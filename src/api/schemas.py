from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime

class ChatRequest(BaseModel):
    query: str = Field(..., min_length=3, description="The legal question provided by the user.")
    history: List[dict] = Field(default=[], description="List of previous messages [{'role': 'user', 'content': '...'}, ...]")

class SourceNode(BaseModel):
    id: str
    title: str = Field(..., description="Title of the law")
    text: str = Field(..., description="The chunk text content")
    score: Optional[float] = Field(None, description="Similarity score")

class ChatResponse(BaseModel):
    answer: str = Field(..., description="The AI generated response")
    sources: List[SourceNode] = Field(default=[], description="List of legal sources used")
    processing_time: float = Field(..., description="Time taken to generate response in seconds")
    timestamp: datetime = Field(default_factory=datetime.now)