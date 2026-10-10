"""
AgriAgent Tool Definitions — Profile-Aware
===========================================
Each tool accepts soil_type and district from the farmer's stored profile,
so the agent can provide personalized, soil-specific recommendations
without asking the farmer to repeat information.
"""

import json
from datetime import datetime, timezone, timedelta

from google import genai
from google.genai import types

from data.schemes import AGRI_SCHEMES, SCHEME_CATEGORIES, MANDI_PRICES, WEATHER_DATA, SOIL_WEATHER_ADVISORY

IST = timezone(timedelta(hours=5, minutes=30))


def match_agri_schemes(crop_type: str, acreage: float, district: str, soil_type: str) -> dict:
    """Find eligible government agriculture schemes for a farmer based on crop,
    land size, district, and soil type. Includes soil-specific recommendations.

    Args:
        crop_type: The primary crop being cultivated (e.g. rice, sugarcane, cotton).
        acreage: Total farmland area in acres.
        district: District name in Tamil Nadu (e.g. Thanjavur, Coimbatore).
        soil_type: Soil type on the farm (e.g. alluvial, red_soil, black_cotton, sandy, clay_loam, laterite).
    """
    crop = crop_type.lower().strip()
    district_lower = district.lower().strip()
    soil_lower = soil_type.lower().strip().replace(" ", "_")

    is_tn = any(kw in district_lower for kw in [
        "tamil nadu", "tamilnadu", "tn", "thanjavur", "coimbatore", "madurai",
        "salem", "erode", "tiruchirappalli", "tirunelveli", "chennai",
        "kanchipuram", "vellore", "dindigul", "cuddalore", "nagapattinam",
    ])

    matched = []
    for scheme in AGRI_SCHEMES:
        crop_ok = scheme["eligible_crops"] == "all" or crop in scheme["eligible_crops"].split(",")
        acreage_ok = scheme["max_acreage"] is None or acreage <= scheme["max_acreage"]
        region_ok = scheme["eligible_regions"] == "all" or (scheme["eligible_regions"] == "tamil_nadu" and is_tn)

        if not (crop_ok and acreage_ok and region_ok):
            continue

        soil_rel = scheme.get("soil_relevance", "all")
        soil_match = soil_rel == "all" or soil_lower in soil_rel.split(",")
        soil_notes = scheme.get("soil_note", {})
        soil_tip = soil_notes.get(soil_lower, "")

        matched.append({
            "scheme_id": scheme["scheme_id"],
            "name": scheme["name"],
            "benefit": scheme["benefit"],
            "documents_required": scheme["documents_required"],
            "apply_url": scheme["apply_url"],
            "eligibility_status": "LIKELY ELIGIBLE (draft — verify at nearest CSC)",
            "soil_match": "HIGH" if soil_match else "GENERAL",
            "soil_recommendation": soil_tip or "Applicable to all soil types.",
        })

    matched.sort(key=lambda s: (0 if s["soil_match"] == "HIGH" else 1))

    return {
        "farmer_profile": {"crop": crop_type, "acreage_acres": acreage, "district": district, "soil_type": soil_type},
        "matched_schemes": matched,
        "total_matches": len(matched),
        "disclaimer": "This is a draft eligibility check. Visit your nearest CSC or agriculture office to confirm.",
        "generated_at": datetime.now(IST).isoformat(),
    }


def fetch_mandi_and_weather(district: str, commodity: str, soil_type: str = "") -> dict:
    """Fetch current mandi prices and local weather for a Tamil Nadu district.
    Includes soil-specific weather advisory when soil_type is provided.

    Args:
        district: Tamil Nadu district name (e.g. Thanjavur, Coimbatore, Madurai).
        commodity: Crop or commodity name (e.g. rice, turmeric, coconut).
        soil_type: Optional soil type for soil-specific weather advisory.
    """
    district_key = district.lower().strip()
    commodity_key = commodity.lower().strip()
    soil_lower = soil_type.lower().strip().replace(" ", "_") if soil_type else ""

    alias_map = {"paddy": "rice", "groundnut oil": "groundnut", "nariyal": "coconut"}
    commodity_key = alias_map.get(commodity_key, commodity_key)

    district_prices = MANDI_PRICES.get(district_key, {})
    price_info = district_prices.get(commodity_key)
    weather = WEATHER_DATA.get(district_key)

    result: dict = {"district": district, "commodity": commodity}

    if price_info:
        result["market_price"] = {
            **price_info,
            "date": datetime.now(IST).strftime("%Y-%m-%d"),
            "msp_comparison": _get_msp_note(commodity_key, price_info["modal_price"]),
        }
    else:
        result["market_price"] = {
            "error": f"No price data for '{commodity}' in {district}.",
            "available_commodities": list(district_prices.keys()) if district_prices else [],
            "available_districts": list(MANDI_PRICES.keys()),
        }

    if weather:
        result["weather"] = {**weather}
        if soil_lower and soil_lower in SOIL_WEATHER_ADVISORY:
            condition = weather.get("condition", "").lower()
            soil_adv = SOIL_WEATHER_ADVISORY[soil_lower]
            if weather.get("rainfall_mm", 0) > 5:
                result["weather"]["soil_advisory"] = soil_adv.get("rain", "")
            elif weather.get("temperature_c", 0) > 35:
                result["weather"]["soil_advisory"] = soil_adv.get("hot", "")
            else:
                result["weather"]["soil_advisory"] = soil_adv.get("dry", "")
    else:
        result["weather"] = {"error": f"No weather data for '{district}'.", "available_districts": list(WEATHER_DATA.keys())}

    return result


