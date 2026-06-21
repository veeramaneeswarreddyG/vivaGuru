import sqlite3
import json
import os
from datetime import datetime

DB_PATH = os.path.join(os.path.dirname(__file__), "vivaguru.db")

def get_db_connection():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # Create sessions table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS sessions (
        session_id TEXT PRIMARY KEY,
        role TEXT,
        experience_level TEXT,
        skills TEXT,
        focus_areas TEXT,
        readiness_score INTEGER,
        difficulty TEXT,
        created_at TEXT
    )
    """)
    
    # Create messages table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS messages (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        session_id TEXT,
        role TEXT,
        content TEXT,
        difficulty TEXT,
        follow_ups TEXT,
        created_at TEXT,
        FOREIGN KEY (session_id) REFERENCES sessions (session_id) ON DELETE CASCADE
    )
    """)
    
    # Create mock interviews table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS mock_interviews (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        session_id TEXT,
        current_question_index INTEGER,
        questions TEXT,
        answers TEXT,
        evaluations TEXT,
        created_at TEXT,
        FOREIGN KEY (session_id) REFERENCES sessions (session_id) ON DELETE CASCADE
    )
    """)
    
    # Create recommendations table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS recommendations (
        session_id TEXT PRIMARY KEY,
        topics TEXT,
        faq TEXT,
        skills TEXT,
        preparation_areas TEXT,
        FOREIGN KEY (session_id) REFERENCES sessions (session_id) ON DELETE CASCADE
    )
    """)
    
    conn.commit()
    conn.close()

# Session functions
def create_session(session_id, role, experience_level, skills, focus_areas, readiness_score, difficulty="Medium"):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("""
    INSERT OR REPLACE INTO sessions (session_id, role, experience_level, skills, focus_areas, readiness_score, difficulty, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        session_id,
        role,
        experience_level,
        json.dumps(skills),
        json.dumps(focus_areas),
        readiness_score,
        difficulty,
        datetime.utcnow().isoformat()
    ))
    conn.commit()
    conn.close()

def get_session(session_id):
    conn = get_db_connection()
    cursor = conn.cursor()
    row = cursor.execute("SELECT * FROM sessions WHERE session_id = ?", (session_id,)).fetchone()
    conn.close()
    if row:
        res = dict(row)
        res["skills"] = json.loads(res["skills"])
        res["focus_areas"] = json.loads(res["focus_areas"])
        return res
    return None

def update_session_difficulty(session_id, difficulty):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("UPDATE sessions SET difficulty = ? WHERE session_id = ?", (difficulty, session_id))
    conn.commit()
    conn.close()

# Message functions
def add_message(session_id, role, content, difficulty=None, follow_ups=None):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("""
    INSERT INTO messages (session_id, role, content, difficulty, follow_ups, created_at)
    VALUES (?, ?, ?, ?, ?, ?)
    """, (
        session_id,
        role,
        json.dumps(content) if isinstance(content, (dict, list)) else content,
        difficulty,
        json.dumps(follow_ups) if follow_ups else None,
        datetime.utcnow().isoformat()
    ))
    conn.commit()
    conn.close()

def get_messages(session_id):
    conn = get_db_connection()
    cursor = conn.cursor()
    rows = cursor.execute("SELECT * FROM messages WHERE session_id = ? ORDER BY id ASC", (session_id,)).fetchall()
    conn.close()
    
    messages = []
    for row in rows:
        d = dict(row)
        try:
            d["content"] = json.loads(d["content"])
        except Exception:
            pass
        if d["follow_ups"]:
            d["follow_ups"] = json.loads(d["follow_ups"])
        messages.append(d)
    return messages

# Mock Interview functions
def save_mock_interview(session_id, current_index, questions, answers, evaluations):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("""
    INSERT INTO mock_interviews (session_id, current_question_index, questions, answers, evaluations, created_at)
    VALUES (?, ?, ?, ?, ?, ?)
    """, (
        session_id,
        current_index,
        json.dumps(questions),
        json.dumps(answers),
        json.dumps(evaluations),
        datetime.utcnow().isoformat()
    ))
    conn.commit()
    conn.close()

def get_latest_mock_interview(session_id):
    conn = get_db_connection()
    cursor = conn.cursor()
    row = cursor.execute("""
        SELECT * FROM mock_interviews 
        WHERE session_id = ? 
        ORDER BY id DESC LIMIT 1
    """, (session_id,)).fetchone()
    conn.close()
    if row:
        d = dict(row)
        d["questions"] = json.loads(d["questions"])
        d["answers"] = json.loads(d["answers"])
        d["evaluations"] = json.loads(d["evaluations"])
        return d
    return None

def update_latest_mock_interview(mock_id, current_index, answers, evaluations):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("""
        UPDATE mock_interviews 
        SET current_question_index = ?, answers = ?, evaluations = ?
        WHERE id = ?
    """, (current_index, json.dumps(answers), json.dumps(evaluations), mock_id))
    conn.commit()
    conn.close()

# Recommendations functions
def save_recommendations(session_id, topics, faq, skills, preparation_areas):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("""
    INSERT OR REPLACE INTO recommendations (session_id, topics, faq, skills, preparation_areas)
    VALUES (?, ?, ?, ?, ?)
    """, (
        session_id,
        json.dumps(topics),
        json.dumps(faq),
        json.dumps(skills),
        json.dumps(preparation_areas)
    ))
    conn.commit()
    conn.close()

def get_recommendations(session_id):
    conn = get_db_connection()
    cursor = conn.cursor()
    row = cursor.execute("SELECT * FROM recommendations WHERE session_id = ?", (session_id,)).fetchone()
    conn.close()
    if row:
        d = dict(row)
        d["topics"] = json.loads(d["topics"])
        d["faq"] = json.loads(d["faq"])
        d["skills"] = json.loads(d["skills"])
        d["preparation_areas"] = json.loads(d["preparation_areas"])
        return d
    return None

# Initialize on import
init_db()
