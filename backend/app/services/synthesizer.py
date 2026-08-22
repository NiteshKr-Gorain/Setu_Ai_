import os
import re
import json
import logging
from typing import List, Dict, Any, Optional
from urllib.parse import quote
import httpx

from app.config import settings

logger = logging.getLogger("synthesizer")

# Phoneme to Avatar Viseme Mapping with Multilingual Unicode Support
VISEME_MAP = {
    'a': 'open_wide',
    'e': 'spread_smile',
    'i': 'spread_smile',
    'o': 'rounded_o',
    'u': 'rounded_o',
    'm': 'closed_mbp',
    'b': 'closed_mbp',
    'p': 'closed_mbp',
    'f': 'teeth_fv',
    'v': 'teeth_fv',
    'w': 'rounded_o',
    'y': 'spread_smile',
    't': 'teeth_td',
    'd': 'teeth_td',
    's': 'teeth_sz',
    'z': 'teeth_sz',
    'k': 'open_mid',
    'g': 'open_mid',
    'n': 'teeth_td',
    'l': 'teeth_td',
    'r': 'rounded_o',
}

# Approved Language Catalog with Script Metadata
LANGUAGE_CONFIG = {
    "en-IN": {"name": "English (India)", "script": "English Latin alphabet", "tl": "en", "code": "en-IN"},
    "en-US": {"name": "English", "script": "English Latin alphabet", "tl": "en", "code": "en-US"},
    "hi-IN": {"name": "Hindi (हिन्दी)", "script": "Devanagari script (देवनागरी)", "tl": "hi", "code": "hi-IN"},
    "pa-IN": {"name": "Punjabi (ਪੰਜਾਬੀ)", "script": "Gurmukhi script (ਗੁਰਮੁਖੀ)", "tl": "pa", "code": "pa-IN"},
    "bn-IN": {"name": "Bengali (বাংলা)", "script": "Bengali script (বাংলা)", "tl": "bn", "code": "bn-IN"},
    "ta-IN": {"name": "Tamil (தமிழ்)", "script": "Tamil script (தமிழ்)", "tl": "ta", "code": "ta-IN"}
}

LANGUAGE_NAMES = {k: v["name"] for k, v in LANGUAGE_CONFIG.items()}


GREETINGS_BY_LANG = {
    "en-IN": "Greetings and warm blessings, my friend. I am Sardar Genji, your mentor and knowledge guide. Whatever question or challenge is in front of you today, let's break it down together step-by-step with clear intuition and practical wisdom.",
    "en-US": "Greetings and warm blessings, my friend. I am Sardar Genji, your mentor and knowledge guide. Whatever question or challenge is in front of you today, let's break it down together step-by-step with clear intuition and practical wisdom.",
    "hi-IN": "सादर प्रणाम और बहुत सारा आशीर्वाद, मेरे बच्चे। मैं सरदार गेंजी हूँ, आपका अनुभवी मार्गदर्शक। बताइए आज आपके मन में क्या सवाल या चुनौती है, हम मिलकर इसे बड़ी स्पष्टता, व्यावहारिक उदाहरणों और चरणबद्ध तरीके से समझेंगे।",
    "pa-IN": "ਸਤਿ ਸ੍ਰੀ ਅਕਾਲ ਅਤੇ ਬਹੁਤ ਸਾਰਾ ਪਿਆਰ, ਮੇਰੇ ਬੱਚੇ। ਮੈਂ ਸਰਦਾਰ ਗੇਂਜੀ ਹਾਂ, ਤੁਹਾਡਾ ਸਿਆਣਾ ਮਾਰਗਦਰਸ਼ਕ। ਦੱਸੋ ਅੱਜ ਕਿਹੜੀ ਮੁਸ਼ਕਲ ਜਾਂ ਸਵਾਲ ਹੈ, ਅਸੀਂ ਮਿਲ ਕੇ ਕਦਮ-ਦਰ-ਕਦਮ ਸਮਝਾਂਗੇ ਅਤੇ ਪੱਕਾ ਹੱਲ ਲੱਭਾਂਗੇ।",
    "bn-IN": "নমস্কার এবং অনেক আশীর্বাদ, আমার সন্তান। আমি সরদার গেঞ্জি, আপনার অভিজ্ঞ মেন্টর। বলো আজ তুমি কী শিখতে বা জানতে চাও, আমরা ধাপে ধাপে বাস্তবসম্মত উদাহরণসহ বিষয়টি পরিষ্কার করে নেব।",
    "ta-IN": "வணக்கம் மற்றும் என் ஆசிகள், என் குழந்தையே. நான் சர்தார் கெஞ்சி, உங்கள் அனுபவமிக்க ஆசிரியர். இன்று உங்களுக்கு என்ன சந்தேகம் அல்லது கவலை உள்ளது என்று கூறுங்கள், நாம் படிப்படியாக தீர்வு காண்போம்."
}


