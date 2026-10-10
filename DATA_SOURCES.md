# AgriAgent — Data Sources

| Data | Source | Status |
|------|--------|--------|
| Weather | Open-Meteo API (open-meteo.com) | LIVE — real-time temp, humidity, rain, 3-day forecast |
| Soil advisory | Our rules + live weather conditions | LIVE — e.g., "Black cotton soil cracks when dry" triggered by actual 0mm rain |
| Mandi prices | Hardcoded realistic TN data | Simulated — no free Indian commodity API exists |
| Schemes | Our curated database of 12 real schemes | Simulated eligibility, real scheme names/benefits |
| Disease diagnosis | Gemini Vision API | LIVE — real AI analysis of crop photos |

## Notes for judges

- **Weather** is fetched in real-time from Open-Meteo (free, no API key, covers 15 TN districts by lat/lng). Falls back to cached data if the API is unreachable.
- **Disease diagnosis** uses Gemini 3.5 Flash Lite's multimodal vision to analyze uploaded crop leaf photos. Soil type from the farmer's profile is injected for soil-specific treatment advice.
- **Mandi prices** would connect to Agmarknet (agmarknet.gov.in) in production, but they do not offer a public API. We use realistic simulated data for Tamil Nadu APMCs.
- **Scheme eligibility** is scored with a weighted algorithm (crop 30%, soil 25%, acreage 20%, region 25%) against 12 real central and TN state schemes. In production this would connect to data.gov.in (currently down) or the PM-KISAN/PMFBY portals.
- The architecture supports swapping in any live data source without changing the agent logic — tools are modular.
