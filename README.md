# LegalMind

A RAG-based legal assistant for California statutes. Built with Neo4j, Llama-3, and Next.js.

## What it does

- Answers legal questions using retrieved statute chunks
- Shows source citations with relevance scores
- Visualizes query-to-statute relationships as a graph

## Architecture

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Next.js   │────▶│   FastAPI   │────▶│    Neo4j    │
│  Frontend   │     │   Backend   │     │  Graph DB   │
└─────────────┘     └─────────────┘     └─────────────┘
                           │
                    ┌──────┴──────┐
                    │   Llama-3   │
                    │  (Unsloth)  │
                    └─────────────┘
```

**Backend:** FastAPI, Neo4j, Llama-3 (4-bit quantized), MiniLM embeddings  
**Frontend:** Next.js 14, Tailwind, react-force-graph-2d

## Setup

### Requirements

- Python 3.10+
- Node.js 20+
- Neo4j (local or Docker)
- NVIDIA GPU (for inference)

### Backend

```bash
python -m venv venv
.\venv\Scripts\activate  # Windows
pip install -r requirements.txt

# Configure .env
NEO4J_URI=bolt://localhost:7687
NEO4J_USER=neo4j
NEO4J_PASSWORD=your_password

# Run
uvicorn src.api.main:app --reload
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Open http://localhost:3000

## Data Pipeline

1. `ingest_data.py` - Downloads BillSum dataset
2. `build_graph.py` - Creates document/chunk nodes in Neo4j
3. `update_embeddings.py` - Generates vector embeddings for chunks

## Training

Training scripts use Unsloth for efficient fine-tuning:

- `train_model.py` - Full epoch training
- `testing_train_model_process.py` - Quick test runs

## Project Structure

```
├── src/
│   ├── api/          # FastAPI routes, services, schemas
│   ├── application/  # Training, text processing
│   ├── domain/       # Data models
│   ├── infrastructure/  # Neo4j connection, graph ops
│   └── tests/        # Unit tests
├── frontend/         # Next.js app
├── models/           # Saved model adapters (gitignored)
└── data/             # Datasets (gitignored)
```

## License

MIT
