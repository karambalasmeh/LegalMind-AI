# ⚖️ LegalMind AI - Enterprise Legal Assistant





**LegalMind** is an advanced RAG (Retrieval-Augmented Generation) system designed to assist legal professionals in analyzing California Traffic & Tax Laws. It combines **Graph Knowledge Bases (Neo4j)** with **LLMs (Llama-3 fine-tuned)** to provide accurate, citation-backed legal answers.

---

## 🚀 Features

- **Hybrid RAG Engine:** Combines Vector Search (Semantic) with Graph Search (Relationships) for high accuracy.
- **No Hallucinations:** Strictly grounded in the provided `BillSum` dataset and California Statutes.
- **Interactive Graph UI:** Visualizes relationships between user queries and legal statutes.
- **Fine-Tuned Model:** Uses a customized version of Llama-3 optimized for legal reasoning using Unsloth.
- **Smart Citations:** Provides precise source citations with relevance scores.

---

## 🛠️ Tech Stack

### Backend (The Brain)

- **Framework:** FastAPI (Async)
- **AI Model:** Llama-3 (Quantized via Unsloth/Bitsandbytes)
- **Database:** Neo4j (Graph DB) for chunks and relationships.
- **Embeddings:** `all-MiniLM-L6-v2`
- **Infrastructure:** CUDA-accelerated Inference (RTX 5060 Optimized).

### Frontend (The Face)

- **Framework:** Next.js 14 (App Router)
- **Styling:** Tailwind CSS + Shadcn UI
- **Visualization:** `react-force-graph-2d`
- **State Management:** React Hooks + Axios

---

## 💻 Installation & Setup (Manual)

### Prerequisites

- Python 3.10+
- Node.js 20+
- Neo4j Desktop (Running locally)
- NVIDIA GPU (Recommended for inference)

### 1. Clone the Repository

```bash

```

### 2. Backend Setup

# Create Virtual Environment

python -m venv venv
.\venv\Scripts\activate

# Install Dependencies

pip install -r requirements.txt

# Create .env file

echo "NEO4J_URI=bolt://localhost:7687" > .env
echo "NEO4J_USER=neo4j" >> .env
echo "NEO4J_PASSWORD=your_password" >> .env

# Run Server

uvicorn src.api.main:app --reload



### 3. Frontend Setup

cd frontend

# Install Dependencies

npm install

# Run Interface

npm run dev

Visit `http://localhost:3000` to access the dashboard.
