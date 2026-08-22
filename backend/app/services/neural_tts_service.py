import re
import base64
import logging
import asyncio
from typing import Optional

try:
    import edge_tts
    HAS_EDGE_TTS = True
except ImportError:
    edge_tts = None
    HAS_EDGE_TTS = False

logger = logging.getLogger("neural_tts")

# Primary High-Quality Microsoft Neural Voices (Warm, wise elder persona matching Sardar Genji)
NEURAL_VOICES = {
    "en-IN": "en-IN-PrabhatNeural",
    "en-US": "en-IN-PrabhatNeural",
    "hi-IN": "hi-IN-MadhurNeural",
    "pa-IN": "hi-IN-MadhurNeural",
    "bn-IN": "bn-IN-BashkarNeural",
    "ta-IN": "ta-IN-ValluvarNeural"
}

# Secondary High-Quality Microsoft Neural Voices for Same-Language Failover (Zero Cross-Language Mixing)
SECONDARY_NEURAL_VOICES = {
    "en-IN": "en-IN-NeerjaNeural",
    "en-US": "en-IN-NeerjaNeural",
    "hi-IN": "hi-IN-SwaraNeural",
    "pa-IN": "hi-IN-SwaraNeural",
    "bn-IN": "bn-IN-TanishaaNeural",
    "ta-IN": "ta-IN-PallaviNeural"
}

def gurmukhi_to_devanagari_tts(text: str) -> str:
    """
    Expert-level phonetic transliteration from Gurmukhi (Punjabi) to Devanagari codepoints
    for pristine pronunciation using Microsoft Indian Neural Voices (hi-IN-MadhurNeural).
    Accurately handles:
    - Addak (ੱ) consonant doubling (e.g. ਬੱਚੇ -> बच्चे, ਸੱਚ -> सच्च)
    - Tippi (ੰ) and Bindi (ਂ) nasalization -> Anusvara (ं)
    - Nukta consonants (ੜ->ड़, ਸ਼->श, ਖ਼->ख़, ਗ਼->ग़, ਜ਼->ज़, ਫ਼->ਫ਼, ਲ਼->ळ)
    - Punctuation and sacred symbols (ੴ -> ਇੱਕ ਓਅੰਕਾਰ)
    """
    if not text:
        return text

    t = text.replace("ੴ", "ਇੱਕ ਓਅੰਕਾਰ")
    
    # 1. Gurmukhi Addak (ੱ 0x0A71) consonant doubling handler
    def double_consonant(match):
        c = match.group(1)
        return f"{c}\u0A4D{c}"
    t = re.sub(r'\u0A71([\u0A15-\u0A39\u0A59-\u0A5E])', double_consonant, t)

    # 2. Gurmukhi Tippi (ੰ 0x0A70) & Bindi (ਂ 0x0A02) -> Devanagari Anusvara (ं 0x0902)
    t = t.replace('\u0A70', '\u0902').replace('\u0A02', '\u0902')

    # 3. Gurmukhi Nukta characters mapping
    nukta_map = {
        '\u0A5C': 'ड़', # ੜ -> ड़
        '\u0A36': 'श', # ਸ਼ -> श
        '\u0A59': 'ख़', # ਖ਼ -> ख़
        '\u0A5A': 'ग़', # ਗ਼ -> ग़
        '\u0A5B': 'ਜ਼', # ਜ਼ -> ज़
        '\u0A5E': 'ਫ਼', # ਫ਼ -> फ़
        '\u0A33': 'ळ', # ਲ਼ -> ळ
    }
    for g_char, d_char in nukta_map.items():
        t = t.replace(g_char, d_char)

    # 4. Standard Unicode offset mapping for remaining Gurmukhi characters
    res = []
    for c in t:
        code = ord(c)
        if 0x0A00 <= code <= 0x0A7F:
            res.append(chr(code - 0x0100))
        else:
            res.append(c)
    devanagari_text = ''.join(res)

    # 5. Clean up any orphaned characters
    devanagari_text = re.sub(r'[\u0970\u0971]', '', devanagari_text)
    return devanagari_text


class NeuralTTSService:
    """
    Studio-Grade Microsoft Neural Text-To-Speech Engine.
    Provides ultra-realistic, warm, gentle, and crystal-clear human speech for Setu Avatar.
    """

    async def generate_speech_base64(
        self,
        text: str,
        language: str = "en-IN",
        rate: str = "+0%",
        pitch: str = "+0Hz"
    ) -> Optional[str]:
        if not text or not text.strip():
            return None

        if not HAS_EDGE_TTS:
            logger.info("edge_tts not installed; frontend will use client-side SpeechSynthesis fallback.")
            return None

        clean_text = text.strip()
        voice = NEURAL_VOICES.get(language, "en-IN-PrabhatNeural")

        # Prepare phonetic text for Indian voice synthesis
        tts_input_text = clean_text
        if language == "pa-IN":
            tts_input_text = gurmukhi_to_devanagari_tts(clean_text)

        async def _generate():
            communicate = edge_tts.Communicate(tts_input_text, voice, rate=rate, pitch=pitch)
            audio_bytes = b""
            async for chunk in communicate.stream():
                if chunk["type"] == "audio":
                    audio_bytes += chunk["data"]
            if audio_bytes:
                return base64.b64encode(audio_bytes).decode("utf-8")
            return None

        try:
            return await asyncio.wait_for(_generate(), timeout=4.5)
        except Exception as e:
            logger.warning(f"Neural TTS generation warning ({e}) for voice {voice}")
            # Try same-language secondary native voice failover (NEVER switch language)
            secondary_voice = SECONDARY_NEURAL_VOICES.get(language, voice)
            if secondary_voice and secondary_voice != voice:
                try:
                    fallback_comm = edge_tts.Communicate(tts_input_text, secondary_voice, rate=rate, pitch=pitch)
                    audio_bytes = b""
                    async for chunk in fallback_comm.stream():
                        if chunk["type"] == "audio":
                            audio_bytes += chunk["data"]
                    if audio_bytes:
                        return base64.b64encode(audio_bytes).decode("utf-8")
                except Exception as ex:
                    logger.warning(f"Neural TTS same-language fallback ({secondary_voice}) failed: {ex}")

        return None


neural_tts_service = NeuralTTSService()
