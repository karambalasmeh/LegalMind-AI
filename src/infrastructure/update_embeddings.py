import sys
import os

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "../../")))

from src.infrastructure.db_connection import Neo4jConnection
from sentence_transformers import SentenceTransformer
import time

def add_embeddings_to_graph():
    print("🚀 Initializing Vector Injection Protocol...")
    
    print("📦 Loading Embedding Model (all-MiniLM-L6-v2)...")
    embedder = SentenceTransformer('all-MiniLM-L6-v2')
    
    db = Neo4jConnection()
    
    index_query = """
    CREATE VECTOR INDEX chunk_text_vector IF NOT EXISTS
    FOR (c:Chunk)
    ON (c.embedding)
    OPTIONS {indexConfig: {
      `vector.dimensions`: 384,
      `vector.similarity_function`: 'cosine'
    }}
    """
    try:
        with db.driver.session() as session:
            session.run(index_query)
        print("✅ Vector Index Created/Verified.")
    except Exception as e:
        print(f"⚠️ Index Warning: {e}")

    print("🔄 Fetching Chunks without embeddings...")
    fetch_query = """
    MATCH (c:Chunk)
    WHERE c.embedding IS NULL
    RETURN c.id AS id, c.text AS text
    """
    
    update_query = """
    MATCH (c:Chunk {id: $id})
    SET c.embedding = $embedding
    """
    
    with db.driver.session() as session:
        result = list(session.run(fetch_query))
        total = len(result)
        print(f"📊 Found {total} chunks to process.")
        
        start_time = time.time()
        batch_data = []
        batch_ids = []
        
        for i, record in enumerate(result):
            text = record["text"]
            chunk_id = record["id"]
            
            batch_data.append(text)
            batch_ids.append(chunk_id)
            
            if len(batch_data) >= 100 or i == total - 1:
                embeddings = embedder.encode(batch_data)
                
                for j, emb in enumerate(embeddings):
                    session.run(update_query, id=batch_ids[j], embedding=emb.tolist())
                
                print(f"⏳ Processed {i+1}/{total} chunks...", end="\r")
                
                batch_data = []
                batch_ids = []

    print(f"\n✅ All chunks embedded successfully in {time.time() - start_time:.2f} seconds!")
    db.close()

if __name__ == "__main__":
    add_embeddings_to_graph()