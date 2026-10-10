from pydantic import BaseModel, Field
from typing import Any


# --- Auth ---

class RegisterRequest(BaseModel):
    full_name: str = Field(..., min_length=2)
    phone_number: str = Field(..., min_length=10)
    password: str = Field(..., min_length=4)
    district: str
    soil_type: str
    acreage: float = Field(..., gt=0)
    primary_crop: str
    preferred_language: str = "English"


class LoginRequest(BaseModel):
    phone_number: str
    password: str


class UserProfile(BaseModel):
    id: int
    full_name: str
    phone_number: str
    district: str
    soil_type: str
    acreage: float
    primary_crop: str
    preferred_language: str

    model_config = {"from_attributes": True}


class ProfileUpdate(BaseModel):
    district: str | None = None
    soil_type: str | None = None
    acreage: float | None = None
    primary_crop: str | None = None
    preferred_language: str | None = None


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserProfile


# --- Agent ---

class ChatRequest(BaseModel):
    message: str = Field(..., min_length=1)


class ToolCallEntry(BaseModel):
    tool_name: str
    arguments: dict[str, Any]
    result: dict[str, Any]


class AgentResponse(BaseModel):
    reply: str
    tool_calls: list[ToolCallEntry] = Field(default_factory=list)
    model_used: str = "gemini-3.8-flash"
    farmer_profile: UserProfile | None = None


class DiagnoseResponse(BaseModel):
    diagnosis: str
    disease_name: str | None = None
    confidence: str | None = None
    treatment: list[str] = Field(default_factory=list)
    preventive_measures: list[str] = Field(default_factory=list)


# --- Scheme Explorer Hub ---

class SchemeMatchRequest(BaseModel):
    district: str | None = None
    soil_type: str | None = None
    acreage: float | None = None
    crop_type: str | None = None
    category_filter: str | None = None


class SchemeDraftRequest(BaseModel):
    scheme_id: str
    farmer_name: str | None = None
    district: str | None = None