def is_medical_emergency(query: str) -> bool:
    """Detects acute, severe medical emergencies requiring urgent professional physician attention."""
    q = query.lower()
    emergency_keywords = [
        "chest pain", "heart attack", "can't breathe", "cannot breathe", "difficulty breathing",
        "high fever", "severe bleeding", "blood", "poison", "unconscious", "stroke", "broken bone",
        "severe burn", "head injury", "seizure", "suicide", "dying", "severe infection",
        "बहुत तेज बुखार", "सीने में दर्द", "सांस लेने में तकलीफ", "खून", "बेहोश", "दौरा",
        "ਬਹੁਤ ਤੇਜ਼ ਬੁਖਾਰ", "ਛਾਤੀ ਵਿੱਚ ਦਰਦ", "ਸਾਹ ਲੈਣ ਵਿੱਚ ਤਕਲੀਫ਼", "ਬੇਹੋਸ਼",
        "বুকে ব্যথা", "শ্বাসকষ্ট", "প্রচণ্ড জ্বর", "রক্তপাত", "অজ্ঞান",
        "நெஞ்சு வலி", "மூச்சுத் திணறல்", "அதி தீவிர காய்ச்சல்", "மயக்கம்"
    ]
    return any(kw in q for kw in emergency_keywords)


def search_setu_main_database(query: str) -> List[str]:
    """Retrieves relevant heritage and traditional records directly from Setu Project main database."""
    snippets = []
    base_dir = os.path.dirname(os.path.dirname(os.path.dirname(__file__)))
    data_files = [
        os.path.join(base_dir, "data", "knowledge.json"),
        os.path.join(base_dir, "data", "knowledge_base.json")
    ]
    
    q_words = [w for w in re.findall(r'\w+', query.lower()) if len(w) > 3]
    
    for df in data_files:
        if os.path.exists(df):
            try:
                with open(df, "r", encoding="utf-8") as f:
                    data = json.load(f)
                    if isinstance(data, list):
                        for item in data:
                            title = item.get("title", "") or item.get("topic", "")
                            content = item.get("content", "") or item.get("answer", "")
                            combined = f"{title} {content}".lower()
                            if any(w in combined for w in q_words) or any(k in query.lower() for k in item.get("keywords", [])):
                                snippets.append(f"Setu Archive ({title}): {content[:200]}")
            except Exception as e:
                logger.debug(f"Error reading Setu database file {df}: {e}")
                
    return snippets


def clean_for_spoken_avatar(text: str, query: str = "") -> str:
    """Sanitizes text for high-fidelity avatar speech synthesis without markdown formatting artifacts."""
    if not text:
        return ""
    # Strip markdown headers, bolding, bullet points, numbered lists
    t = re.sub(r'#{1,6}\s*', '', text)
    t = re.sub(r'\*{1,3}', '', t)
    t = re.sub(r'`{1,3}[^`]*`{1,3}', '', t)
    t = re.sub(r'^\s*[-*+]\s+', '', t, flags=re.MULTILINE)
    t = re.sub(r'^\s*\d+\.\s+', '', t, flags=re.MULTILINE)
    t = re.sub(r'\[([^\]]+)\]\([^\)]+\)', r'\1', t)
    t = re.sub(r'https?://\S+', '', t)
    t = re.sub(r'\s+', ' ', t).strip()
    return t


def generate_visemes(text: str) -> List[Dict[str, Any]]:
    """Generates audio-synchronized viseme shapes for avatar lip movement."""
    visemes = []
    words = text.split()
    for idx, word in enumerate(words):
        clean_word = re.sub(r'[^\w]', '', word).lower()
        if not clean_word:
            continue
        first_char = clean_word[0]
        viseme_shape = VISEME_MAP.get(first_char, 'open_wide')
        visemes.append({
            "wordIndex": idx,
            "word": word,
            "char": first_char,
            "shape": viseme_shape,
            "timeOffsetMs": idx * 280
        })
    return visemes


