from pydantic import BaseModel, Field
from typing import Optional

class LegalDocument(BaseModel):
    id: str = Field(..., description="Unique identifier for the document")
    title: str = Field(..., description="The official title of the bill/law")
    text: str = Field(..., description="The full text content of the law")
    summary: Optional[str] = Field(None, description="Human-written summary (Ground Truth)")
    
    def clean_text(self):
        if self.text:
            self.text = " ".join(self.text.split())