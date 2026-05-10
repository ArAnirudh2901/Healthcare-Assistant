from fastapi import APIRouter, Depends, UploadFile, File, HTTPException
from fastapi.responses import FileResponse
from typing import Any
from app.api import deps
from app.models.user import User
from app.services.azure_storage import upload_file_to_azure
from app.services.ai.rag import process_and_index_document
from app.services.analytical_report import get_analytical_report

router = APIRouter()

@router.post("/upload")
async def upload_document(
    file: UploadFile = File(...),
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    """
    Upload a patient medical report (PDF).
    1. Uploads securely to Azure Blob Storage.
    2. Processes text and stores embeddings in local FAISS Vector DB.
    """
    if not file.filename.endswith('.pdf'):
        raise HTTPException(status_code=400, detail="Only PDF files are supported.")

    try:
        # Step 1: Attempt Upload to Azure
        try:
            blob_url, blob_name = await upload_file_to_azure(file, user_id=current_user.id)
            storage_type = "azure"
        except Exception as azure_err:
            print(f"Azure Upload Failed, falling back to local: {str(azure_err)}")
            # Fallback to local storage
            import os
            import uuid
            upload_dir = "data/uploads"
            os.makedirs(upload_dir, exist_ok=True)
            blob_name = f"user_{current_user.id}/{uuid.uuid4()}.pdf"
            local_path = os.path.join(upload_dir, blob_name)
            os.makedirs(os.path.dirname(local_path), exist_ok=True)
            
            content = await file.read()
            with open(local_path, "wb") as f:
                f.write(content)
            await file.seek(0)
            
            blob_url = f"/api/v1/documents/local/{blob_name}" # Placeholder for local serving
            storage_type = "local"

        # Step 2: Extract text and save to user-specific FAISS index
        # Indexing works locally on the UploadFile stream, independent of Azure
        chunks_indexed = await process_and_index_document(file, user_id=current_user.id)

        return {
            "message": "Document uploaded and indexed successfully",
            "filename": file.filename,
            "azure_url": blob_url,
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
        full_context = get_all_documents(user_id=current_user.id)
        
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
) -> Any:
    """
    Delete a document from Azure storage.
    """
    from app.services.azure_storage import delete_file_from_azure
    import os
    
    # 1. Try to delete from Azure
    azure_success = await delete_file_from_azure(blob_name, user_id=current_user.id)
    
    # 2. Try to delete from local storage (if it was a fallback)
    local_path = os.path.join("data/uploads", blob_name)
    local_success = False
    if os.path.exists(local_path):
        try:
            os.remove(local_path)
            local_success = True
        except Exception as e:
            print(f"Error deleting local file {local_path}: {e}")

    if not azure_success and not local_success:
        # We still return success to the frontend if the record is intended to be gone
        return {"message": "Document record removed (Note: storage cleanup skipped or failed)"}
        
    return {"message": "Document deleted successfully"}
@router.get("/local/user_{user_id}/{filename}")
async def serve_local_file(
    user_id: int,
    filename: str,
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    """
    Serve a locally stored document securely.
    """
    if current_user.id != user_id:
        raise HTTPException(status_code=403, detail="Unauthorized access to this document.")
    
    import os
    file_path = os.path.join("data/uploads", f"user_{user_id}", filename)
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="File not found.")
    
    return FileResponse(file_path)