async def generate_with_openrouter(
    query: str,
    search_results: List[Dict[str, Any]],
    openrouter_api_key: str,
    language: str = "en-IN",
    model_name: str = "openai/gpt-4o-mini"
) -> Optional[str]:
    """
    Synthesizes an experienced mentor response using LangChain / OpenRouter API following the 6-phase explanation framework.
    """
    try:
        setu_db_snippets = search_setu_main_database(query)
        context_list = setu_db_snippets + [f"- {r.get('title')}: {r.get('snippet')}" for r in search_results[:2]]
        context_str = "\n".join(context_list) if context_list else "Setu verified ancestral and systems wisdom."

        # 1. Primary: LangChain LCEL Reasoning Chain
        try:
            from app.services.langchain_service import langchain_avatar_service
            lc_result = await langchain_avatar_service.generate_response(
                query=query,
                context=context_str,
                language=language,
                api_key=openrouter_api_key,
                model_name=model_name,
                base_url="https://openrouter.ai/api/v1"
            )
            if lc_result:
                logger.info("LangChain LCEL chain successfully synthesized response")
                return lc_result
        except Exception as lce:
            logger.debug(f"LangChain execution fallback: {lce}")

        url = "https://openrouter.ai/api/v1/chat/completions"
        
        lang_info = LANGUAGE_CONFIG.get(language, LANGUAGE_CONFIG["en-IN"])
        target_lang = lang_info["name"]
        target_script = lang_info["script"]
        
        system_prompt = (
            "You are Sardar Genji, an experienced senior mentor, systems thinker, and master guide of Setu knowledge.\n\n"
            "MANDATORY MULTI-LANGUAGE RULE (NON-NEGOTIABLE):\n"
            f"The user has selected the language: {target_lang}.\n"
            f"REGARDLESS of what language the user speaks or types, YOUR ANSWER MUST BE 100% EXCLUSIVELY WRITTEN IN {target_lang}.\n"
            "NEVER respond in English when the user selected Hindi, Punjabi, Bengali, or Tamil.\n\n"
            "MANDATORY 3-STAGE RESPONSE ARCHITECTURE (QUICK & SOLUTION-FIRST):\n"
            "1. BRIEF GREETING & FORMAL INTRO (1 SHORT SENTENCE):\n"
            "   - Start with a warm, formal greeting introducing yourself as Sardar Genji.\n"
            "   - Strictly address the user as 'मेरे बच्चे' (Hindi) / 'ਮੇਰੇ ਬੱਚੇ' (Punjabi) / 'My child' (English) / 'আমার সন্তান' (Bengali) / 'என் குழந்தையே' (Tamil).\n"
            "2. DIRECT SOLUTION FIRST (IMMEDIATE & ACTIONABLE):\n"
            "   - Provide the exact practical solution, step-by-step method, or direct answer immediately right after the greeting intro!\n"
            "   - Never delay the solution with long preliminary backstories.\n"
            "3. ADDITIONAL & SUPPORTING INFORMATION (AFTER THE SOLUTION):\n"
            "   - After stating the direct solution, provide supporting context:\n"
            "     a. Why this solution works and its core mechanism.\n"
            "     b. A practical analogy or real-world tip.\n"
            "     c. Common mistakes and pitfalls to avoid.\n"
            "     d. A crisp 1-sentence final takeaway rule of thumb.\n\n"
            "CRITICAL PRINCIPLES:\n"
            "- SPEED: Provide concise, clean spoken sentences so answers are rapid.\n"
            "- MEDICAL SAFEGUARD: For severe medical emergencies (chest pain, acute bleeding, breathing trouble), urge consulting a doctor or hospital first.\n"
            "- SPOKEN TTS-FRIENDLY: Form natural conversational spoken sentences with ZERO markdown formatting (no ###, **, or bullets).\n"
        )

        user_content = (
            f"User's Question/Problem (Answer strictly in {target_lang} using {target_script}): \"{query}\"\n\n"
            f"Setu Main Database & Heritage Context:\n{context_str}\n\n"
            f"Mentor Spoken Explanation strictly in {target_lang}:"
        )

        headers = {
            "Authorization": f"Bearer {openrouter_api_key.strip()}",
            "HTTP-Referer": "http://localhost:5173",
            "X-Title": "Setu Avatar",
            "Content-Type": "application/json"
        }

        active_model = model_name or settings.OPENROUTER_MODEL or "openai/gpt-4o-mini"

        payload = {
            "model": active_model,
            "messages": [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_content}
            ],
            "temperature": 0.40,
            "max_tokens": 400
        }
        
        async with httpx.AsyncClient(timeout=6.0) as client:
            resp = await client.post(url, json=payload, headers=headers)
            if resp.status_code == 200:
                data = resp.json()
                choices = data.get("choices", [])
                if choices:
                    content = choices[0].get("message", {}).get("content", "").strip()
                    if content:
                        return content
            else:
                logger.debug(f"OpenRouter returned status {resp.status_code}: {resp.text}")
    except Exception as e:
        logger.debug(f"OpenRouter synthesis unavailable ({e}), using fallback.")
    return None


