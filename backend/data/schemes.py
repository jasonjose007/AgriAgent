"""
Simulated databases for government schemes, mandi prices, weather,
and soil-specific advisory data.
"""

AGRI_SCHEMES = [
    {
        "scheme_id": "PMKISAN",
        "name": "PM-KISAN Samman Nidhi",
        "ministry": "Ministry of Agriculture & Farmers Welfare",
        "benefit": "Rs 6,000/year in 3 installments directly to bank account",
        "eligible_crops": "all",
        "max_acreage": None,
        "eligible_regions": "all",
        "soil_relevance": "all",
        "documents_required": [
            "Aadhaar Card",
            "Land ownership records (patta/chitta)",
            "Bank account with IFSC",
            "Mobile number linked to Aadhaar",
        ],
        "apply_url": "https://pmkisan.gov.in",
    },
    {
        "scheme_id": "PMFBY",
        "name": "Pradhan Mantri Fasal Bima Yojana",
        "ministry": "Ministry of Agriculture & Farmers Welfare",
        "benefit": "Crop insurance at 2% premium for Kharif, 1.5% for Rabi",
        "eligible_crops": "rice,wheat,cotton,sugarcane,groundnut,maize,pulses",
        "max_acreage": None,
        "eligible_regions": "all",
        "soil_relevance": "all",
        "documents_required": [
            "Aadhaar Card",
            "Land records / tenancy agreement",
            "Sowing certificate from agriculture officer",
            "Bank account passbook",
        ],
        "apply_url": "https://pmfby.gov.in",
    },
    {
        "scheme_id": "TN_MICRO_IRRIGATION",
        "name": "Tamil Nadu Micro Irrigation Scheme",
        "ministry": "TN Dept. of Agriculture",
        "benefit": "75-100% subsidy on drip/sprinkler irrigation systems",
        "eligible_crops": "sugarcane,banana,coconut,vegetables,turmeric,groundnut",
        "max_acreage": 12.5,
        "eligible_regions": "tamil_nadu",
        "soil_relevance": "sandy,laterite,red_soil,alluvial",
        "soil_note": {
            "sandy": "High priority — sandy soil loses water fast, drip irrigation critical",
            "laterite": "Recommended — laterite drains quickly, micro-irrigation improves yield",
            "red_soil": "Beneficial — helps maintain consistent moisture levels",
            "alluvial": "Optional but useful for water-efficient farming",
        },
        "documents_required": [
            "Aadhaar Card",
            "Land document (patta/chitta/adangal)",
            "Caste certificate (for SC/ST higher subsidy)",
            "Passport-size photos (2 nos)",
            "Water source proof (borewell/well)",
        ],
        "apply_url": "https://www.tn.gov.in/scheme/data_view/6741",
    },
    {
        "scheme_id": "TN_CROP_INSURANCE",
        "name": "TN State Crop Insurance (TNSCIS)",
        "ministry": "TN Dept. of Agriculture",
        "benefit": "Additional state-level crop insurance top-up, Rs 20,000-40,000 coverage",
        "eligible_crops": "rice,millets,pulses,oilseeds",
        "max_acreage": 5.0,
        "eligible_regions": "tamil_nadu",
        "soil_relevance": "all",
        "documents_required": [
            "Aadhaar Card",
            "Land records",
            "Crop sowing certificate",
            "Village administrative officer certificate",
        ],
        "apply_url": "https://www.tn.gov.in/scheme/data_view/6738",
    },
    {
        "scheme_id": "NHM",
        "name": "National Horticulture Mission",
        "ministry": "Ministry of Agriculture & Farmers Welfare",
        "benefit": "40-75% subsidy on planting material, cold storage, and pack houses",
        "eligible_crops": "banana,coconut,mango,turmeric,vegetables,flowers",
        "max_acreage": 10.0,
        "eligible_regions": "all",
        "soil_relevance": "red_soil,alluvial,clay_loam",
        "soil_note": {
            "red_soil": "Excellent for horticulture — good drainage for fruit trees",
            "alluvial": "Rich nutrients support high-yield horticulture",
            "clay_loam": "Versatile — suitable for most horticulture crops",
        },
        "documents_required": [
            "Aadhaar Card",
            "Land records showing horticulture cultivation",
            "Project proposal / cost estimate",
            "Bank loan sanction letter (if applicable)",
        ],
        "apply_url": "https://nhm.nic.in",
    },
    {
        "scheme_id": "SMAM",
        "name": "Sub-Mission on Agricultural Mechanization (SMAM)",
        "ministry": "Ministry of Agriculture & Farmers Welfare",
        "benefit": "50-80% subsidy on farm machinery (tractors, harvesters, tillers)",
        "eligible_crops": "all",
        "max_acreage": None,
        "eligible_regions": "all",
        "soil_relevance": "all",
        "documents_required": [
            "Aadhaar Card",
            "Land records",
            "Quotation from authorized dealer",
            "Bank account details",
            "Caste certificate (for SC/ST/women higher subsidy)",
        ],
        "apply_url": "https://agrimachinery.nic.in",
    },
    {
        "scheme_id": "TN_SOIL_HEALTH",
        "name": "Tamil Nadu Soil Health Card & Nutrient Management",
        "ministry": "TN Dept. of Agriculture",
        "benefit": "Free soil testing + subsidized fertilizers based on soil health report",
        "eligible_crops": "all",
        "max_acreage": None,
        "eligible_regions": "tamil_nadu",
        "soil_relevance": "all",
        "soil_note": {
            "sandy": "Critical — sandy soil needs regular nutrient replenishment",
            "laterite": "Important — laterite is often nutrient-deficient",
            "red_soil": "Useful — helps optimize fertilizer for iron-rich soil",
            "black_cotton": "Recommended — prevents over-application on already rich soil",
        },
        "documents_required": [
            "Aadhaar Card",
            "Land records",
            "Previous soil health card (if any)",
        ],
        "apply_url": "https://soilhealth.dac.gov.in",
    },
]

