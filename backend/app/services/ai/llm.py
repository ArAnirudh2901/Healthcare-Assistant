from langchain_groq import ChatGroq
from app.core.config import settings

def get_llm():
    api_key = settings.GROQ_API_KEY
    if not api_key:
        raise ValueError("GROQ_API_KEY environment variable is not set")
    
    # We use llama-3.3-70b-versatile as the current powerful model
    return ChatGroq(
        groq_api_key=api_key,
        model_name="llama-3.3-70b-versatile",
        temperature=0.0
    )
