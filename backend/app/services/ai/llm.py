from langchain_groq import ChatGroq
from app.core.config import settings

def get_llm():
    api_key = settings.GROQ_API_KEY
    if not api_key:
        raise ValueError("GROQ_API_KEY environment variable is not set")
    
    # Using a more widely compatible model to avoid 403 errors
    return ChatGroq(
        groq_api_key=api_key,
        model_name="llama3-70b-8192",
        temperature=0.0
    )