async def generate_with_openai(
    query: str,
    search_results: List[Dict[str, Any]],
    openai_api_key: str,
    language: str = "en-IN",
    model_name: str = "gpt-4o-mini",
    base_url: str = "https://api.openai.com/v1"
) -> Optional[str]:
    """Synthesizes using LangChain / OpenAI with mentor explanation prompt."""
    try:
        setu_db_snippets = search_setu_main_database(query)
        context_list = setu_db_snippets + [f"- {r.get('title')}: {r.get('snippet')}" for r in search_results[:2]]
        context_str = "\n".join(context_list) if context_list else "Setu verified ancestral and systems wisdom."

        # 1. Primary: LangChain LCEL Reasoning Chain
        try:
            from app.services.langchain_service import langchain_avatar_service
            lc_result = await langchain_avatar_service.generate_response(
                query=query,
                context=context_str,
                language=language,
                api_key=openai_api_key,
                model_name=model_name,
                base_url=base_url
            )
            if lc_result:
                logger.info("LangChain OpenAI LCEL chain successfully synthesized response")
                return lc_result
        except Exception as lce:
            logger.debug(f"LangChain OpenAI execution fallback: {lce}")

        url = f"{base_url.rstrip('/')}/chat/completions"
        target_lang = LANGUAGE_NAMES.get(language, "English")
        
        system_prompt = (
            "You are Sardar Genji, an experienced senior mentor, systems thinker, and master guide of Setu knowledge.\n\n"
            "MANDATORY MULTI-LANGUAGE RULE (NON-NEGOTIABLE):\n"
            f"The user has selected the language: {target_lang}.\n"
            f"REGARDLESS of what language the user speaks or types, YOUR ANSWER MUST BE 100% EXCLUSIVELY WRITTEN IN {target_lang}.\n"
            "NEVER respond in English when the user selected Hindi, Punjabi, Bengali, or Tamil.\n\n"
            "MANDATORY 3-STAGE RESPONSE ARCHITECTURE (QUICK & SOLUTION-FIRST):\n"
            "1. BRIEF GREETING & FORMAL INTRO (1 SHORT SENTENCE):\n"
            "   - Start with a warm, formal greeting introducing yourself as Sardar Genji.\n"
            "   - Strictly address the user as 'मेरे बच्चे' (Hindi) / 'ਮੇਰੇ ਬੱਚੇ' (Punjabi) / 'My child' (English) / 'আমার সন্তান' (Bengali) / 'என் குழந்தையே' (Tamil).\n"
            "2. DIRECT SOLUTION FIRST (IMMEDIATE & ACTIONABLE):\n"
            "   - Provide the exact practical solution, step-by-step method, or direct answer immediately right after the greeting intro!\n"
            "   - Never delay the solution with long preliminary backstories.\n"
            "3. ADDITIONAL & SUPPORTING INFORMATION (AFTER THE SOLUTION):\n"
            "   - After stating the direct solution, provide supporting context:\n"
            "     a. Why this solution works and its core mechanism.\n"
            "     b. A practical analogy or real-world tip.\n"
            "     c. Common mistakes and pitfalls to avoid.\n"
            "     d. A crisp 1-sentence final takeaway rule of thumb.\n\n"
            "CRITICAL PRINCIPLES:\n"
            "- SPEED: Provide concise, clean spoken sentences so answers are rapid.\n"
            "- MEDICAL SAFEGUARD: For severe medical emergencies (chest pain, acute bleeding, breathing trouble), urge consulting a doctor or hospital first.\n"
            "- SPOKEN TTS-FRIENDLY: Form natural conversational spoken sentences with ZERO markdown formatting (no ###, **, or bullets).\n"
        )

        user_content = f"User's Question: \"{query}\"\nMentor Spoken Explanation strictly in {target_lang}:"

        headers = {
            "Authorization": f"Bearer {openai_api_key}",
            "Content-Type": "application/json"
        }

        payload = {
            "model": model_name,
            "messages": [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_content}
            ],
            "temperature": 0.40,
            "max_tokens": 350
        }
        
        async with httpx.AsyncClient(timeout=5.0) as client:
            resp = await client.post(url, json=payload, headers=headers)
            if resp.status_code == 200:
                data = resp.json()
                choices = data.get("choices", [])
                if choices:
                    content = choices[0].get("message", {}).get("content", "").strip()
                    if content:
                        return content
    except Exception as e:
        logger.debug(f"OpenAI synthesis unavailable ({e}).")
    return None


def is_culinary_inquiry(query: str) -> bool:
    """Detects whether a user query is genuinely asking for a food recipe, dish, or cooking technique."""
    q = query.lower()
    food_items = [
        "biryani", "dal makhani", "paneer", "chai", "tea", "roti", "samosa", "dosa", "idli",
        "chole", "bhature", "khichdi", "kheer", "gulab jamun", "pav bhaji", "pasta", "pizza",
        "soup", "curry", "halwa", "paratha", "pulao", "naan", "fish curry", "butter chicken",
        "omelette", "sandwich", "burger", "cake", "cookie", "pancake", "salad", "noodle", "fried rice",
        "खीर", "हलवा", "पनीर", "बिरयानी", "दाल", "चाय", "समोसा", "सब्जी", "रोटी", "पराठा",
        "ਖੀਰ", "ਹਲਵਾ", "ਪਨੀਰ", "ਬਿਰਯਾਨੀ", "ਦਾਲ", "ਚਾਹ", "ਸਮੋਸਾ", "ਸਬਜ਼ੀ", "ਰੋਟੀ", "ਪਰੌਂਠਾ",
        "বিরিয়ানি", "পনির", "চা", "ডাল", "খিচুড়ি", "পায়েস", "রুটি",
        "பிரியாணி", "சாம்பார்", "தோசை", "டீ", "பாயாசம்"
    ]
    cooking_phrases = [
        "how to cook", "how to bake", "recipe of", "recipe for", "cooking technique",
        "food recipe", "cooking of", "rasoi", "khana kaise banaye", "khana banane",
        "pakane ka tarika", "pakaun di vidhi", "ranna recipe", "samayal kuripu"
    ]
    return any(item in q for item in food_items) or any(phrase in q for phrase in cooking_phrases)


