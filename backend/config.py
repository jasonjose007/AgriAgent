import os
from dotenv import load_dotenv

load_dotenv()

GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY", "")
GEMINI_MODEL = "gemini-3.8-flash-lite"
GEMINI_VISION_MODEL = "gemini-3.8-flash-lite"
