"""
AgriAgent Core — Profile-Aware Agentic Reasoning Loop
======================================================
When a logged-in farmer chats, their stored profile (district, soil_type, acreage,
crop) is injected into the system instruction so the agent's tool calls use
real farmer data without requiring repetitive inputs.
"""

import asyncio
import json
from functools import partial

from google import genai
from google.genai import types

from config import GOOGLE_API_KEY, GEMINI_MODEL
from models.schemas import AgentResponse, ToolCallEntry, UserProfile
from agent.tools import AGENT_TOOLS, TOOL_DISPATCHER, diagnose_crop_disease

MAX_TOOL_ITERATIONS = 6

BASE_INSTRUCTION = """\
You are AgriAgent, an AI-powered agriculture assistant built for Indian farmers, \
specializing in Tamil Nadu.

{profile_block}

YOUR CAPABILITIES:
1. Diagnose crop diseases and pests — from text descriptions OR leaf photos
2. Find eligible government schemes and subsidies
3. Check current mandi (market) prices and weather with soil-specific advisories
4. Generate pre-filled e-Seva application drafts for scheme submissions

INTENT DETECTION — respond to WHAT THE FARMER ACTUALLY ASKED:

- DISEASE / PEST QUERY (mentions spots, yellowing, wilting, curling, rot, fungus, insects, \
pests, disease, damage, dying, brown, holes, lesions, blight, or any crop health problem): \
Provide a detailed diagnosis. Explain what is happening to the plant in simple language, \
what likely caused it, and give a clear treatment plan with specific pesticide/fungicide \
names and dosages. Factor in the farmer's soil type for treatment advice. \
Do NOT call scheme or market tools for disease queries unless also asked.

- SCHEME / SUBSIDY QUERY (asks about schemes, subsidies, benefits, government help, \
PM-KISAN, eligibility, or financial assistance): Call match_agri_schemes using the \
farmer's profile data.

- MARKET / WEATHER QUERY (asks about price, rate, mandi, selling, market, or weather): \
Call fetch_mandi_and_weather using the farmer's district. Include the soil_type parameter.

- E-SEVA DRAFT REQUEST (farmer wants to apply, asks for application form, wants to go to \
e-Seva, or you recommend a scheme they should apply for): Call generate_official_draft \
with the farmer's name, district, scheme details, and required documents.

- COMBINED QUERY: Call only the tools relevant to what was asked.

RESPONSE RULES:
- For disease queries: Start with a clear 2-3 sentence summary in very simple language.
- Use tools for prices and schemes — never make up data.
- When recommending a scheme, always offer to generate an e-Seva draft.
- End scheme recommendations with: "This is a draft — please verify at your nearest CSC."
- You are advisory only — never claim to submit official applications.
- Include specific amounts, dates, and action steps.
"""

PROFILE_BLOCK = """\
FARMER PROFILE (auto-loaded from their account — use this data when calling tools):
- Name: {full_name}
- District: {district}
- Soil Type: {soil_type}
- Land Size: {acreage} acres
- Primary Crop: {primary_crop}

IMPORTANT: You already know this farmer's details. Use them directly when calling tools. \
Do NOT ask the farmer to repeat their location, soil type, acreage, or crop."""

NO_PROFILE_BLOCK = """\
The farmer is not logged in, so you don't have their profile. \
Ask for crop type, land size, and district when needed to call tools."""


def _build_instruction(profile: UserProfile | None) -> str:
    if profile:
        block = PROFILE_BLOCK.format(
            full_name=profile.full_name,
            district=profile.district,
            soil_type=profile.soil_type,
            acreage=profile.acreage,
            primary_crop=profile.primary_crop,
        )
    else:
        block = NO_PROFILE_BLOCK
    return BASE_INSTRUCTION.format(profile_block=block)


def _run_agent_sync(
    user_message: str,
    profile: UserProfile | None = None,
    image_bytes: bytes | None = None,
    image_mime: str = "image/jpeg",
) -> AgentResponse:
    client = genai.Client(api_key=GOOGLE_API_KEY)
    tool_log: list[ToolCallEntry] = []
    message_text = user_message
    soil = profile.soil_type if profile else ""

    if image_bytes:
        vision_result = diagnose_crop_disease(client, image_bytes, image_mime, soil_type=soil)
        tool_log.append(ToolCallEntry(
            tool_name="diagnose_crop_disease",
            arguments={"image_size_bytes": len(image_bytes), "mime_type": image_mime, "soil_type": soil},
            result=vision_result,
        ))
        message_text = (
            f"{user_message}\n\n"
            f"[VISION ANALYSIS RESULT]\n{json.dumps(vision_result, indent=2)}\n"
            "Use this diagnosis to help the farmer. Suggest treatments and next steps."
        )

    system_instruction = _build_instruction(profile)

    chat = client.chats.create(
        model=GEMINI_MODEL,
        config=types.GenerateContentConfig(
            system_instruction=system_instruction,
            tools=AGENT_TOOLS,
            automatic_function_calling=types.AutomaticFunctionCallingConfig(disable=True),
        ),
    )

    response = chat.send_message(message_text)

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
            fn_response_parts.append(types.Part.from_function_response(
                name=fc.name,
                response={"result": json.dumps(result, default=str)},
            ))

        response = chat.send_message(fn_response_parts)

    reply = _extract_text(response)

    return AgentResponse(
        reply=reply,
        tool_calls=tool_log,
        model_used=GEMINI_MODEL,
        farmer_profile=profile,
    )


class AgriAgent:
    async def run(self, user_message: str, profile: UserProfile | None = None,
                  image_bytes: bytes | None = None, image_mime: str = "image/jpeg") -> AgentResponse:
        loop = asyncio.get_running_loop()
        return await loop.run_in_executor(
            None,
            partial(_run_agent_sync, user_message, profile, image_bytes, image_mime),
        )


def _extract_function_calls(response) -> list:
    calls = []
    try:
        for part in response.candidates[0].content.parts:
            if part.function_call and part.function_call.name:
                calls.append(part.function_call)
    except (IndexError, AttributeError):
        pass
    return calls


def _extract_text(response) -> str:
    texts = []
    try:
        for part in response.candidates[0].content.parts:
            if part.text:
                texts.append(part.text)
    except (IndexError, AttributeError):
        pass
    return "\n".join(texts) if texts else "I wasn't able to generate a response. Please try again."
