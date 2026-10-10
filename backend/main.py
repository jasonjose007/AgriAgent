"""
AgriAgent Backend — FastAPI Entry Point
========================================
Author: jasonjose007
Stack : FastAPI + SQLAlchemy + Google Gemini 3.8 Flash + Function Calling (google-genai SDK)

Run:  uvicorn main:app --reload
Docs: http://localhost:8000/docs
"""

from fastapi import FastAPI, File, Form, UploadFile, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session

from database import engine, get_db, Base
from models.db_models import AgentSessionLog
from models.schemas import AgentResponse, ChatRequest, DiagnoseResponse, UserProfile
from agent.core import AgriAgent
from agent.tools import match_agri_schemes, fetch_mandi_and_weather, diagnose_crop_disease
from auth import router as auth_router, get_current_user, require_user
from config import GOOGLE_API_KEY
from google import genai

Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="AgriAgent API",
    description="AI-powered agriculture assistant — DevFest on Campus Chennai 2026",
    version="2.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router)

agent = AgriAgent()


# ---------------------------------------------------------------------------
# POST /api/agent/chat — Protected agentic endpoint (profile-aware)
# ---------------------------------------------------------------------------

@app.post("/api/agent/chat", response_model=AgentResponse)
async def agent_chat(
    message: str = Form(...),
    image: UploadFile | None = File(None),
    user=Depends(require_user),
    db: Session = Depends(get_db),
):
    if not GOOGLE_API_KEY:
        raise HTTPException(status_code=500, detail="GOOGLE_API_KEY not configured")

    profile = UserProfile.model_validate(user)

    image_bytes = None
    image_mime = "image/jpeg"
    if image:
        image_bytes = await image.read()
        image_mime = image.content_type or "image/jpeg"

    try:
        result = await agent.run(
            user_message=message,
            profile=profile,
            image_bytes=image_bytes,
            image_mime=image_mime,
        )
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Agent error: {str(e)}")

    log = AgentSessionLog(
        user_id=user.id,
        query_text=message,
        tools_executed=[{"tool": t.tool_name, "args": t.arguments} for t in result.tool_calls],
        final_output=result.reply[:2000],
    )
    db.add(log)
    db.commit()

    return result


# ---------------------------------------------------------------------------
# POST /api/chat — Public agentic endpoint (backward compatible, no profile)
# ---------------------------------------------------------------------------

@app.post("/api/chat", response_model=AgentResponse)
async def chat_public(
    message: str = Form(...),
    image: UploadFile | None = File(None),
    user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if not GOOGLE_API_KEY:
        raise HTTPException(status_code=500, detail="GOOGLE_API_KEY not configured")

    profile = UserProfile.model_validate(user) if user else None

    image_bytes = None
    image_mime = "image/jpeg"
    if image:
        image_bytes = await image.read()
        image_mime = image.content_type or "image/jpeg"

    try:
        result = await agent.run(
            user_message=message,
            profile=profile,
            image_bytes=image_bytes,
            image_mime=image_mime,
        )
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Agent error: {str(e)}")

    if user:
        log = AgentSessionLog(
            user_id=user.id,
            query_text=message,
            tools_executed=[{"tool": t.tool_name, "args": t.arguments} for t in result.tool_calls],
            final_output=result.reply[:2000],
        )
        db.add(log)
        db.commit()

    return result


# ---------------------------------------------------------------------------
# POST /api/diagnose — Standalone crop disease diagnosis
# ---------------------------------------------------------------------------

@app.post("/api/diagnose", response_model=DiagnoseResponse)
async def diagnose_endpoint(
    image: UploadFile = File(...),
    user=Depends(get_current_user),
):
    if not GOOGLE_API_KEY:
        raise HTTPException(status_code=500, detail="GOOGLE_API_KEY not configured")

    image_bytes = await image.read()
    mime_type = image.content_type or "image/jpeg"
    soil = user.soil_type if user else ""

    try:
        client = genai.Client(api_key=GOOGLE_API_KEY)
        result = diagnose_crop_disease(client, image_bytes, mime_type, soil_type=soil)
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Vision model error: {str(e)}")

    return DiagnoseResponse(
        diagnosis=result.get("raw_response", "") if result.get("parse_error") else f"{result.get('disease_name', 'Unknown')} ({result.get('confidence', 'N/A')} confidence)",
        disease_name=result.get("disease_name"),
        confidence=result.get("confidence"),
        treatment=result.get("treatment", []),
        preventive_measures=result.get("preventive_measures", []),
    )


# ---------------------------------------------------------------------------
# Quick non-agentic lookups
# ---------------------------------------------------------------------------

@app.get("/api/schemes")
async def schemes_lookup(crop_type: str, acreage: float, region: str = "Tamil Nadu", soil_type: str = ""):
    return match_agri_schemes(crop_type, acreage, region, soil_type)


@app.get("/api/market")
async def market_lookup(district: str, commodity: str, soil_type: str = ""):
    return fetch_mandi_and_weather(district, commodity, soil_type)


@app.get("/health")
async def health():
    return {"status": "ok", "service": "AgriAgent", "version": "2.0.0", "api_key_configured": bool(GOOGLE_API_KEY)}
