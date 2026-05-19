import base64
import os
from groq import Groq
from app.core.config import settings

def analyze_injury_image(image_bytes: bytes, filename: str) -> str:
    """
    Analyzes an image of an injury using Groq's Llama 4 Scout Vision model.
    """
    client = Groq(api_key=settings.GROQ_API_KEY)
    
    # Encode image to Base64
    base64_image = base64.b64encode(image_bytes).decode('utf-8')
    
    prompt = """
    You are a medical AI assistant. Analyze the uploaded image of an injury or body part.
    1. Identify the possible nature of the injury (e.g., cut, bruise, rash, burn).
    2. Provide a brief contextual description of what is visible.
    3. Suggest immediate first aid steps if applicable.
    
    IMPORTANT: Include a medical disclaimer that this is not a professional diagnosis.
    """
    
    try:
        completion = client.chat.completions.create(
            model="meta-llama/llama-4-scout-17b-16e-instruct",
            messages=[
                {
                    "role": "user",
                    "content": [
                        {"type": "text", "text": prompt},
                        {
                            "type": "image_url",
                            "image_url": {
                                "url": f"data:image/jpeg;base64,{base64_image}",
                            },
                        },
                    ]
                }
            ],
            temperature=0.2,
            max_tokens=1024,
        )
        return completion.choices[0].message.content
    except Exception as e:
        print(f"Vision Analysis Error: {e}")
        return f"Error analyzing image: {str(e)}"
