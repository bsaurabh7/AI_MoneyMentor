from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Dict, Any
import uvicorn
from agent import generate_response
from agents import insurance, sip, loan, expense
import sys
import asyncio

if sys.platform == 'win32':
    asyncio.set_event_loop_policy(asyncio.WindowsProactorEventLoopPolicy())

app = FastAPI(title="Arthmize Agent API", version="3.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(insurance.router, prefix="/api/agents/insurance", tags=["Insurance Agent"])
app.include_router(sip.router,       prefix="/api/agents/sip",       tags=["SIP Agent"])
app.include_router(loan.router,      prefix="/api/agents/loan",       tags=["Loan Agent"])
app.include_router(expense.router,   prefix="/api/agents/expense",    tags=["Expense Agent"])

# ── Main Chat Endpoint (Gemini orchestrator) ──────────────────────────────────
class ChatRequest(BaseModel):
    sessionId: str
    message: str
    context: Dict[str, Any]
    messageHistory: List[Dict[str, Any]]

@app.post("/api/chat", tags=["Chat"])
async def chat_endpoint(request: ChatRequest):
    try:
        response = await generate_response(
            message=request.message,
            context=request.context,
            history=request.messageHistory
        )
        return response
    except Exception as e:
        print(f"Error in /api/chat: {e}")
        return {"error": str(e)}

@app.get("/health", tags=["Health"])
def health():
    return {"status": "ok", "version": "3.0"}

if __name__ == "__main__":
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)