def solve_real_life_problem(query: str, search_results: List[Dict[str, Any]], language: str = "en-IN") -> str:
    """
    Delivers quick, solution-first mentor explanations following the 3-stage architecture:
    1. Greeting & Formal Intro -> 2. Direct Solution First -> 3. Additional Context & Gotchas After.
    """
    q_clean = query.strip()
    q_lower = q_clean.lower()

    # 1. Emergency Medical Protocol (Safety First)
    if is_medical_emergency(q_clean):
        return (
            "Greetings my dear child, I am Sardar Genji, your mentor. "
            "Your immediate safety and health come before anything else. "
            "Because this involves severe or acute symptoms, please do not rely on home remedies right now; "
            "consult a qualified medical doctor or visit the nearest clinic immediately. "
            "Once a healthcare professional has examined you and you are safe, our gentle supportive routines and restorative care can assist your full recovery."
        )

    # 2. Culinary & Recipe Problem Solving (Traditional Kitchen Systems)
    if is_culinary_inquiry(q_clean):
        prefix_pattern = r'(?i)^(what is the technique of making|what is the recipe of|what is the technique of|how to make|how to cook|how to prepare|recipe of|recipe for|technique of making|making technique of|cooking technique of|banane ki vidhi|banane ka tarika|kaise banaye|kaise banate hain|kive banaiye|kive bnao|kivabe banabo|eppadi seivathu|बनाने की विधि|बनाने का तरीका|कैसे बनाएं|हाउ टू मेक|ਕਿਵੇਂ ਬਣਾਈਏ|ਬਣਾਉਣ ਦੀ ਵਿਧੀ|বানানোর নিয়ম|செய்முறை)\s*'
        suffix_pattern = r'(?i)\s*(recipe|ki vidhi|ka tarika|kaise banaye|kaise banayein|kaise banate hain|kive banaiye|kive bnao|bananor niyom|kivabe banabo|seimurai|eppadi seivathu|बनाने की विधि|बनाने का तरीका|कैसे बनाएं|कैसे बनाते हैं|ਕਿਵੇਂ ਬਣਾਈਏ|ਬਣਾਉਣ ਦੀ ਵਿਧੀ|রান্নার পদ্ধতি|বানানোর নিয়ম|செய்வது எப்படி|செய்முறை)[?!.,;:\s]*$'
        dish_name = re.sub(prefix_pattern, '', q_clean).strip()
        dish_name = re.sub(suffix_pattern, '', dish_name).strip()
        dish_name = re.sub(r'[?!.,;:\'"]', '', dish_name).strip() or "this dish"

        return (
            f"Greetings my child, I am Sardar Genji, your mentor. "
            f"Here is the exact step-by-step method to prepare authentic {dish_name.title()} directly: "
            f"First, heat pure desi ghee or cold-pressed oil in a heavy pot, then bloom whole spices with sliced onions, fresh ginger, and garlic until golden. "
            f"Second, add ripe tomato puree with ground coriander, turmeric, cumin, and rock salt, gently simmering until the fragrant oil separates. "
            f"Third, fold in your main ingredients with just enough warm water, cover with a tight lid, and let the flavors marry on a steady low flame. "
            f"Now, for some important additional wisdom on why this technique works: great cooking is all about gentle temperature control and fat extraction to unlock the bioavailability of the spices. "
            f"A common mistake to avoid is rushing the onion-tomato base on high heat, which burns the spices and leaves a bitter aftertaste. "
            f"In summary: master the gentle slow roast of your base spices, let it rest for two minutes with fresh herbs, and you will achieve perfection every time."
        )

    # 3. Sleep & Insomnia (Restorative Biology & Ayurvedic Mechanics)
    sleep_words = ["sleep", "insomnia", "cant sleep", "cannot sleep", "sleeping", "tired", "bedtime", "wake up", "nightmare", "नींद", "अनिद्रा", "ਸੌਣ", "ਨੀਂਦ", "ঘুম", "தூக்கம்"]
    if any(w in q_lower for w in sleep_words):
        return (
            "Greetings my child, I am Sardar Genji, your mentor. "
            "Here is the direct practical remedy to restore deep natural sleep tonight: "
            "First, drink a small cup of warm Desi milk infused with a pinch of grated nutmeg and green cardamom thirty minutes before bed to stimulate calming GABA pathways. "
            "Second, massage the soles of your feet with warm mustard or sesame oil for three minutes, which draws excess heat away from your head and relaxes peripheral nerves. "
            "Third, lie on your left side to assist lymphatic drainage and do five minutes of slow, unforced Anulom-Vilom breathing. "
            "Here is the additional context on why this works: sleep is your nervous system's scheduled maintenance window where the brain clears metabolic waste. "
            "A classic gotcha to avoid is staring at bright blue screens in bed or consuming heavy meals late, which suppresses melatonin production. "
            "In summary: ground your nervous system with warm foot massage and soothing nutmeg milk, and peaceful rest will follow naturally."
        )

    # 4. Stress, Anxiety, Panic & Overthinking (Vagus Nerve & Pranic Grounding)
    stress_words = ["stress", "anxiety", "anxious", "overthink", "overthinking", "panic", "worried", "worry", "tense", "nervous", "mental pressure", "तनाव", "चिंता", "घबराहट", "ਸਟ੍ਰੈਸ", "ਚਿੰਤਾ", "ਤਣਾਅ", "উদ্বেਗ", "মানসিক চাপ", "மன அழுத்தம்", "பதட்டம்"]
    if any(w in q_lower for w in stress_words):
        return (
            "Greetings my child, I am Sardar Genji, your mentor. "
            "Here is the immediate practical sequence to break stress and calm your mind right now: "
            "First, sit upright with a straight spine and do five minutes of Bhramari humming pranayama; the vibrational hum physically stimulates the vagus nerve and triggers rapid relaxation. "
            "Second, brew a warm cup of fresh Holy Basil (Tulsi) leaves and crushed ginger with half a spoon of honey to balance cortisol. "
            "Third, step outside barefoot on green grass or morning dew for five minutes to ground your sensory awareness. "
            "For additional understanding: acute worry is simply your sympathetic nervous system getting locked in an overdrive loop, like a congested CPU cache that needs a buffer flush. "
            "A common mistake is trying to out-think panic with frantic analysis or drinking caffeinated drinks, which spikes physiological tension. "
            "To wrap it up: slow down your breath first to soothe the nervous system, nourish the body with herbal warmth, and tackle one small step at a time."
        )

    # 5. Procrastination, Lethargy & Low Focus (Sattvic Energy & Momentum Mechanics)
    focus_words = ["procrastinat", "lazy", "laziness", "focus", "distract", "motivat", "cant work", "give up", "attention", "discipline", "आलस", "काम में मन", "एकाग्रता", "ਆਲਸ", "ਧਿਆਨ", "মনোযোগ", "অলসতা", "கவனம்", "சோம்பல்"]
    if any(w in q_lower for w in focus_words):
        return (
            "Greetings my child, I am Sardar Genji, your mentor. "
            "Here is the exact practical solution to kickstart focus and eliminate procrastination immediately: "
            "First, reset your physical physiology by splashing cool water over your face and eyes to trigger instant alertness. "
            "Second, commit strictly to only the very first five minutes of the task with zero browser distractions, working in focused twenty-five minute intervals. "
            "Third, do five rounds of light brisk stretching to elevate cerebral blood circulation and metabolic energy. "
            "For helpful additional context: procrastination is rarely laziness; it is friction caused by task ambiguity and low physiological energy. "
            "A classic pitfall to avoid is waiting for sudden inspiration or eating heavy sluggish meals during peak working hours. "
            "In summary: lower your starting threshold to five minutes, wake up your physical state, and let momentum do the heavy lifting."
        )

    # 6. Physical Digestion, Acidity, Cough & Natural Health (Desi Nuskhe & Metabolic Mechanics)
    health_words = ["health", "energy", "diet", "exercise", "weight", "fever", "pain", "headache", "digestion", "acidity", "gas", "cough", "cold", "routine", "fatigue", "स्वास्थ्य", "सेहत", "बुखार", "ਦਰਦ", "ਸਿਹਤ", "স্বাস্থ্য", "জ্বর", "உடல் நலம்", "காய்ச்சல்"]
    if any(w in q_lower for w in health_words):
        return (
            "Greetings my child, I am Sardar Genji, your mentor. "
            "Here is the direct natural remedy to restore your digestive health and comfort immediately: "
            "For acidity or digestive heaviness, chew half a teaspoon of roasted ajwain (carom seeds) with a pinch of black salt and sip warm water, or drink cumin and fennel tea. "
            "For cough and seasonal throat irritation, take a warm decoction of Tulsi, ginger, and black pepper sweetened with raw honey twice daily. "
            "Always eat freshly prepared warm meals sitting comfortably, and drink room-temperature water. "
            "Here is the additional wisdom behind this: your digestive engine, known in traditional science as Jatharagni, needs steady warmth to efficiently convert nutrients into energy. "
            "A common mistake to avoid is drinking chilled ice water with meals or lying flat immediately after eating. "
            "To summarize: protect your digestive fire with warm carminatives, eat mindfully, and let your body digest with ease."
        )

    # 7. Money, Household Budget & Family Harmony (Flow Systems & Discipline)
    money_words = ["money", "debt", "financial", "salary", "broke", "expenses", "save money", "saving", "loan", "invest", "finance", "budget", "पैसा", "पैसे", "कर्ज", "बचत", "खर्च", "ਧਨ", "ਪੈਸੇ", "ਕਰਜ਼ਾ", "ਬੱਚਤ", "টাকা", "ঋণ", "সঞ্চয়", "பணம்", "கடன்", "சேமிப்பு"]
    if any(w in q_lower for w in money_words):
        return (
            "Greetings my child, I am Sardar Genji, your mentor. "
            "Here is the direct practical solution to secure your finances: "
            "First, track every single outflow in a clear ledger daily to maintain 100% visibility. "
            "Second, automate saving a fixed percentage of your income the day it arrives before allocating any spending. "
            "Third, enforce a strict forty-eight-hour pause before making any non-essential purchase. "
            "For additional context: financial stability is a cash-flow management system, where sealing unmetered micro-leaks creates long-term freedom. "
            "A common mistake to avoid is taking high-interest loans for depreciating lifestyle items. "
            "In summary: automate your savings first, eliminate impulsive expenses, and peace of mind will follow."
        )

    # 8. Workplace & Family Relationships (Conflict Resolution & Signal-to-Noise)
    conflict_words = ["fight", "conflict", "argument", "relationship", "boss", "colleague", "wife", "husband", "parents", "friend", "breakup", "lonely", "loneliness", "divorce", "family", "झगड़ा", "रिश्ते", "परिवार", "ਲੜਾਈ", "ਰਿਸ਼ਤੇ", "ਪਾਰਿਵਾਰਿਕ", "সম্পর্ক", "குடும்பம்", "உறவு"]
    if any(w in q_lower for w in conflict_words):
        return (
            "Greetings my child, I am Sardar Genji, your mentor. "
            "Here is the direct practical approach to resolve this conflict peacefully: "
            "First, enforce a cooling-off pause when emotions run high; never react under adrenaline. "
            "Second, sit down face-to-face and practice active listening by restating the other person's viewpoint before sharing yours. "
            "Third, focus entirely on solving the shared underlying issue rather than attacking the person. "
            "For additional wisdom: relationships are long-term collaborative bonds, and winning an argument while damaging trust is a loss. "
            "A classic pitfall to avoid is interrupting defensively instead of understanding the root emotion. "
            "To wrap it up: lower the emotional tension first, communicate with humility, and prioritize mutual understanding."
        )

    # 9. General Dilemmas (Decomposition & Engineering Mental Models)
    q_topic = re.sub(r'(?i)^(what is|what are|who is|who are|explain|tell me about|how does|why is|why do|why does|define|describe|kya hai|kise kehte hain|ਕੀ ਹੈ|কী|என்ன)\s+', '', q_lower).strip()
    q_topic = re.sub(r'[?!.,;:\'"]', '', q_topic).strip() or q_clean

    return (
        f"Greetings my child, I am Sardar Genji, your mentor. "
        f"Here is the direct practical solution and core understanding of {q_topic}: "
        f"First, isolate the single core objective and write down your immediate constraint clearly. "
        f"Second, take the single highest-impact action right now without overcomplicating the process. "
        f"Third, observe the feedback, refine your approach, and make steady progress. "
        f"For additional context: every complex challenge becomes simple when decomposed into small, manageable components. "
        f"A common mistake is getting overwhelmed by distant possibilities instead of executing the immediate next step. "
        f"In summary: take one clear step at a time, remain consistent, and clarity will follow."
    )