MANDI_PRICES = {
    "thanjavur": {
        "rice": {"modal_price": 2180, "min_price": 2050, "max_price": 2320, "mandi": "Thanjavur APMC", "unit": "per quintal"},
        "paddy": {"modal_price": 2183, "min_price": 2060, "max_price": 2310, "mandi": "Thanjavur APMC", "unit": "per quintal"},
        "groundnut": {"modal_price": 5800, "min_price": 5500, "max_price": 6200, "mandi": "Thanjavur APMC", "unit": "per quintal"},
        "banana": {"modal_price": 1200, "min_price": 900, "max_price": 1600, "mandi": "Thanjavur APMC", "unit": "per quintal"},
    },
    "coimbatore": {
        "coconut": {"modal_price": 12500, "min_price": 11000, "max_price": 14000, "mandi": "Perundurai", "unit": "per 1000 nuts"},
        "turmeric": {"modal_price": 13200, "min_price": 12000, "max_price": 15500, "mandi": "Erode Regulated Market", "unit": "per quintal"},
        "cotton": {"modal_price": 6800, "min_price": 6200, "max_price": 7100, "mandi": "Coimbatore APMC", "unit": "per quintal"},
        "banana": {"modal_price": 1350, "min_price": 1000, "max_price": 1700, "mandi": "Oddanchatram", "unit": "per quintal"},
    },
    "madurai": {
        "rice": {"modal_price": 2150, "min_price": 2000, "max_price": 2280, "mandi": "Madurai APMC", "unit": "per quintal"},
        "sugarcane": {"modal_price": 315, "min_price": 290, "max_price": 340, "mandi": "Madurai APMC", "unit": "per quintal"},
        "banana": {"modal_price": 1400, "min_price": 1100, "max_price": 1800, "mandi": "Madurai APMC", "unit": "per quintal"},
        "vegetables": {"modal_price": 2800, "min_price": 1500, "max_price": 4500, "mandi": "Mattuthavani Market", "unit": "per quintal"},
    },
    "tiruchirappalli": {
        "rice": {"modal_price": 2170, "min_price": 2020, "max_price": 2300, "mandi": "Trichy APMC", "unit": "per quintal"},
        "groundnut": {"modal_price": 5900, "min_price": 5600, "max_price": 6300, "mandi": "Trichy APMC", "unit": "per quintal"},
        "maize": {"modal_price": 2100, "min_price": 1900, "max_price": 2250, "mandi": "Trichy APMC", "unit": "per quintal"},
    },
    "salem": {
        "turmeric": {"modal_price": 13000, "min_price": 11800, "max_price": 14800, "mandi": "Salem APMC", "unit": "per quintal"},
        "sugarcane": {"modal_price": 320, "min_price": 295, "max_price": 345, "mandi": "Salem APMC", "unit": "per quintal"},
        "rice": {"modal_price": 2160, "min_price": 2010, "max_price": 2290, "mandi": "Salem APMC", "unit": "per quintal"},
    },
    "erode": {
        "turmeric": {"modal_price": 13500, "min_price": 12200, "max_price": 16000, "mandi": "Erode Turmeric Market", "unit": "per quintal"},
        "coconut": {"modal_price": 12800, "min_price": 11500, "max_price": 14200, "mandi": "Erode APMC", "unit": "per 1000 nuts"},
        "cotton": {"modal_price": 6900, "min_price": 6400, "max_price": 7200, "mandi": "Erode APMC", "unit": "per quintal"},
    },
    "tirunelveli": {
        "rice": {"modal_price": 2190, "min_price": 2060, "max_price": 2330, "mandi": "Tirunelveli APMC", "unit": "per quintal"},
        "banana": {"modal_price": 1500, "min_price": 1200, "max_price": 1900, "mandi": "Tirunelveli APMC", "unit": "per quintal"},
        "coconut": {"modal_price": 12200, "min_price": 10800, "max_price": 13500, "mandi": "Tirunelveli APMC", "unit": "per 1000 nuts"},
    },
    "chennai": {
        "rice": {"modal_price": 2250, "min_price": 2100, "max_price": 2400, "mandi": "Koyambedu Market", "unit": "per quintal"},
        "vegetables": {"modal_price": 3200, "min_price": 1800, "max_price": 5000, "mandi": "Koyambedu Wholesale", "unit": "per quintal"},
        "banana": {"modal_price": 1600, "min_price": 1300, "max_price": 2000, "mandi": "Koyambedu Market", "unit": "per quintal"},
    },
    "kanchipuram": {
        "rice": {"modal_price": 2200, "min_price": 2080, "max_price": 2350, "mandi": "Kanchipuram APMC", "unit": "per quintal"},
        "groundnut": {"modal_price": 5750, "min_price": 5400, "max_price": 6100, "mandi": "Kanchipuram APMC", "unit": "per quintal"},
    },
    "vellore": {
        "rice": {"modal_price": 2175, "min_price": 2030, "max_price": 2310, "mandi": "Vellore APMC", "unit": "per quintal"},
        "groundnut": {"modal_price": 5850, "min_price": 5500, "max_price": 6250, "mandi": "Vellore APMC", "unit": "per quintal"},
    },
    "dindigul": {
        "banana": {"modal_price": 1450, "min_price": 1100, "max_price": 1850, "mandi": "Dindigul APMC", "unit": "per quintal"},
        "vegetables": {"modal_price": 2600, "min_price": 1400, "max_price": 4000, "mandi": "Dindigul APMC", "unit": "per quintal"},
    },
}

