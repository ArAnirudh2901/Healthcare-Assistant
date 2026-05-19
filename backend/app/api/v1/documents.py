from fastapi import APIRouter, Depends, UploadFile, File, HTTPException, Response
from typing import Any
from sqlalchemy.orm import Session
from app.api import deps
from app.models.user import User
from app.models.file_storage import FileStorage
from app.services.db_storage import save_file_to_db, delete_file_from_db
from app.services.ai.rag import process_and_index_document
from app.services.analytical_report import get_analytical_report

router = APIRouter()

@router.post("/upload")
async def upload_document(
    file: UploadFile = File(...),
    current_user: User = Depends(deps.get_current_user),
    db: Session = Depends(deps.get_db)
) -> Any:
    """
    Upload a patient medical report (PDF).
    1. Uploads to SQL Database.
    2. Processes text and stores embeddings in local FAISS Vector DB and syncs to SQL DB.
    """
    if not file.filename.endswith('.pdf'):
        raise HTTPException(status_code=400, detail="Only PDF files are supported.")

    try:
        # Step 1: Upload to DB
        blob_url, blob_name = save_file_to_db(file, user_id=current_user.id, db=db)
        storage_type = "database"

        # Step 2: Extract text and save to user-specific FAISS index
        chunks_indexed = await process_and_index_document(file, user_id=current_user.id, db=db)

        return {
            "message": "Document uploaded and indexed successfully",
            "filename": file.filename,
            "azure_url": blob_url, # keeping key name for frontend compatibility
            "blob_name": blob_name,
            "chunks_indexed": chunks_indexed,
            "storage_type": storage_type
        }
    except Exception as e:
        import traceback
        print(f"UPLOAD ERROR: {str(e)}")
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Critical error during document processing: {str(e)}")

@router.get("/analytical-report")
async def generate_report(
    current_user: User = Depends(deps.get_current_user),
    db: Session = Depends(deps.get_db)
) -> Any:
    """
    Generate a health analysis report based on all uploaded data.
    Uses FAISS to retrieve all indexed context for analysis.
    """
    from app.services.ai.rag import get_all_documents
    from app.services.ai.parser import parse_lab_report_lines, categorize_test, classify_value
    from app.services.analytical_report import generate_health_summary

    try:
        # 1. Retrieve ONLY this user's indexed medical content
        full_context = get_all_documents(user_id=current_user.id, db=db)
        
        if not full_context or "No patient reports" in full_context:
            return {
                "message": "No reports found.",
                "status": "empty",
                "summary": "Please upload your medical reports first to generate a full analysis."
            }

        # 2. Parse the retrieved context into structured data
        lines = full_context.split('\n')
        aggregated_data = parse_lab_report_lines(lines)

        if not aggregated_data:
            return {
                "message": "Could not extract structured data from reports.",
                "status": "empty",
                "summary": "The AI could not identify specific test results in your uploaded documents. Please ensure they are legible lab reports."
            }

        # 3. Generate narrative summary
        summary = generate_health_summary(aggregated_data)
        
        # 4. Calculate stats
        stats = {
            "total_tests": len(aggregated_data),
            "high_values": len([i for i in aggregated_data if i["status"] == "HIGH"]),
            "low_values": len([i for i in aggregated_data if i["status"] == "LOW"]),
            "normal_values": len([i for i in aggregated_data if i["status"] == "NORMAL"]),
        }

        return {
            "summary": summary,
            "stats": stats,
            "aggregated_data": aggregated_data,
            "status": "success"
        }
    except Exception as e:
        return {
            "message": f"Error generating report: {str(e)}",
            "status": "error",
            "summary": "We encountered an issue generating your analysis. Please try uploading your reports again."
        }

@router.delete("/{blob_name:path}")
async def delete_document(
    blob_name: str,
    current_user: User = Depends(deps.get_current_user),
    db: Session = Depends(deps.get_db)
) -> Any:
    """
    Delete a document from database storage.
    """
    success = delete_file_from_db(blob_name, user_id=current_user.id, db=db)
    
    if not success:
        return {"message": "Document record removed (Note: storage cleanup skipped or failed)"}
        
    return {"message": "Document deleted successfully"}

@router.get("/files/{file_id}")
async def serve_db_file(
    file_id: str,
    current_user: User = Depends(deps.get_current_user),
    db: Session = Depends(deps.get_db)
) -> Any:
    """
    Serve a stored document securely from the database.
    """
    db_file = db.query(FileStorage).filter(FileStorage.id == file_id).first()
    
    if not db_file:
        raise HTTPException(status_code=404, detail="File not found.")
        
    if db_file.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Unauthorized access to this document.")
    
    media_types = {
        "pdf": "application/pdf",
        "png": "image/png",
        "jpg": "image/jpeg",
        "jpeg": "image/jpeg"
    }
    m_type = media_types.get(db_file.file_type, "application/octet-stream")
    
    return Response(content=db_file.data, media_type=m_type)