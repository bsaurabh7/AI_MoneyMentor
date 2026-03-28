from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Dict, Any, Optional
import uvicorn
from agent import generate_response

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class ChatRequest(BaseModel):
    sessionId: str
    message: str
    context: Dict[str, Any]
    messageHistory: List[Dict[str, Any]]

@app.post("/api/chat")
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

if __name__ == "__main__":
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)