WEATHER_DATA = {
    "thanjavur": {
        "temperature_c": 33, "humidity_pct": 78, "rainfall_mm": 12,
        "condition": "Partly Cloudy with light showers",
        "forecast_3day": "Moderate rain expected. Good for transplanting paddy.",
        "advisory": "Avoid pesticide spraying during rain. Ensure field drainage.",
    },
    "coimbatore": {
        "temperature_c": 30, "humidity_pct": 65, "rainfall_mm": 2,
        "condition": "Clear skies",
        "forecast_3day": "Dry spell for next 3 days. Temperature 29-32C.",
        "advisory": "Good conditions for harvesting. Ensure irrigation for standing crops.",
    },
    "madurai": {
        "temperature_c": 35, "humidity_pct": 70, "rainfall_mm": 0,
        "condition": "Hot and humid",
        "forecast_3day": "Heat wave warning. Max temperature may reach 38C.",
        "advisory": "Irrigate crops in early morning or evening. Mulch to retain moisture.",
    },
    "tiruchirappalli": {
        "temperature_c": 34, "humidity_pct": 72, "rainfall_mm": 5,
        "condition": "Scattered clouds",
        "forecast_3day": "Intermittent clouds. Low chance of rain.",
        "advisory": "Suitable for fertilizer application. Monitor for pest activity.",
    },
    "salem": {
        "temperature_c": 31, "humidity_pct": 60, "rainfall_mm": 0,
        "condition": "Warm and dry",
        "forecast_3day": "Dry conditions continuing. Moderate winds.",
        "advisory": "Watch for moisture stress in turmeric. Schedule irrigation.",
    },
    "erode": {
        "temperature_c": 32, "humidity_pct": 62, "rainfall_mm": 1,
        "condition": "Partly cloudy",
        "forecast_3day": "Slight chance of rain on day 3. Otherwise dry.",
        "advisory": "Good time for turmeric harvest and drying.",
    },
    "tirunelveli": {
        "temperature_c": 34, "humidity_pct": 75, "rainfall_mm": 8,
        "condition": "Overcast with rain",
        "forecast_3day": "Southwest monsoon active. Expect 20-30mm over 3 days.",
        "advisory": "Delay harvesting if possible. Ensure proper drainage in banana fields.",
    },
    "chennai": {
        "temperature_c": 33, "humidity_pct": 80, "rainfall_mm": 3,
        "condition": "Humid with sea breeze",
        "forecast_3day": "Typical coastal weather. Possible evening showers.",
        "advisory": "Monitor for fungal infections due to high humidity.",
    },
    "kanchipuram": {
        "temperature_c": 33, "humidity_pct": 76, "rainfall_mm": 4,
        "condition": "Partly cloudy",
        "forecast_3day": "Light showers expected. Moderate humidity.",
        "advisory": "Good conditions for paddy. Monitor drainage in low-lying fields.",
    },
    "vellore": {
        "temperature_c": 32, "humidity_pct": 68, "rainfall_mm": 2,
        "condition": "Clear to partly cloudy",
        "forecast_3day": "Warm days, pleasant nights. Low rain probability.",
        "advisory": "Ensure irrigation for standing groundnut crop.",
    },
    "dindigul": {
        "temperature_c": 31, "humidity_pct": 65, "rainfall_mm": 3,
        "condition": "Partly cloudy",
        "forecast_3day": "Scattered showers possible. Moderate temperatures.",
        "advisory": "Good for banana plantation maintenance. Watch for leaf spot.",
    },
}

