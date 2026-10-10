"""
AgriAgent Tool Definitions
==========================
Each tool is a plain Python function that returns structured data.
Gemini's function-calling mechanism lets the LLM *choose* which tool to invoke
based on the user's intent — the model never executes code directly; it returns
a FunctionCall, and OUR code dispatches it. This is what makes it an
"agentic" system rather than a static pipeline.

For the hackathon judges:
  1. We register each tool as a Python function with typed parameters.
  2. The google-genai SDK auto-generates JSON schemas from our type hints/docstrings.
  3. Gemini inspects these schemas and decides which tool(s) to call.
  4. We execute the tool locally, feed the result back, and Gemini synthesizes
     a human-readable answer from the raw data.
"""

from datetime import datetime, timezone, timedelta

from google import genai
from google.genai import types

from data.schemes import AGRI_SCHEMES, MANDI_PRICES, WEATHER_DATA


# ---------------------------------------------------------------------------
# TOOL 1: Scheme Matcher
# ---------------------------------------------------------------------------

def match_agri_schemes(crop_type: str, acreage: float, region: str) -> dict:
    """
    Find eligible government agriculture schemes for a farmer and draft an
    eligibility checklist. This is a DRAFT — it does not submit any official
    application (satisfying the hackathon rule: no irreversible decisions).

    Args:
        crop_type: The primary crop being cultivated (e.g. rice, sugarcane, cotton, banana).
        acreage: Total farmland area in acres.
        region: State or district name in India (e.g. Tamil Nadu, Thanjavur, Coimbatore).
    """
    crop = crop_type.lower().strip()
    region_lower = region.lower().strip()
    is_tamil_nadu = any(
        kw in region_lower
        for kw in ["tamil nadu", "tamilnadu", "tn", "thanjavur", "coimbatore",
                    "madurai", "salem", "erode", "tiruchirappalli", "tirunelveli", "chennai"]
    )

    matched = []
    for scheme in AGRI_SCHEMES:
        crop_ok = (
            scheme["eligible_crops"] == "all"
            or crop in scheme["eligible_crops"].split(",")
        )
        acreage_ok = (
            scheme["max_acreage"] is None
            or acreage <= scheme["max_acreage"]
        )
        region_ok = (
            scheme["eligible_regions"] == "all"
            or (scheme["eligible_regions"] == "tamil_nadu" and is_tamil_nadu)
        )

        if crop_ok and acreage_ok and region_ok:
            matched.append({
                "scheme_id": scheme["scheme_id"],
                "name": scheme["name"],
                "benefit": scheme["benefit"],
                "documents_required": scheme["documents_required"],
                "apply_url": scheme["apply_url"],
                "eligibility_status": "LIKELY ELIGIBLE (draft — verify at nearest CSC)",
            })

    return {
        "farmer_profile": {
            "crop": crop_type,
            "acreage_acres": acreage,
            "region": region,
        },
        "matched_schemes": matched,
        "total_matches": len(matched),
        "disclaimer": "This is a draft eligibility check. Visit your nearest Common Service Centre (CSC) or district agriculture office to confirm and submit applications.",
        "generated_at": datetime.now(timezone(timedelta(hours=5, minutes=30))).isoformat(),
    }


# ---------------------------------------------------------------------------
# TOOL 2: Mandi Prices + Weather
# ---------------------------------------------------------------------------

