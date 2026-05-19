import os
from groq import Groq
from app.core.config import settings

def transcribe_audio(audio_file_path: str) -> str:
    """
    Transcribes audio using Groq's Whisper model.
    """
    client = Groq(api_key=settings.GROQ_API_KEY)
    
    try:
        with open(audio_file_path, "rb") as audio_file:
            transcription = client.audio.transcriptions.create(
                file=(os.path.basename(audio_file_path), audio_file),
                model="whisper-large-v3-turbo",
                response_format="json",
            )
        return transcription.text
    except Exception as e:
        print(f"Transcription Error: {e}")
        return f"Error transcribing audio: {str(e)}"
