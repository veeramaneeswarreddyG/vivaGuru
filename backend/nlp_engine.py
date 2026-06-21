import os
import re
import json
import random
import math
import pdfplumber
import PyPDF2
from pydantic import BaseModel, Field
import dotenv

# Load environment variables
dotenv.load_dotenv()

# Initialize Gemini Client
from google import genai
from google.genai import types

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
if GEMINI_API_KEY:
    client = genai.Client(api_key=GEMINI_API_KEY)
else:
    client = None
    print("Warning: GEMINI_API_KEY is not set in environment variables.")

GEMINI_MODEL = "gemini-2.5-flash"

# Pydantic schemas for Gemini structured outputs
class JDAnalysis(BaseModel):
    role: str = Field(description="The primary job role, e.g., 'Software Engineer', 'Data Scientist', 'DevOps Engineer', 'Product Manager', etc.")
    experience_level: str = Field(description="Experience level required, e.g., 'Junior / Associate', 'Mid-Level', 'Senior / Lead', or 'Executive / Director'.")
    skills: list[str] = Field(description="List of key technical or professional skills extracted from the description.")
    focus_areas: list[str] = Field(description="Key focus areas or responsibilities of the role.")
    readiness_score: int = Field(description="A baseline readiness score (from 0 to 100) estimated for a typical candidate matching this role's requirements.")

class AnswerResponse(BaseModel):
    title: str = Field(description="The title of the question or topic.")
    concept_explanation: str = Field(description="Explanation of the concept tailored to the requested difficulty level.")
    interview_explanation: str = Field(description="Instructions on how to explain this in an interview, tailored to the difficulty level.")
    real_world_example: str = Field(description="A practical real-world example or scenario illustrating the concept, tailored to the difficulty.")
    common_mistakes: str = Field(description="Common mistakes candidates make when explaining this topic in interviews, tailored to the difficulty.")
    interview_tip: str = Field(description="A strategic tip to make the answer stand out, tailored to the difficulty.")
    follow_up_questions: list[str] = Field(description="List of exactly 3 related follow-up questions that might be asked next.")

class AnswerEvaluation(BaseModel):
    score: int = Field(description="Overall scoring percentage (0-100) for the answer.")
    communication: int = Field(description="Communication score (0-100) evaluating clarity, articulation, and professional tone.")
    confidence: int = Field(description="Confidence score (0-100) based on assertiveness and directness.")
    technical_accuracy: int = Field(description="Technical accuracy score (0-100) based on correct usage of domain concepts.")
    structure: int = Field(description="Structure score (0-100) evaluating the presence of introduction, body/examples, and conclusion.")
    missing_concepts: list[str] = Field(description="Important concepts, keywords, or details that were omitted from the candidate's answer.")
    improvements: list[str] = Field(description="Specific actionable tips or suggestions to improve the response.")
    better_version: str = Field(description="A restructured, high-scoring premium answer example that the user could have given.")
    feedback: str = Field(description="Detailed constructive summary feedback for the candidate.")

class TopicRec(BaseModel):
    id: str
    title: str
    priority: str = Field(description="Priority level: 'High', 'Medium', or 'Low'")

class SkillRec(BaseModel):
    name: str
    priority: str = Field(description="Priority level: 'High', 'Medium', or 'Low'")

class RecommendationsResponse(BaseModel):
    topics: list[TopicRec]
    faq: list[str] = Field(description="List of frequently asked interview questions for this role.")
    skills: list[SkillRec]
    preparation_areas: list[str] = Field(description="List of specific areas the candidate should focus their preparation on.")

class MockQuestionsResponse(BaseModel):
    questions: list[str] = Field(description="List of exactly 5 custom mock interview questions.")

def call_gemini_structured(prompt: str, response_schema):
    if not client:
        raise ValueError("Gemini client is not initialized")
    
    response = client.models.generate_content(
        model=GEMINI_MODEL,
        contents=prompt,
        config=types.GenerateContentConfig(
            response_mime_type="application/json",
            response_schema=response_schema,
            temperature=0.2,
        ),
    )
    return json.loads(response.text)

# Try importing nltk, with a fallback to regex tokenization
try:
    import nltk
    from nltk.tokenize import word_tokenize
    from nltk.corpus import stopwords
    try:
        nltk.data.find('tokenizers/punkt')
    except LookupError:
        nltk.download('punkt', quiet=True)
    try:
        nltk.data.find('corpora/stopwords')
    except LookupError:
        nltk.download('stopwords', quiet=True)
    HAS_NLTK = True
except Exception:
    HAS_NLTK = False

# Try importing scikit-learn, with a fallback to pure Python TF-IDF and Cosine Similarity
try:
    from sklearn.feature_extraction.text import TfidfVectorizer
    from sklearn.metrics.pairwise import cosine_similarity
    HAS_SKLEARN = True
except Exception:
    HAS_SKLEARN = False


# Pure Python fallback for Tokenization, TF-IDF and Cosine Similarity
def tokenize_pure(text):
    return re.findall(r'\b[a-z0-9]+\b', text.lower())

def compute_tfidf_and_similarity(target_doc, docs_list):
    """
    Computes cosine similarity between target_doc and each doc in docs_list.
    Returns a list of similarity scores.
    """
    if HAS_SKLEARN:
        try:
            vectorizer = TfidfVectorizer()
            all_docs = docs_list + [target_doc]
            tfidf = vectorizer.fit_transform(all_docs)
            similarities = cosine_similarity(tfidf[-1], tfidf[:-1])[0]
            return [float(s) for s in similarities]
        except Exception:
            pass # Fallback to pure Python if sklearn throws an error
            
    # Pure Python TF-IDF Implementation
    # Tokenize all documents
    target_tokens = tokenize_pure(target_doc)
    docs_tokens = [tokenize_pure(d) for d in docs_list]
    all_tokens_list = docs_tokens + [target_tokens]
    
    # Calculate vocabulary
    vocab = set(w for doc in all_tokens_list for w in doc)
    if not vocab:
        return [0.0] * len(docs_list)
        
    # Calculate IDFs
    N = len(all_tokens_list)
    idf = {}
    for w in vocab:
        doc_count = sum(1 for doc in all_tokens_list if w in doc)
        idf[w] = math.log((1 + N) / (1 + doc_count)) + 1
        
    # Calculate TF vectors
    def get_tf_vector(tokens):
        tf = {}
        for t in tokens:
            tf[t] = tf.get(t, 0) + 1
        total = len(tokens) or 1
        tf_norm = {k: v / total for k, v in tf.items()}
        return [tf_norm.get(w, 0.0) * idf[w] for w in vocab]
        
    target_vec = get_tf_vector(target_tokens)
    target_norm = math.sqrt(sum(x * x for x in target_vec))
    
    scores = []
    for doc_tok in docs_tokens:
        doc_vec = get_tf_vector(doc_tok)
        doc_norm = math.sqrt(sum(x * x for x in doc_vec))
        dot_product = sum(a * b for a, b in zip(target_vec, doc_vec))
        
        if target_norm * doc_norm == 0:
            scores.append(0.0)
        else:
            scores.append(dot_product / (target_norm * doc_norm))
            
    return scores