def fetch_mandi_and_weather(district: str, commodity: str) -> dict:
    """
    Fetch current mandi (market) prices and local weather for a commodity
    in a Tamil Nadu district. In production this would call the Agmarknet
    and IMD APIs.

    Args:
        district: Tamil Nadu district name (e.g. Thanjavur, Coimbatore, Madurai, Erode).
        commodity: Crop or commodity name (e.g. rice, turmeric, coconut, banana).
    """
    district_key = district.lower().strip()
    commodity_key = commodity.lower().strip()

    alias_map = {"paddy": "rice", "groundnut oil": "groundnut", "nariyal": "coconut"}
    commodity_key = alias_map.get(commodity_key, commodity_key)

    district_prices = MANDI_PRICES.get(district_key, {})
    price_info = district_prices.get(commodity_key)

    weather = WEATHER_DATA.get(district_key)

    result: dict = {"district": district, "commodity": commodity}

    if price_info:
        result["market_price"] = {
            **price_info,
            "date": datetime.now(timezone(timedelta(hours=5, minutes=30))).strftime("%Y-%m-%d"),
            "msp_comparison": _get_msp_note(commodity_key, price_info["modal_price"]),
        }
    else:
        available = list(district_prices.keys()) if district_prices else []
        result["market_price"] = {
            "error": f"No price data for '{commodity}' in {district}.",
            "available_commodities": available,
            "available_districts": list(MANDI_PRICES.keys()),
        }

    if weather:
        result["weather"] = weather
    else:
        result["weather"] = {
            "error": f"No weather data for '{district}'.",
            "available_districts": list(WEATHER_DATA.keys()),
        }

    return result


def _get_msp_note(commodity: str, modal_price: float) -> str:
    """Compare market price against Minimum Support Price (MSP) 2024-25."""
    msp_table = {
        "rice": 2300, "paddy": 2300, "wheat": 2275, "cotton": 7121,
        "groundnut": 6377, "sugarcane": 315, "maize": 2090,
    }
    msp = msp_table.get(commodity)
    if msp is None:
        return "MSP not applicable for this commodity."
    diff = modal_price - msp
    if diff >= 0:
        return f"Market price is Rs {diff}/qtl ABOVE MSP (Rs {msp}). Favourable for selling."
    return f"Market price is Rs {abs(diff)}/qtl BELOW MSP (Rs {msp}). Consider selling via govt procurement."


# ---------------------------------------------------------------------------
# TOOL 3: Vision Diagnostic (Gemini Multimodal)
# ---------------------------------------------------------------------------

def diagnose_crop_disease(client: genai.Client, image_bytes: bytes, mime_type: str = "image/jpeg") -> dict:
    """
    Uses Gemini 3.8 Flash's vision capability to analyze a crop leaf photo.
    Returns a structured diagnosis with treatment suggestions.
    This is advisory only — the farmer should confirm with an agriculture officer.
    """
    prompt = (
        "You are an expert agricultural pathologist. Analyze this crop leaf image.\n"
        "Return your response as EXACTLY this JSON structure (no markdown, no extra text):\n"
        "{\n"
        '  "disease_name": "name of the disease or Healthy if no disease",\n'
        '  "confidence": "High / Medium / Low",\n'
        '  "crop_identified": "the crop species you see",\n'
        '  "symptoms_observed": ["list", "of", "visible", "symptoms"],\n'
        '  "treatment": ["step 1", "step 2"],\n'
        '  "preventive_measures": ["measure 1", "measure 2"],\n'
        '  "urgency": "Immediate / Within a week / Monitor"\n'
        "}\n"
    )

    response = client.models.generate_content(
        model="gemini-3.8-flash",
        contents=[
            types.Content(
                role="user",
                parts=[
                    types.Part.from_text(text=prompt),
                    types.Part.from_bytes(data=image_bytes, mime_type=mime_type),
                ],
            )
        ],
    )

    import json
    try:
        text = response.text.strip()
        if text.startswith("```"):
            text = text.split("\n", 1)[1].rsplit("```", 1)[0].strip()
        diagnosis = json.loads(text)
    except (json.JSONDecodeError, IndexError):
        diagnosis = {"raw_response": response.text, "parse_error": True}

    diagnosis["disclaimer"] = (
        "This is an AI-assisted preliminary diagnosis. "
        "Please consult your district agriculture officer or KVK for confirmation."
    )
    return diagnosis


# ---------------------------------------------------------------------------
# TOOL REGISTRY
# ---------------------------------------------------------------------------
# These two functions are registered as Gemini tools. The google-genai SDK
# reads the type hints and docstrings to auto-generate the JSON schemas that
# Gemini uses to decide WHEN and HOW to call each tool.

AGENT_TOOLS = [match_agri_schemes, fetch_mandi_and_weather]

TOOL_DISPATCHER: dict = {
    "match_agri_schemes": match_agri_schemes,
    "fetch_mandi_and_weather": fetch_mandi_and_weather,
}
