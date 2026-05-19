from fastapi import APIRouter, UploadFile, File, HTTPException, Depends
from app.services.ai.speech import transcribe_audio
from app.api import deps
import shutil
import os
import tempfile

router = APIRouter()

@router.post("/transcribe")
async def transcribe(
    file: UploadFile = File(...),
    current_user = Depends(deps.get_current_user)
):
    """
    Upload an audio file and get the text transcript.
    """
    if not file.content_type.startswith("audio/"):
        # Some browsers send audio as video/webm or application/octet-stream
        pass 

    # Save to a temporary file
    contents = await file.read()
    if not contents:
        raise HTTPException(status_code=400, detail="Empty audio file")

    with tempfile.NamedTemporaryFile(delete=False, suffix=".webm") as tmp:
        tmp.write(contents)
        tmp_path = tmp.name

    try:
        transcript = transcribe_audio(tmp_path)
        return {"transcript": transcript}
    finally:
        if os.path.exists(tmp_path):
            os.remove(tmp_path)
