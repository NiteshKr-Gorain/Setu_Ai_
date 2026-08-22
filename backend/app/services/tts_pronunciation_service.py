import re
import logging
from typing import Dict, Any, Optional, Tuple

logger = logging.getLogger("tts_pronunciation")

# =====================================================================
# EDITABLE PRONUNCIATION DICTIONARY
# Maps written terms (names, places, traditional terms, heritage methods)
# to their phonetic spoken equivalents for natural TTS delivery.
# Keep this separate from display text!
# =====================================================================
PRONUNCIATION_DICTIONARY: Dict[str, Dict[str, str]] = {
    # 1. Avatar & Brand Identities
    "setu": {
        "en": "Say-too",
        "default": "Setu"
    },
    "setu avatar": {
        "en": "Say-too Avatar",
        "default": "Setu Avatar"
    },
    "jnanasetu": {
        "en": "Gyaan Say-too",
        "hi": "ज्ञान सेतु",
        "default": "Gyaan Setu"
    },
    "vidyadhar": {
        "en": "Vid-yaa-dhar",
        "default": "Vidyadhar"
    },
    "genji": {
        "en": "Gen-jee",
        "default": "Genji"
    },
    "kaizen": {
        "en": "Kye-zen",
        "default": "Kaizen"
    },
    "bodhi": {
        "en": "Boh-dhee",
        "default": "Bodhi"
    },

    # 2. Traditional Agricultural & Water Conservation Practices
    "neemastra": {
        "en": "Neem-aastra",
        "hi": "नीमास्त्र",
        "default": "Neem-aastra"
    },
    "jeevamrutha": {
        "en": "Jeev-aamrit",
        "hi": "जीवामृत",
        "default": "Jeevamrith"
    },
    "beejamrutha": {
        "en": "Beej-aamrit",
        "hi": "बीजामृत",
        "default": "Beejamrith"
    },
    "panchagavya": {
        "en": "Panch-gavya",
        "hi": "पंचगव्य",
        "default": "Panchagavya"
    },
    "brahmastra": {
        "en": "Brah-maastra",
        "default": "Brahmastra"
    },
    "agniastra": {
        "en": "Agni-aastra",
        "default": "Agniastra"
    },
    "bori bandh": {
        "en": "Bori Baandh",
        "hi": "बोरी बांध",
        "default": "Bori Bandh"
    },
    "johad": {
        "en": "Joh-had",
        "hi": "जोहड़",
        "default": "Johad"
    },
    "khadin": {
        "en": "Kha-deen",
        "default": "Khadin"
    },
    "baoli": {
        "en": "Baav-lee",
        "default": "Baoli"
    },
    "baolis": {
        "en": "Baav-lees",
        "default": "Baolis"
    },
    "kothi": {
        "en": "Koh-thee",
        "default": "Kothi"
    },

    # 3. Ayurvedic Health, Traditional Food & Remedies
    "ragi ambali": {
        "en": "Raagi Aam-ba-lee",
        "default": "Raagi Ambali"
    },
    "ambali": {
        "en": "Aam-ba-lee",
        "default": "Ambali"
    },
    "ragi": {
        "en": "Raagi",
        "default": "Ragi"
    },
    "kashayam": {
        "en": "Kash-aayam",
        "default": "Kashayam"
    },
    "pippali": {
        "en": "Pip-pa-lee",
        "default": "Pippali"
    },
    "tulsi": {
        "en": "Tool-see",
        "default": "Tulsi"
    },
    "triphala": {
        "en": "Tri-pha-laa",
        "default": "Triphala"
    },
    "harda": {
        "en": "Har-daa",
        "default": "Harda"
    },
    "ayurveda": {
        "en": "Aayur-veda",
        "default": "Ayurveda"
    },
    "ayurvedic": {
        "en": "Aayur-vedic",
        "default": "Ayurvedic"
    },
    "vaidya": {
        "en": "Vye-dya",
        "default": "Vaidya"
    },
    "pranayama": {
        "en": "Praa-naa-yaa-maa",
        "default": "Pranayama"
    },
    "anulom vilom": {
        "en": "Anu-lom Vi-lom",
        "default": "Anulom Vilom"
    },
    "ashwagandha": {
        "en": "Ash-wa-gaan-dha",
        "default": "Ashwagandha"
    },
    "brahmi": {
        "en": "Brah-mee",
        "default": "Brahmi"
    },
    "amla": {
        "en": "Aam-laa",
        "default": "Amla"
    },
    "haldi": {
        "en": "Hul-dee",
        "default": "Haldi"
    },
    "kadha": {
        "en": "Kaa-dhaa",
        "default": "Kadha"
    },
    "sardar genji": {
        "en": "Sar-daar Gen-jee",
        "hi": "सरदार गेंजी",
        "pa": "ਸਰਦਾਰ ਗੇਂਜੀ",
        "bn": "সরদার গেঞ্জি",
        "ta": "சர்தார் கெஞ்சி",
        "default": "Sardar Genji"
    },
    "sardar": {
        "en": "Sar-daar",
        "default": "Sardar"
    },
    "biryani": {
        "en": "Bir-yaa-nee",
        "default": "Biryani"
    },
    "dosha": {
        "en": "Doh-shaa",
        "default": "Dosha"
    },
    "gaba": {
        "en": "Gaa-baa",
        "default": "GABA"
    },

    # 4. Indian Geography, States & Cultural Regions
    "punjab": {
        "en": "Punyaab",
        "pa": "ਪੰਜਾਬ",
        "default": "Punjab"
    },
    "ludhiana": {
        "en": "Lood-hee-aanaa",
        "default": "Ludhiana"
    },
    "amritsar": {
        "en": "Am-rit-sar",
        "default": "Amritsar"
    },
    "haryana": {
        "en": "Har-ee-aanaa",
        "default": "Haryana"
    },
    "maharashtra": {
        "en": "Mahaa-raashtra",
        "default": "Maharashtra"
    },
    "amravati": {
        "en": "Am-raa-va-tee",
        "default": "Amravati"
    },
    "dharwad": {
        "en": "Dhaar-waad",
        "default": "Dharwad"
    },
    "mysuru": {
        "en": "My-soo-roo",
        "default": "Mysuru"
    },
    "uttarakhand": {
        "en": "Oot-taraa-khand",
        "default": "Uttarakhand"
    },
    "wayanad": {
        "en": "Vye-aa-naad",
        "default": "Wayanad"
    },
    "rajasthan": {
        "en": "Raajas-thaan",
        "default": "Rajasthan"
    },
    "gujarat": {
        "en": "Goo-jraat",
        "default": "Gujarat"
    },
    "bagru": {
        "en": "Baag-roo",
        "default": "Bagru"
    },
    "marwari": {
        "en": "Maar-waa-ree",
        "default": "Marwari"
    },
    "chanderi": {
        "en": "Chan-deh-ree",
        "default": "Chanderi"
    },
    "bharat": {
        "en": "Bhaa-rat",
        "hi": "भारत",
        "default": "Bharat"
    },
    "desi": {
        "en": "Day-see",
        "default": "Desi"
    },
    "ghee": {
        "en": "Ghee",
        "default": "Ghee"
    },
    "jaggery": {
        "en": "Jag-ree",
        "default": "Jaggery"
    }
}

