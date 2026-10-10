"""
Vercel Serverless Function entry point.
Vercel auto-detects this as an ASGI app and routes /api/* requests to it.
"""
import sys
import os

sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'backend'))

from main import app
