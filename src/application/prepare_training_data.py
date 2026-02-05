import json
import os
import random
from typing import List, Dict

def prepare_comprehensive_dataset():
    input_path = "data/processed/billsum_cleaned.json"
    output_path = "data/training/train_dataset_diverse.json"
    
    if not os.path.exists(input_path):
        print("❌ Error: Processed data not found!")
        return

    print("📖 Loading raw data...")
    with open(input_path, "r", encoding="utf-8") as f:
        raw_data = json.load(f)

    instruction_templates = [
        "Summarize the following legal document highlighting the main objectives.",
        "Provide a concise summary of this legislation.",
        
        "Explain the key legal provisions in this text simply.",
        "Break down this law into its essential components for a non-expert.",
        
        "Identify the core mandates and requirements in this bill.",
        "What are the primary rules established by this document?",
        
        "Draft a brief internal memo outlining the purpose of this act.",
        "Write a short executive brief based on the following legal text."
    ]

    print(f"🔄 Engineering {len(raw_data)} samples with diverse instructions...")
    
    training_data: List[Dict] = []
    
    for item in raw_data:
        full_text = item.get('text', '')
        summary = item.get('summary', '')
        title = item.get('title', '')
        
        if full_text and summary:
            selected_instruction = random.choice(instruction_templates)
            
            entry = {
                "instruction": selected_instruction,
                "input": f"Title: {title}\n\nLegislation Text:\n{full_text}",
                "output": summary
            }
            training_data.append(entry)

    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(training_data, f, indent=4, ensure_ascii=False)
        
    print(f"✅ Success! Created {len(training_data)} diverse training samples.")
    print(f"📂 Output saved to: {output_path}")

if __name__ == "__main__":
    prepare_comprehensive_dataset()