# Predefined Knowledge Base of Interview Topics
TOPIC_KNOWLEDGE_BASE = {
    "overfitting": {
        "title": "Overfitting in Machine Learning",
        "category": "Data Science",
        "difficulty_responses": {
            "Lite": {
                "concept": "Overfitting is like memorizing the answers for a test instead of understanding the concepts. The model learns details and noise in the training data too well, so it performs poorly on new, unseen data.",
                "interview": "Explain that overfitting occurs when a model performs exceptionally well on training data but fails to generalize to validation or test data. Use the 'memorization' analogy.",
                "example": "A kid memorizing exactly 5 plus 5 equals 10, but not knowing what 5 plus 6 is because they don't understand addition.",
                "mistakes": "Saying that overfitting means the model is bad at everything. It is actually too good on the training data.",
                "tip": "Always mention that overfitting can be detected using train/test splits or cross-validation.",
                "follow_ups": ["What is Underfitting?", "Explain Bias Variance Tradeoff", "What is Cross Validation?"]
            },
            "Medium": {
                "concept": "Overfitting happens when a model has high variance and low bias. It captures the noise along with the underlying pattern in the dataset, leading to poor generalization.",
                "interview": "Define overfitting as high variance. Explain how to detect it by comparing training error (low) vs test error (high). Discuss solutions like regularization (L1/L2), cross-validation, and reducing model complexity.",
                "example": "Fitting a high-degree polynomial (e.g., degree 10) to data points that have a simple linear trend plus random measurement noise.",
                "mistakes": "Failing to explain *why* noise gets captured, or confusing L1 and L2 regularization effects.",
                "tip": "Explain that adding more data or performing feature selection are direct ways to reduce overfitting.",
                "follow_ups": ["Explain L1 vs L2 Regularization", "What is Cross Validation?", "What is Feature Selection?"]
            },
            "Hardcore": {
                "concept": "Overfitting is a consequence of model capacity exceeding the information content of the training distribution. The model fits the training sample's empirical distribution rather than the true data-generating distribution.",
                "interview": "Formulate overfitting in terms of empirical risk minimization vs. structural risk minimization. Discuss the mathematical impact on generalization error bounds and Rademacher complexity.",
                "example": "A Deep Neural Network with millions of parameters training on a small dataset without dropout, learning sample-specific high-frequency features rather than robust semantic patterns.",
                "mistakes": "Overlooking the role of hyperparameters (e.g., learning rate, weight decay) in mitigating overfitting, or misstating the bias-variance trade-off mechanics.",
                "tip": "Mention early stopping, batch normalization, dropout, and weight decay (L2 regularization) as key neural network anti-overfitting techniques.",
                "follow_ups": ["How does Dropout prevent overfitting?", "Explain Rademacher Complexity", "What is Early Stopping?"]
            },
            "Critical": {
                "concept": "In production engineering, overfitting represents a failure of generalization leading to silent model degradation in real-world traffic. High-capacity models over-index on historical telemetry and suffer from covariate shift.",
                "interview": "Explain overfitting in terms of production tradeoffs. Detail how offline metrics fail under distribution shift. Discuss online detection using shadow deployments, and mitigation using continuous retraining and adversarially robust testing.",
                "example": "An algorithmic trading model optimized on pre-pandemic volatility regimes that completely fails during black swan events due to systemic structural breaks in market indicators.",
                "mistakes": "Focusing purely on academic regularization formulas instead of outlining concrete production monitoring, feature stores, and drift detection mechanisms.",
                "tip": "Frame your answer around production pipelines: data drift, feature stores, and how automated validation gates block overfitted models from deployment.",
                "follow_ups": ["What is Data Drift?", "How do you design a Shadow Deployment?", "Explain Covariate Shift"]
            }
        }
    },
    "bias variance tradeoff": {
        "title": "Bias-Variance Tradeoff",
        "category": "Data Science",
        "difficulty_responses": {
            "Lite": {
                "concept": "Bias is error from under-simplifying (underfitting), and variance is error from over-complicating (overfitting). The tradeoff is about finding the sweet spot between a model that is too simple and one that is too complex.",
                "interview": "Explain that bias is the model's assumption error and variance is the sensitivity to small changes in training data. The goal is to minimize both for optimal accuracy.",
                "example": "Target shooting: High Bias means all shots are clustered far from the bullseye. High Variance means shots are scattered wildly all over the board.",
                "mistakes": "Thinking that high bias and high variance can both be easily reduced to zero at the same time.",
                "tip": "Use the dartboard visual analogy to explain the four combinations of high/low bias/variance.",
                "follow_ups": ["What is Overfitting?", "What is Underfitting?", "Explain Cross Validation?"]
            },
            "Medium": {
                "concept": "Total Error = Bias^2 + Variance + Irreducible Error. Bias represents the difference between average predictions and correct values. Variance represents the spread of predictions for different training sets.",
                "interview": "Give the mathematical formulation of Total Error. Explain how simple models (like Linear Regression) have high bias/low variance, while complex models (like Decision Trees) have low bias/high variance.",
                "example": "A linear regression line trying to fit quadratic data (high bias) versus a decision tree of depth 50 fitting the same data points perfectly (high variance).",
                "mistakes": "Forgetting that irreducible error is part of the total error equation and cannot be reduced by any model.",
                "tip": "Tie bias/variance directly to underfitting/overfitting so the interviewer sees you connect theory to practice.",
                "follow_ups": ["What is Irreducible Error?", "How does Random Forest balance Bias and Variance?", "Explain Regularization"]
            },
            "Hardcore": {
                "concept": "The bias-variance decomposition divides the expected test MSE. Bias is the error of the target function approximation. Variance measures the variance of the fit estimator around its own expectation.",
                "interview": "Decompose the expected prediction error mathematically. Explain how regularization parameters control this tradeoff (e.g., lambda in ridge regression pulls variance down while increasing bias).",
                "example": "In Kernel Ridge Regression, decreasing the bandwidth parameter reduces bias but increases the estimator's sensitivity to sampling variations (high variance).",
                "mistakes": "Failing to explain how ensemble methods affect these parameters (e.g., Bagging reduces variance; Boosting reduces bias).",
                "tip": "Explain how modern deep learning double-descent curves challenge the classical monotonic bias-variance tradeoff model.",
                "follow_ups": ["Explain Deep Learning Double Descent", "How does Bagging reduce variance?", "Derive Bias-Variance Decomposition"]
            },
            "Critical": {
                "concept": "In production, managing the bias-variance tradeoff involves engineering robust feature representations, implementing online validation, and setting up automated model fallback architectures.",
                "interview": "Discuss how real-world data pipelines handle the tradeoff. Explain how over-parameterized models are deployed in production, using calibration layers, model compression, and edge deployment constraints.",
                "example": "A fraud detection system where high variance causes false positive spikes during shopping festivals, requiring a high-bias fallback rules-engine to maintain checkout SLA.",
                "mistakes": "Ignoring operational costs, inference latency, and hardware constraints in favor of a theoretical mathematical explanation.",
                "tip": "Discuss model calibration, threshold tuning, and how monitoring precision/recall curves in real time guides the tuning of bias/variance.",
                "follow_ups": ["What is Model Calibration?", "Explain Precision-Recall Curves", "How do fallback rules engines work?"]
            }
        }
    },
    "rest apis": {
        "title": "REST APIs & Design Principles",
        "category": "Software Engineering",
        "difficulty_responses": {
            "Lite": {
                "concept": "A REST API is like a waiter in a restaurant. You (the client) ask the waiter (the API) for food (data), the waiter goes to the kitchen (server) and brings it back to you.",
                "interview": "Explain REST as a standard way for computers to talk over the web using HTTP methods like GET (read), POST (create), PUT (update), and DELETE.",
                "example": "Requesting a user profile page using `GET /users/123` and receiving a JSON response containing their name and email.",
                "mistakes": "Confusing GET and POST, or thinking REST is a programming language.",
                "tip": "Use real-life analogies to make your explanation easy to follow and memorable.",
                "follow_ups": ["What is JSON?", "What is an HTTP Status Code?", "Difference between GET and POST"]
            },
            "Medium": {
                "concept": "REST (Representational State Transfer) is an architectural style utilizing HTTP protocol. It operates on resources identified by URIs, using HTTP status codes to indicate action success or failure.",
                "interview": "Explain key constraints: client-server separation, statelessness, cacheability, uniform interface, and layered system. Explain RESTful design patterns (nouns for resources, verbs for actions).",
                "example": "`POST /api/v1/articles` to create a new post, returning a `201 Created` status code and the created resource object.",
                "mistakes": "Using verbs in URIs (e.g., `/api/getUsers` instead of `GET /api/users`), or returning `200 OK` for every single type of response including errors.",
                "tip": "Mention REST constraints like statelessness, meaning the server doesn't remember previous requests, which improves scalability.",
                "follow_ups": ["What is Statelessness in REST?", "Explain HTTP Status Codes (200, 201, 400, 404, 500)", "REST vs SOAP"]
            },
            "Hardcore": {
                "concept": "REST leverages standard HTTP semantics. True RESTful systems conform to Richardson Maturity Model Level 3, incorporating HATEOAS (Hypermedia As The Engine Of Application State) for dynamic client state transitions.",
                "interview": "Detail the levels of Richardson Maturity Model. Discuss statelessness, idempotent operations (GET, PUT, DELETE) vs non-idempotent (POST, PATCH), and HTTP cache-control mechanics.",
                "example": "A client queries `GET /accounts/12` and receives a payload containing balance plus links (`rel`: 'withdraw', 'deposit') directing the client to valid next states.",
                "mistakes": "Incorrectly identifying PATCH as idempotent, or failing to understand the security implications of stateless authentication (e.g. JWT vs sessions).",
                "tip": "Describe cache validation using ETags and `If-None-Match` headers, proving you understand network efficiency.",
                "follow_ups": ["Explain HATEOAS", "Explain HTTP Idempotency", "What are ETags and how do they work?"]
            },
            "Critical": {
                "concept": "Designing high-scale production REST APIs requires addressing rate limiting, versioning, idempotent retry tokens, pagination architectures, and token-based distributed authentication.",
                "interview": "Discuss REST API design at scale. Detail backward-compatibility strategies (header vs path versioning), rate limiting (Token Bucket algorithm), cursor-based pagination, and distributed tracing.",
                "example": "A Stripe-like payment API requiring idempotency keys (`Idempotency-Key` headers) to prevent duplicate card charges on network retry spikes.",
                "mistakes": "Suggesting basic offset pagination for high-velocity datasets (leads to duplicate/skipped items and high database offset penalties).",
                "tip": "Explain cursor-based pagination (e.g., using encoded base64 timestamps) as the gold standard for high-performance listing endpoints.",
                "follow_ups": ["Explain Cursor Pagination vs Offset Pagination", "How does Token Bucket rate limiting work?", "What is an Idempotency Key?"]
            }
        }
    },
    "sql vs nosql": {
        "title": "SQL vs NoSQL Databases",
        "category": "Software Engineering",
        "difficulty_responses": {
            "Lite": {
                "concept": "SQL databases are like Excel spreadsheets with structured rows and columns. NoSQL databases are like folders of Word documents, where each document can have different structures.",
                "interview": "Explain that SQL databases are relational and structured, while NoSQL databases are non-relational and flexible.",
                "example": "SQL: A table of customers where everyone has exactly Name, Age, and Email. NoSQL: A customer list where some profiles have Phone Numbers, others have Social Media handles, and others have shipping addresses.",
                "mistakes": "Saying that NoSQL is always better because it is newer. Both have strong use cases.",
                "tip": "Contrast the structural stiffness of SQL with the document flexibility of NoSQL.",
                "follow_ups": ["What is a Relational Database?", "What is MongoDB?", "When would you choose SQL over NoSQL?"]
            },
            "Medium": {
                "concept": "SQL databases are relational, table-based, use SQL for queries, and scale vertically. NoSQL databases are non-relational, document/key-value/graph/column-based, and scale horizontally.",
                "interview": "Discuss schemas (predefined vs dynamic), relations (joins vs embedding), scaling strategies, and transactions (ACID properties in SQL vs BASE in NoSQL).",
                "example": "PostgreSQL enforcing foreign key constraints on Order items vs MongoDB storing an entire Order as a single nested document with customer details.",
                "mistakes": "Claiming NoSQL databases do not support transactions at all, or thinking vertical scaling is infinite.",
                "tip": "Frame your decision based on data structure consistency. If you have complex relationships and need ACID compliance, choose SQL.",
                "follow_ups": ["Explain ACID Properties", "What is Horizontal Scaling?", "Explain Document Databases vs Key-Value Databases"]
            },
            "Hardcore": {
                "concept": "SQL guarantees relational constraints via normal forms and write-ahead logs. NoSQL trades strong consistency for scale, governed by the CAP Theorem (Consistency, Availability, Partition Tolerance).",
                "interview": "Explain the CAP Theorem and how databases choose between CP and AP. Discuss database internals: B-Trees (SQL) vs LSM-Trees (NoSQL write-optimized storage). Explain normalization vs denormalization tradeoffs.",
                "example": "Cassandra partitioning data via hash rings (AP, highly write-available) vs PostgreSQL using locks and MVCC to ensure strict serializability (CP).",
                "mistakes": "Misapplying CAP theorem (every distributed system experiences network partitions, so it is really a choice between C and A during a partition).",
                "tip": "Mention B-Trees vs LSM-Trees (Log-Structured Merge-Trees) to demonstrate deep understanding of disk read/write characteristics.",
                "follow_ups": ["Explain CAP Theorem", "What is an LSM Tree?", "How does MVCC (Multi-Version Concurrency Control) work?"]
            },
            "Critical": {
                "concept": "In high-throughput, multi-region cloud architectures, SQL and NoSQL are often combined. Decisions hinge on consistency SLAs, query patterns, indexing, sharding keys, and replication lag.",
                "interview": "Discuss distributed databases. Explain sharding, re-sharding challenges, hot partitions, and global replication lag. Detail hybrid architectures (e.g. transactional SQL + read-cache NoSQL).",
                "example": "Using Spanner or CockroachDB for global ACID transactions, combined with Redis as a low-latency cache, and DynamoDB for high-volume unstructured telemetry data.",
                "mistakes": "Overlooking write path bottlenecks or proposing global locks in high-write systems.",
                "tip": "Explain how hot partitions occur when a poor shard key (e.g., tenant_id or date) concentrates traffic on a single physical node.",
                "follow_ups": ["How do you choose a Shard Key?", "Explain Distributed Transactions (2-Phase Commit)", "What is Write-Ahead Logging (WAL)?"]
            }
        }
    }
}

