import os
from typing import List
from fastapi import UploadFile
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_community.vectorstores import FAISS
from langchain_core.embeddings import Embeddings
from langchain_core.documents import Document
import tempfile
import random
from sqlalchemy.orm import Session
from app.services.pdf_processor import extract_text_from_pdf
from app.services.db_storage import sync_faiss_to_db, sync_faiss_from_db

FAISS_BASE_PATH = os.path.join(os.path.dirname(__file__), "../../../data/faiss_index")

def get_user_index_path(user_id: int) -> str:
    """Returns the path to the FAISS index for a specific user."""
    return os.path.join(FAISS_BASE_PATH, f"user_{user_id}")

class MockEmbeddings(Embeddings):
    """
    Mock embeddings class to bypass PyTorch/ONNX incompatibility with Python 3.14.
    In production (Python 3.11/3.12), replace this with HuggingFaceEmbeddings.
    """
    def embed_documents(self, texts: List[str]) -> List[List[float]]:
        return [[random.random() for _ in range(384)] for _ in texts]

    def embed_query(self, text: str) -> List[float]:
        return [random.random() for _ in range(384)]

embeddings = MockEmbeddings()

async def process_and_index_document(file: UploadFile, user_id: int, db: Session):
    """
    Reads a PDF using custom medical extractor, splits it into chunks, 
    and saves them to the user-specific FAISS index.
    """
    user_index_path = get_user_index_path(user_id)
    
    with tempfile.NamedTemporaryFile(delete=False, suffix=".pdf") as tmp:
        content = await file.read()
        tmp.write(content)
        tmp_path = tmp.name

    try:
        # Use our PRECISE medical extractor
        cleaned_lines = extract_text_from_pdf(tmp_path)
        
        if not cleaned_lines:
            return 0

        # Convert lines to LangChain documents
        documents = [Document(page_content=line, metadata={"source_file": file.filename, "user_id": user_id}) for line in cleaned_lines]

        # Split text into chunks (though lines are already small, we keep it for consistency)
        text_splitter = RecursiveCharacterTextSplitter(chunk_size=1000, chunk_overlap=0)
        chunks = text_splitter.split_documents(documents)

        # Download latest index from DB before modifying
        sync_faiss_from_db(user_id, user_index_path, db)

        # Load existing FAISS index or create a new one for this specific user
        if os.path.exists(user_index_path) and os.path.exists(os.path.join(user_index_path, "index.faiss")):
            vector_store = FAISS.load_local(user_index_path, embeddings, allow_dangerous_deserialization=True)
            vector_store.add_documents(chunks)
        else:
            os.makedirs(os.path.dirname(user_index_path), exist_ok=True)
            vector_store = FAISS.from_documents(chunks, embeddings)
            
        vector_store.save_local(user_index_path)
        
        # Upload updated index to DB
        sync_faiss_to_db(user_id, user_index_path, db)
        
        return len(chunks)
    finally:
        os.remove(tmp_path)
        await file.seek(0)

def retrieve_context(query: str, user_id: int, db: Session, k: int = 3) -> str:
    """
    Searches the user-specific FAISS index for relevant context.
    """
    user_index_path = get_user_index_path(user_id)
    
    sync_faiss_from_db(user_id, user_index_path, db)
    
    if not os.path.exists(user_index_path) or not os.path.exists(os.path.join(user_index_path, "index.faiss")):
        return "No patient reports have been uploaded yet."

    vector_store = FAISS.load_local(user_index_path, embeddings, allow_dangerous_deserialization=True)
    docs = vector_store.similarity_search(query, k=k)
    
    if not docs:
        return "No relevant information found in your reports."
        
    context = "\n\n".join([f"Excerpt from {doc.metadata.get('source_file', 'unknown')}:\n{doc.page_content}" for doc in docs])
    return context

def get_all_documents(user_id: int, db: Session) -> str:
    """
    Retrieves ALL text content from the user-specific FAISS index.
    """
    user_index_path = get_user_index_path(user_id)
    
    sync_faiss_from_db(user_id, user_index_path, db)
    
    if not os.path.exists(user_index_path) or not os.path.exists(os.path.join(user_index_path, "index.faiss")):
        return "No patient reports have been uploaded yet."
    
    vector_store = FAISS.load_local(user_index_path, embeddings, allow_dangerous_deserialization=True)
    all_docs = list(vector_store.docstore._dict.values())
    
    if not all_docs:
        return "No patient reports have been uploaded yet."
        
    return "\n".join([doc.page_content for doc in all_docs])
