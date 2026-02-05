from src.infrastructure.db_connection import Neo4jConnection

class GraphManager:
    def __init__(self):
        self.db = Neo4jConnection()

    def create_constraints(self):
        queries = [
            "CREATE CONSTRAINT document_id IF NOT EXISTS FOR (d:Document) REQUIRE d.id IS UNIQUE",
            "CREATE CONSTRAINT chunk_id IF NOT EXISTS FOR (c:Chunk) REQUIRE c.id IS UNIQUE"
        ]
        
        try:
            with self.db.driver.session() as session:
                for q in queries:
                    session.run(q)
            print("✅ Graph constraints created.")
        except Exception as e:
            print(f"⚠️ Warning creating constraints: {e}")

    def add_document_with_chunks(self, doc_data: dict, chunks: list[str]):
        
        chunks_payload = []
        for index, chunk_text in enumerate(chunks):
            chunk_id = f"{doc_data['id']}_chunk_{index}"
            
            chunks_payload.append({
                "id": chunk_id,
                "text": chunk_text,
                "index": index
            })

        query = """
        MERGE (d:Document {id: $doc_id})
        SET d.title = $title, 
            d.summary = $summary,
            d.text = $full_text,
            d.created_at = datetime()

        WITH d
        UNWIND $chunks_data AS chunk_item
        
        MERGE (c:Chunk {id: chunk_item.id})
        SET c.text = chunk_item.text,
            c.index = chunk_item.index
            
        MERGE (d)-[:HAS_PART]->(c)
        """
        
        params = {
            "doc_id": doc_data['id'],
            "title": doc_data['title'],
            "summary": doc_data.get('summary', ''),
            "full_text": doc_data.get('text', ''),
            "chunks_data": chunks_payload
        }

        try:
            with self.db.driver.session() as session:
                session.run(query, params)
        except Exception as e:
            print(f"❌ Error adding document {doc_data['id']}: {e}")

    def close(self):
        self.db.close()