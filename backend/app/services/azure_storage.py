import uuid
from datetime import datetime, timedelta, timezone
from azure.storage.blob import BlobServiceClient, generate_blob_sas, BlobSasPermissions, ContentSettings
from fastapi import UploadFile
from app.core.config import settings

def get_blob_service_client() -> BlobServiceClient:
    connection_string = settings.AZURE_STORAGE_CONNECTION_STRING
    if not connection_string:
        raise ValueError("AZURE_STORAGE_CONNECTION_STRING is not set in environment variables")
    return BlobServiceClient.from_connection_string(connection_string)

def generate_sas_url(container_name: str, blob_name: str) -> str:
    """
    Generates a Shared Access Signature (SAS) URL for a specific blob.
    This allows temporary secure access even if public access is disabled.
    """
    # Extract account name and key from connection string for SAS generation
    conn_dict = dict(item.split('=', 1) for item in settings.AZURE_STORAGE_CONNECTION_STRING.split(';') if '=' in item)
    account_name = conn_dict.get('AccountName')
    account_key = conn_dict.get('AccountKey')

    if not account_name or not account_key:
        raise ValueError("Invalid Azure Connection String: Missing AccountName or AccountKey")

    sas_token = generate_blob_sas(
        account_name=account_name,
        account_key=account_key,
        container_name=container_name,
        blob_name=blob_name,
        permission=BlobSasPermissions(read=True),
        expiry=datetime.now(timezone.utc) + timedelta(hours=2) # URL valid for 2 hours
    )

    return f"https://{account_name}.blob.core.windows.net/{container_name}/{blob_name}?{sas_token}"

async def upload_file_to_azure(file: UploadFile, user_id: int, container_name: str = "patient-reports") -> tuple[str, str]:
    """
    Uploads a file to Azure Blob Storage and returns (secure_sas_url, blob_name).
    Sets metadata so files view in browser instead of downloading.
    """
    blob_service_client = get_blob_service_client()
    
    # Ensure container exists
    container_client = blob_service_client.get_container_client(container_name)
    if not container_client.exists():
        container_client = blob_service_client.create_container(container_name)
        
    # Generate a unique filename with user-specific prefix
    file_extension = file.filename.split('.')[-1].lower() if '.' in file.filename else 'pdf'
    unique_filename = f"user_{user_id}/{uuid.uuid4()}.{file_extension}"
    
    # Map extension to MIME type
    content_types = {
        'pdf': 'application/pdf',
        'jpg': 'image/jpeg',
        'jpeg': 'image/jpeg',
        'png': 'image/png'
    }
    content_type = content_types.get(file_extension, 'application/octet-stream')
    
    blob_client = blob_service_client.get_blob_client(container=container_name, blob=unique_filename)
    
    # Upload the file stream with correct content settings
    content = await file.read()
    blob_client.upload_blob(
        content, 
        overwrite=True, 
        content_settings=ContentSettings(
            content_type=content_type,
            content_disposition='inline'
        )
    )
    
    # Reset file cursor
    await file.seek(0)
    
    # Generate a secure SAS URL
    sas_url = generate_sas_url(container_name, unique_filename)
    
    return sas_url, unique_filename

async def delete_file_from_azure(blob_name: str, user_id: int, container_name: str = "patient-reports") -> bool:
    """
    Deletes a file from Azure Blob Storage.
    Verifies that the file belongs to the user.
    """
    if not blob_name.startswith(f"user_{user_id}/"):
        print(f"Unauthorized deletion attempt: User {user_id} tried to delete {blob_name}")
        return False

    try:
        blob_service_client = get_blob_service_client()
        blob_client = blob_service_client.get_blob_client(container=container_name, blob=blob_name)
        blob_client.delete_blob()
        return True
    except Exception as e:
        print(f"Error deleting from Azure: {str(e)}")
        return False