# Predefined Job Profiles to match uploaded Job Descriptions
ROLE_PROFILES = [
    {
        "role": "Software Engineer",
        "skills": ["Python", "JavaScript", "System Design", "Git", "REST APIs", "SQL", "Algorithms", "Data Structures"],
        "focus_areas": ["System Design & Architecture", "Coding & Problem Solving", "Web Technologies", "Database Management"],
        "readiness_score": 72,
        "keywords": ["software", "developer", "engineer", "react", "programming", "code", "architecture", "git", "web"]
    },
    {
        "role": "Data Scientist",
        "skills": ["Python", "Machine Learning", "Pandas", "Scikit-Learn", "Overfitting", "Bias Variance Tradeoff", "Statistics", "SQL"],
        "focus_areas": ["Model Generalization", "Feature Engineering", "Statistical Analysis", "Data Processing Pipelines"],
        "readiness_score": 68,
        "keywords": ["data", "science", "ml", "machine learning", "pandas", "numpy", "tensorflow", "pytorch", "statistics", "model"]
    },
    {
        "role": "DevOps Engineer",
        "skills": ["Docker", "Kubernetes", "Linux", "CI/CD", "AWS", "Bash", "Terraform", "Monitoring"],
        "focus_areas": ["Container Orchestration", "Deployment Pipelines", "Cloud Infrastructure", "System Reliability"],
        "readiness_score": 65,
        "keywords": ["devops", "cloud", "aws", "kubernetes", "docker", "ci/cd", "pipeline", "infrastructure", "terraform", "linux"]
    },
    {
        "role": "Product Manager",
        "skills": ["Agile", "Roadmapping", "Prioritization", "User Research", "Metrics", "MVP", "A/B Testing"],
        "focus_areas": ["Feature Prioritization", "Market & User Research", "Product Strategy", "Product Metrics & Analytics"],
        "readiness_score": 75,
        "keywords": ["product", "manager", "pm", "agile", "scrum", "roadmap", "user experience", "metrics", "strategy"]
    }
]

