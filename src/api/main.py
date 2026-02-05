from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from src.api.routes import router as api_router
from src.infrastructure.db_connection import Neo4jConnection
from src.api.model_manager import ModelManager



app = FastAPI(
    title="LegalMind API",
    version="1.0.0",
    description="Enterprise Legal AI Assistant Backend"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
async def startup():
    print("🚀 LegalMind API Starting...")
    db = Neo4jConnection()
    if db.verify_connectivity():
        print("✅ Neo4j Connected Successfully!")
    else:
        print("❌ WARNING: Neo4j Connection Failed!")

    ModelManager.get_instance().load_models()    

@app.on_event("shutdown")
async def shutdown():
    print("🛑 Shutting down...")
    Neo4jConnection().close()

app.include_router(api_router, prefix="/api/v1")

@app.get("/health")
def health_check():
    return {"status": "healthy", "gpu": "RTX 5060 Ready"}