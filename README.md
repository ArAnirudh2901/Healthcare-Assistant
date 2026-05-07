# MediHealth - Healthcare AI Platform

A production-grade, multi-agent healthcare AI orchestration platform built with **FastAPI**, **LangGraph**, and **Next.js**. This system enables medical report analysis, patient data isolation, and intelligent clinical consultations using specialized AI agents.

---

## 🚀 Quick Setup Guide

### 1. Prerequisites
- **Python 3.11+** (Tested on 3.11, 3.12, and 3.14)
- **Node.js 18+**
- **npm** or **yarn**
- **Azure Blob Storage Account** (For medical report storage)

---

## 🛠️ Backend Setup (FastAPI)

1. **Navigate to the backend directory:**
   ```bash
   cd backend
   ```

2. **Create and Activate Virtual Environment:**
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. **Install Dependencies:**
   ```bash
   pip install -r requirements.txt
   ```
   *Note: Includes SQLAlchemy, LangGraph, Azure Storage, and FAISS.*

4. **Configure Environment Variables:**
   - Copy the example file: `cp .env.example .env`
   - Fill in the required keys:
     - `GROQ_API_KEY`: Required for LLM orchestration.
     - `AZURE_STORAGE_CONNECTION_STRING`: Required for secure PDF storage.
     - `TAVILY_API_KEY`: Optional but recommended for web search capabilities.
     - `DATABASE_URL`: Defaults to local SQLite (`sqlite:///./sql_app.db`).
     - `SECRET_KEY`: Set a secure string for JWT authentication.

5. **Initialize Database and Start Server:**
   ```bash
   uvicorn app.main:app --reload
   ```
   The API will be live at `http://localhost:8000`.

---

## 💻 Frontend Setup (Next.js)

1. **Navigate to the frontend directory:**
   ```bash
   cd frontend
   ```

2. **Install Dependencies:**
   ```bash
   npm install
   ```

3. **Launch Development Server:**
   ```bash
   npm run dev
   ```
   Access the dashboard at `http://localhost:3000`.

---

## 📂 Project Architecture

- **`backend/`**: 
  - `app/api/`: REST endpoints for Auth, Chat, and Documents.
  - `app/services/ai/`: LangGraph agents (Senior/Junior Doctor, Nutritionist).
  - `app/services/ai/rag.py`: User-scoped FAISS vector indexing.
  - `app/services/ai/mcp_server.py`: Medical Tool Server (Drug interactions, Cardiac risk).
- **`frontend/`**: 
  - Next.js 16 (App Router) with CSS Modules.
  - Premium Dashboard with real-time AI indexing status.
- **`data/`**: Local storage for FAISS indices (user-partitioned).

---

## 🧪 Key Features & Design
- **Multi-Agent Orchestration**: Intelligent routing between general support and specialized medical agents.
- **Privacy First**: Medical reports are stored in user-specific Azure Blob folders and FAISS indices.
- **Browser-Native Viewing**: PDF reports open directly in the browser via SAS URLs and correct MIME types.
- **Model Context Protocol (MCP)**: Local medical tools integrated directly into the LLM's reasoning loop.

---

## 📝 License
Proprietary - MediHealth.
