import os
import sys
import asyncio

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding='utf-8')
    except Exception:
        pass

from app.models.avatar_schemas import AvatarChatRequest
from app.services.avatar_brain_service import avatar_brain_service
from app.routers.avatar import AVATAR_PERSONAS
from app.services.storage_service import storage_service
from app.services.rag_service import rag_service

async def test_integration():
    print("=== Testing Avatar Backend Integration in Setu_project ===")
    
    # 1. Test RAG initialization
    await rag_service.initialize()
    print(" [PASS] RAG service initialized.")

    # 2. Test Personas
    print(f" [PASS] Personas loaded: {len(AVATAR_PERSONAS)}")
    for p in AVATAR_PERSONAS:
        print(f"   - {p['name']} ({p['role']})")

    # 3. Test Storage Stats
    stats = await storage_service.get_avatar_stats()
    print(f" [PASS] Avatar stats retrieved: Total interactions={stats.get('totalInteractions', 0)}")

    # 4. Test Chat Processing
    req = AvatarChatRequest(query="Hello, who are you and how can you help me?", language="en-IN")
    res = await avatar_brain_service.process_chat(req)
    print(f" [PASS] Chat query processed:")
    print(f"   - Spoken Text: {res.spoken_text}")
    print(f"   - Words: {res.word_count}, Sentences: {res.sentence_count}, Visemes: {len(res.visemes)}")
    assert len(res.spoken_text) > 0, "Spoken text should not be empty"
    assert len(res.visemes) > 0, "Visemes should be generated"

    print("\n=== ALL AVATAR BACKEND INTEGRATION TESTS PASSED 100%! ===")

if __name__ == "__main__":
    asyncio.run(test_integration())
