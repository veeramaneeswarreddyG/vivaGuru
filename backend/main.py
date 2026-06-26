import os
import uuid
import shutil
from flask import Flask, request, jsonify
from flask_cors import CORS
import dotenv

# Load environment variables
dotenv.load_dotenv()

import database as db
import nlp_engine as nlp


app = Flask(__name__)
CORS(app) # Enable CORS for frontend development

TEMP_UPLOAD_DIR = os.path.join(os.path.dirname(__file__), "temp_uploads")
os.makedirs(TEMP_UPLOAD_DIR, exist_ok=True)

@app.route("/api/upload-jd", methods=["POST"])
def upload_jd():
    session_id = str(uuid.uuid4())
    extracted_text = ""

    # Check for file upload
    file = request.files.get("file")
    text_fallback = request.form.get("text_fallback")

    if file:
        file_ext = os.path.splitext(file.filename)[1]
        temp_file_path = os.path.join(TEMP_UPLOAD_DIR, f"{session_id}{file_ext}")
        try:
            file.save(temp_file_path)
            extracted_text = nlp.extract_text_from_file(temp_file_path)
        except Exception as e:
            return jsonify({"error": f"File processing failed: {str(e)}"}), 500
        finally:
            if os.path.exists(temp_file_path):
                os.remove(temp_file_path)
    elif text_fallback is not None:
        extracted_text = text_fallback
    else:
        extracted_text = ""

    # Analyze JD
    analysis = nlp.analyze_job_description(extracted_text)
    
    # Save session
    db.create_session(
        session_id=session_id,
        role=analysis["role"],
        experience_level=analysis["experience_level"],
        skills=analysis["skills"],
        focus_areas=analysis["focus_areas"],
        readiness_score=analysis["readiness_score"],
        difficulty="Medium" # Default difficulty
    )

    # Generate and save recommendations
    recs = nlp.generate_recommendations(analysis["role"], analysis["skills"])
    db.save_recommendations(
        session_id=session_id,
        topics=recs["topics"],
        faq=recs["faq"],
        skills=recs["skills"],
        preparation_areas=recs["preparation_areas"]
    )

    return jsonify({
        "session_id": session_id,
        "role": analysis["role"],
        "experience_level": analysis["experience_level"],
        "skills": analysis["skills"],
        "focus_areas": analysis["focus_areas"],
        "readiness_score": analysis["readiness_score"]
    })

@app.route("/api/session/<session_id>", methods=["GET"])
def get_session(session_id):
    session = db.get_session(session_id)
    if not session:
        return jsonify({"error": "Session not found"}), 404
    
    recommendations = db.get_recommendations(session_id)
    messages = db.get_messages(session_id)
    
    return jsonify({
        "session": session,
        "recommendations": recommendations,
        "messages": messages
      })

@app.route("/api/session/<session_id>/difficulty", methods=["POST"])
def update_difficulty(session_id):
    session = db.get_session(session_id)
    if not session:
        return jsonify({"error": "Session not found"}), 404
        
    payload = request.json or {}
    difficulty = payload.get("difficulty", "Medium")
    
    db.update_session_difficulty(session_id, difficulty)
    return jsonify({"status": "success", "difficulty": difficulty})

@app.route("/api/chat", methods=["POST"])
def chat():
    payload = request.json or {}
    session_id = payload.get("session_id")
    message = payload.get("message")
    
    if not session_id or not message:
        return jsonify({"error": "Missing parameters"}), 400
        
    session = db.get_session(session_id)
    if not session:
        return jsonify({"error": "Session not found"}), 404

    # Add user message
    db.add_message(session_id, "user", message)
    
    # Generate response
    response = nlp.get_answer_response(
        question=message,
        role=session["role"],
        difficulty=session["difficulty"]
    )
    
    # Save assistant response
    db.add_message(
        session_id=session_id,
        role="assistant",
        content=response,
        difficulty=session["difficulty"],
        follow_ups=response["follow_up_questions"]
    )
    
    return jsonify(response)

@app.route("/api/mock/start", methods=["POST"])
def start_mock():
    payload = request.json or {}
    session_id = payload.get("session_id")
    
    if not session_id:
        return jsonify({"error": "Missing session_id"}), 400
        
    session = db.get_session(session_id)
    if not session:
        return jsonify({"error": "Session not found"}), 404
        
    questions = nlp.get_mock_questions(session["role"])
    
    # Initialize mock session
    db.save_mock_interview(
        session_id=session_id,
        current_index=0,
        questions=questions,
        answers=[],
        evaluations=[]
    )
    
    return jsonify({
        "first_question": questions[0],
        "current_index": 0,
        "total_questions": len(questions)
    })

