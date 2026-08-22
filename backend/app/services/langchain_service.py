"""
LangChain Service for Setu Avatar (Setu Project)
Provides LCEL (LangChain Expression Language) Chains for:
1. Multilingual Sardar Genji Mentor Reasoning Chain
2. RAG Knowledge Integration Chain
3. Async Token & Sentence Stream Engine
"""

import logging
from typing import List, Dict, Any, Optional, AsyncGenerator

from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import StrOutputParser
from langchain_core.runnables import RunnablePassthrough, RunnableSequence
from langchain_openai import ChatOpenAI

from app.config import settings

logger = logging.getLogger("langchain_service")

# Approved Language Configuration
LANGUAGE_CONFIG = {
    "en-IN": {"name": "English (India)", "script": "English Latin alphabet", "tl": "en", "code": "en-IN"},
    "en-US": {"name": "English", "script": "English Latin alphabet", "tl": "en", "code": "en-US"},
    "hi-IN": {"name": "Hindi (हिन्दी)", "script": "Devanagari script (देवनागरी)", "tl": "hi", "code": "hi-IN"},
    "pa-IN": {"name": "Punjabi (ਪੰਜਾਬੀ)", "script": "Gurmukhi script (ਗੁਰਮੁਖੀ)", "tl": "pa", "code": "pa-IN"},
    "bn-IN": {"name": "Bengali (বাংলা)", "script": "Bengali script (বাংলা)", "tl": "bn", "code": "bn-IN"},
    "ta-IN": {"name": "Tamil (தமிழ்)", "script": "Tamil script (தமிழ்)", "tl": "ta", "code": "ta-IN"}
}


