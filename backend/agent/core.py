"""
AgriAgent Core — The Agentic Reasoning Loop
============================================

How function calling works (for the judges):

  1. User sends a natural-language message (e.g. "I grow rice in 3 acres in Thanjavur,
     what schemes can I get and what's the current price?").

  2. We forward this to Gemini along with TOOL DECLARATIONS — JSON schemas
     auto-generated from our Python function signatures and docstrings.

  3. Gemini DOES NOT execute code. Instead, it returns a structured FunctionCall
     saying: "I want to call match_agri_schemes with {crop_type: rice, acreage: 3,
     region: Thanjavur}".

  4. OUR backend executes the function, collects the result, and sends it back
     to Gemini as a FunctionResponse.

  5. Gemini may call MORE tools (e.g. fetch_mandi_and_weather next), or it may
     decide it has enough data and generate a final natural-language reply.

  6. We loop until Gemini stops requesting tools (max 6 iterations for safety).

  7. The response includes BOTH the reply AND a structured log of every tool call —
     this transparency is critical for the hackathon's "no black box" requirement.

This is a SEMI-AUTONOMOUS agent: it reasons and takes actions (tool calls) but
never makes irreversible official decisions — it only drafts recommendations.
"""

import asyncio
import json
from functools import partial

from google import genai
from google.genai import types

from config import GOOGLE_API_KEY, GEMINI_MODEL
from models.schemas import AgentResponse, ToolCallEntry
from agent.tools import AGENT_TOOLS, TOOL_DISPATCHER, diagnose_crop_disease

MAX_TOOL_ITERATIONS = 6

SYSTEM_INSTRUCTION = """\
You are AgriAgent, an AI-powered agriculture assistant built for Indian farmers, \
specializing in Tamil Nadu. You help farmers with:

1. Diagnosing crop diseases and pests — from text descriptions OR leaf photos
2. Finding eligible government schemes and subsidies
3. Checking current market prices (mandi rates) and weather conditions

INTENT DETECTION — read the farmer's message carefully and respond to WHAT THEY ACTUALLY ASKED:

- DISEASE / PEST QUERY (mentions spots, yellowing, wilting, curling, rot, fungus, insects, \
pests, disease, damage, dying, brown, holes, lesions, blight, or any crop health problem): \
Provide a detailed diagnosis in simple language. Explain what is happening to the plant, \
what likely caused it, what disease or pest it could be, and give a clear treatment plan \
with specific pesticide/fungicide names and dosages. Also mention prevention steps. \
Do NOT call scheme or market tools for disease queries unless the farmer also asks about them.

- SCHEME / SUBSIDY QUERY (explicitly asks about schemes, subsidies, benefits, government help, \
PM-KISAN, eligibility, or financial assistance AND mentions crop + acreage + region): \
Call match_agri_schemes.

- MARKET / WEATHER QUERY (explicitly asks about price, rate, mandi, selling, market, or weather): \
Call fetch_mandi_and_weather.

- COMBINED QUERY (asks about multiple things): Call only the tools relevant to what was asked.

RESPONSE RULES:
- For disease queries: Start with a clear 2-3 sentence summary of what is wrong with the crop \
in very simple language a farmer can understand. Then give details on cause, treatment, and prevention.
- Use the available tools for prices and schemes. Never make up prices or scheme details.
- Present information clearly in simple language. Use bullet points.
- Always end scheme recommendations with: "This is a draft — please verify at your nearest CSC or agriculture office."
- You are advisory only. Never claim to submit applications or make official decisions.
- If the user speaks in Tamil transliteration, respond in English but acknowledge their language.
- Include specific rupee amounts, dates, and action steps whenever possible.
"""


def _run_agent_sync(user_message: str, image_bytes: bytes | None = None,
                    image_mime: str = "image/jpeg") -> AgentResponse:
    """
    Synchronous agent loop. We run this in a thread pool from the async endpoint
    because the google-genai SDK uses synchronous httpx under the hood.
    """
    client = genai.Client(api_key=GOOGLE_API_KEY)
    tool_log: list[ToolCallEntry] = []

    # ---- Step 1: Build initial message ----
    message_text = user_message

    if image_bytes:
        vision_result = diagnose_crop_disease(client, image_bytes, image_mime)
        tool_log.append(ToolCallEntry(
            tool_name="diagnose_crop_disease",
            arguments={"image_size_bytes": len(image_bytes), "mime_type": image_mime},
            result=vision_result,
        ))
        message_text = (
            f"{user_message}\n\n"
            f"[VISION ANALYSIS RESULT]\n{json.dumps(vision_result, indent=2)}\n"
            "Use this diagnosis to help the farmer. Suggest treatments and next steps."
        )

    # ---- Step 2: Start chat with tools registered ----
    # The google-genai SDK reads our Python function type hints and docstrings
    # to auto-generate the JSON schemas that Gemini uses to decide which tool to call.
    chat = client.chats.create(
        model=GEMINI_MODEL,
        config=types.GenerateContentConfig(
            system_instruction=SYSTEM_INSTRUCTION,
            tools=AGENT_TOOLS,
            automatic_function_calling=types.AutomaticFunctionCallingConfig(
                disable=True,  # We handle the loop manually so we can log each step
            ),
        ),
    )

    response = chat.send_message(message_text)

    # ---- Step 3: Agentic loop — keep going while Gemini wants to call tools ----
    for _ in range(MAX_TOOL_ITERATIONS):
        function_calls = _extract_function_calls(response)
        if not function_calls:
            break

        fn_response_parts = []
        for fc in function_calls:
            tool_fn = TOOL_DISPATCHER.get(fc.name)
            if tool_fn is None:
                result = {"error": f"Unknown tool: {fc.name}"}
            else:
                args = dict(fc.args) if fc.args else {}
                result = tool_fn(**args)

            tool_log.append(ToolCallEntry(
                tool_name=fc.name,
                arguments=dict(fc.args) if fc.args else {},
                result=result,
            ))

            fn_response_parts.append(
                types.Part.from_function_response(
                    name=fc.name,
                    response={"result": json.dumps(result, default=str)},
                )
            )

        # Feed all tool results back to Gemini in one round-trip
        response = chat.send_message(fn_response_parts)

    # ---- Step 4: Extract final text reply ----
    reply = _extract_text(response)

    return AgentResponse(
        reply=reply,
        tool_calls=tool_log,
        model_used=GEMINI_MODEL,
    )


class AgriAgent:
    """Stateless agent — each call to `run()` is an independent reasoning loop."""

    async def run(self, user_message: str, image_bytes: bytes | None = None,
                  image_mime: str = "image/jpeg") -> AgentResponse:
        """
        Async wrapper that runs the sync agent loop in a thread pool.
        This avoids event-loop conflicts between FastAPI/uvicorn and the
        google-genai SDK's synchronous HTTP client.
        """
        loop = asyncio.get_event_loop()
        return await loop.run_in_executor(
            None,
            partial(_run_agent_sync, user_message, image_bytes, image_mime),
        )


def _extract_function_calls(response) -> list:
    """Pull all FunctionCall objects from a Gemini response."""
    calls = []
    try:
        for part in response.candidates[0].content.parts:
            if part.function_call and part.function_call.name:
                calls.append(part.function_call)
    except (IndexError, AttributeError):
        pass
    return calls


def _extract_text(response) -> str:
    """Pull concatenated text from a Gemini response."""
    texts = []
    try:
        for part in response.candidates[0].content.parts:
            if part.text:
                texts.append(part.text)
    except (IndexError, AttributeError):
        pass
    return "\n".join(texts) if texts else "I wasn't able to generate a response. Please try again."