def generate_official_draft(farmer_name: str, district: str, scheme_name: str, scheme_id: str, document_checklist: str) -> dict:
    """Generate a pre-filled e-Seva application draft for a government scheme.
    This is a DRAFT only — it must be verified and submitted at an e-Seva centre.

    Args:
        farmer_name: Full name of the farmer as per Aadhaar.
        district: District of residence.
        scheme_name: Name of the scheme to apply for.
        scheme_id: Scheme ID code.
        document_checklist: Comma-separated list of required documents.
    """
    docs = [d.strip() for d in document_checklist.split(",") if d.strip()]
    return {
        "draft_type": "e-Seva Application Draft",
        "status": "DRAFT — NOT YET SUBMITTED",
        "applicant": {
            "name": farmer_name,
            "district": district,
        },
        "scheme": {
            "name": scheme_name,
            "id": scheme_id,
        },
        "document_checklist": [{"document": doc, "status": "PENDING"} for doc in docs],
        "instructions": [
            f"1. Collect all documents listed above",
            f"2. Visit your nearest e-Seva centre or Common Service Centre (CSC) in {district}",
            f"3. Show this draft and request application submission for {scheme_name}",
            f"4. The e-Seva operator will verify your documents and submit officially",
            f"5. Keep the acknowledgment receipt for tracking",
        ],
        "generated_at": datetime.now(IST).isoformat(),
        "disclaimer": "This is an AI-generated draft for reference only. Official submission must be done through authorized government channels.",
    }


TN_DISTRICTS = {
    "tamil nadu", "tamilnadu", "tn", "thanjavur", "coimbatore", "madurai",
    "salem", "erode", "tiruchirappalli", "tirunelveli", "chennai",
    "kanchipuram", "vellore", "dindigul", "cuddalore", "nagapattinam",
    "theni", "sivaganga",
}


def _is_tn(district: str) -> bool:
    return any(kw in district.lower().strip() for kw in TN_DISTRICTS)


def match_agri_schemes_advanced(
    crop_type: str, acreage: float, district: str, soil_type: str,
    category_filter: str = "",
) -> dict:
    """Score and rank all government agriculture schemes for a farmer.
    Returns a match_score (0-100) per scheme based on weighted factors.

    Args:
        crop_type: Primary crop (e.g. rice, sugarcane, cotton).
        acreage: Land area in acres.
        district: District name in Tamil Nadu.
        soil_type: Soil type (e.g. alluvial, red_soil, black_cotton).
        category_filter: Optional category id to filter (irrigation, machinery, insurance, soil).
    """
    crop = crop_type.lower().strip()
    soil_lower = soil_type.lower().strip().replace(" ", "_")
    is_tamil_nadu = _is_tn(district)
    cat = category_filter.lower().strip() if category_filter else ""

    results = []
    for scheme in AGRI_SCHEMES:
        if cat and scheme.get("category", "") != cat:
            continue

        # --- Weighted scoring (crop 30%, soil 25%, acreage 20%, region 25%) ---
        crop_score = 0
        eligible_crops = scheme["eligible_crops"]
        if eligible_crops == "all":
            crop_score = 100
        elif crop in eligible_crops.split(","):
            crop_score = 100
        else:
            crop_score = 0

        soil_rel = scheme.get("soil_relevance", "all")
        if soil_rel == "all":
            soil_score = 80
        elif soil_lower in soil_rel.split(","):
            soil_score = 100
        else:
            soil_score = 30

        max_ac = scheme.get("max_acreage")
        if max_ac is None:
            acreage_score = 90
        elif acreage <= max_ac:
            acreage_score = 100
        elif acreage <= max_ac * 1.2:
            acreage_score = 50
        else:
            acreage_score = 0

        region = scheme["eligible_regions"]
        if region == "all":
            region_score = 85
        elif region == "tamil_nadu" and is_tamil_nadu:
            region_score = 100
        else:
            region_score = 0

        total = int(crop_score * 0.30 + soil_score * 0.25 + acreage_score * 0.20 + region_score * 0.25)

        if total < 20:
            continue

        reasons = []
        if crop_score == 100:
            reasons.append(f"Crop '{crop_type}' is eligible")
        if soil_score >= 80:
            reasons.append(f"Soil type '{soil_type}' is {'highly ' if soil_score == 100 else ''}compatible")
        if acreage_score >= 90:
            reasons.append(f"{acreage} acres within limit")
        if region_score >= 85:
            reasons.append(f"Available in {district}")

        soil_notes = scheme.get("soil_note", {})
        soil_tip = soil_notes.get(soil_lower, "")

        results.append({
            "scheme_id": scheme["scheme_id"],
            "scheme_name": scheme["name"],
            "provider": scheme.get("provider", "Central"),
            "category": scheme.get("category", ""),
            "match_score": total,
            "eligibility_reasons": reasons,
            "subsidy_benefit_summary": scheme["benefit"],
            "required_documents": scheme["documents_required"],
            "soil_recommendation": soil_tip or "Applicable to all soil types.",
            "apply_url": scheme.get("apply_url", ""),
        })

    results.sort(key=lambda s: s["match_score"], reverse=True)

    return {
        "query": {"crop_type": crop_type, "acreage": acreage, "district": district, "soil_type": soil_type, "category_filter": category_filter},
        "matched_schemes": results,
        "total_matches": len(results),
        "generated_at": datetime.now(IST).isoformat(),
    }


