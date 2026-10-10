from pydantic import BaseModel, Field
from typing import Any


class ChatRequest(BaseModel):
    message: str = Field(..., min_length=1, description="User's question or request")


class ToolCallEntry(BaseModel):
    """One step in the agent's reasoning trace — shows which tool was called and why."""
    tool_name: str
    arguments: dict[str, Any]
    result: dict[str, Any]


class AgentResponse(BaseModel):
    """Final response from the agentic loop, with full transparency."""
    reply: str = Field(..., description="The agent's natural-language answer")
    tool_calls: list[ToolCallEntry] = Field(
        default_factory=list,
        description="Ordered log of every tool the agent invoked",
    )
    model_used: str = "gemini-3.8-flash"


class DiagnoseRequest(BaseModel):
    pass


class DiagnoseResponse(BaseModel):
    diagnosis: str
    disease_name: str | None = None
    confidence: str | None = None
    treatment: list[str] = Field(default_factory=list)
    preventive_measures: list[str] = Field(default_factory=list)
