from fastapi import APIRouter, HTTPException
from src.api.schemas import ChatRequest, ChatResponse
from src.api.services import RAGService
import time

router = APIRouter()

@router.post("/chat", response_model=ChatResponse)
async def chat_endpoint(request: ChatRequest):
    start_time = time.time()
    
    rag_service = RAGService()
    
    try:
        answer, sources = rag_service.process_query(request.query)
        
        process_time = time.time() - start_time
        
        return ChatResponse(
            answer=answer,
            sources=sources,
            processing_time=process_time
        )
    except Exception as e:
        print(f"❌ Error processing request: {e}")
        raise HTTPException(status_code=500, detail=str(e))