@app.route("/api/mock/submit", methods=["POST"])
def submit_mock_answer():
    payload = request.json or {}
    session_id = payload.get("session_id")
    answer = payload.get("answer")
    
    if not session_id or not answer:
        return jsonify({"error": "Missing parameters"}), 400
        
    mock = db.get_latest_mock_interview(session_id)
    if not mock:
        return jsonify({"error": "No active mock interview session found"}), 400
        
    current_index = mock["current_question_index"]
    questions = mock["questions"]
    answers = mock["answers"]
    evaluations = mock["evaluations"]
    
    if current_index >= len(questions):
        return jsonify({"error": "Mock interview already completed"}), 400
        
    current_question = questions[current_index]
    
    # Evaluate current answer
    evaluation = nlp.evaluate_answer(current_question, answer)
    
    answers.append(answer)
    evaluations.append(evaluation)
    new_index = current_index + 1
    
    db.update_latest_mock_interview(
        mock_id=mock["id"],
        current_index=new_index,
        answers=answers,
        evaluations=evaluations
    )
    
    is_completed = new_index >= len(questions)
    next_question = None if is_completed else questions[new_index]
    
    # Calculate final aggregate score if completed
    final_feedback = None
    if is_completed:
        avg_score = int(sum(e["score"] for e in evaluations) / len(evaluations))
        avg_comm = int(sum(e["communication"] for e in evaluations) / len(evaluations))
        avg_conf = int(sum(e["confidence"] for e in evaluations) / len(evaluations))
        avg_tech = int(sum(e["technical_accuracy"] for e in evaluations) / len(evaluations))
        avg_struct = int(sum(e["structure"] for e in evaluations) / len(evaluations))
        
        strengths = []
        improvements = []
        for e in evaluations:
            for item in e["improvements"]:
                if item not in improvements and "brief" not in item.lower():
                    improvements.append(item)
            if e["score"] >= 80:
                strengths.append(f"Strong understanding of the concept in response to: '{e['better_version'][:40]}...'")
        
        if not improvements:
            improvements.append("Refine pacing and practice with a timer.")
        if not strengths:
            strengths.append("Attempted all questions and covered basic topics.")
            
        session = db.get_session(session_id)
        final_feedback = {
            "score": avg_score,
            "communication": avg_comm,
            "confidence": avg_conf,
            "technical_accuracy": avg_tech,
            "structure": avg_struct,
            "strengths": strengths[:3],
            "improvements": improvements[:3],
            "general_feedback": f"Completed mock interview for the {session['role']} role. Your average performance score was {avg_score}%. Excellent work maintaining structure; focus on expanding technical depth in future sessions."
        }
    
    return jsonify({
        "evaluation": evaluation,
        "is_completed": is_completed,
        "next_question": next_question,
        "current_index": new_index,
        "total_questions": len(questions),
        "final_feedback": final_feedback
    })

@app.route("/api/review/submit", methods=["POST"])
def review_answer():
    payload = request.json or {}
    question = payload.get("question")
    answer = payload.get("answer")
    
    if not question or not answer:
        return jsonify({"error": "Missing parameters"}), 400
        
    evaluation = nlp.evaluate_answer(question, answer)
    return jsonify(evaluation)

@app.route("/api/auth/register", methods=["POST"])
def auth_register():
    payload = request.json or {}
    email = payload.get("email")
    username = payload.get("username")
    password = payload.get("password")
    
    if not email or not username or not password:
        return jsonify({"error": "Missing parameters"}), 400
        
    success = db.create_user(email, username, password)
    if success:
        return jsonify({"success": True})
    else:
        return jsonify({"error": "Email is already registered"}), 400

@app.route("/api/auth/login", methods=["POST"])
def auth_login():
    payload = request.json or {}
    email = payload.get("email")
    password = payload.get("password")
    
    if not email or not password:
        return jsonify({"error": "Missing parameters"}), 400
        
    user = db.authenticate_user(email, password)
    if user:
        return jsonify({"success": True, "user": user})
    else:
        return jsonify({"error": "Invalid email or password"}), 401

if __name__ == "__main__":
    app.run(host="127.0.0.1", port=8001, debug=True)
