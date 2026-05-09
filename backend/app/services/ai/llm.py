from langchain_groq import ChatGroq
from app.core.config import settings

def get_llm():
    api_key = settings.GROQ_API_KEY
    if not api_key:
        print("CRITICAL: GROQ_API_KEY is not set!")
        raise ValueError("GROQ_API_KEY environment variable is not set")
    
    model = "llama-3.1-8b-instant"
    print(f"DEBUG: Initializing ChatGroq with model={model}")
    
    return ChatGroq(
        groq_api_key=api_key,
        model_name=model,
        temperature=0.0
    )