def _get_msp_note(commodity: str, modal_price: float) -> str:
    msp_table = {"rice": 2300, "paddy": 2300, "wheat": 2275, "cotton": 7121, "groundnut": 6377, "sugarcane": 315, "maize": 2090}
    msp = msp_table.get(commodity)
    if msp is None:
        return "MSP not applicable for this commodity."
    diff = modal_price - msp
    if diff >= 0:
        return f"Market price is Rs {diff}/qtl ABOVE MSP (Rs {msp}). Favourable for selling."
    return f"Market price is Rs {abs(diff)}/qtl BELOW MSP (Rs {msp}). Consider selling via govt procurement."


def diagnose_crop_disease(client: genai.Client, image_bytes: bytes, mime_type: str = "image/jpeg", soil_type: str = "") -> dict:
    """Uses Gemini vision to analyze a crop leaf photo with soil context."""
    soil_context = f"\nThe farmer's soil type is: {soil_type}. Factor this into your treatment recommendations — different soils retain nutrients and moisture differently." if soil_type else ""

    prompt = (
        "You are an expert agricultural pathologist." + soil_context + "\n"
        "Analyze this crop leaf image.\n"
        "Return your response as EXACTLY this JSON structure (no markdown, no extra text):\n"
        "{\n"
        '  "disease_name": "name of the disease or Healthy if no disease",\n'
        '  "confidence": "High / Medium / Low",\n'
        '  "crop_identified": "the crop species you see",\n'
        '  "symptoms_observed": ["list", "of", "visible", "symptoms"],\n'
        '  "treatment": ["step 1", "step 2"],\n'
        '  "preventive_measures": ["measure 1", "measure 2"],\n'
        '  "soil_specific_advice": "advice specific to the soil type if provided",\n'
        '  "urgency": "Immediate / Within a week / Monitor"\n'
        "}\n"
    )

    response = client.models.generate_content(
        model="gemini-3.5-flash-lite",
        contents=[types.Content(role="user", parts=[
            types.Part.from_text(text=prompt),
            types.Part.from_bytes(data=image_bytes, mime_type=mime_type),
        ])],
    )

    try:
        text = response.text.strip()
        if text.startswith("```"):
            text = text.split("\n", 1)[1].rsplit("```", 1)[0].strip()
        diagnosis = json.loads(text)
    except (json.JSONDecodeError, IndexError):
        diagnosis = {"raw_response": response.text, "parse_error": True}

    diagnosis["disclaimer"] = "AI-assisted preliminary diagnosis. Consult your district agriculture officer or KVK for confirmation."
    return diagnosis


AGENT_TOOLS = [match_agri_schemes, fetch_mandi_and_weather, generate_official_draft, match_agri_schemes_advanced]

TOOL_DISPATCHER: dict = {
    "match_agri_schemes": match_agri_schemes,
    "fetch_mandi_and_weather": fetch_mandi_and_weather,
    "generate_official_draft": generate_official_draft,
    "match_agri_schemes_advanced": match_agri_schemes_advanced,
}
