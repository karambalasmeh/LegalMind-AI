from llama_index.core.node_parser import SentenceSplitter

class TextProcessor:
    def __init__(self, chunk_size: int = 512, chunk_overlap: int = 50):
        self.splitter = SentenceSplitter(
            chunk_size=chunk_size, 
            chunk_overlap=chunk_overlap
        )

    def split_text(self, text: str) -> list[str]:
        if not text:
            return []
        
        chunks = self.splitter.split_text(text)
        return chunks