# Fallback profile for general use
GENERAL_PROFILE = {
    "role": "General Professional",
    "skills": ["Communication", "Problem Solving", "Time Management", "Collaboration", "Adaptability", "Goal Setting"],
    "focus_areas": ["Behavioral Assessment", "Project Experience", "Conflict Resolution", "Teamwork & Culture"],
    "readiness_score": 70
}

# Mock Interview Questions Database by Role
MOCK_INTERVIEW_QUESTIONS = {
    "Software Engineer": [
        "Tell me about yourself.",
        "Explain REST APIs and their design principles.",
        "What is the difference between SQL and NoSQL?",
        "Explain the Big O Notation and why it matters in code optimization.",
        "Describe a challenging coding problem you solved and how you arrived at the solution."
    ],
    "Data Scientist": [
        "Tell me about yourself.",
        "What is overfitting and how do you prevent it?",
        "Explain the Bias-Variance tradeoff.",
        "What is Cross-Validation and why is it important?",
        "Describe how you would handle missing data in a large dataset."
    ],
    "DevOps Engineer": [
        "Tell me about yourself.",
        "What is Docker and how does it differ from a Virtual Machine?",
        "Explain Kubernetes and its key components like Pods and Deployments.",
        "How do you design a secure, automated CI/CD pipeline?",
        "Describe a time you diagnosed a major production outage."
    ],
    "Product Manager": [
        "Tell me about yourself.",
        "How do you prioritize features for a product roadmap?",
        "Explain the concept of an MVP (Minimum Viable Product). How do you define one?",
        "How do you measure success for a new feature launch?",
        "Describe a time when you had to say no to an important stakeholder."
    ],
    "General Professional": [
        "Tell me about yourself.",
        "Describe a challenging project you worked on and how you handled it.",
        "How do you handle conflict or differing opinions in a team?",
        "Tell me about a time you failed and what you learned from it.",
        "Where do you see yourself in five years?"
    ]
}

