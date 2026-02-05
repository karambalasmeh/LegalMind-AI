import json
import os
from tqdm import tqdm
from src.application.text_splitter import TextProcessor
from src.infrastructure.graph_manager import GraphManager

def build_knowledge_graph():
    processor = TextProcessor(chunk_size=512, chunk_overlap=50)
    graph_db = GraphManager()
    
    graph_db.create_constraints()
    
    data_path = "data/processed/billsum_cleaned.json"
    if not os.path.exists(data_path):
        print("❌ Data file not found! Run ingest_data.py first.")
        return

    with open(data_path, "r", encoding="utf-8") as f:
        documents = json.load(f)

    print(f"🚀 Starting ingestion of {len(documents)} documents into Neo4j...")
    
    for doc in tqdm(documents):
        chunks = processor.split_text(doc.get('text', ''))
        
        if chunks:
            graph_db.add_document_with_chunks(doc, chunks)
            
    print("\n✅ Knowledge Graph Build Complete!")
    graph_db.close()

if __name__ == "__main__":
    build_knowledge_graph()