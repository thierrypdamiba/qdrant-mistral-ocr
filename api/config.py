import os
from dotenv import load_dotenv

load_dotenv()

MISTRAL_API_KEY = os.getenv("MISTRAL_API_KEY")
QDRANT_URL = os.getenv("QDRANT_URL")
QDRANT_API_KEY = os.getenv("QDRANT_API_KEY")
COLLECTION_NAME = os.getenv("COLLECTION_NAME", "notes")

if not MISTRAL_API_KEY:
    print("Warning: MISTRAL_API_KEY not set in environment variables")

if not QDRANT_URL or not QDRANT_API_KEY:
    print("Warning: QDRANT_URL or QDRANT_API_KEY not set in environment variables")