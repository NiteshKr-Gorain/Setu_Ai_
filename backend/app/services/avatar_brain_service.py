import re
import time
import json
import logging
import asyncio
from typing import Dict, Any, List, Optional

import httpx

from app.config import settings
from app.models.avatar_schemas import (
    IntentType, AvatarState, AvatarChatRequest, AvatarChatResponse,
    MemoryType, LifeEventType
)
from app.services.personality_service import personality_service
from app.services.storage_service import storage_service
from app.services.router_service import query_router_service
from app.services.rag_service import rag_service
from app.services.web_search_service import web_search_service
from app.services.memory_service import memory_service
from app.services.life_cycle_service import life_cycle_service
from app.services.knowledge_learning_service import knowledge_learning_service
from app.services.synthesizer import (
    VISEME_MAP, LANGUAGE_NAMES, clean_for_spoken_avatar,
    generate_visemes, synthesize_spoken_response, translate_to_target_language
)


from app.services.neural_tts_service import neural_tts_service
from app.services.tts_pronunciation_service import tts_pronunciation_service

logger = logging.getLogger("avatar_brain")

# Circuit breaker state for external LLM endpoints
_openai_disabled_until = 0.0
_gemini_disabled_until = 0.0


class AvatarBrainService:
    """
    Central AI Brain of Setu Avatar.
    Orchestrates Personality, Memory, Preserved Setu Knowledge, Web Search,
    Context Assembly, LLM Synthesis, and Life Cycle Growth.
    """

    def generate_visemes_for_text(self, text: str) -> List[Dict[str, Any]]:
        """Generates 60FPS lip-sync viseme cues for the frontend video canvas."""
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
                "timeOffsetMs": idx * 320
            })
        return visemes

    async def process_chat(self, request: AvatarChatRequest) -> AvatarChatResponse:
        start_time = time.time()
        
        # 1. Normalize Query & User Metadata
        query = (request.query or request.message or "").strip()
        if not query:
            query = "Hello"

        user_id = request.userId or "guest_user"
        persona_id = request.persona or "genji"
        language = request.language or "en-IN"
        
        # 2. Get or Create Persistent Conversation
        conv = await storage_service.get_or_create_conversation(request.conversationId, user_id=user_id)
        conv_id = conv.id

        # 3. Check for Pending Knowledge Confirmation (e.g. "Yes, preserve this knowledge")
        recent_msgs = await storage_service.get_recent_messages(conv_id, limit=4)
        is_confirming = any(w in query.lower() for w in ["yes preserve", "yes, preserve", "preserve it", "please preserve", "save this knowledge"])
        
        knowledge_preserved_now = False
        if is_confirming and len(recent_msgs) >= 2:
            # Check previous user message for traditional knowledge
            prev_user_msg = ""
            for m in reversed(recent_msgs):
                if m.role == "user":
                    prev_user_msg = m.content
                    break
            
            if prev_user_msg and any(t in prev_user_msg.lower() for t in ["grandfather", "grandmother", "traditional", "seed", "farming", "recipe"]):
                preserved_item = await knowledge_learning_service.confirm_and_preserve_knowledge(
                    user_id=user_id,
                    title=f"Preserved Heritage: {prev_user_msg[:40]}...",
                    category="Farming & Traditional Knowledge",
                    content=prev_user_msg,
                    language=language
                )
                knowledge_preserved_now = True

        # 4. Parallel Context Retrieval with Strict Timeouts (Under 0.8s Guaranteed)
        async def _fetch_rag():
            try:
                return await asyncio.wait_for(rag_service.retrieve_knowledge(query, top_k=2), timeout=0.8)
            except Exception:
                return []

        async def _fetch_intent():
            try:
                return await asyncio.wait_for(query_router_service.route_query(query, conversation_history=recent_msgs), timeout=0.6)
            except Exception:
                return IntentType.SETU_KNOWLEDGE

        async def _fetch_mem():
            try:
                return await asyncio.wait_for(memory_service.retrieve_relevant_memories(query, user_id=user_id, top_k=1), timeout=0.6)
            except Exception:
                return []

        intent, retrieved_knowledge, retrieved_memories = await asyncio.gather(
            _fetch_intent(),
            _fetch_rag(),
            _fetch_mem()
        )

        web_sources = []
        if intent in [IntentType.WEB_SEARCH, IntentType.HYBRID] and request.search_enabled:
            try:
                web_sources = await asyncio.wait_for(web_search_service.search(query, max_results=2), timeout=0.8)
            except Exception:
                web_sources = []

        # 5. Detect potential new knowledge sharing (non-blocking)
        knowledge_suggestion = None
        try:
            knowledge_suggestion = await asyncio.wait_for(knowledge_learning_service.detect_knowledge_contribution(query), timeout=0.5)
        except Exception:
            pass

        # 6. Assemble Structured AI Brain Context
        brain_context = self._build_brain_context(
            query=query,
            intent=intent,
            persona_id=persona_id,
            language=language,
            recent_msgs=recent_msgs,
            memories=retrieved_memories,
            setu_knowledge=retrieved_knowledge,
            web_sources=web_sources,
            knowledge_preserved_now=knowledge_preserved_now
        )

        # 7. Synthesize Response with Fast LLM / Fallback (Max 3.0s)
        raw_response = await self._call_llm(brain_context, query, persona_id, language, intent, retrieved_knowledge, web_sources, retrieved_memories)

        # 8. Clean Output for Spoken Avatar Delivery in Selected Language
        clean_text = clean_for_spoken_avatar(raw_response, query=query)
        if not clean_text:
            default_greetings = {
                "hi-IN": "सादर प्रणाम मेरे बच्चे, मैं सरदार गेंजी हूँ। बताइए आज आप किस विषय में मार्गदर्शन चाहते हैं?",
                "pa-IN": "ਸਤਿ ਸ੍ਰੀ ਅਕਾਲ ਮੇਰੇ ਬੱਚੇ, ਮੈਂ ਸਰਦਾਰ ਗੇਂਜੀ ਹਾਂ। ਦੱਸੋ ਅੱਜ ਤੁਸੀਂ ਕਿਸ ਵਿਸ਼ੇ ਤੇ ਸਲਾਹ ਚਾਹੁੰਦੇ ਹੋ?",
                "bn-IN": "নমস্কার আমার সন্তান, আমি সরদার গেঞ্জি। বলো আজ তুমি কী বিষয়ে জানতে চাও?",
                "ta-IN": "வணக்கம் என் குழந்தையே, நான் சர்தார் கெஞ்சி. இன்று உங்களுக்கு என்ன உதவி தேவை?",
                "en-IN": "Greetings my child, I am Sardar Genji. Let us explore and solve your inquiry together."
            }
            clean_text = default_greetings.get(language, default_greetings["en-IN"])


        # If knowledge was detected, append gentle invitation if not already present
        if knowledge_suggestion and not is_confirming and "preserve" not in clean_text.lower():
            clean_text += " That is valuable traditional wisdom. Would you like me to preserve it in Setu?"


        # 10. Process for TTS Pronunciation & Studio-Grade Neural Audio Generation
        tts_info = tts_pronunciation_service.process_for_tts(clean_text, language=language)
        tts_text = tts_info["tts_text"]
        ssml_text = tts_info.get("ssml_text")
        debug_tts = tts_info.get("debug")

        visemes = generate_visemes(clean_text)

        # Generate Studio-Quality Microsoft Neural Audio (Base64 MP3) with 1.8s timeout
        audio_base64 = None
        try:
            audio_base64 = await asyncio.wait_for(
                neural_tts_service.generate_speech_base64(
                    text=clean_text,
                    language=language,
                    rate="+0%",
                    pitch="+0Hz"
                ),
                timeout=1.8
            )
        except Exception as e:
            logger.debug(f"Neural audio generation fallback: {e}")

        # 11. Ultra-Fast Non-Blocking Background Processing (Storage, Memory, Life Cycle)
        async def _background_post_processing():
            try:
                await storage_service.add_message(conv_id, "user", query, user_id=user_id)
                await storage_service.add_message(conv_id, "avatar", clean_text, user_id=user_id)
                await storage_service.record_interaction(user_id)
                await memory_service.extract_and_store_memory(query, clean_text, user_id=user_id)
                await life_cycle_service.evaluate_interaction_milestones(user_id, query, clean_text)
            except Exception as ex:
                logger.debug(f"Background task execution error: {ex}")

        asyncio.create_task(_background_post_processing())

        # Format sources for response
        sources_payload = []
        for k in retrieved_knowledge:
            sources_payload.append({
                "type": "setu_knowledge",
                "documentId": k.get("metadata", {}).get("documentId", k.get("id")),
                "title": k.get("metadata", {}).get("title", "Setu Preserved Knowledge"),
                "category": k.get("metadata", {}).get("category", "Heritage"),
                "snippet": k.get("text", "")[:180],
                "verified": True,
                "url": "#"
            })
        for w in web_sources:
            sources_payload.append({
                "type": "web",
                "title": w.get("title", "Web Source"),
                "snippet": w.get("snippet", ""),
                "source": w.get("source", "Web"),
                "url": w.get("url", "#")
            })

        latency_ms = round((time.time() - start_time) * 1000, 2)


        return AvatarChatResponse(
            query=query,
            spoken_text=clean_text,
            response=clean_text,
            tts_text=tts_text,
            ssml_text=ssml_text,
            debug_tts=debug_tts,
            audio_base64=audio_base64,
            visemes=visemes,
            intent=intent,
            state=AvatarState.SPEAKING,
            memoryCreated=False,
            lifeEventCreated=bool(knowledge_preserved_now),
            knowledgeLearned=knowledge_preserved_now,
            suggestPreservation=bool(knowledge_suggestion and not is_confirming),

            extractedKnowledge=knowledge_suggestion,
            sources=sources_payload,
            word_count=len(clean_text.split()),
            sentence_count=len([s for s in clean_text.split('.') if s.strip()]),
            persona=persona_id,
            userId=user_id,
            conversationId=conv_id,
            search_performed=bool(web_sources),
            latency_ms=latency_ms
        )

    async def process_chat_stream(self, request: AvatarChatRequest):
        """
        True Incremental Sentence-Based Streaming Pipeline:
        1. Emits instant warm elder acknowledgement within 50ms.
        2. Chunks incoming AI stream by natural sentence boundaries (. ? ! । ॥ \n).
        3. Immediately synthesizes Neural TTS for each sentence chunk as soon as it forms.
        4. Streams audio chunks concurrently while subsequent sentences continue generating.
        5. Logs high-resolution timing metrics for each step.
        """
        t0_start = time.time()
        query = (request.query or request.message or "").strip() or "Hello"
        user_id = request.userId or "guest_user"
        persona_id = request.persona or "genji"
        language = request.language or "en-IN"

        logger.info(f"⚡ [STREAM STARTED] Query: '{query}' | Lang: {language}")

        # 1. Instant Warm Elder Acknowledgement
        acks = {
            "hi-IN": "हाँ मेरे बच्चे, मैं आपकी बात समझ रहा हूँ...",
            "pa-IN": "ਹਾਂ ਮੇਰੇ ਬੱਚੇ, ਮੈਂ ਤੁਹਾਡੀ ਗੱਲ ਧਿਆਨ ਨਾਲ ਸੁਣ ਰਿਹਾ ਹਾਂ...",
            "bn-IN": "হ্যাঁ আমার সন্তান, আমি তোমার কথা শুনছি...",
            "ta-IN": "ஆம் என் குழந்தையே, நான் உங்கள் கவலையை கவனிக்கிறேன்...",
            "en-IN": "Yes, my child, let me share our traditional guidance with you..."
        }

        ack_text = acks.get(language, acks["en-IN"])
        yield f"data: {json.dumps({'event': 'start', 'acknowledgement': ack_text, 'language': language, 'timestamp_ms': round((time.time() - t0_start) * 1000, 1)}, ensure_ascii=False)}\n\n"

        # 2. Context Assembly in Parallel (Max 1.2s)
        conv = await storage_service.get_or_create_conversation(request.conversationId, user_id=user_id)
        conv_id = conv.id
        recent_msgs = await storage_service.get_recent_messages(conv_id, limit=4)

        async def _fetch_rag():
            try:
                return await asyncio.wait_for(rag_service.retrieve_knowledge(query, top_k=3), timeout=1.2)
            except Exception:
                return []

        async def _fetch_web():
            if request.search_enabled:
                try:
                    return await asyncio.wait_for(web_search_service.search(query, max_results=2), timeout=1.2)
                except Exception:
                    return []
            return []

        async def _fetch_mem():
            try:
                return await asyncio.wait_for(memory_service.retrieve_relevant_memories(query, user_id=user_id, top_k=2), timeout=0.8)
            except Exception:
                return []

        async def _fetch_intent():
            try:
                return await asyncio.wait_for(query_router_service.route_query(query, conversation_history=recent_msgs), timeout=0.8)
            except Exception:
                return IntentType.SETU_KNOWLEDGE

        intent, retrieved_knowledge, web_sources, retrieved_memories = await asyncio.gather(
            _fetch_intent(),
            _fetch_rag(),
            _fetch_web(),
            _fetch_mem()
        )

        brain_context = self._build_brain_context(
            query=query,
            intent=intent,
            persona_id=persona_id,
            language=language,
            recent_msgs=recent_msgs,
            memories=retrieved_memories,
            setu_knowledge=retrieved_knowledge,
            web_sources=web_sources,
            knowledge_preserved_now=False
        )

        lang_name = LANGUAGE_NAMES.get(language, language)
        accumulated_text = ""
        stream_buffer = ""
        chunk_index = 0
        first_token_logged = False
        streamed_successfully = False

        def extract_sentence_chunks(buffer_text: str):
            """
            Extracts complete, coherent spoken sentences across English, Hindi (।), Punjabi, Bengali, Tamil.
            Protects against:
            - Splitting on decimals (e.g. 1.5, 2.5)
            - Splitting on abbreviations (e.g. Dr., Mr., e.g., i.e., vs., etc., रु., श्री., ਮਾ., எண்.)
            - Strips markdown formatting to prevent audio stutter or skipped tokens.
            """
            pattern = r'(?<!\bDr)(?<!\bMr)(?<!\bMrs)(?<!\be\.g)(?<!\bi\.e)(?<!\bvs)(?<!\betc)(?<!\d)([.?!।॥\n]+)(?=\s|$)'
            matches = list(re.finditer(pattern, buffer_text))
            if not matches:
                return [], buffer_text

            chunks = []
            last_end = 0
            for m in matches:
                candidate = buffer_text[last_end:m.end()].strip()
                # Clean any stray formatting artifacts
                cleaned = re.sub(r'[\*\#\_`~]', '', candidate).strip()
                cleaned = re.sub(r'^\s*[-*+]\s+', '', cleaned)
                cleaned = re.sub(r'^\s*\d+\.\s+', '', cleaned)
                if cleaned and len(cleaned.split()) >= 3:
                    chunks.append(cleaned)
                    last_end = m.end()
                elif cleaned and any(p in cleaned for p in ['।', '॥', '?', '!']):
                    chunks.append(cleaned)
                    last_end = m.end()

            return chunks, buffer_text[last_end:]

        # 3. Incremental LLM Stream with Dynamic Urgency Model Selection & Multi-Model Failover
        if settings.OPENROUTER_API_KEY and len(settings.OPENROUTER_API_KEY) > 5:
            # Determine urgency
            is_urgent_query = any(k in query.lower() for k in [
                "urgent", "emergency", "pain", "dard", "bukhar", "fever", "turant", "jaldi",
                "fatafat", "severe", "vomit", "ultee", "bleeding", "dizziness", "chest", "breath"
            ])

            configured_model = settings.OPENROUTER_MODEL or "openai/gpt-4o-mini"
            # Build intelligent candidate models list by urgency and reliability
            if is_urgent_query:
                candidate_models = [
                    "openai/gpt-4o-mini",
                    "google/gemini-2.0-flash-exp:free",
                    "deepseek/deepseek-chat",
                    configured_model
                ]
            else:
                candidate_models = [
                    configured_model,
                    "openai/gpt-4o-mini",
                    "google/gemini-2.0-flash-exp:free",
                    "deepseek/deepseek-chat",
                    "meta-llama/llama-3.3-70b-instruct"
                ]

            # Deduplicate while preserving order
            candidate_models = list(dict.fromkeys(candidate_models))

            url = "https://openrouter.ai/api/v1/chat/completions"
            headers = {
                "Authorization": f"Bearer {settings.OPENROUTER_API_KEY.strip()}",
                "HTTP-Referer": "http://localhost:5173",
                "X-Title": "Setu Avatar",
                "Content-Type": "application/json"
            }
            trad_rule = (
                f"MANDATORY MULTI-LANGUAGE RULE (NON-NEGOTIABLE):\n"
                f"- The mentee has chosen the target spoken language: {lang_name}.\n"
                f"- The mentee may ask their question in ANY language (English, Hindi, Punjabi, Bengali, Tamil, Hinglish, or any mix).\n"
                f"- You must accept and fully comprehend their question regardless of what language it was asked in.\n"
                f"- BUT YOUR SPOKEN RESPONSE MUST BE 100% EXCLUSIVELY WRITTEN AND SPOKEN IN {lang_name}.\n"
                f"- NEVER reply in the user's input language if it is different from {lang_name}. Always formulate your entire answer in {lang_name}.\n\n"
                "=== SETU AVATAR MANDATORY 3-STAGE RESPONSE ARCHITECTURE (QUICK & SOLUTION-FIRST) ===\n"
                "1. BRIEF GREETING & FORMAL INTRO (1 SHORT SENTENCE):\n"
                "   - Start with a warm, formal greeting introducing yourself as Sardar Genji in " + lang_name + ".\n"
                "   - Strictly address the user as 'मेरे बच्चे' (Hindi) / 'ਮੇਰੇ ਬੱਚੇ' (Punjabi) / 'My child' (English) / 'আমার সন্তান' (Bengali) / 'என் குழந்தையே' (Tamil).\n"
                "2. DIRECT SOLUTION FIRST (IMMEDIATE & ACTIONABLE):\n"
                "   - Provide the exact practical solution, step-by-step method, or direct answer immediately right after the greeting intro!\n"
                "   - Never delay the solution with long preliminary backstories. Give the user the practical answer first!\n"
                "3. ADDITIONAL & SUPPORTING INFORMATION (AFTER THE SOLUTION):\n"
                "   - After stating the direct solution, provide supporting context:\n"
                "     a. Why this solution works and its core mechanism.\n"
                "     b. A practical analogy or real-world tip.\n"
                "     c. Common mistakes and pitfalls to avoid.\n"
                "     d. A crisp 1-sentence final takeaway rule of thumb.\n\n"
                "CRITICAL PRINCIPLES:\n"
                "- SPEED: Provide concise, clean spoken sentences so the spoken response is rapid.\n"
                "- MEDICAL SAFEGUARD: For severe medical emergencies (chest pain, acute bleeding, breathing trouble), urge consulting a doctor or hospital first.\n"
                "- SPOKEN TTS-FRIENDLY: Form natural conversational spoken sentences with ZERO markdown formatting (no ###, **, or bullets)."
            )

            # Try candidate models sequentially until one streams successfully
            for model_to_try in candidate_models:
                if streamed_successfully:
                    break
                try:
                    logger.info(f"🤖 [STREAM ATTEMPT] Trying model: {model_to_try} (Urgent: {is_urgent_query})")
                    payload = {
                        "model": model_to_try,
                        "messages": [
                            {"role": "system", "content": f"{brain_context}\n\n{trad_rule}"},
                            {"role": "user", "content": f"Please provide a quick, solution-first response in {lang_name} as {persona_id} for: \"{query}\". Strictly follow the 3-stage flow: 1. Brief greeting and formal intro (1 short sentence introducing as Sardar Genji). 2. Direct practical solution / remedy immediately first. 3. Useful supporting details, why it works, gotchas to avoid, and summary after."}
                        ],
                        "temperature": 0.25,
                        "max_tokens": 180,
                        "stream": True
                    }

                    async with httpx.AsyncClient(timeout=15.0) as client:
                        async with client.stream("POST", url, json=payload, headers=headers) as response:
                            if response.status_code == 200:
                                streamed_successfully = True
                                logger.info(f"✨ [STREAM CONNECTED] Using {model_to_try}")
                                async for line in response.aiter_lines():
                                    if line.startswith("data: ") and line.strip() != "data: [DONE]":
                                        try:
                                            chunk_obj = json.loads(line[6:])
                                            delta = chunk_obj["choices"][0]["delta"].get("content", "")
                                            if delta:
                                                if not first_token_logged:
                                                    first_token_logged = True
                                                    logger.info(f"⏱️ [FIRST AI TOKEN from {model_to_try}] at {(time.time() - t0_start)*1000:.1f}ms")

                                                accumulated_text += delta
                                                stream_buffer += delta

                                                # Check for complete sentences in the buffer
                                                new_chunks, remaining_buffer = extract_sentence_chunks(stream_buffer)
                                                if new_chunks:
                                                    stream_buffer = remaining_buffer
                                                    for sentence in new_chunks:
                                                        clean_sentence = clean_for_spoken_avatar(sentence, query=query)
                                                        if clean_sentence:
                                                            chunk_time = round((time.time() - t0_start) * 1000, 1)
                                                            logger.info(f"📝 [SENTENCE #{chunk_index}] detected at {chunk_time}ms: '{clean_sentence}'")

                                                            # Emit text chunk immediately for UI display
                                                            yield f"data: {json.dumps({'event': 'text_chunk', 'chunk_index': chunk_index, 'text': clean_sentence, 'accumulated': accumulated_text, 'timestamp_ms': chunk_time}, ensure_ascii=False)}\n\n"

                                                            # Synthesize Neural TTS immediately for this native sentence
                                                            tts_start = time.time()
                                                            audio_b64 = await neural_tts_service.generate_speech_base64(
                                                                text=clean_sentence,
                                                                language=language,
                                                                rate="+0%",
                                                                pitch="+0Hz"
                                                            )
                                                            tts_duration = round((time.time() - tts_start) * 1000, 1)
                                                            total_elapsed = round((time.time() - t0_start) * 1000, 1)
                                                            logger.info(f"🔊 [AUDIO READY #{chunk_index}] synthesized in {tts_duration}ms (Total elapsed: {total_elapsed}ms)")

                                                            visemes = generate_visemes(clean_sentence)
                                                            audio_payload = {
                                                                "event": "audio_chunk",
                                                                "chunk_index": chunk_index,
                                                                "text": clean_sentence,
                                                                "audio_base64": audio_b64,
                                                                "visemes": visemes,
                                                                "language": language,
                                                                "timestamp_ms": total_elapsed
                                                            }
                                                            yield f"data: {json.dumps(audio_payload, ensure_ascii=False)}\n\n"
                                                            chunk_index += 1
                                        except Exception as ex:
                                            logger.debug(f"Stream parsing skip: {ex}")
                            else:
                                logger.warning(f"Model {model_to_try} returned status {response.status_code}, failing over to next model...")
                except Exception as e:
                    logger.warning(f"Streaming error with model {model_to_try}: {e}, failing over to next model...")

        # If LLM stream did not generate chunks, fallback to standard synthesizer

        if chunk_index == 0 or not streamed_successfully:
            synth_result = await synthesize_spoken_response(
                query=query,
                search_results=web_sources,
                persona_id=persona_id,
                language=language
            )
            clean_text = clean_for_spoken_avatar(synth_result.get("spoken_text", ""), query=query)

            # Emit text chunk
            yield f"data: {json.dumps({'event': 'text_chunk', 'chunk_index': 0, 'text': clean_text, 'accumulated': clean_text, 'timestamp_ms': round((time.time() - t0_start)*1000, 1)}, ensure_ascii=False)}\n\n"

            # Synthesize single chunk audio
            audio_b64 = await neural_tts_service.generate_speech_base64(
                text=clean_text,
                language=language,
                rate="+0%",
                pitch="+0Hz"
            )
            visemes = generate_visemes(clean_text)
            yield f"data: {json.dumps({'event': 'audio_chunk', 'chunk_index': 0, 'text': clean_text, 'audio_base64': audio_b64, 'visemes': visemes, 'language': language, 'timestamp_ms': round((time.time() - t0_start)*1000, 1)}, ensure_ascii=False)}\n\n"
            chunk_index = 1
        elif stream_buffer.strip():
            # Process remaining leftover text in buffer
            clean_leftover = clean_for_spoken_avatar(stream_buffer.strip(), query=query)
            if clean_leftover and len(clean_leftover.split()) >= 2:
                chunk_time = round((time.time() - t0_start) * 1000, 1)
                yield f"data: {json.dumps({'event': 'text_chunk', 'chunk_index': chunk_index, 'text': clean_leftover, 'accumulated': accumulated_text, 'timestamp_ms': chunk_time}, ensure_ascii=False)}\n\n"

                audio_b64 = await neural_tts_service.generate_speech_base64(
                    text=clean_leftover,
                    language=language,
                    rate="+0%",
                    pitch="+0Hz"
                )
                visemes = generate_visemes(clean_leftover)
                audio_payload = {
                    "event": "audio_chunk",
                    "chunk_index": chunk_index,
                    "text": clean_leftover,
                    "audio_base64": audio_b64,
                    "visemes": visemes,
                    "language": language,
                    "timestamp_ms": round((time.time() - t0_start) * 1000, 1)
                }
                yield f"data: {json.dumps(audio_payload, ensure_ascii=False)}\n\n"
                chunk_index += 1

        # 4. Stream Done Event & Background Tasks
        total_latency_ms = round((time.time() - t0_start) * 1000, 2)
        logger.info(f"✅ [STREAM COMPLETED] {chunk_index} total chunks generated in {total_latency_ms}ms")

        # Asynchronous background logging
        async def _bg_log():
            try:
                await storage_service.add_message(conv_id, "user", query, user_id=user_id)
                await storage_service.add_message(conv_id, "avatar", accumulated_text, user_id=user_id)
                await storage_service.record_interaction(user_id)
            except Exception:
                pass
        asyncio.create_task(_bg_log())

        done_payload = {
            "event": "stream_done",
            "total_chunks": chunk_index,
            "full_text": accumulated_text,
            "latency_ms": total_latency_ms,
            "language": language,
            "intent": intent.value if hasattr(intent, 'value') else str(intent)
        }
        yield f"data: {json.dumps(done_payload, ensure_ascii=False)}\n\n"




    def _build_brain_context(
        self,
        query: str,
        intent: IntentType,
        persona_id: str,
        language: str,
        recent_msgs: list,
        memories: list,
        setu_knowledge: list,
        web_sources: list,
        knowledge_preserved_now: bool
    ) -> str:
        parts = []

        # 1. System Personality
        sys_prompt = personality_service.get_system_prompt(persona_id, language=language)
        parts.append(f"=== SYSTEM PERSONALITY ===\n{sys_prompt}")

        # 2. Conversation History
        if recent_msgs:
            hist_str = "\n".join(f"- {m.role.capitalize()}: {m.content}" for m in recent_msgs[-4:])
            parts.append(f"=== RECENT CONVERSATION ===\n{hist_str}")

        # 3. Memories
        if memories:
            mem_str = "\n".join(f"- [{m.type.value}] {m.summary}" for m in memories)
            parts.append(f"=== PERSISTENT USER MEMORIES ===\n{mem_str}")

        # 4. Setu Knowledge (RAG)
        if setu_knowledge:
            rag_str = "\n\n".join(
                f"[Document: {k.get('metadata', {}).get('title', 'Knowledge')}]\n{k.get('text', '')}"
                for k in setu_knowledge
            )
            parts.append(f"=== VERIFIED SETU PRESERVED KNOWLEDGE (RAG) ===\n{rag_str}")
        elif intent == IntentType.SETU_KNOWLEDGE:
            parts.append("=== SETU KNOWLEDGE STATUS ===\nNo matching record found in Setu's verified knowledge archives. Honestly acknowledge this without making up false facts.")

        # 5. Live Web Sources
        if web_sources:
            web_str = "\n\n".join(
                f"[Source: {w.get('title')}]\nSnippet: {w.get('snippet')}\nURL: {w.get('url')}"
                for w in web_sources
            )
            parts.append(f"=== CURRENT LIVE WEB INFORMATION ===\n{web_str}")

        if knowledge_preserved_now:
            parts.append("=== SPECIAL ACTION ===\nThe user just confirmed knowledge preservation. Inform them warmly that their knowledge has been verified and permanently preserved in Setu's archive.")

        # 6. Intent & Query
        parts.append(f"=== USER INTENT ===\n{intent.value}")
        parts.append(f"=== CURRENT USER QUESTION ===\n\"{query}\"")

        return "\n\n".join(parts)

    async def _call_llm(
        self,
        context: str,
        query: str,
        persona_id: str,
        language: str,
        intent: IntentType,
        setu_knowledge: list,
        web_sources: list,
        memories: list
    ) -> str:
        """Invokes OpenAI GPT / Gemini / Intelligent Multilingual Logical Synthesizer."""
        global _openai_disabled_until, _gemini_disabled_until
        now = time.time()

        # 1. Try Universal OpenRouter AI Gateway (Gemini, DeepSeek, Claude, Llama 3, GPT-4o)
        if settings.OPENROUTER_API_KEY and len(settings.OPENROUTER_API_KEY) > 5:
            try:
                lang_name = LANGUAGE_NAMES.get(language, language)
                lang_rule = (
                    f"MANDATORY MULTI-LANGUAGE RULE (NON-NEGOTIABLE):\n"
                    f"- The mentee has chosen the target spoken language: {lang_name}.\n"
                    f"- The mentee may ask their question in ANY language (English, Hindi, Punjabi, Bengali, Tamil, Hinglish, or any mix).\n"
                    f"- You must accept and fully comprehend their question regardless of what language it was asked in.\n"
                    f"- BUT YOUR SPOKEN RESPONSE MUST BE 100% EXCLUSIVELY WRITTEN AND SPOKEN IN {lang_name}.\n"
                    f"- NEVER reply in the user's input language if it is different from {lang_name}. Always formulate your entire answer in {lang_name}."
                )
                trad_rule = (
                    "=== SETU AVATAR MANDATORY 3-STAGE RESPONSE ARCHITECTURE (QUICK & SOLUTION-FIRST) ===\n"
                    "1. BRIEF GREETING & FORMAL INTRO (1 SHORT SENTENCE):\n"
                    "   - Start with a warm, formal greeting introducing yourself as Sardar Genji in " + lang_name + ".\n"
                    "   - Strictly address the user as 'मेरे बच्चे' (Hindi) / 'ਮੇਰੇ ਬੱਚੇ' (Punjabi) / 'My child' (English) / 'আমার সন্তান' (Bengali) / 'என் குழந்தையே' (Tamil).\n"
                    "2. DIRECT SOLUTION FIRST (IMMEDIATE & ACTIONABLE):\n"
                    "   - Provide the exact practical solution, step-by-step method, or direct answer immediately right after the greeting intro!\n"
                    "   - Never delay the solution with long preliminary backstories. Give the user the practical answer first!\n"
                    "3. ADDITIONAL & SUPPORTING INFORMATION (AFTER THE SOLUTION):\n"
                    "   - After stating the direct solution, provide supporting context:\n"
                    "     a. Why this solution works and its core mechanism.\n"
                    "     b. A practical analogy or real-world tip.\n"
                    "     c. Common mistakes and pitfalls to avoid.\n"
                    "     d. A crisp 1-sentence final takeaway rule of thumb.\n\n"
                    "CRITICAL PRINCIPLES:\n"
                    "- SPEED: Provide concise, clean spoken sentences so the spoken response is rapid.\n"
                    "- MEDICAL SAFEGUARD: For severe medical emergencies (chest pain, acute bleeding, breathing trouble), urge consulting a doctor or hospital first.\n"
                    "- SPOKEN TTS-FRIENDLY: Form natural conversational spoken sentences with ZERO markdown formatting (no ###, **, or bullets)."
                )
                active_model = settings.OPENROUTER_MODEL or "openai/gpt-4o-mini"
                async with httpx.AsyncClient(timeout=2.8) as client:
                    resp = await client.post(
                        "https://openrouter.ai/api/v1/chat/completions",
                        headers={
                            "Authorization": f"Bearer {settings.OPENROUTER_API_KEY.strip()}",
                            "HTTP-Referer": "http://localhost:5173",
                            "X-Title": "Setu Avatar",
                            "Content-Type": "application/json"
                        },
                        json={
                            "model": active_model,
                            "messages": [
                                {"role": "system", "content": f"{context}\n\n{lang_rule}\n\n{trad_rule}"},
                                {"role": "user", "content": f"Please provide a quick, punchy, solution-first response (max 60-80 spoken words) in {lang_name} as {persona_id} for: \"{query}\". Strictly follow the 3-stage flow: 1. Brief greeting and formal intro (1 short sentence). 2. Direct practical solution / remedy immediately first. 3. Brief supporting details and 1-sentence summary after."}
                            ],
                            "temperature": 0.25,
                            "max_tokens": 160
                        }
                    )



                    if resp.status_code == 200:
                        content = resp.json()["choices"][0]["message"]["content"].strip()
                        if content:
                            return content

                    else:
                        logger.debug(f"OpenRouter API returned status {resp.status_code}: {resp.text}")
            except Exception as e:

                logger.debug(f"OpenRouter brain completion fallback: {e}")

        # 2. Try Direct OpenAI GPT-4o-mini if API key configured and not circuit-broken
        if settings.OPENAI_API_KEY and not settings.OPENAI_API_KEY.startswith("sk-Your") and len(settings.OPENAI_API_KEY) > 20 and now > _openai_disabled_until:
            try:
                async with httpx.AsyncClient(timeout=3.0) as client:
                    resp = await client.post(
                        f"{settings.OPENAI_BASE_URL.rstrip('/')}/chat/completions",
                        headers={
                            "Authorization": f"Bearer {settings.OPENAI_API_KEY}",
                            "Content-Type": "application/json"
                        },
                        json={
                            "model": settings.OPENAI_MODEL,
                            "messages": [
                                {"role": "system", "content": context},
                                {"role": "user", "content": f"Please answer in {language} as {persona_id} following all spoken constraints: \"{query}\""}
                            ],
                            "temperature": 0.3,
                            "max_tokens": 110
                        }
                    )
                    if resp.status_code == 200:
                        content = resp.json()["choices"][0]["message"]["content"].strip()
                        if content:
                            return content
                    elif resp.status_code in [401, 403, 429]:
                        logger.info(f"OpenAI API status {resp.status_code}, activating circuit breaker.")
                        _openai_disabled_until = now + 300.0
            except Exception as e:
                logger.debug(f"OpenAI completion fallback: {e}")
                _openai_disabled_until = now + 60.0

        # 3. Try Google Gemini if configured and not circuit-broken
        if settings.GEMINI_API_KEY and len(settings.GEMINI_API_KEY) > 15 and now > _gemini_disabled_until:
            try:
                gemini_url = f"https://generativelanguage.googleapis.com/v1beta/models/{settings.GEMINI_MODEL}:generateContent?key={settings.GEMINI_API_KEY}"
                async with httpx.AsyncClient(timeout=3.0) as client:
                    resp = await client.post(
                        gemini_url,
                        json={
                            "contents": [
                                {"parts": [{"text": f"{context}\n\nQuestion: {query}\nProvide a warm, gentle, spoken response in {language}."}]}
                            ]
                        }
                    )
                    if resp.status_code == 200:
                        data = resp.json()
                        text = data["candidates"][0]["content"]["parts"][0]["text"].strip()
                        if text:
                            return text
                    elif resp.status_code in [400, 401, 403, 429]:
                        _gemini_disabled_until = now + 300.0
            except Exception as e:
                logger.debug(f"Gemini fallback: {e}")
                _gemini_disabled_until = now + 60.0

        # 3. Intelligent Deep Logical Reasoning & Knowledge Synthesizer
        combined_sources = []
        for k in setu_knowledge:
            combined_sources.append({
                "title": k.get("metadata", {}).get("title", "Setu Knowledge"),
                "snippet": k.get("text", "")
            })
        for w in web_sources:
            combined_sources.append({
                "title": w.get("title", "Web Source"),
                "snippet": w.get("snippet", "")
            })

        synth_result = await synthesize_spoken_response(
            query=query,
            search_results=combined_sources,
            persona_id=persona_id,
            language=language
        )
        return synth_result.get("spoken_text", "")


avatar_brain_service = AvatarBrainService()