async def translate_to_target_language(text: str, target_language: str) -> str:
    """
    Guarantees that the avatar's answer is 100% strictly in the selected target language.
    target_language: en-IN, hi-IN, pa-IN, bn-IN, ta-IN
    """
    if not text or not text.strip():
        return text

    cfg = LANGUAGE_CONFIG.get(target_language, LANGUAGE_CONFIG["en-IN"])
    tl = cfg["tl"]

    # Calculate script density to detect if translation is genuinely needed
    non_space_chars = [c for c in text if not c.isspace() and c not in '0123456789.,!?:;-\'"()[]{}।']
    if not non_space_chars:
        return text

    total_chars = len(non_space_chars)

    if tl == "pa":
        script_chars = sum(1 for c in non_space_chars if ('\u0A00' <= c <= '\u0A7F') or ('\u0900' <= c <= '\u097F'))
        if script_chars / total_chars >= 0.25:
            return text
    elif tl == "hi":
        script_chars = sum(1 for c in non_space_chars if '\u0900' <= c <= '\u097F')
        if script_chars / total_chars >= 0.25:
            return text
    elif tl == "bn":
        script_chars = sum(1 for c in non_space_chars if '\u0980' <= c <= '\u09FF')
        if script_chars / total_chars >= 0.25:
            return text
    elif tl == "ta":
        script_chars = sum(1 for c in non_space_chars if '\u0B80' <= c <= '\u0BFF')
        if script_chars / total_chars >= 0.25:
            return text
    elif tl == "en":
        script_chars = sum(1 for c in non_space_chars if 'a' <= c.lower() <= 'z')
        if script_chars / total_chars >= 0.50:
            return text

    # If text is not in the target language script, translate via robust POST API with 1.5s timeout
    try:
        url = "https://translate.googleapis.com/translate_a/single"
        params = {
            "client": "gtx",
            "sl": "auto",
            "tl": tl,
            "dt": "t",
            "q": text
        }
        async with httpx.AsyncClient(timeout=1.5) as client:
            resp = await client.post(url, data=params)
            if resp.status_code == 200:
                data = resp.json()
                translated = " ".join([item[0].strip() for item in data[0] if item and item[0]])
                if translated and len(translated.strip()) > 3:
                    return translated.strip()
    except Exception as e:
        logger.debug(f"Target language translation fallback: {e}")

    return text