# Sample answers to check similarity against during evaluation
SAMPLE_ANSWERS = {
    "Explain REST APIs and their design principles.": "REST APIs are an architectural style utilizing HTTP protocols. They use resources identified by URIs, standard HTTP methods like GET, POST, PUT, and DELETE, return status codes, and maintain statelessness.",
    "What is the difference between SQL and NoSQL?": "SQL databases are relational, table-based, use SQL, have predefined schemas, and scale vertically. NoSQL databases are non-relational, document or key-value based, scale horizontally, and have dynamic schemas.",
    "What is overfitting and how do you prevent it?": "Overfitting happens when a model learns the noise in the training data rather than the actual pattern, performing poorly on new data. It can be prevented using cross-validation, regularization, and gathering more data.",
    "Explain the Bias-Variance tradeoff.": "Bias is the error from simple assumptions in the model, causing underfitting. Variance is the error from model sensitivity to small data variations, causing overfitting. The tradeoff is about balancing both to minimize total error.",
    "How do you prioritize features for a product roadmap?": "Features can be prioritized using frameworks like RICE (Reach, Impact, Confidence, Effort), MoSCoW (Must-have, Should-have, Could-have, Won't-have), or Kano models, balancing customer value against engineering cost.",
    "Explain the concept of an MVP (Minimum Viable Product). How do you define one?": "An MVP is the version of a new product that allows a team to collect the maximum amount of validated learning about customers with the least effort, focusing on core value propositions.",
    "Tell me about yourself.": "My name is [User] and I am a professional in this field. I have experience working with various systems and projects, focusing on building high-quality solutions and collaborating with cross-functional teams.",
    "What is Docker and how does it differ from a Virtual Machine?": "Docker containers share the host OS kernel and are lightweight, starting up in seconds. Virtual Machines include a full guest OS, running on top of a hypervisor, making them heavier and slower to start.",
    "Explain Kubernetes and its key components like Pods and Deployments.": "Kubernetes is a container orchestration tool. Pods are the smallest deployable units containing one or more containers. Deployments manage pod scaling, rollouts, and self-healing configurations.",
    "What is Cross-Validation and why is it important?": "Cross-validation is a resampling technique that partitions data into subsets, training the model on some and validating on others (like K-fold) to ensure generalizability and prevent overfitting."
}

def extract_text_from_file(file_path):
    ext = os.path.splitext(file_path)[1].lower()
    text = ""
    try:
        if ext == ".pdf":
            try:
                with pdfplumber.open(file_path) as pdf:
                    for page in pdf.pages:
                        page_text = page.extract_text()
                        if page_text:
                            text += page_text + "\n"
            except Exception:
                with open(file_path, 'rb') as f:
                    reader = PyPDF2.PdfReader(f)
                    for page in reader.pages:
                        page_text = page.extract_text()
                        if page_text:
                            text += page_text + "\n"
        elif ext in [".txt", ".docx"]:
            with open(file_path, "r", encoding="utf-8", errors="ignore") as f:
                text = f.read()
    except Exception as e:
        print(f"Error reading file {file_path}: {e}")
    return text

def analyze_job_description(text):
    if not text.strip():
        return {
            "role": GENERAL_PROFILE["role"],
            "experience_level": "Mid-Level",
            "skills": GENERAL_PROFILE["skills"],
            "focus_areas": GENERAL_PROFILE["focus_areas"],
            "readiness_score": GENERAL_PROFILE["readiness_score"]
        }

    if client:
        try:
            prompt = f"""
            Analyze the following job description text and extract:
            1. The primary job role (e.g., Software Engineer, Data Scientist, DevOps Engineer, Product Manager, etc.)
            2. The required experience level (choose one of: 'Junior / Associate', 'Mid-Level', 'Senior / Lead', 'Executive / Director')
            3. A list of key technical/professional skills required.
            4. Key focus areas or main responsibilities of the role.
            5. An estimated candidate baseline readiness score (from 0 to 100) for a typical applicant matching this role's description.
            
            Job Description Text:
            {text}
            """
            result = call_gemini_structured(prompt, JDAnalysis)
            return {
                "role": result.get("role", "General Professional"),
                "experience_level": result.get("experience_level", "Mid-Level"),
                "skills": result.get("skills", []),
                "focus_areas": result.get("focus_areas", []),
                "readiness_score": result.get("readiness_score", 70)
            }
        except Exception as e:
            print(f"Gemini JD analysis failed: {e}. Falling back to rule-based analysis.")

    # --- FALLBACK RULE-BASED LOGIC ---
    text_lower = text.lower()
    role_docs = [" ".join(p["keywords"]) for p in ROLE_PROFILES]
    
    try:
        similarities = compute_tfidf_and_similarity(text_lower, role_docs)
        best_idx = int(similarities.index(max(similarities)))
        best_score = similarities[best_idx]
        
        if best_score > 0.05:
            matched_profile = ROLE_PROFILES[best_idx]
        else:
            counts = []
            for profile in ROLE_PROFILES:
                match_count = sum(1 for kw in profile["keywords"] if kw in text_lower)
                counts.append(match_count)
            best_idx = int(counts.index(max(counts))) if max(counts) > 0 else -1
            if best_idx != -1:
                matched_profile = ROLE_PROFILES[best_idx]
            else:
                matched_profile = GENERAL_PROFILE
    except Exception:
        matched_profile = GENERAL_PROFILE

    exp_level = "Mid-Level"
    if any(word in text_lower for word in ["junior", "entry level", "associate", "graduate", "0-2 years", "intern"]):
        exp_level = "Junior / Associate"
    elif any(word in text_lower for word in ["senior", "lead", "architect", "5+ years", "principal", "manager"]):
        exp_level = "Senior / Lead"
    elif any(word in text_lower for word in ["director", "vp", "executive", "head of"]):
        exp_level = "Executive / Director"

    extracted_skills = []
    common_keywords = [
        "Python", "Java", "C++", "C#", "Ruby", "PHP", "Go", "Rust", "Swift", "Kotlin", "TypeScript",
        "React", "Vue", "Angular", "Node.js", "Express", "Django", "Flask", "FastAPI", "Spring Boot",
        "Docker", "Kubernetes", "AWS", "Azure", "GCP", "Linux", "SQL", "NoSQL", "MongoDB", "PostgreSQL",
        "Git", "CI/CD", "Agile", "Scrum", "Jira", "Figma", "Redux", "GraphQL", "REST APIs", "gRPC",
        "Machine Learning", "Deep Learning", "TensorFlow", "PyTorch", "NLP", "Pandas", "Scikit-Learn",
        "Statistics", "A/B Testing", "Analytics", "MVP", "Product Strategy", "System Design"
    ]
    
    for skill in common_keywords:
        pattern = r'\b' + re.escape(skill.lower()) + r'\b'
        if re.search(pattern, text_lower):
            extracted_skills.append(skill)
            
    for skill in matched_profile.get("skills", []):
        if skill not in extracted_skills:
            extracted_skills.append(skill)
            
    extracted_skills = extracted_skills[:8]
    focus_areas = matched_profile.get("focus_areas", GENERAL_PROFILE["focus_areas"])
    base_score = matched_profile.get("readiness_score", 70)
    readiness_score = min(92, base_score + len(extracted_skills))

    return {
        "role": matched_profile["role"],
        "experience_level": exp_level,
        "skills": extracted_skills,
        "focus_areas": focus_areas,
        "readiness_score": readiness_score
    }