# =====================================================================
# ACRONYMS & TECHNICAL ABBREVIATIONS
# Ensures letters are pronounced cleanly (e.g. A-P-I, L-L-M)
# =====================================================================
ACRONYMS_MAP: Dict[str, str] = {
    "AI": "A-I",
    "API": "A-P-I",
    "RAG": "Rag",
    "LLM": "L-L-M",
    "TTS": "T-T-S",
    "STT": "S-T-T",
    "CSE": "C-S-E",
    "GPS": "G-P-S",
    "IOT": "Eye-Oh-Tee",
    "IoT": "Eye-Oh-Tee",
    "UI": "U-I",
    "UX": "U-X",
    "FPS": "F-P-S",
    "URL": "U-R-L",
    "HTML": "H-T-M-L",
    "HTTP": "H-T-T-P",
    "PDF": "P-D-F",
    "SMS": "S-M-S"
}

# Common abbreviations
ABBREVIATIONS_MAP: Dict[str, str] = {
    r"\bapprox\.?\b": "approximately",
    r"\bvs\.?\b": "versus",
    r"\be\.g\.?,?\b": "for example",
    r"\bi\.e\.?,?\b": "that is",
    r"\betc\.?\b": "etcetera",
    r"\bdr\.?\b": "Doctor",
    r"\bshri\b": "Shree",
    r"\bsmt\.?\b": "Shreemati"
}


