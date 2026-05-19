from fastapi import APIRouter, UploadFile, File, HTTPException, Depends
from app.services.ai.vision import analyze_injury_image
from app.api import deps
import sqlalchemy.orm as orm

router = APIRouter()

@router.post("/analyze-injury")
async def analyze_injury(
    file: UploadFile = File(...),
    current_user = Depends(deps.get_current_user),
    db: orm.Session = Depends(deps.get_db)
):
    """
    Upload an image of an injury and get a contextual description.
    """
    if not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="File must be an image")
    
    contents = await file.read()
    
    # Process the image
    result = analyze_injury_image(contents, file.filename)
    
    return {
        "filename": file.filename,
        "analysis": result
    }
