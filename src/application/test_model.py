from unsloth import FastLanguageModel
from transformers import TextStreamer

model_path = "models/legalmind_final_adapter"
max_seq_length = 2048
dtype = None
load_in_4bit = True

def test_inference():
    print(f"🚀 Loading LegalMind from: {model_path} ...")
    
    model, tokenizer = FastLanguageModel.from_pretrained(
        model_name = model_path,
        max_seq_length = max_seq_length,
        dtype = dtype,
        load_in_4bit = load_in_4bit,
    )
    
    FastLanguageModel.for_inference(model)

    print("✅ Model Loaded Successfully!")
    print("🤖 LegalMind AI is ready. Type 'exit' to stop.\n")

    alpaca_prompt = """Below is an instruction that describes a task, paired with an input that provides further context. Write a response that appropriately completes the request.

### Instruction:
{}

### Input:
{}

### Response:
{}"""

    while True:
        user_input = input("\n⚖️ Enter Legal Text or Question: ")
        if user_input.lower() in ["exit", "quit"]:
            break
            
        instruction = "Summarize and explain the key legal provisions of this text."
        
        inputs = tokenizer(
            [
                alpaca_prompt.format(
                    instruction,
                    user_input,
                    "",
                )
            ], return_tensors = "pt").to("cuda")

        text_streamer = TextStreamer(tokenizer)
        
        print("\n🧠 LegalMind Response:\n")
        _ = model.generate(**inputs, streamer = text_streamer, max_new_tokens = 512)

if __name__ == "__main__":
    test_inference()