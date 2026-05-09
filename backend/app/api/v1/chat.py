from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import Any
from langchain_core.messages import HumanMessage

from app.api import deps
from app.models.user import User
from app.services.ai.graph import ai_app

router = APIRouter()

class ChatRequest(BaseModel):
    query: str
    use_personal_analysis: bool = False

class ChatResponse(BaseModel):
    response: str
    classification: str

@router.post("/query", response_model=ChatResponse)
async def handle_chat_query(
    request: ChatRequest,
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    """
    Send a query to the AI Healthcare Orchestrator.
    If use_personal_analysis is True, injects user profile and 
    global report analysis into the context.
    """
    try:
        from app.services.ai.rag import get_all_documents
        from app.services.analytical_report import generate_health_summary
        from app.services.ai.parser import parse_lab_report_lines
        from langchain_core.messages import SystemMessage

        config = {"configurable": {"thread_id": str(current_user.id)}}
        
        messages = []
        
        # Inject Personal Context if requested
        if request.use_personal_analysis:
            # 1. User Profile Context
            profile_context = f"User Profile: Name: {current_user.full_name}, Email: {current_user.email}."
            
            # 2. Medical History Context (Synthesized)
            raw_docs = get_all_documents(user_id=current_user.id)
            if "No patient reports" not in raw_docs:
                lines = raw_docs.split('\n')
                data = parse_lab_report_lines(lines[:50]) # Limit for prompt size
                medical_summary = generate_health_summary(data)
                
                context_msg = f"{profile_context}\n\nClinical Summary from all Reports:\n{medical_summary}\n\nPlease use this information to provide personalized advice."
                messages.append(SystemMessage(content=context_msg))
            else:
                messages.append(SystemMessage(content=f"{profile_context}\nNote: No medical reports found for this user yet."))

        # Add the user's current query
        messages.append(HumanMessage(content=request.query))
        
        initial_state = {
            "messages": messages,
            "user_id": current_user.id
        }
        
        # Run the graph
        result = ai_app.invoke(initial_state, config=config)
        
        return {
            "response": result.get("final_response", "Sorry, I could not process that request."),
            "classification": result.get("classification", "unknown")
        }
    except Exception as e:
        import traceback
        error_msg = str(e)
        print(f"ERROR in chat query: {error_msg}")
        print(traceback.format_exc())
        
        # Specific check for Groq regional/permission blocks
        if "403" in error_msg and "Forbidden" in error_msg:
            raise HTTPException(
                status_code=500, 
                detail="Groq API returned 403 Forbidden. This is likely due to regional restrictions in Azure 'eastasia' (Hong Kong). Please redeploy your backend to 'eastus' or 'centralindia'."
            )
            
        raise HTTPException(status_code=500, detail=error_msg)
