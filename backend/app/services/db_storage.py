import os
from sqlalchemy.orm import Session
from app.models.file_storage import FileStorage
from fastapi import UploadFile
import uuid

def save_file_to_db(file: UploadFile, user_id: int, db: Session) -> tuple[str, str]:
    """
    Reads an uploaded file and saves it to the database.
    Returns (url, blob_name)
    """
    content = file.file.read()
    file_extension = file.filename.split('.')[-1].lower() if '.' in file.filename else 'pdf'
    
    db_file = FileStorage(
        user_id=user_id,
        filename=file.filename,
        file_type=file_extension,
        data=content
    )
    db.add(db_file)
    db.commit()
    db.refresh(db_file)
    
    file.file.seek(0)
    
    blob_name = db_file.id
    url = f"/api/v1/documents/files/{blob_name}"
    
    return url, blob_name

def delete_file_from_db(file_id: str, user_id: int, db: Session) -> bool:
    db_file = db.query(FileStorage).filter(FileStorage.id == file_id, FileStorage.user_id == user_id).first()
    if db_file:
        db.delete(db_file)
        db.commit()
        return True
    return False

def sync_faiss_to_db(user_id: int, local_index_path: str, db: Session) -> bool:
    """
    Reads the local index.faiss and index.pkl files and saves them to the DB as BLOBs.
    """
    try:
        faiss_file = os.path.join(local_index_path, "index.faiss")
        pkl_file = os.path.join(local_index_path, "index.pkl")

        for filepath, file_type in [(faiss_file, 'faiss'), (pkl_file, 'pkl')]:
            if os.path.exists(filepath):
                with open(filepath, "rb") as f:
                    content = f.read()
                
                # Check if exists
                existing = db.query(FileStorage).filter(FileStorage.user_id == user_id, FileStorage.file_type == file_type).first()
                if existing:
                    existing.data = content
                else:
                    new_file = FileStorage(
                        user_id=user_id,
                        filename=f"index.{file_type}",
                        file_type=file_type,
                        data=content
                    )
                    db.add(new_file)
        db.commit()
        return True
    except Exception as e:
        print(f"Error syncing FAISS to DB: {e}")
        return False

def sync_faiss_from_db(user_id: int, local_index_path: str, db: Session) -> bool:
    """
    Downloads the FAISS index files from the DB and writes them locally.
    """
    try:
        faiss_record = db.query(FileStorage).filter(FileStorage.user_id == user_id, FileStorage.file_type == 'faiss').first()
        pkl_record = db.query(FileStorage).filter(FileStorage.user_id == user_id, FileStorage.file_type == 'pkl').first()
        
        if not faiss_record and not pkl_record:
            return False
            
        os.makedirs(local_index_path, exist_ok=True)
        downloaded = False
        
        if faiss_record:
            with open(os.path.join(local_index_path, "index.faiss"), "wb") as f:
                f.write(faiss_record.data)
            downloaded = True
            
        if pkl_record:
            with open(os.path.join(local_index_path, "index.pkl"), "wb") as f:
                f.write(pkl_record.data)
            downloaded = True
            
        return downloaded
    except Exception as e:
        print(f"Error syncing FAISS from DB: {e}")
        return False