def get_answer_response(question, role, difficulty="Medium"):
    quota_exceeded = False
    if client:
        try:
            prompt = f"""
            Act as a top-tier interviewer. Answer the following candidate question or topic in an interview preparation context.
            Tailor the content level specifically to the difficulty level '{difficulty}'.
            
            Formatting & Style Guidelines:
            - Write in a highly readable, user-friendly, and concise format (similar to Gemini/ChatGPT).
            - Avoid long, dense walls of text. Break down explanations into short paragraphs.
            - Extensively use bullet points (`- `) or numbered lists where appropriate to make information scan-friendly.
            - Bold key terms and keywords using `**keyword**` to make them stand out.
            
            Guidelines for the difficulty levels:
            - Lite: Keep it simple, using high-level concepts and clear analogies. Avoid heavy jargon.
            - Medium: Use standard technical definitions, standard terminology, and common solutions.
            - Hardcore: Go deep into technical, mathematical, or algorithmic details, complex patterns, and code-level/architectural specifics.
            - Critical: Focus on high-scale systems design, operational trade-offs, production failures, data drift, deployment models, and business SLAs.
            
            Question/Topic: "{question}"
            Target Role: "{role}"
            Difficulty Level: "{difficulty}"
            
            Generate a response that matches the schema structure.
            """
            result = call_gemini_structured(prompt, AnswerResponse)
            return {
                "title": result.get("title", question),
                "concept_explanation": result.get("concept_explanation", ""),
                "interview_explanation": result.get("interview_explanation", ""),
                "real_world_example": result.get("real_world_example", ""),
                "common_mistakes": result.get("common_mistakes", ""),
                "interview_tip": result.get("interview_tip", ""),
                "follow_up_questions": result.get("follow_up_questions", [])
            }
        except Exception as e:
            print(f"Gemini answer response generation failed: {e}. Falling back to static knowledge base.")
            if "429" in str(e) or "RESOURCE_EXHAUSTED" in str(e) or "quota" in str(e).lower() or "limit" in str(e).lower():
                quota_exceeded = True

    # --- FALLBACK STATIC/TEMPLATE LOGIC ---
    q_clean = question.lower().strip().replace("?", "")
    matched_topic = None
    keys = list(TOPIC_KNOWLEDGE_BASE.keys())
    
    if keys:
        try:
            similarities = compute_tfidf_and_similarity(q_clean, keys)
            best_idx = similarities.index(max(similarities))
            if similarities[best_idx] > 0.35:
                matched_topic = keys[best_idx]
        except Exception:
            pass

    if matched_topic and matched_topic in TOPIC_KNOWLEDGE_BASE:
        topic_info = TOPIC_KNOWLEDGE_BASE[matched_topic]
        response = topic_info["difficulty_responses"].get(difficulty, topic_info["difficulty_responses"]["Medium"])
        title = topic_info["title"]
    else:
        title = question
        
        if difficulty == "Lite":
            response = {
                "concept": f"For {question}: Think of this concept in simple terms. It describes a key technique or tool in {role} that solves a common problem by keeping processes simple and straightforward.",
                "interview": f"In interviews, explain this by highlighting its core utility. Emphasize why it makes things easier and describe its benefits in simple language.",
                "example": f"Like using a label maker to organize items in your closet so you can find them instantly.",
                "mistakes": "Over-complicating the definition or using jargon that you can't explain.",
                "tip": "Keep your explanation brief and focused on the immediate benefit.",
                "follow_ups": [f"Why is {question} used?", "What is a simple alternative?", "When should we avoid it?"]
            }
        elif difficulty == "Hardcore":
            response = {
                "concept": f"In {role}, {question} represents a structural implementation pattern. It defines system interfaces, algorithms, or structural models to manage runtime scaling, concurrency, or performance metrics.",
                "interview": f"Formulate your response in terms of engineering architecture, algorithmic complexity, and system constraints. Detail the technical protocols, schemas, and processing overhead.",
                "example": f"Implementing this as an asynchronous pipeline with a thread-pool executor to decouple computation from IO blocks, maintaining a sub-100ms processing loop.",
                "mistakes": f"Giving a high-level conceptual explanation without outlining concrete interfaces, complexity classes (Big O), or protocol details.",
                "tip": "Draw a mental architecture diagram and talk through data flow, ingestion rates, and thread states.",
                "follow_ups": [f"What is the time complexity of {question}?", "How do you scale this architecture?", "Explain the memory constraints."]
            }
        elif difficulty == "Critical":
            response = {
                "concept": f"In production systems, {question} governs performance stability, high-availability SLAs, and system edge cases under distributed traffic spikes.",
                "interview": f"Focus on production tradeoffs. Discuss failure modes, fallback systems, consistency tradeoffs (CAP), rate-limiting, and metric-based alert configurations.",
                "example": f"Deploying this configuration with a distributed cache layer and circuit breaker patterns to prevent cascading database crashes during black-swan load events.",
                "mistakes": "Providing static academic definitions. Avoid ignoring resource costs, write amplification, and networking delays.",
                "tip": "Contrast alternative implementations and justify your engineering choices based on concrete business SLAs.",
                "follow_ups": [f"How does distributed state affect {question}?", "Explain the failover mechanism.", "What metrics would you monitor?"]
            }
        else:
            response = {
                "concept": f"{question} is a standard concept in {role} used to structure files, manage resources, or improve execution flows during standard operations.",
                "interview": f"Describe the concept clearly. Detail the standard implementation steps, the problem it solves, and give a structured example of its usage.",
                "example": f"Creating a modular interface for {question} to keep the codebase clean, readable, and easily testable.",
                "mistakes": "Failing to explain the exact problem this concept solves, making the answer sound purely academic.",
                "tip": "State a real-world scenario where this concept saved development time or prevented bugs.",
                "follow_ups": [f"Explain the benefits of {question}.", "What is a real-world project example?", "What are the common tools for this?"]
            }
            
    concept_explanation = response["concept"]
    if quota_exceeded:
        concept_explanation = "⚠️ **Gemini API Quota Exceeded (Free Tier limit of 20 requests/day reached. Showing local template response instead.)**\n\n" + concept_explanation

    return {
        "title": title,
        "concept_explanation": concept_explanation,
        "interview_explanation": response["interview"],
        "real_world_example": response["example"],
        "common_mistakes": response["mistakes"],
        "interview_tip": response["tip"],
        "follow_up_questions": response["follow_ups"]
    }

