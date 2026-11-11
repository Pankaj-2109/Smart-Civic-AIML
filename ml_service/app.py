import os
from typing import Optional, List, Dict, Any
from fastapi import FastAPI, HTTPException, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from model import classifier
from severity import severity_predictor
from duplicate import duplicate_detector
from verification import verifier
from assistant import generate_assistant_response

app = FastAPI(
    title="SmartCivic ML & AI Microservice",
    description="High-performance machine learning API for image classification, severity scoring, duplicate detection, and civic assistance.",
    version="2.0.0"
)

# Enable CORS for Express backend & React frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class ImageRequest(BaseModel):
    image_url: Optional[str] = None
    image_path: Optional[str] = None
    description: Optional[str] = ""

class SeverityRequest(BaseModel):
    category: str
    confidence: Optional[float] = 0.90
    description: Optional[str] = ""
    location_type: Optional[str] = "residential"
    nearby_complaints_count: Optional[int] = 0
    days_pending: Optional[int] = 0

class DuplicateRequest(BaseModel):
    latitude: float
    longitude: float
    description: Optional[str] = ""
    category: Optional[str] = ""
    existing_complaints: List[Dict[str, Any]] = []

class VerifyResolutionRequest(BaseModel):
    before_image: str
    after_image: str

class ChatRequest(BaseModel):
    query: str
    user_context: Optional[Dict[str, Any]] = None

@app.get("/")
@app.get("/health")
def health():
    return {
        "status": "healthy",
        "service": "SmartCivic ML API",
        "models_loaded": {
            "image_classifier": "MobileNetV2 Civic Feature Engine",
            "severity_predictor": "Multi-Factor Civic Severity Model",
            "duplicate_detector": "Geodesic Haversine + TF-IDF Vectorizer",
            "verification_engine": "Surface Debris & Cleanliness Verifier",
            "ai_assistant": "Civic NLP Assistant"
        }
    }

@app.post("/predict/image")
async def predict_image(data: ImageRequest):
    """
    ML Model 1: Civic Issue Image Classification
    Classifies image into Garbage, Overflowing Bin, Pothole, Water Leakage, Illegal Dumping, Clean Area.
    """
    target = data.image_path or data.image_url
    if not target:
        raise HTTPException(status_code=400, detail="Must provide image_path or image_url")
        
    result = classifier.predict(target, description_hint=data.description)
    return result

@app.post("/predict/upload-image")
async def predict_upload_image(file: UploadFile = File(...), description: str = Form("")):
    """
    Accepts raw multipart file upload for direct image classification.
    """
    contents = await file.read()
    result = classifier.predict(contents, description_hint=description)
    return result

@app.post("/predict/severity")
def predict_severity(data: SeverityRequest):
    """
    ML Model 2: Complaint Severity Prediction
    Estimates LOW, MEDIUM, HIGH severity and priority score (0-100).
    """
    result = severity_predictor.predict(
        category=data.category,
        confidence=data.confidence or 0.90,
        description=data.description or "",
        location_type=data.location_type or "residential",
        nearby_complaints_count=data.nearby_complaints_count or 0,
        days_pending=data.days_pending or 0
    )
    return result

@app.post("/predict/duplicate")
def predict_duplicate(data: DuplicateRequest):
    """
    ML Model 3: Duplicate Complaint Detection
    Evaluates geographical distance and semantic text similarity.
    """
    result = duplicate_detector.detect_duplicate(
        new_lat=data.latitude,
        new_lon=data.longitude,
        new_description=data.description or "",
        new_category=data.category or "",
        existing_complaints=data.existing_complaints
    )
    return result

@app.post("/predict/verify-resolution")
def verify_resolution(data: VerifyResolutionRequest):
    """
    Standout Feature 3: Before and After Verification
    Assesses cleanliness difference between original and resolved photos.
    """
    result = verifier.verify_resolution(data.before_image, data.after_image)
    return result

@app.post("/assistant/chat")
def assistant_chat(data: ChatRequest):
    """
    Standout Feature 4: AI Civic Assistant
    """
    result = generate_assistant_response(data.query, data.user_context)
    return result

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app:app", host="0.0.0.0", port=8000, reload=True)