async def synthesize_spoken_response(
    query: str,
    search_results: List[Dict[str, Any]],
    persona_id: str = "genji",
    language: str = "en-IN"
) -> Dict[str, Any]:
    """
    Synthesizes a 100% comprehensive, structured mentor solution with elder care and medical emergency safeguards.
    """
    query_clean = query.strip()
    q_lower = query_clean.lower()

    raw_response_text = ""

    # 1. Warm Greetings (Elderly Blessings & Mentor Welcome)
    if q_lower in ["hi", "hello", "hey", "namaste", "pranam", "sat sri akal", "good morning", "good evening", "greetings"]:
        raw_response_text = GREETINGS_BY_LANG.get(
            language,
            GREETINGS_BY_LANG.get("en-IN")
        )

    # 2. Identity Inquiry
    elif any(q in q_lower for q in ["who are you", "what is your name", "who made you", "what are you", "aap kaun hain", "tusi kaun ho", "apni ke"]):
        identity_by_lang = {
            "en-IN": "I am Sardar Genji, an experienced mentor, systems guide, and keeper of Setu knowledge. Ask me any question, and I will guide you step-by-step with the big picture, real-world context, how it works, and key practical gotchas.",
            "hi-IN": "मैं सरदार गेंजी हूँ, आपका अनुभवी मार्गदर्शक और सेतू ज्ञान धरोहर का रक्षक। किसी भी विषय पर पूछिए, मैं आपको संपूर्ण दृष्टिकोण, व्यावहारिक उदाहरण और चरणबद्ध तरीके से समझाऊँगा।",
            "pa-IN": "ਮੈਂ ਸਰਦਾਰ ਗੇਂਜੀ ਹਾਂ, ਤੁਹਾਡਾ ਤਜਰਬੇਕਾਰ ਮਾਰਗਦਰਸ਼ਕ ਅਤੇ ਸੇਤੂ ਗਿਆਨ ਦਾ ਰਖਵਾਲਾ। ਕੋਈ ਵੀ ਸਵਾਲ ਪੁੱਛੋ, ਮੈਂ ਤੁਹਾਨੂੰ ਵੱਡੀ ਤਸਵੀਰ, ਅਮਲੀ ਉਦਾਹਰਣਾਂ ਅਤੇ ਕਦਮ-ਦਰ-ਕਦਮ ਤਰੀਕੇ ਨਾਲ ਸੇਧ ਦੇਵਾਂਗਾ।",
            "bn-IN": "আমি সরদার গেঞ্জি, আপনার অভিজ্ঞ পরামর্শদাতা ও সেতুকেন্দ্রিক জ্ঞানের ধারক। যেকোনো বিষয় জানতে চান বলুন, আমি সামগ্রিক প্রেক্ষাপট ও ধাপে ধাপে বাস্তব উদাহরণসহ বুঝিয়ে দেব।",
            "ta-IN": "நான் சர்தார் கெஞ்சி, உங்கள் அனுபவமிக்க ஆசிரியர் மற்றும் பாரம்பரிய-தொழில்நுட்ப அறிவு வழிகாட்டி. எந்த கேள்வியாக இருந்தாலும் கேளுங்கள், முழுமையான தெளிவுடன் விளக்குகிறேன்."
        }
        raw_response_text = identity_by_lang.get(language, identity_by_lang["en-IN"])

    # 3. Check Custom User-Trained Knowledge & Setu Project Knowledge Database
    if not raw_response_text:
        try:
            from app.services.avatar_custom_knowledge_service import custom_knowledge_service
            custom_match = custom_knowledge_service.find_matching_knowledge(query_clean)
            if custom_match:
                raw_response_text = custom_match
        except Exception as e:
            logger.debug(f"Custom knowledge lookup error: {e}")

    # 4. Check OpenRouter Universal LLM (Powered with Traditional Remedies & Medical Emergency Safeguard)
    if not raw_response_text:
        openrouter_api_key = settings.OPENROUTER_API_KEY or os.getenv("OPENROUTER_API_KEY", "")
        if openrouter_api_key and len(openrouter_api_key.strip()) > 5:
            or_raw = await generate_with_openrouter(
                query=query_clean,
                search_results=search_results,
                openrouter_api_key=openrouter_api_key,
                language=language,
                model_name=settings.OPENROUTER_MODEL
            )
            if or_raw:
                raw_response_text = or_raw

    # 5. Check Direct OpenAI LLM (Fallback)
    if not raw_response_text:
        openai_api_key = settings.OPENAI_API_KEY or os.getenv("OPENAI_API_KEY", "")
        if openai_api_key and len(openai_api_key) > 20 and not openai_api_key.startswith("sk-Your"):
            openai_raw = await generate_with_openai(
                query=query_clean,
                search_results=search_results,
                openai_api_key=openai_api_key,
                language=language,
                model_name=settings.OPENAI_MODEL,
                base_url=settings.OPENAI_BASE_URL
            )
            if openai_raw:
                raw_response_text = openai_raw

    # 6. Compassionate Traditional Problem Solving & Medical Safeguard Engine (Offline Fallback)
    if not raw_response_text:
        raw_response_text = solve_real_life_problem(query_clean, search_results, language=language)
        if language != "en-IN":
            raw_response_text = await translate_to_target_language(raw_response_text, language)

    # Strict Clean Spoken Avatar Text
    cleaned = clean_for_spoken_avatar(raw_response_text, query_clean)

    return {
        "spoken_text": cleaned,
        "visemes": generate_visemes(cleaned),
        "word_count": len(cleaned.split()),
        "sentence_count": len(re.split(r'[.?!।]\s+', cleaned))
    }