SOIL_WEATHER_ADVISORY = {
    "alluvial": {
        "rain": "Alluvial soil retains water well. Monitor for waterlogging in low areas during heavy rain.",
        "dry": "Alluvial soil holds moisture longer. Irrigation frequency can be reduced.",
        "hot": "Apply mulch to conserve moisture. Alluvial soil cracks less than clay.",
    },
    "red_soil": {
        "rain": "Red soil drains moderately. Apply mulch to prevent topsoil erosion during rain.",
        "dry": "Red soil dries faster than clay. Increase irrigation frequency.",
        "hot": "Add organic matter to improve water retention in red soil during heat.",
    },
    "black_cotton": {
        "rain": "Black cotton soil swells when wet — ensure drainage channels are clear. Risk of waterlogging.",
        "dry": "Black cotton soil develops deep cracks when dry. This can damage roots — irrigate before cracking starts.",
        "hot": "Mulch heavily. Black cotton soil retains heat and can stress shallow-rooted crops.",
    },
    "clay_loam": {
        "rain": "Clay loam has moderate drainage. Monitor for puddles in heavy rain.",
        "dry": "Clay loam retains moisture reasonably well. Standard irrigation schedule sufficient.",
        "hot": "Good heat tolerance. Light mulching recommended.",
    },
    "sandy": {
        "rain": "Sandy soil drains very fast — nutrients leach quickly after rain. Apply split doses of fertilizer.",
        "dry": "Sandy soil dries out rapidly. Drip irrigation strongly recommended.",
        "hot": "Sandy soil heats up fast. Heavy mulching and frequent light irrigation needed.",
    },
    "laterite": {
        "rain": "Laterite drains quickly. Risk of nutrient washout — add organic amendments after rain.",
        "dry": "Laterite has poor water retention. Frequent irrigation essential.",
        "hot": "Laterite absorbs heat rapidly. Shade nets and mulching critical for seedlings.",
    },
}
