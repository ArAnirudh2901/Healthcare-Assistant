from fastapi import APIRouter, Depends, HTTPException
from typing import Any
from app.api import deps
from app.models.user import User
from app.services.ai.rag import get_all_documents
from app.services.ai.parser import parse_lab_report_lines
from app.services.ai.risk_assessment import perform_full_risk_assessment
from app.schemas.risk import RiskAssessmentResponse

router = APIRouter()

@router.get("/my-risk", response_model=RiskAssessmentResponse)
async def get_user_risk_assessment(
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    """
    Analyzes all uploaded medical documents to assess disease risks.
    """
    try:
        # 1. Retrieve all medical text for the user
        raw_text = get_all_documents(user_id=current_user.id)
        
        if not raw_text or "No patient reports" in raw_text:
            return RiskAssessmentResponse(
                overall_status="NO_DATA",
                assessments=[],
                last_updated=""
            )
            
        # 2. Extract structured lab results from the text
        # Note: In a larger app, we might store these in a DB instead of parsing on-the-fly
        lines = raw_text.split('\n')
        # Limit to avoid massive LLM calls if there are thousands of lines
        # But for risk assessment, we want the most recent or comprehensive data
        lab_data = parse_lab_report_lines(lines[:100]) 
        
        # 3. Perform the ML-based (simulated) risk assessment
        assessment = perform_full_risk_assessment(lab_data)
        
        return assessment
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
