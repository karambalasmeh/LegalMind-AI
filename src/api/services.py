from src.infrastructure.db_connection import Neo4jConnection
from src.api.model_manager import ModelManager
from src.api.schemas import SourceNode

class RAGService:
    TOP_K = 3
    SCORE_CUTOFF = 0.50

    def __init__(self):
        self.db = Neo4jConnection()
        self.model_manager = ModelManager.get_instance()

    def _retrieve_hybrid(self, query: str) -> list[SourceNode]:
        query_vector = self.model_manager.embed_query(query)
        
        cypher_query = f"""
        CALL db.index.vector.queryNodes('chunk_text_vector', {self.TOP_K}, $embedding)
        YIELD node, score
        RETURN node.id AS id, node.text AS text, score
        """
        
        sources = []
        try:
            with self.db.driver.session() as session:
                result = session.run(cypher_query, embedding=query_vector)
                for record in result:
                    if record["score"] >= self.SCORE_CUTOFF:
                        sources.append(SourceNode(
                            id=record["id"],
                            title="Legal Provision", 
                            text=record["text"][:1500],
                            score=record["score"]
                        ))
        except Exception as e:
            print(f"⚠️ Retrieval Error: {e}")
            
        return sources

    def _construct_ultimate_prompt(self, query: str, context: list[SourceNode]) -> str:
        context_text = "\n\n".join([f"Source ID: {s.id}\nText: {s.text}" for s in context])
        
        if not context_text:
            return None

        prompt = f"""Below is an instruction that describes a task, paired with an input that provides further context. Write a response that appropriately completes the request.

### Instruction:
You are LegalMind, a strict legal assistant. Answer the User Question using ONLY the Legal Context below.

**Strict Rules:**
1. Do NOT use outside knowledge.
2. If the answer is not in the text, say "Information not found in retrieved laws."
3. Follow this EXACT format:
   - **Executive Summary:** A direct answer in 1-2 sentences.
   - **Detailed Analysis:** Explanation citing Source IDs.
   - **Key Entities:** Bullet points of important terms/limits.
   - **Disclaimer:** "This is AI-generated information, not professional legal counsel."

### Input:
**Legal Context:**
{context_text}

**User Question:**
{query}

### Response:
"""
        return prompt

    def process_query(self, query: str):
        
        print(f"🔍 Searching for: '{query}'...")
        sources = self._retrieve_hybrid(query)
        
        if not sources:
            return "Information not found in retrieved laws.\nThis is AI-generated information, not professional legal counsel.", []

        prompt = self._construct_ultimate_prompt(query, sources)
        if not prompt:
             return "Information not found in retrieved laws.\nThis is AI-generated information, not professional legal counsel.", []

        print("🤖 Generating Answer...")
        answer = self.model_manager.generate_response(prompt)
        
        if "Information not found" in answer:
             return "Information not found in retrieved laws.\nThis is AI-generated information, not professional legal counsel.", sources

        return answer, sources