class TTSPronunciationService:
    """
    Pronunciation-processing layer before TTS.
    Converts raw text into clear, natural phonetic TTS text without altering the display text.
    """

    def __init__(self, debug: bool = True):
        self.debug = debug
        # Pre-compile regex for dictionary terms (sorted longest first to avoid partial overrides)
        sorted_terms = sorted(PRONUNCIATION_DICTIONARY.keys(), key=lambda k: len(k), reverse=True)
        self.dict_patterns = [
            (term, re.compile(rf'\b{re.escape(term)}\b', re.IGNORECASE))
            for term in sorted_terms
        ]

    def process_for_tts(
        self,
        text: str,
        language: str = "en-IN",
        voice_gender: str = "male"
    ) -> Dict[str, Any]:
        """
        Transforms pristine display text into phonetically tuned TTS text and optional SSML.
        Returns:
            {
                "original_text": str,
                "tts_text": str,
                "ssml_text": str,
                "language": str,
                "rules_applied": list
            }
        """
        if not text:
            return {
                "original_text": "",
                "tts_text": "",
                "ssml_text": "<speak></speak>",
                "language": language,
                "rules_applied": []
            }

        original_text = text.strip()
        tts_text = original_text
        rules_applied = []
        lang_prefix = language.split("-")[0].lower() if language else "en"

        # 1. Step: Acronym Normalization (preserve casing boundary)
        for acronym, spoken in ACRONYMS_MAP.items():
            pattern = rf'\b{re.escape(acronym)}\b'
            if re.search(pattern, tts_text):
                tts_text = re.sub(pattern, spoken, tts_text)
                rules_applied.append(f"Acronym: {acronym} -> {spoken}")

        # 2. Step: Abbreviations Normalization
        for abbr_pattern, expansion in ABBREVIATIONS_MAP.items():
            if re.search(abbr_pattern, tts_text, re.IGNORECASE):
                tts_text = re.sub(abbr_pattern, expansion, tts_text, flags=re.IGNORECASE)
                rules_applied.append(f"Abbreviation: {abbr_pattern} -> {expansion}")

        # 3. Step: Numbers, Currency, Measurements & Units Normalization
        tts_text, num_rules = self._normalize_numbers_and_units(tts_text, lang_prefix)
        rules_applied.extend(num_rules)

        # 4. Step: Indian Traditional, Cultural, and Place Names Dictionary
        for term, pattern in self.dict_patterns:
            if pattern.search(tts_text):
                entry = PRONUNCIATION_DICTIONARY[term]
                # Pick language-specific phonetic if available, else English or default
                replacement = entry.get(lang_prefix) or entry.get("en") or entry.get("default")
                if replacement:
                    tts_text = pattern.sub(replacement, tts_text)
                    rules_applied.append(f"Dictionary: {term} -> {replacement}")

        # 5. Step: Multilingual & Mixed-Script Script Bridging
        # If English voice reads mixed Devanagari (e.g. "and भारत"), transliterate for English voice
        if lang_prefix.startswith("en") and re.search(r'[\u0900-\u097F]', tts_text):
            tts_text = self._bridge_mixed_devanagari(tts_text)
            rules_applied.append("Mixed-Script: Devanagari bridged to Latin phonetic")

        # 6. Step: Clean up excess whitespace & punctuation for speech flow
        tts_text = re.sub(r'\s+', ' ', tts_text).strip()

        # 7. Step: Generate SSML if needed
        ssml_text = self._generate_ssml(tts_text, language=language, voice_gender=voice_gender)

        debug_info = {
            "original_text": original_text,
            "tts_text": tts_text,
            "language": language,
            "voice_gender": voice_gender,
            "rules_applied_count": len(rules_applied),
            "rules_applied": rules_applied
        }

        if self.debug and rules_applied:
            logger.info(f"[TTS DEBUG] Original: \"{original_text[:60]}...\" | TTS: \"{tts_text[:60]}...\" | Rules: {len(rules_applied)}")

        return {
            "original_text": original_text,
            "tts_text": tts_text,
            "ssml_text": ssml_text,
            "language": language,
            "debug": debug_info
        }

    def _normalize_numbers_and_units(self, text: str, lang_prefix: str) -> Tuple[str, list]:
        """Converts currency (₹, Rs), measurements (km, kg, L), percentages, and dates into spoken words."""
        rules = []
        result = text

        # Indian Rupee Symbols: ₹50,000 or ₹ 50000 or Rs. 500
        rupee_pattern = re.compile(r'₹\s*([0-9]+(?:,[0-9]+)*(?:\.[0-9]+)?)')
        def replace_rupee(m):
            val = m.group(1).replace(",", "")
            return f"{self._spoken_number(val)} rupees"
        if rupee_pattern.search(result):
            result = rupee_pattern.sub(replace_rupee, result)
            rules.append("Currency: ₹ -> rupees")

        rs_pattern = re.compile(r'\b(?:Rs\.?|INR)\s*([0-9]+(?:,[0-9]+)*(?:\.[0-9]+)?)', re.IGNORECASE)
        if rs_pattern.search(result):
            result = rs_pattern.sub(replace_rupee, result)
            rules.append("Currency: Rs -> rupees")

        dollar_pattern = re.compile(r'\$\s*([0-9]+(?:,[0-9]+)*(?:\.[0-9]+)?)')
        def replace_dollar(m):
            val = m.group(1).replace(",", "")
            return f"{self._spoken_number(val)} dollars"
        if dollar_pattern.search(result):
            result = dollar_pattern.sub(replace_dollar, result)
            rules.append("Currency: $ -> dollars")

        # Percentages: 95% -> 95 percent
        pct_pattern = re.compile(r'([0-9]+(?:\.[0-9]+)?)\s*%')
        if pct_pattern.search(result):
            result = pct_pattern.sub(r'\1 percent', result)
            rules.append("Unit: % -> percent")

        # Measurements: 5 km, 10 kg, 200 L, 200 liters, 50 ha
        unit_map = [
            (re.compile(r'(\b[0-9]+(?:\.[0-9]+)?)\s*km\b', re.IGNORECASE), r'\1 kilometers'),
            (re.compile(r'(\b[0-9]+(?:\.[0-9]+)?)\s*kg\b', re.IGNORECASE), r'\1 kilograms'),
            (re.compile(r'(\b[0-9]+(?:\.[0-9]+)?)\s*(?:L|litres|liter)\b', re.IGNORECASE), r'\1 liters'),
            (re.compile(r'(\b[0-9]+(?:\.[0-9]+)?)\s*ha\b', re.IGNORECASE), r'\1 hectares'),
            (re.compile(r'(\b[0-9]+(?:\.[0-9]+)?)\s*hr(?:s)?\b', re.IGNORECASE), r'\1 hours'),
            (re.compile(r'(\b[0-9]+(?:\.[0-9]+)?)\s*min(?:s)?\b', re.IGNORECASE), r'\1 minutes')
        ]
        for pattern, repl in unit_map:
            if pattern.search(result):
                result = pattern.sub(repl, result)
                rules.append(f"Unit measurement normalized: {repl}")

        # Comma-separated numbers: 10,000 -> 10 thousand or 10000
        comma_num = re.compile(r'\b([0-9]{1,3}),([0-9]{3})\b')
        if comma_num.search(result):
            result = comma_num.sub(r'\1 thousand \2' if r'\2' != '000' else r'\1 thousand', result)
            result = result.replace("thousand 000", "thousand")
            rules.append("Number: Comma format expanded")

        return result, rules

    def _spoken_number(self, num_str: str) -> str:
        """Converts number string to spoken Indian/Western representation."""
        try:
            val = int(float(num_str))
            if val >= 10000000:
                crores = val // 10000000
                rem = val % 10000000
                return f"{crores} crore {self._spoken_number(str(rem)) if rem else ''}".strip()
            elif val >= 100000:
                lakhs = val // 100000
                rem = val % 100000
                return f"{lakhs} lakh {self._spoken_number(str(rem)) if rem else ''}".strip()
            elif val >= 1000:
                thousands = val // 1000
                rem = val % 1000
                return f"{thousands} thousand {self._spoken_number(str(rem)) if rem else ''}".strip()
            return str(val)
        except Exception:
            return num_str

    def _bridge_mixed_devanagari(self, text: str) -> str:
        """Transliterates common Devanagari words appearing in English sentences for English TTS engines."""
        dev_map = {
            "भारत": "Bharat",
            "सेतु": "Say-too",
            "नमस्ते": "Namaste",
            "प्रणाम": "Pranam",
            "ज्ञान": "Gyaan",
            "किसान": "Kisaan",
            "कृषि": "Krishi"
        }
        res = text
        for dev, lat in dev_map.items():
            res = res.replace(dev, lat)
        return res

    def _generate_ssml(self, text: str, language: str = "en-IN", voice_gender: str = "male") -> str:
        """Generates standard W3C compliant SSML with natural speaking rate and pauses."""
        # Escape XML special characters
        escaped = (
            text.replace("&", "&amp;")
                .replace("<", "&lt;")
                .replace(">", "&gt;")
                .replace('"', "&quot;")
                .replace("'", "&apos;")
        )
        
        # Add subtle pause after periods
        ssml_body = re.sub(r'(\.|\?|\!)\s+', r'\1 <break time="220ms"/> ', escaped)
        
        return f'<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xml:lang="{language}"><prosody rate="0.95" pitch="-3%">{ssml_body}</prosody></speak>'

    def add_custom_word(self, term: str, spoken_phonetic: str, lang: str = "en"):
        """Programmatically add or update a pronunciation entry in the dictionary."""
        term_lower = term.strip().lower()
        if term_lower not in PRONUNCIATION_DICTIONARY:
            PRONUNCIATION_DICTIONARY[term_lower] = {}
        PRONUNCIATION_DICTIONARY[term_lower][lang] = spoken_phonetic.strip()
        # Recompile regex list
        sorted_terms = sorted(PRONUNCIATION_DICTIONARY.keys(), key=lambda k: len(k), reverse=True)
        self.dict_patterns = [
            (t, re.compile(rf'\b{re.escape(t)}\b', re.IGNORECASE))
            for t in sorted_terms
        ]
        logger.info(f"Added custom pronunciation rule: '{term}' -> '{spoken_phonetic}' ({lang})")


# Global singleton instance
tts_pronunciation_service = TTSPronunciationService(debug=True)
