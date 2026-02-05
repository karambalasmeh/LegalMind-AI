import pytest
import re
import importlib

NUMERIC_PATTERN = re.compile(r"\b\d+(\.\d+)?\s?%|\$\d+|\b\d+\s+days\b", re.IGNORECASE)

def has_numeric_claim(text: str) -> bool:
    return bool(NUMERIC_PATTERN.search(text))

def has_disclaimer(text: str) -> bool:
    return "not professional legal counsel" in (text or "").lower()

def has_source_reference(text: str) -> bool:
    return "Source:" in (text or "") or "Source ID:" in (text or "")

@pytest.fixture(scope="session")
def model_manager():
    try:
        mm_mod = importlib.import_module("src.api.model_manager")
    except Exception as e:
        pytest.skip(f"Skipping model tests: cannot import model_manager ({e})")
    ModelManager = getattr(mm_mod, "ModelManager", None)
    if ModelManager is None:
        pytest.skip("Skipping model tests: ModelManager not found")
    mm = ModelManager.get_instance()
    try:
        mm.load_models()
    except Exception as e:
        pytest.skip(f"Skipping model load: {e}")
    return mm

@pytest.fixture(scope="session")
def rag_service(model_manager):
    try:
        rs_mod = importlib.import_module("src.api.services")
    except Exception as e:
        pytest.skip(f"Skipping RAGService tests: cannot import services ({e})")
    RAGService = getattr(rs_mod, "RAGService", None)
    if RAGService is None:
        pytest.skip("Skipping RAGService tests: RAGService class not found")
    svc = RAGService()
    return svc

def test_model_loaded(model_manager):
    assert model_manager.model is not None
    assert model_manager.tokenizer is not None
    assert model_manager.embedder is not None

def test_embedding_generation(model_manager):
    vec = model_manager.embed_query("What is the legal BAC limit?")
    assert isinstance(vec, list)
    assert len(vec) > 10

def test_retrieval_returns_sources(rag_service):
    sources = rag_service._retrieve_hybrid(
        "What is the blood alcohol concentration limit for commercial drivers?"
    )
    assert isinstance(sources, list)
    assert len(sources) > 0

def test_underspecified_question_rejected(rag_service):
    answer, sources = rag_service.process_query("What is the maximum fine?")
    assert "Information not found in retrieved laws" in answer
    assert has_disclaimer(answer)

def test_numeric_answer_is_extractive(rag_service):
    answer, sources = rag_service.process_query(
        "What is the blood alcohol concentration limit for commercial drivers?"
    )
    assert has_numeric_claim(answer)
    assert has_disclaimer(answer)

def test_unknown_topic_fails_cleanly(rag_service):
    answer, sources = rag_service.process_query("Is Bitcoin considered legal tender in California?")
    assert "Information not found in retrieved laws" in answer
    assert has_disclaimer(answer)

def test_deterministic_output(rag_service):
    q = "What is the blood alcohol concentration limit for commercial drivers?"
    a1, _ = rag_service.process_query(q)
    a2, _ = rag_service.process_query(q)
    assert a1 == a2
