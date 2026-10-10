"""
AgriAgent Backend — FastAPI Entry Point
========================================
Author: jasonjose007
Stack : FastAPI + Google Gemini 3.8 Flash + Function Calling (google-genai SDK)

Run with:
    cd backend
    pip install -r requirements.txt
    cp .env.example .env        # then paste your Gemini API key
    uvicorn main:app --reload

Endpoints:
    POST /api/chat        — Agentic chat (text + optional image)
    POST /api/diagnose    — Standalone crop disease vision diagnosis
    GET  /api/schemes     — Quick scheme lookup (non-agentic, for the frontend)
    GET  /health          — Health check
"""

from fastapi import FastAPI, File, Form, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from models.schemas import AgentResponse, ChatRequest, DiagnoseResponse
from agent.core import AgriAgent
from agent.tools import match_agri_schemes, fetch_mandi_and_weather, diagnose_crop_disease
from config import GOOGLE_API_KEY
from google import genai

app = FastAPI(
    title="AgriAgent API",
    description="AI-powered agriculture assistant for Indian farmers — DevFest on Campus Chennai 2026",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

agent = AgriAgent()


# ---------------------------------------------------------------------------
# POST /api/chat — The main agentic endpoint
# ---------------------------------------------------------------------------
# This is the core of the project. It accepts a user message (and an optional
# crop photo), runs the full Gemini function-calling agent loop, and returns:
#   1. The agent's natural-language reply
#   2. A structured log of every tool that was triggered
#
# The tool_calls log is what proves this is an AGENT, not a wrapper — the
# model autonomously decides which tools to call based on the user's intent.

@app.post("/api/chat", response_model=AgentResponse)
async def chat_endpoint(
    message: str = Form(..., description="The farmer's question or request"),
    image: UploadFile | None = File(None, description="Optional crop leaf photo for disease diagnosis"),
):
    if not GOOGLE_API_KEY:
        raise HTTPException(status_code=500, detail="GOOGLE_API_KEY not configured. Add it to .env")

    image_bytes = None
    image_mime = "image/jpeg"
    if image:
        image_bytes = await image.read()
        image_mime = image.content_type or "image/jpeg"

    try:
        result = await agent.run(
            user_message=message,
            image_bytes=image_bytes,
            image_mime=image_mime,
        )
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Agent error: {str(e)}")

    return result


# ---------------------------------------------------------------------------
# POST /api/chat/json — Same agent, but accepts JSON body (no image)
# ---------------------------------------------------------------------------
# Convenience endpoint for frontends that prefer JSON over multipart form data.

@app.post("/api/chat/json", response_model=AgentResponse)
async def chat_json_endpoint(req: ChatRequest):
    if not GOOGLE_API_KEY:
        raise HTTPException(status_code=500, detail="GOOGLE_API_KEY not configured. Add it to .env")

    try:
        result = await agent.run(user_message=req.message)
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Agent error: {str(e)}")

    return result


# ---------------------------------------------------------------------------
# POST /api/diagnose — Standalone crop disease diagnosis
# ---------------------------------------------------------------------------
# Direct vision endpoint — uploads a crop leaf image and gets a diagnosis
# without going through the full agent loop. Useful for a dedicated
# "Scan Leaf" feature in the frontend.

@app.post("/api/diagnose", response_model=DiagnoseResponse)
async def diagnose_endpoint(
    image: UploadFile = File(..., description="Crop leaf photo to analyze"),
):
    if not GOOGLE_API_KEY:
        raise HTTPException(status_code=500, detail="GOOGLE_API_KEY not configured. Add it to .env")

    image_bytes = await image.read()
    mime_type = image.content_type or "image/jpeg"

    try:
        client = genai.Client(api_key=GOOGLE_API_KEY)
        result = diagnose_crop_disease(client, image_bytes, mime_type)
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
# GET /api/schemes — Quick non-agentic scheme lookup
# ---------------------------------------------------------------------------

@app.get("/api/schemes")
async def schemes_lookup(crop_type: str, acreage: float, region: str = "Tamil Nadu"):
    return match_agri_schemes(crop_type, acreage, region)


# ---------------------------------------------------------------------------
# GET /api/market — Quick non-agentic market + weather lookup
# ---------------------------------------------------------------------------

@app.get("/api/market")
async def market_lookup(district: str, commodity: str):
    return fetch_mandi_and_weather(district, commodity)


# ---------------------------------------------------------------------------
# GET /health
# ---------------------------------------------------------------------------

@app.get("/health")
async def health():
    return {
        "status": "ok",
        "service": "AgriAgent",
        "api_key_configured": bool(GOOGLE_API_KEY),
    }
