import threading
import gc
import torch
from unsloth import FastLanguageModel
from sentence_transformers import SentenceTransformer

class ModelManager:
    _instance = None
    _lock = threading.Lock()

    def __init__(self):
        self.model = None
        self.tokenizer = None
        self.model_path = "models/legalmind_final_adapter"

        self.embedder = None
        self.embedder_name = "all-MiniLM-L6-v2"

        self.max_new_tokens = 512
        self.temperature = 0.0
        self.do_sample = False
        self.repetition_penalty = 1.15

    @classmethod
    def get_instance(cls):
        if cls._instance is None:
            with cls._lock:
                if cls._instance is None:
                    cls._instance = ModelManager()
        return cls._instance

    def load_models(self):
        if self.embedder is None:
            print(f"📦 Loading Embedder ({self.embedder_name})...")
            self.embedder = SentenceTransformer(self.embedder_name)
            print("✅ Embedder Loaded.")

        if self.model is None:
            print(f"⏳ Loading LegalMind LLM from {self.model_path}...")
            try:
                model, tokenizer = FastLanguageModel.from_pretrained(
                    model_name=self.model_path,
                    max_seq_length=4096,
                    dtype=None,
                    load_in_4bit=True,
                )
                FastLanguageModel.for_inference(model)

                self.model = model
                self.tokenizer = tokenizer
                print("✅ LegalMind LLM Loaded & Ready on GPU!")
            except Exception as e:
                print(f"❌ Failed to load LLM: {e}")
                raise

    def embed_query(self, query: str):
        if not self.embedder:
            raise Exception("Embedder not loaded!")
        vec = self.embedder.encode([query], convert_to_numpy=True)
        return vec[0].tolist()

    def generate_response(self, prompt: str) -> str:
        if not self.model or not self.tokenizer:
            raise Exception("Model not loaded!")

        inputs = self.tokenizer(
            [prompt],
            return_tensors="pt",
            truncation=True,
            max_length=3500
        ).to("cuda")

        with torch.inference_mode():
            outputs = self.model.generate(
                **inputs,
                max_new_tokens=self.max_new_tokens,
                temperature=self.temperature,
                do_sample=self.do_sample,
                repetition_penalty=self.repetition_penalty,
                use_cache=True,
                pad_token_id=self.tokenizer.eos_token_id
            )

        generated_ids = outputs[0][inputs["input_ids"].shape[-1]:]
        response_text = self.tokenizer.decode(generated_ids, skip_special_tokens=True).strip()

        try:
            del inputs, outputs
            torch.cuda.empty_cache()
            gc.collect()
        except Exception as e:  
            print(f"❌ Failed to clean memory: {e}")
            pass

        return response_text