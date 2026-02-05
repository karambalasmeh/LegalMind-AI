import os
import json
import uuid  
from datasets import load_dataset
from src.domain.models import LegalDocument

def ingest_billsum():
    print(" Starting Data Ingestion from HuggingFace...")
    
    try:
        dataset = load_dataset("billsum", split="ca_test")
        print(f"📦 Downloaded {len(dataset)} documents.")
        
        print(f"🔍 Dataset Columns found: {dataset.column_names}")
        
    except Exception as e:
        print(f" Failed to download dataset: {e}")
        return

    processed_docs = []
    
    print(" Cleaning and Validating data...")
    
    for item in dataset:
        try:
            doc_id = str(uuid.uuid4())

            doc = LegalDocument(
                id=doc_id,
                title=item.get('title', 'No Title'),
                text=item.get('text', ''),
                summary=item.get('summary', '')
            )
            
            doc.clean_text()
            
            processed_docs.append(doc.model_dump())

        except Exception as e:
            print(f"⚠️ Error processing document {item.get('title', 'Unknown')}: {e}")
            continue
    
    try:
        os.makedirs("data/processed", exist_ok=True)
        output_path = "data/processed/billsum_cleaned.json"
        
        with open(output_path, "w", encoding="utf-8") as f:
            json.dump(processed_docs, f, indent=4, ensure_ascii=False)
            
        print(f"✅ Success! Saved {len(processed_docs)} cleaned documents to {output_path}")
        
        if processed_docs:
            print("\n🔍 Sample Data Check:")
            print(f"ID: {processed_docs[0]['id']}")
            print(f"Title: {processed_docs[0]['title']}")
            print(f"Text Snippet: {processed_docs[0]['text'][:100]}...")
            
    except Exception as e:
        print(f"❌ Failed to save file: {e}")

if __name__ == "__main__":
    ingest_billsum()