def generate_recommendations(role, skills):
    if client:
        try:
            prompt = f"""
            Generate personalized preparation recommendations for a candidate interviewing for the role of '{role}'.
            The candidate's core skills are: {', '.join(skills)}.
            
            Provide:
            1. A list of 4 key topics to study (each with an id, title, and priority: High, Medium, or Low).
            2. A list of 4 frequently asked interview questions (FAQs) for this role.
            3. A prioritized list of skills from their skill set (each with name and priority: High, Medium, or Low).
            4. 3 specific preparation areas or guidelines.
            
            Generate a response that matches the schema structure.
            """
            result = call_gemini_structured(prompt, RecommendationsResponse)
            
            topics = []
            for t in result.get("topics", []):
                topics.append({
                    "id": t.get("id", "t_unknown"),
                    "title": t.get("title", ""),
                    "priority": t.get("priority", "Medium")
                })
            
            skills_rec = []
            for s in result.get("skills", []):
                skills_rec.append({
                    "name": s.get("name", ""),
                    "priority": s.get("priority", "Medium")
                })
                
            return {
                "topics": topics,
                "faq": result.get("faq", []),
                "skills": skills_rec,
                "preparation_areas": result.get("preparation_areas", [])
            }
        except Exception as e:
            print(f"Gemini recommendations generation failed: {e}. Falling back to role-based profiles.")

    # --- FALLBACK LOGIC ---
    if role == "Software Engineer":
        topics = [
            {"id": "t1", "title": "REST APIs & Design", "priority": "High"},
            {"id": "t2", "title": "SQL vs NoSQL Databases", "priority": "High"},
            {"id": "t3", "title": "System Design Patterns", "priority": "Medium"},
            {"id": "t4", "title": "Data Structures & Algorithms", "priority": "High"}
        ]
        faq = [
            "Explain the difference between SQL and NoSQL databases.",
            "How do you design a stateless REST API?",
            "What is MVC and how does it separate concerns?",
            "How does Git merge conflict resolution work?"
        ]
        prep_areas = [
            "Practice writing SQL joins and index optimizations.",
            "Read up on System Design concepts like Load Balancers and Caching.",
            "Solve medium-difficulty array and string problems."
        ]
    elif role == "Data Scientist":
        topics = [
            {"id": "t1", "title": "Overfitting & Generalization", "priority": "High"},
            {"id": "t2", "title": "Bias-Variance Tradeoff", "priority": "High"},
            {"id": "t3", "title": "Cross-Validation Techniques", "priority": "Medium"},
            {"id": "t4", "title": "Feature Engineering & Scaling", "priority": "High"}
        ]
        faq = [
            "What is overfitting and how do you prevent it?",
            "Explain the Bias-Variance tradeoff.",
            "How does K-Fold Cross-Validation work?",
            "Explain Precision vs Recall and when to use which."
        ]
        prep_areas = [
            "Review statistical distributions and hypothesis testing.",
            "Write model evaluation pipelines in Scikit-Learn.",
            "Study regularization methods (Lasso/Ridge regression)."
        ]
    elif role == "DevOps Engineer":
        topics = [
            {"id": "t1", "title": "Containerization (Docker)", "priority": "High"},
            {"id": "t2", "title": "Orchestration (Kubernetes)", "priority": "High"},
            {"id": "t3", "title": "Infrastructure as Code (IaC)", "priority": "Medium"},
            {"id": "t4", "title": "CI/CD Deployment Pipelines", "priority": "High"}
        ]
        faq = [
            "What is Docker and how does it differ from VM?",
            "Explain the components of a Kubernetes Control Plane.",
            "How do you achieve blue-green deployments?",
            "Explain standard metrics to monitor server health."
        ]
        prep_areas = [
            "Write multi-stage Dockerfiles for size optimization.",
            "Study Kubernetes config maps, services, and ingress rules.",
            "Configure a simple GitHub Actions or GitLab pipeline."
        ]
    elif role == "Product Manager":
        topics = [
            {"id": "t1", "title": "Feature Prioritization Frameworks", "priority": "High"},
            {"id": "t2", "title": "MVP Definition & Scope", "priority": "High"},
            {"id": "t3", "title": "Product Metrics (AARRR)", "priority": "High"},
            {"id": "t4", "title": "A/B Testing & Analysis", "priority": "Medium"}
        ]
        faq = [
            "How do you prioritize features using the RICE framework?",
            "How do you define success metrics for a chat application?",
            "How do you handle feature requests from key enterprise clients?",
            "Tell me about a product you use daily and how you would improve it."
        ]
        prep_areas = [
            "Study RICE, Kano, and MoSCoW prioritization methods.",
            "Practice structuring answers using the CIRCLES method.",
            "Analyze metrics for popular SaaS products."
        ]
    else:
        topics = [
            {"id": "t1", "title": "Behavioral STAR Method", "priority": "High"},
            {"id": "t2", "title": "Professional Communication", "priority": "High"},
            {"id": "t3", "title": "Project Walkthroughs", "priority": "High"},
            {"id": "t4", "title": "Conflict Resolution", "priority": "Medium"}
        ]
        faq = [
            "Tell me about yourself.",
            "Describe a challenging project and how you solved it.",
            "How do you handle conflict in a team setting?",
            "What is your greatest professional accomplishment?"
        ]
        prep_areas = [
            "Prepare STAR stories for past accomplishments.",
            "Refine your elevator pitch (Tell me about yourself).",
            "Identify key takeaways from your failures."
        ]

    return {
        "topics": topics,
        "faq": faq,
        "skills": [{"name": skill, "priority": "High" if i < 3 else "Medium"} for i, skill in enumerate(skills)],
        "preparation_areas": prep_areas
    }

