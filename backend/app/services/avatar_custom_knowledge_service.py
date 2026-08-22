import os
import re
import json
import uuid
import logging
from typing import List, Dict, Any, Optional

from app.config import settings

logger = logging.getLogger("custom_knowledge")

DATA_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "data")
KNOWLEDGE_FILE = os.path.join(DATA_DIR, "knowledge_base.json")
CONFIG_FILE = os.path.join(DATA_DIR, "user_config.json")


class CustomKnowledgeService:
    """
    Manages custom user-trained topics, questions & answers, document ingestion,
    and runtime AI model key configurations.
    """

    def __init__(self):
        os.makedirs(DATA_DIR, exist_ok=True)
        self._ensure_files()
        self.knowledge_entries: List[Dict[str, Any]] = self._load_knowledge()
        self._load_saved_keys()

    def _ensure_files(self):
        if not os.path.exists(KNOWLEDGE_FILE):
            default_entries = [
                {
                    "id": str(uuid.uuid4()),
                    "topic": "About Setu Project",
                    "keywords": ["setu project", "what is setu", "who created setu", "setu avatar"],
                    "answer": "Setu is an AI-powered cultural and knowledge bridge avatar designed to preserve wisdom, answer questions with human warmth, and connect generational heritage with modern technology.",
                    "category": "General",
                    "language": "en-IN",
                    "createdAt": "2026-08-12"
                }
            ]
            with open(KNOWLEDGE_FILE, "w", encoding="utf-8") as f:
                json.dump(default_entries, f, indent=2, ensure_ascii=False)

    def _load_knowledge(self) -> List[Dict[str, Any]]:
        try:
            if os.path.exists(KNOWLEDGE_FILE):
                with open(KNOWLEDGE_FILE, "r", encoding="utf-8") as f:
                    return json.load(f)
        except Exception as e:
            logger.error(f"Error loading custom knowledge base: {e}")
        return []

    def _load_saved_keys(self):
        if os.path.exists(CONFIG_FILE):
            try:
                with open(CONFIG_FILE, "r", encoding="utf-8") as f:
                    cfg = json.load(f)
                    if cfg.get("openrouter_key"):
                        settings.OPENROUTER_API_KEY = cfg["openrouter_key"]
                    if cfg.get("openrouter_model"):
                        settings.OPENROUTER_MODEL = cfg["openrouter_model"]
                    if cfg.get("gemini_key"):
                        settings.GEMINI_API_KEY = cfg["gemini_key"]
                        settings.GOOGLE_API_KEY = cfg["gemini_key"]
                    if cfg.get("openai_key"):
                        settings.OPENAI_API_KEY = cfg["openai_key"]
            except Exception as e:
                logger.error(f"Error loading user config: {e}")

    def _save_knowledge(self):
        try:
            with open(KNOWLEDGE_FILE, "w", encoding="utf-8") as f:
                json.dump(self.knowledge_entries, f, indent=2, ensure_ascii=False)
        except Exception as e:
            logger.error(f"Error saving custom knowledge base: {e}")

    def save_api_keys(
        self,
        openrouter_key: Optional[str] = None,
        openrouter_model: Optional[str] = None,
        gemini_key: Optional[str] = None,
        openai_key: Optional[str] = None
    ) -> Dict[str, Any]:
        """Saves runtime OpenRouter/LLM API keys and model choices."""
        current_config = {}
        if os.path.exists(CONFIG_FILE):
            try:
                with open(CONFIG_FILE, "r", encoding="utf-8") as f:
                    current_config = json.load(f)
            except Exception:
                pass

        if openrouter_key is not None:
            current_config["openrouter_key"] = openrouter_key.strip()
            settings.OPENROUTER_API_KEY = openrouter_key.strip()
        if openrouter_model is not None and openrouter_model.strip():
            current_config["openrouter_model"] = openrouter_model.strip()
            settings.OPENROUTER_MODEL = openrouter_model.strip()
        if gemini_key is not None:
            current_config["gemini_key"] = gemini_key.strip()
            settings.GEMINI_API_KEY = gemini_key.strip()
            settings.GOOGLE_API_KEY = gemini_key.strip()
        if openai_key is not None:
            current_config["openai_key"] = openai_key.strip()
            settings.OPENAI_API_KEY = openai_key.strip()

        with open(CONFIG_FILE, "w", encoding="utf-8") as f:
            json.dump(current_config, f, indent=2)

        return self.get_api_key_status()

    def get_api_key_status(self) -> Dict[str, Any]:
        return {
            "has_openrouter": bool(settings.OPENROUTER_API_KEY and len(settings.OPENROUTER_API_KEY) > 10),
            "openrouter_model": settings.OPENROUTER_MODEL,
            "has_gemini": bool(settings.GEMINI_API_KEY and len(settings.GEMINI_API_KEY) > 10),
            "has_openai": bool(settings.OPENAI_API_KEY and len(settings.OPENAI_API_KEY) > 10)
        }

    def get_all(self) -> List[Dict[str, Any]]:
        """Returns all trained knowledge items."""
        return self.knowledge_entries

    def add_entry(
        self,
        topic: str,
        answer: str,
        keywords: Optional[List[str]] = None,
        category: str = "Custom",
        language: str = "en-IN"
    ) -> Dict[str, Any]:
        """Adds a new custom topic and answer to the avatar's brain."""
        if not keywords:
            clean_kw = re.sub(r'[?!.,;:\'"]', '', topic.lower()).strip()
            keywords = [clean_kw]
            words = clean_kw.split()
            if len(words) > 2:
                keywords.append(" ".join(words[:3]))

        entry = {
            "id": str(uuid.uuid4()),
            "topic": topic.strip(),
            "keywords": [k.lower().strip() for k in keywords if k.strip()],
            "answer": answer.strip(),
            "category": category,
            "language": language,
            "createdAt": "2026-08-12"
        }
        self.knowledge_entries.insert(0, entry)
        self._save_knowledge()
        logger.info(f"Added custom knowledge: {topic}")
        return entry

    def delete_entry(self, entry_id: str) -> bool:
        """Deletes a custom knowledge item by ID."""
        initial_len = len(self.knowledge_entries)
        self.knowledge_entries = [e for e in self.knowledge_entries if e.get("id") != entry_id]
        if len(self.knowledge_entries) < initial_len:
            self._save_knowledge()
            logger.info(f"Deleted custom knowledge ID: {entry_id}")
            return True
        return False

    def ingest_raw_text(self, text: str, title: str = "Trained Document", category: str = "Document") -> List[Dict[str, Any]]:
        """
        Ingests a raw paragraph or document, automatically splitting into logical knowledge nuggets.
        """
        paragraphs = [p.strip() for p in text.split("\n\n") if len(p.strip()) > 20]
        if not paragraphs:
            paragraphs = [text.strip()]

        created = []
        for i, para in enumerate(paragraphs):
            first_sent = re.split(r'[.?!।]\s+', para)[0][:60].strip()
            sub_topic = f"{title}: {first_sent}" if len(paragraphs) > 1 else title
            keywords = [
                re.sub(r'[?!.,;:\'"]', '', title.lower()).strip(),
                re.sub(r'[?!.,;:\'"]', '', first_sent.lower()).strip()
            ]
            entry = self.add_entry(
                topic=sub_topic,
                answer=para,
                keywords=keywords,
                category=category
            )
            created.append(entry)
        return created

    def find_matching_knowledge(self, query: str) -> Optional[str]:
        """
        Searches user-trained knowledge base for a matching topic or keyword.
        """
        q_lower = query.lower().strip()
        q_clean = re.sub(r'[?!.,;:\'"]', '', q_lower).strip()

        # 1. Exact or Substring Keyword Match
        for entry in self.knowledge_entries:
            for kw in entry.get("keywords", []):
                kw_clean = kw.lower().strip()
                if kw_clean and (kw_clean in q_clean or q_clean in kw_clean):
                    return entry.get("answer")

        # 2. Topic Match
        for entry in self.knowledge_entries:
            topic_clean = re.sub(r'[?!.,;:\'"]', '', entry.get("topic", "").lower()).strip()
            if topic_clean and (topic_clean in q_clean or q_clean in topic_clean):
                return entry.get("answer")

        # 3. Word Overlap Match
        q_words = set(q_clean.split())
        for entry in self.knowledge_entries:
            topic_words = set(re.sub(r'[?!.,;:\'"]', '', entry.get("topic", "").lower()).split())
            if len(topic_words) >= 2 and len(q_words.intersection(topic_words)) >= max(2, int(len(topic_words) * 0.6)):
                return entry.get("answer")

        return None


custom_knowledge_service = CustomKnowledgeService()