class LangChainAvatarService:
    """Manages LangChain LLM instances, LCEL chains, and streaming pipelines for Setu Avatar."""

    def __init__(self):
        self._llm = None

    def get_llm(
        self,
        api_key: Optional[str] = None,
        model_name: Optional[str] = None,
        base_url: Optional[str] = None,
        temperature: float = 0.40,
        streaming: bool = True
    ) -> Optional[ChatOpenAI]:
        """Creates or returns a LangChain ChatOpenAI instance configured for OpenAI or OpenRouter."""
        effective_key = (
            api_key
            or getattr(settings, "OPENROUTER_API_KEY", "")
            or getattr(settings, "OPENAI_API_KEY", "")
            or ""
        ).strip()

        if not effective_key:
            return None

        # Detect OpenRouter vs OpenAI
        if "openrouter" in (base_url or "").lower() or effective_key.startswith("sk-or-") or (getattr(settings, "OPENROUTER_API_KEY", None) and effective_key == settings.OPENROUTER_API_KEY.strip()):
            effective_base_url = "https://openrouter.ai/api/v1"
            effective_model = model_name or getattr(settings, "OPENROUTER_MODEL", "openai/gpt-4o-mini") or "openai/gpt-4o-mini"
            extra_headers = {
                "HTTP-Referer": "http://localhost:5173",
                "X-Title": "Setu Project Avatar LangChain"
            }
        else:
            effective_base_url = (base_url or getattr(settings, "OPENAI_BASE_URL", "https://api.openai.com/v1")).rstrip('/')
            effective_model = model_name or getattr(settings, "OPENAI_MODEL", "gpt-4o-mini") or "gpt-4o-mini"
            extra_headers = {}

        try:
            return ChatOpenAI(
                model=effective_model,
                api_key=effective_key,
                base_url=effective_base_url,
                temperature=0.25,
                max_tokens=220,
                streaming=streaming,
                default_headers=extra_headers if extra_headers else None,
                timeout=3.5
            )
        except Exception as e:
            logger.error(f"Failed to instantiate LangChain ChatOpenAI: {e}")
            return None

    def create_mentor_prompt(self, language: str = "en-IN") -> ChatPromptTemplate:
        """Constructs a LangChain ChatPromptTemplate with Sardar Genji mentor persona and strict multi-language rules."""
        lang_info = LANGUAGE_CONFIG.get(language, LANGUAGE_CONFIG["en-IN"])
        target_lang = lang_info["name"]
        target_script = lang_info["script"]

        system_template = (
            "You are Sardar Genji, an expert senior mentor, traditional heritage philosopher, and master guide of Setu knowledge.\n\n"
            "MANDATORY MULTI-LANGUAGE EXPERT STANDARDS (NON-NEGOTIABLE):\n"
            f"The mentee has selected the target language: {target_lang} ({target_script}).\n"
            "CROSS-LANGUAGE INPUT COMPREHENSION & STRICT TARGET OUTPUT RULE:\n"
            "- The mentee may ask or speak their question in ANY language (English, Hindi, Punjabi, Bengali, Tamil, Hinglish, or any mix).\n"
            "- You must accept and fully comprehend their question in whatever language they used.\n"
            f"- HOWEVER, YOUR SPOKEN ANSWER MUST BE 100% EXCLUSIVELY FORMULATED IN {target_lang} ({target_script}).\n"
            f"- NEVER reply in the user's input language if it differs from {target_lang}. Always reply and speak strictly in {target_lang}!\n\n"
            "LANGUAGE-SPECIFIC SPOKEN FLUENCY RULES:\n"
            "- HINDI (हिन्दी): Speak in warm, respectful, native Hindi. Address strictly as 'मेरे बच्चे'. Example opening: 'सादर प्रणाम मेरे बच्चे, मैं सरदार गेंजी हूँ।'\n"
            "- PUNJABI (ਪੰਜਾਬੀ): Speak in authentic, loving Gurmukhi Punjabi with proper orthography. Address strictly as 'ਮੇਰੇ ਬੱਚੇ'. Example opening: 'ਸਤਿ ਸ੍ਰੀ ਅਕਾਲ ਮੇਰੇ ਬੱਚੇ, ਮੈਂ ਸਰਦਾਰ ਗੇਂਜੀ ਹਾਂ।'\n"
            "- BENGALI (বাংলা): Speak in elegant, articulate Bengali. Address strictly as 'আমার সন্তান'. Example opening: 'নমস্কার আমার সন্তান, আমি সরদার গেঞ্জি।'\n"
            "- TAMIL (தமிழ்): Speak in pure, natural, respectful Tamil. Address strictly as 'என் குழந்தையே'. Example opening: 'வணக்கம் என் குழந்தையே, நான் சர்தார் கெஞ்சி.'\n"
            "- ENGLISH (English): Speak in warm, articulate mentor English. Address strictly as 'My child'. Example opening: 'Greetings my child, I am Sardar Genji, your mentor.'\n\n"
            "MANDATORY 3-STAGE RESPONSE ARCHITECTURE (QUICK & SOLUTION-FIRST):\n"
            "1. STAGE 1 - BRIEF GREETING & FORMAL INTRO (1 SHORT SENTENCE):\n"
            "   - Greet warmly and state your mentor identity as Sardar Genji addressing the user as specified above.\n"
            "2. STAGE 2 - DIRECT PRACTICAL SOLUTION FIRST (IMMEDIATE & ACTIONABLE):\n"
            "   - Deliver the exact remedy, recipe, technique, or direct answer immediately right after the greeting intro!\n"
            "   - Do NOT delay the solution with long preliminary backstories. Give the user the practical answer first!\n"
            "3. STAGE 3 - SUPPORTING WISDOM & GOTCHAS (AFTER THE SOLUTION):\n"
            "   - Follow up with helpful supporting details:\n"
            "     a. Why this solution works (core biological/practical mechanism).\n"
            "     b. A practical analogy or real-world tip.\n"
            "     c. Common mistakes and pitfalls to avoid.\n"
            "     d. A crisp 1-sentence final takeaway rule of thumb.\n\n"
            "ZERO-INTERRUPTION SPOKEN TTS PRINCIPLES:\n"
            "- ZERO FORMATTING ARTIFACTS: NEVER use markdown headers (###), bold asterisks (**), bullets (-), or numbered lists (1. / 2.).\n"
            "- ZERO RAW SYMBOLS OR EMOJIS: Never output emojis or symbols (&, /, %, @). Spell them out in words (e.g. percent, and, or).\n"
            "- CONTINUOUS SPOKEN CADENCE: Write complete, flowing spoken sentences so speech synthesis is 100% smooth with zero missed words or stutters.\n"
            "- CONCISE LENGTH: Keep total response between 60 to 80 spoken words for rapid, punchy delivery.\n"
            "- MEDICAL SAFEGUARD: For severe medical emergencies (chest pain, acute bleeding, severe breathing difficulty), advise consulting a doctor or hospital immediately.\n"
        )

        human_template = (
            f"User Query (Answer strictly in {target_lang} using {target_script}):\n"
            "{query}\n\n"
            "Relevant Knowledge & Heritage Context:\n"
            "{context}\n\n"
            f"Mentor Spoken Explanation strictly in {target_lang}:"
        )

        return ChatPromptTemplate.from_messages([
            ("system", system_template),
            ("human", human_template)
        ])

    async def generate_response(
        self,
        query: str,
        context: str = "",
        language: str = "en-IN",
        api_key: Optional[str] = None,
        model_name: Optional[str] = None,
        base_url: Optional[str] = None
    ) -> Optional[str]:
        """Executes a LangChain LCEL Chain (Prompt | LLM | StrOutputParser) to synthesize a mentor response."""
        llm = self.get_llm(api_key=api_key, model_name=model_name, base_url=base_url, streaming=False)
        if not llm:
            return None

        prompt = self.create_mentor_prompt(language=language)
        chain = prompt | llm | StrOutputParser()

        try:
            result = await chain.ainvoke({
                "query": query,
                "context": context or "Setu verified ancestral and systems wisdom."
            })
            return result.strip() if result else None
        except Exception as e:
            logger.warning(f"LangChain chain execution error: {e}")
            return None

    async def stream_response(
        self,
        query: str,
        context: str = "",
        language: str = "en-IN",
        api_key: Optional[str] = None,
        model_name: Optional[str] = None,
        base_url: Optional[str] = None
    ) -> AsyncGenerator[str, None]:
        """Streams tokens directly from the LangChain LCEL Chain."""
        llm = self.get_llm(api_key=api_key, model_name=model_name, base_url=base_url, streaming=True)
        if not llm:
            return

        prompt = self.create_mentor_prompt(language=language)
        chain = prompt | llm | StrOutputParser()

        try:
            async for chunk in chain.astream({
                "query": query,
                "context": context or "Setu verified ancestral and systems wisdom."
            }):
                if chunk:
                    yield chunk
        except Exception as e:
            logger.warning(f"LangChain stream error: {e}")


# Global LangChain Avatar Singleton
langchain_avatar_service = LangChainAvatarService()
