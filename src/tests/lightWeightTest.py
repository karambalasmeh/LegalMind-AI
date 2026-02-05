from unsloth import FastLanguageModel

max_seq_length = 2048
dtype = None
load_in_4bit = True

print("⏳ Loading model... (This might take a minute)")

try:
    model, tokenizer = FastLanguageModel.from_pretrained(
        model_name = "unsloth/TinyLlama-1.1B-Chat-v1.0", 
        max_seq_length = max_seq_length,
        dtype = dtype,
        load_in_4bit = load_in_4bit,
    )
    
    print("✅ Model loaded successfully into VRAM!")
    
    FastLanguageModel.for_inference(model) 
    
    print("✅ Inference mode enabled. System is ready for Fine-Tuning!")

except Exception as e:
    print(f"❌ Error loading model: {e}")
    print("If this fails on Windows, ensure 'bitsandbytes' windows version is installed.")