def get_mock_questions(role):
    if client:
        try:
            prompt = f"""
            Generate exactly 5 distinct, high-quality, and realistic interview questions for a candidate interviewing for the role of '{role}'.
            The first question should be a general introduction (e.g. 'Tell me about yourself.').
            The remaining 4 questions should cover technical concepts, design patterns, or behavioral challenges relevant to this role.
            
            Generate a response that matches the schema structure.
            """
            result = call_gemini_structured(prompt, MockQuestionsResponse)
            questions = result.get("questions", [])
            if len(questions) >= 5:
                return questions[:5]
        except Exception as e:
            print(f"Gemini mock questions generation failed: {e}. Falling back to default questions list.")

    # --- FALLBACK LOGIC ---
    return MOCK_INTERVIEW_QUESTIONS.get(role, MOCK_INTERVIEW_QUESTIONS["General Professional"])

def evaluate_answer(question, user_answer):
    if not user_answer or len(user_answer.strip()) < 10:
        return {
            "score": 35,
            "communication": 40,
            "confidence": 40,
            "technical_accuracy": 20,
            "structure": 30,
            "missing_concepts": ["Content is too short to evaluate. Please provide a more detailed answer."],
            "improvements": ["Give a structured explanation containing details, a real-world example, and key terms."],
            "better_version": "To answer this, describe the definition clearly, state a project or example where you applied it, and mention trade-offs or benefits.",
            "feedback": "Your answer is extremely brief. Try expanding your response using the STAR method or structured definitions."
        }

    if client:
        try:
            prompt = f"""
            Act as a technical interviewer evaluating a candidate's response to an interview question.
            Provide a deep, constructive, and qualitative assessment.
            
            Question: "{question}"
            Candidate's Answer: "{user_answer}"
            
            Assess and score (from 0 to 100):
            - technical_accuracy: correctness, terminology, and domain knowledge.
            - communication: articulation, professional tone, and clarity.
            - confidence: assertiveness and conviction.
            - structure: presence of clear introduction, details/body/examples, and conclusion.
            - score: overall average/weighted score reflecting the response quality.
            
            Also identify missing concepts/keywords, concrete actionable improvement suggestions, a premium rewrite ("better_version"), and general summary feedback.
            
            Generate a response that matches the schema structure.
            """
            result = call_gemini_structured(prompt, AnswerEvaluation)
            return {
                "score": result.get("score", 70),
                "communication": result.get("communication", 70),
                "confidence": result.get("confidence", 70),
                "technical_accuracy": result.get("technical_accuracy", 70),
                "structure": result.get("structure", 70),
                "missing_concepts": result.get("missing_concepts", []),
                "improvements": result.get("improvements", []),
                "better_version": result.get("better_version", ""),
                "feedback": result.get("feedback", "")
            }
        except Exception as e:
            print(f"Gemini answer evaluation failed: {e}. Falling back to TF-IDF comparison.")

    # --- FALLBACK LOGIC ---
    clean_user = user_answer.lower()
    sample = SAMPLE_ANSWERS.get(question, "")
    similarity = 0.5
    
    if sample:
        try:
            # Calculate pure Python similarity
            scores = compute_tfidf_and_similarity(clean_user, [sample.lower()])
            similarity = scores[0]
        except Exception:
            pass

    comm_score = min(95, 60 + len(user_answer.split()) // 3)
    conf_score = min(90, 65 + (len(user_answer.split()) // 5 if "specifically" in clean_user or "for example" in clean_user else 0))
    accuracy_score = int(similarity * 100)
    
    keywords_matched = 0
    test_keywords = sample.lower().split() if sample else ["implement", "process", "system", "use"]
    for kw in test_keywords:
        if len(kw) > 3 and kw in clean_user:
            keywords_matched += 1
    
    accuracy_score = max(40, min(95, accuracy_score + (keywords_matched * 5)))
    
    has_intro = any(word in clean_user for word in ["is a", "refers to", "stands for", "defined as"])
    has_body = any(word in clean_user for word in ["for example", "specifically", "such as", "like"])
    has_conclusion = any(word in clean_user for word in ["therefore", "overall", "in summary", "consequently", "resulting in"])
    
    structure_score = 50
    if has_intro: structure_score += 15
    if has_body: structure_score += 15
    if has_conclusion: structure_score += 15
    
    overall_score = int((comm_score + conf_score + accuracy_score + structure_score) / 4)

    missing = []
    improvements = []
    
    if accuracy_score < 70:
        missing.append("Specific standard terminology matching the concept.")
        improvements.append("Align your vocabulary with industry standards. Mention key terms from the documentation.")
    
    if not has_body:
        missing.append("Concrete real-world example or use-case.")
        improvements.append("Always include an example (e.g., 'In my previous project, we encountered this...') to back up your theoretical explanation.")
        
    if not has_conclusion:
        missing.append("Concluding summary or impact statement.")
        improvements.append("End your response with a strong statement on how this affects performance, scale, or business objectives.")
        
    if len(missing) == 0:
        missing = ["No major concepts missing! Your answer is robust."]
        improvements = ["Refine your delivery pacing and maintain steady eye contact during live interviews."]

    better_version = ""
    if sample:
        better_version = f"A premium response: \"{sample} For instance, in our development stack, we apply this by structuring our API layers stateless, ensuring high horizontal scalability. This prevents single point of failure bottlenecks under spike loads.\""
    else:
        better_version = "Here is a structured template: \"This concept represents [Core definition]. For example, in a recent application, we used it to solve [Problem]. The key benefit is [Advantage], though we must balance it against the trade-off of [Disadvantage].\""

    return {
        "score": overall_score,
        "communication": comm_score,
        "confidence": conf_score,
        "technical_accuracy": accuracy_score,
        "structure": structure_score,
        "missing_concepts": missing,
        "improvements": improvements,
        "better_version": better_version,
        "feedback": f"Your response demonstrates a score of {overall_score}%. " + 
                    ("You explained the core definitions nicely, but you should practice providing a clearer structure and adding real-world examples." if overall_score < 80 else 
                     "Great response! You structured the answer very well, showing both technical familiarity and strong communication capabilities.")
    }
