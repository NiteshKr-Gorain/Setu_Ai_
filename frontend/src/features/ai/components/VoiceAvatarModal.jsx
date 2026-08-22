import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, Send, RefreshCw, X, Globe, AlertCircle } from 'lucide-react';
import AvatarCanvas from './AvatarCanvas';
import KaraokeSubtitles from './KaraokeSubtitles';
import { askAvatarChat, askAvatarChatStream, fetchPersonas, fetchNeuralSpeechAudio } from '../services/avatarApi';

// Supported 5 Multi-Language Catalog matching Setu_Avatar
// Supported 5 Multi-Language Catalog (Clean names only)
const SUPPORTED_LANGUAGES = [
  { code: 'en-IN', name: 'English', native: 'English' },
  { code: 'hi-IN', name: 'Hindi', native: 'हिन्दी' },
  { code: 'pa-IN', name: 'Punjabi', native: 'ਪੰਜਾਬੀ' },
  { code: 'bn-IN', name: 'Bengali', native: 'বাংলা' },
  { code: 'ta-IN', name: 'Tamil', native: 'தமிழ்' }
];

export default function VoiceAvatarModal({ isOpen, onClose }) {
  // Model & State
  const [selectedPersona, setSelectedPersona] = useState(null);
  const [avatarState, setAvatarState] = useState('idle'); // 'idle' | 'listening' | 'thinking' | 'speaking'
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedLang, setSelectedLang] = useState('en-IN');
  const [spokenText, setSpokenText] = useState(
    'Greetings and warm blessings, my child. I am Sardar Genji. Share with me what is in your heart today, and we will find a peaceful, time-tested traditional remedy together.'
  );

  const [wordsList, setWordsList] = useState([]);
  const [currentWordIndex, setCurrentWordIndex] = useState(-1);
  const [currentViseme, setCurrentViseme] = useState(null);
  const [speakerAudioLevel, setSpeakerAudioLevel] = useState(0);

  // Voice Engine State
  const [useNeuralVoice, setUseNeuralVoice] = useState(true);
  const [speechRate, setSpeechRate] = useState(1.0);
  const [speechPitch, setSpeechPitch] = useState(1.0);
  const [availableVoices, setAvailableVoices] = useState([]);
  const [selectedVoiceIndex, setSelectedVoiceIndex] = useState(0);

  // Voice Recognition & Input
  const [transcript, setTranscript] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [micVolume, setMicVolume] = useState(0);

  const recognitionRef = useRef(null);
  const audioContextRef = useRef(null);
  const micStreamRef = useRef(null);
  const animFrameRef = useRef(null);
  const latestTranscriptRef = useRef('');
  const micEnabledRef = useRef(false);
  const isStartingSpeechRef = useRef(false);
  const inputRef = useRef(null);

  // Audio Playback & FIFO Streaming Audio Queue
  const speakerAudioCtxRef = useRef(null);
  const currentAudioSourceRef = useRef(null);
  const speakerSyncFrameRef = useRef(null);
  const fallbackIntervalRef = useRef(null);
  const audioQueueRef = useRef([]);
  const isPlayingAudioRef = useRef(false);
  const isStreamActiveRef = useRef(false);
  const abortControllerRef = useRef(null);
  const activeRequestStartTimeRef = useRef(0);
  const hasSpokenFirstChunkRef = useRef(false);
  const autoSubmitTimerRef = useRef(null);

  // Auto-submit after 3 seconds of silence or stopped commanding (invisible, no timing on screen)
  useEffect(() => {
    if (autoSubmitTimerRef.current) {
      clearTimeout(autoSubmitTimerRef.current);
      autoSubmitTimerRef.current = null;
    }

    const trimmed = (transcript || '').trim();
    if (trimmed && !isProcessing && avatarState !== 'speaking' && avatarState !== 'thinking') {
      autoSubmitTimerRef.current = setTimeout(() => {
        const textToSubmit = (latestTranscriptRef.current || transcript || '').trim();
        if (textToSubmit && !isProcessing) {
          handleExecuteQuery(textToSubmit);
        }
      }, 3000);
    }

    return () => {
      if (autoSubmitTimerRef.current) {
        clearTimeout(autoSubmitTimerRef.current);
      }
    };
  }, [transcript, isProcessing, avatarState]);

  // State for Mic Errors & Compatibility
  const [speechSupported, setSpeechSupported] = useState(true);
  const [micPermissionDenied, setMicPermissionDenied] = useState(false);
  const [micErrorNotice, setMicErrorNotice] = useState('');

  // Initialize Persona
  useEffect(() => {
    async function init() {
      const pList = await fetchPersonas();
      if (pList.length > 0) {
        setSelectedPersona(pList[0]);
      }
    }
    init();
  }, []);

  // Match Browser Installed Voices
  useEffect(() => {
    if (!('speechSynthesis' in window)) return;

    const loadVoices = () => {
      const voices = window.speechSynthesis.getVoices();
      if (voices && voices.length > 0) {
        setAvailableVoices(voices);
        const langLower = selectedLang.toLowerCase();

        let matchIdx = -1;
        if (langLower.startsWith('hi')) {
          matchIdx = voices.findIndex(v => {
            const vLang = v.lang.toLowerCase().replace('_', '-');
            const vName = v.name.toLowerCase();
            return (vLang.startsWith('hi') || vName.includes('hindi') || vName.includes('हिन्दी'));
          });
        } else if (langLower.startsWith('pa')) {
          matchIdx = voices.findIndex(v => {
            const vLang = v.lang.toLowerCase().replace('_', '-');
            const vName = v.name.toLowerCase();
            return (vLang.startsWith('pa') || vName.includes('punjabi') || vName.includes('panjabi'));
          });
        } else if (langLower.startsWith('bn')) {
          matchIdx = voices.findIndex(v => {
            const vLang = v.lang.toLowerCase().replace('_', '-');
            const vName = v.name.toLowerCase();
            return (vLang.startsWith('bn') || vName.includes('bengali') || vName.includes('বাংলা'));
          });
        } else if (langLower.startsWith('ta')) {
          matchIdx = voices.findIndex(v => {
            const vLang = v.lang.toLowerCase().replace('_', '-');
            const vName = v.name.toLowerCase();
            return (vLang.startsWith('ta') || vName.includes('tamil') || vName.includes('தமிழ்'));
          });
        } else {
          matchIdx = voices.findIndex(v => {
            const vLang = v.lang.toLowerCase().replace('_', '-');
            return vLang.startsWith('en-in') || vLang.startsWith('en-gb') || vLang.startsWith('en');
          });
        }

        if (matchIdx !== -1) {
          setSelectedVoiceIndex(matchIdx);
        }
      }
    };

    loadVoices();
    window.speechSynthesis.onvoiceschanged = loadVoices;
    return () => {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.onvoiceschanged = null;
      }
    };
  }, [selectedLang]);

  // Check Web Speech API Support
  useEffect(() => {
    const hasSTT = 'SpeechRecognition' in window || 'webkitSpeechRecognition' in window;
    setSpeechSupported(hasSTT);
  }, []);

  // Cleanup on Unmount / Close
  useEffect(() => {
    if (isOpen) {
      if (inputRef.current) {
        setTimeout(() => inputRef.current?.focus(), 200);
      }
    } else {
      turnMicOff();
      handleStopSpeech();
    }
  }, [isOpen]);

  // Safe AudioContext Initializer & Resumer (Fixes Autoplay Suspension)
  const getOrCreateAudioContext = async () => {
    try {
      if (!speakerAudioCtxRef.current || speakerAudioCtxRef.current.state === 'closed') {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        if (AudioCtx) {
          speakerAudioCtxRef.current = new AudioCtx();
        }
      }
      if (speakerAudioCtxRef.current && speakerAudioCtxRef.current.state === 'suspended') {
        await speakerAudioCtxRef.current.resume().catch(() => {});
      }
      return speakerAudioCtxRef.current;
    } catch (e) {
      console.warn('AudioContext initialization/resume warning:', e);
      return null;
    }
  };

  // Safe Mic Visualizer (Isolated so it never blocks SpeechRecognition)
  const initMicVisualizer = async () => {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) return;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      micStreamRef.current = stream;
      setMicPermissionDenied(false);

      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;

      if (!audioContextRef.current || audioContextRef.current.state === 'closed') {
        audioContextRef.current = new AudioCtx();
      }
      const ctx = audioContextRef.current;
      if (ctx.state === 'suspended') {
        await ctx.resume().catch(() => {});
      }

      const source = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 64;
      source.connect(analyser);

      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);

      const updateVolume = () => {
        if (!analyser || !micStreamRef.current) return;
        analyser.getByteFrequencyData(dataArray);
        let sum = 0;
        for (let i = 0; i < bufferLength; i++) {
          sum += dataArray[i];
        }
        const avg = sum / bufferLength;
        const normalized = Math.min(1, avg / 128);
        setMicVolume(normalized);
        animFrameRef.current = requestAnimationFrame(updateVolume);
      };
      updateVolume();
    } catch (err) {
      console.warn('Mic visualizer notice:', err);
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setMicPermissionDenied(true);
        setMicErrorNotice('Microphone access was denied. Please allow microphone permissions in your browser.');
        setTimeout(() => setMicErrorNotice(''), 6000);
      }
    }
  };

  const cleanupMicVisualizer = () => {
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }
    if (micStreamRef.current) {
      try {
        micStreamRef.current.getTracks().forEach(track => track.stop());
      } catch (_e) {}
      micStreamRef.current = null;
    }
    setMicVolume(0);
  };

  // Safe Speech Recognition Engine with Persistent User State
  const startSpeechEngine = () => {
    if (!micEnabledRef.current || micPermissionDenied) return;

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setSpeechSupported(false);
      setMicErrorNotice('Speech recognition is not supported in this browser.');
      setTimeout(() => setMicErrorNotice(''), 6000);
      return;
    }

    if (isStartingSpeechRef.current) return;
    isStartingSpeechRef.current = true;

    try {
      if (recognitionRef.current) {
        try { recognitionRef.current.abort(); } catch (_e) {}
        recognitionRef.current = null;
      }

      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = selectedLang;

      recognition.onstart = () => {
        isStartingSpeechRef.current = false;
        setIsListening(true);
        if (avatarState !== 'speaking' && avatarState !== 'thinking') {
          setAvatarState('listening');
        }
        initMicVisualizer();
      };

      recognition.onresult = (event) => {
        let currentTranscript = '';
        for (let i = 0; i < event.results.length; i++) {
          currentTranscript += event.results[i][0].transcript;
        }
        setTranscript(currentTranscript);
        latestTranscriptRef.current = currentTranscript;
      };

      recognition.onerror = (event) => {
        console.warn('Speech recognition event:', event.error);
        if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
          setMicPermissionDenied(true);
          micEnabledRef.current = false;
          setIsListening(false);
          setMicErrorNotice('Microphone permission was denied in your browser.');
          setTimeout(() => setMicErrorNotice(''), 6000);
        }
      };

      recognition.onend = () => {
        isStartingSpeechRef.current = false;
        if (micEnabledRef.current && !micPermissionDenied) {
          try {
            recognition.start();
          } catch (_e) {
            setTimeout(() => {
              if (micEnabledRef.current) startSpeechEngine();
            }, 250);
          }
        } else {
          setIsListening(false);
          cleanupMicVisualizer();
          if (avatarState === 'listening') {
            setAvatarState('idle');
          }
        }
      };

      recognition.start();
      recognitionRef.current = recognition;
    } catch (err) {
      console.warn('Speech recognition start error:', err);
      isStartingSpeechRef.current = false;
      if (!micEnabledRef.current) {
        setIsListening(false);
        if (avatarState === 'listening') setAvatarState('idle');
      }
    }
  };

  // Explicit User Control: Turn Mic ON (Stays ON until user turns it OFF)
  const turnMicOn = () => {
    if (micPermissionDenied) return;
    micEnabledRef.current = true;
    setIsListening(true);
    getOrCreateAudioContext();
    startSpeechEngine();
  };

  // Explicit User Control: Turn Mic OFF (Stays OFF until user turns it ON)
  const turnMicOff = () => {
    micEnabledRef.current = false;
    isStartingSpeechRef.current = false;
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (_e) {}
      recognitionRef.current = null;
    }
    cleanupMicVisualizer();
    setIsListening(false);
    setMicVolume(0);
    if (avatarState === 'listening') {
      setAvatarState('idle');
    }
  };

  // Toggle Mic ON / OFF
  const toggleMic = () => {
    if (micEnabledRef.current || isListening) {
      turnMicOff();
    } else {
      turnMicOn();
    }
  };
  const toggleListening = toggleMic;

  // Spacebar Keyboard Shortcut to Toggle Mic ON / OFF
  useEffect(() => {
    const handleGlobalKey = (e) => {
      if (!isOpen) return;
      if (e.key === 'Escape') {
        onClose();
        return;
      }
      const activeTag = document.activeElement ? document.activeElement.tagName.toLowerCase() : '';
      if (activeTag === 'input' || activeTag === 'textarea' || activeTag === 'select') return;
      if (e.code === 'Space' || e.key === ' ') {
        e.preventDefault();
        toggleMic();
      }
    };
    window.addEventListener('keydown', handleGlobalKey);
    return () => window.removeEventListener('keydown', handleGlobalKey);
  }, [isOpen, isListening, onClose]);

  // Immediate Cancellation & Audio Stop
  const handleStopSpeech = () => {
    if (abortControllerRef.current) {
      try {
        abortControllerRef.current.abort();
      } catch (e) {}
      abortControllerRef.current = null;
    }

    audioQueueRef.current = [];
    isPlayingAudioRef.current = false;
    isStreamActiveRef.current = false;

    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }

    if (currentAudioSourceRef.current) {
      try {
        currentAudioSourceRef.current.stop();
      } catch (e) {}
      currentAudioSourceRef.current = null;
    }

    if (speakerSyncFrameRef.current) {
      cancelAnimationFrame(speakerSyncFrameRef.current);
      speakerSyncFrameRef.current = null;
    }
    if (fallbackIntervalRef.current) {
      clearInterval(fallbackIntervalRef.current);
      fallbackIntervalRef.current = null;
    }

    setAvatarState('idle');
    setSpeakerAudioLevel(0);
    setCurrentWordIndex(-1);
    setCurrentViseme(null);
  };

  // Enqueue Incoming Neural Audio Chunk into FIFO Queue
  const enqueueAudioChunk = (chunkData) => {
    if (!chunkData) return;
    audioQueueRef.current.push(chunkData);
    processAudioQueue();
  };

  // Process FIFO Audio Queue Sequentially without Gaps
  const processAudioQueue = async () => {
    if (isPlayingAudioRef.current) {
      return;
    }

    if (audioQueueRef.current.length === 0) {
      if (!isStreamActiveRef.current) {
        setAvatarState('idle');
        setSpeakerAudioLevel(0);
        setCurrentWordIndex(-1);
        setCurrentViseme(null);
      }
      return;
    }

    const nextChunk = audioQueueRef.current.shift();
    if (!nextChunk) return;

    isPlayingAudioRef.current = true;
    setAvatarState('speaking');

    if (!hasSpokenFirstChunkRef.current) {
      hasSpokenFirstChunkRef.current = true;
      const elapsed = Date.now() - activeRequestStartTimeRef.current;
      console.log(`🚀 [AVATAR STARTED SPEAKING FIRST CHUNK] at ${elapsed}ms`);
    }

    await playSingleAudioChunk(nextChunk);
  };

  // Play Single Audio Chunk with 60FPS Lip-Sync & Multi-Tier Fallbacks
  const playSingleAudioChunk = async (chunk) => {
    const { text, audio_base64 } = chunk;

    if (!audio_base64) {
      speakBrowserChunk(text, () => {
        isPlayingAudioRef.current = false;
        processAudioQueue();
      });
      return;
    }

    try {
      const audioCtx = await getOrCreateAudioContext();

      if (!audioCtx) {
        throw new Error('AudioContext unavailable');
      }

      const binaryString = window.atob(audio_base64);
      const len = binaryString.length;
      const bytes = new Uint8Array(len);
      for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }

      const audioBuffer = await audioCtx.decodeAudioData(bytes.buffer);
      const words = (text || '').trim().split(/\s+/);
      setWordsList(words);
      setCurrentWordIndex(0);

      const source = audioCtx.createBufferSource();
      source.buffer = audioBuffer;
      source.playbackRate.value = speechRate;

      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 256;
      analyser.smoothingTimeConstant = 0.85;

      source.connect(analyser);
      analyser.connect(audioCtx.destination);
      currentAudioSourceRef.current = source;

      const freqData = new Uint8Array(analyser.frequencyBinCount);
      const audioStartTime = audioCtx.currentTime;
      const audioDuration = audioBuffer.duration / speechRate;

      let endedHandled = false;
      const onEndedHandler = () => {
        if (endedHandled) return;
        endedHandled = true;
        if (speakerSyncFrameRef.current) {
          cancelAnimationFrame(speakerSyncFrameRef.current);
          speakerSyncFrameRef.current = null;
        }
        isPlayingAudioRef.current = false;
        processAudioQueue();
      };

      const updateLipSync = () => {
        if (endedHandled || !speakerAudioCtxRef.current) return;

        const currentElapsed = audioCtx.currentTime - audioStartTime;
        if (currentElapsed >= audioDuration) {
          onEndedHandler();
          return;
        }

        if (words.length > 0 && audioDuration > 0) {
          const progress = Math.min(1.0, Math.max(0, currentElapsed / audioDuration));
          const wIdx = Math.min(words.length - 1, Math.floor(progress * words.length));
          setCurrentWordIndex(wIdx);
        }

        analyser.getByteFrequencyData(freqData);
        let lowEnergy = 0;
        let midEnergy = 0;
        let highEnergy = 0;

        for (let i = 0; i < 8; i++) lowEnergy += freqData[i];
        for (let i = 8; i < 32; i++) midEnergy += freqData[i];
        for (let i = 32; i < 64; i++) highEnergy += freqData[i];

        lowEnergy /= (8 * 255);
        midEnergy /= (24 * 255);
        highEnergy /= (32 * 255);

        const liveLevel = Math.min(1.0, (lowEnergy * 0.45 + midEnergy * 0.45 + highEnergy * 0.10) * 1.6);
        setSpeakerAudioLevel(liveLevel);

        if (liveLevel > 0.08) {
          if (highEnergy > lowEnergy * 1.15) {
            setCurrentViseme({ shape: 'spread_smile' });
          } else if (lowEnergy > highEnergy * 1.25) {
            setCurrentViseme({ shape: 'rounded_o' });
          } else {
            setCurrentViseme({ shape: 'open_wide' });
          }
        } else {
          setCurrentViseme({ shape: 'closed_mbp' });
        }

        speakerSyncFrameRef.current = requestAnimationFrame(updateLipSync);
      };

      source.onended = onEndedHandler;
      source.start(0);
      updateLipSync();

      setTimeout(() => {
        if (!endedHandled) {
          onEndedHandler();
        }
      }, (audioDuration * 1000) + 350);

    } catch (err) {
      console.warn('Web Audio decode failed, falling back to HTML5 Audio Element:', err);
      try {
        const audio = new Audio(`data:audio/mp3;base64,${audio_base64}`);
        audio.playbackRate = speechRate;
        audio.onplay = () => {
          setAvatarState('speaking');
          setSpeakerAudioLevel(0.7);
        };
        audio.onended = () => {
          isPlayingAudioRef.current = false;
          processAudioQueue();
        };
        audio.onerror = () => {
          speakBrowserChunk(text, () => {
            isPlayingAudioRef.current = false;
            processAudioQueue();
          });
        };
        const playPromise = audio.play();
        if (playPromise !== undefined) {
          playPromise.catch((e) => {
            console.warn('HTML5 Audio play rejected, falling back to Browser Speech:', e);
            speakBrowserChunk(text, () => {
              isPlayingAudioRef.current = false;
              processAudioQueue();
            });
          });
        }
      } catch (audioElErr) {
        speakBrowserChunk(text, () => {
          isPlayingAudioRef.current = false;
          processAudioQueue();
        });
      }
    }
  };

  // Browser Speech Synthesis for a Single Chunk
  const speakBrowserChunk = (textToSpeak, onComplete) => {
    if (!('speechSynthesis' in window) || !textToSpeak) {
      if (onComplete) onComplete();
      return;
    }

    const words = textToSpeak.trim().split(/\s+/);
    setWordsList(words);
    setCurrentWordIndex(-1);

    const cleanSpeech = textToSpeak.replace(/[\*\#\_`~]/g, '').replace(/\s+/g, ' ').trim();
    const utterance = new SpeechSynthesisUtterance(cleanSpeech);
    utterance.rate = speechRate;
    utterance.pitch = speechPitch;
    utterance.lang = selectedLang;

    if (availableVoices.length > 0) {
      const targetPrefix = selectedLang.toLowerCase().split('-')[0];
      const matchingVoice = availableVoices.find(v => v.lang.toLowerCase().replace('_', '-').startsWith(targetPrefix)) || availableVoices[selectedVoiceIndex];
      if (matchingVoice) {
        utterance.voice = matchingVoice;
      }
    }
    
    let wordIdx = 0;
    utterance.onstart = () => {
      setAvatarState('speaking');
      setCurrentWordIndex(0);
      setSpeakerAudioLevel(0.7);
    };

    utterance.onboundary = (event) => {
      if (event.name === 'word') {
        setCurrentWordIndex(wordIdx);
        setSpeakerAudioLevel(0.5 + Math.random() * 0.4);
        setCurrentViseme({ shape: wordIdx % 2 === 0 ? 'open_wide' : 'spread_smile' });
        wordIdx++;
      }
    };

    utterance.onend = () => {
      setSpeakerAudioLevel(0);
      setCurrentViseme(null);
      if (onComplete) onComplete();
    };

    utterance.onerror = () => {
      if (onComplete) onComplete();
    };

    window.speechSynthesis.speak(utterance);
  };

  // Re-play Current Spoken Answer
  const handlePlaySpokenAnswer = async (textToPlay) => {
    const rawText = (typeof textToPlay === 'string' ? textToPlay : spokenText || '').trim();
    if (!rawText) return;

    await getOrCreateAudioContext();
    handleStopSpeech();

    const sentenceMatches = rawText.match(/([^.?!।॥\n]+[.?!।॥\n]+|[^.?!।॥\n]+$)/g);
    const sentences = (sentenceMatches || [rawText])
      .map(s => s.trim())
      .filter(s => s.length > 0);

    if (sentences.length === 0) return;

    isStreamActiveRef.current = true;
    activeRequestStartTimeRef.current = Date.now();
    hasSpokenFirstChunkRef.current = false;
    audioQueueRef.current = [];

    if (useNeuralVoice) {
      try {
        setIsProcessing(true);
        for (let i = 0; i < sentences.length; i++) {
          const sent = sentences[i];
          const audioB64 = await fetchNeuralSpeechAudio({
            text: sent,
            language: selectedLang
          });
          enqueueAudioChunk({
            text: sent,
            audio_base64: audioB64,
            chunk_index: i
          });
        }
      } catch (err) {
        console.warn('Neural TTS synthesis for play failed, using browser speech fallback:', err);
        for (let i = 0; i < sentences.length; i++) {
          enqueueAudioChunk({
            text: sentences[i],
            audio_base64: null,
            chunk_index: i
          });
        }
      } finally {
        setIsProcessing(false);
        isStreamActiveRef.current = false;
      }
    } else {
      for (let i = 0; i < sentences.length; i++) {
        enqueueAudioChunk({
          text: sentences[i],
          audio_base64: null,
          chunk_index: i
        });
      }
      isStreamActiveRef.current = false;
    }
  };

  // Submit Query with Incremental Sentence Streaming & Immediate First-Chunk Speech
  const handleExecuteQuery = async (queryToSend) => {
    if (autoSubmitTimerRef.current) {
      clearTimeout(autoSubmitTimerRef.current);
      autoSubmitTimerRef.current = null;
    }

    const cleanQ = (queryToSend || transcript).trim();
    if (!cleanQ) return;

    // Immediately turn OFF microphone on Enter / Auto-Enter / Query Execution
    turnMicOff();

    getOrCreateAudioContext();
    handleStopSpeech();

    setTranscript('');
    setIsProcessing(true);
    setAvatarState('thinking');

    const controller = new AbortController();
    abortControllerRef.current = controller;
    activeRequestStartTimeRef.current = Date.now();
    hasSpokenFirstChunkRef.current = false;
    isStreamActiveRef.current = true;
    audioQueueRef.current = [];
    isPlayingAudioRef.current = false;

    console.log(`⏱️ [AI REQUEST STARTED] Query: "${cleanQ}" (Lang: ${selectedLang})`);

    const instantAcks = {
      'hi-IN': 'हाँ मेरे बच्चे, मैं आपकी बात समझ रहा हूँ...',
      'pa-IN': 'ਹਾਂ ਮੇਰੇ ਬੱਚੇ, ਮੈਂ ਤੁਹਾਡੀ ਗੱਲ ਧਿਆਨ ਨਾਲ ਸੁਣ ਰਿਹਾ ਹਾਂ...',
      'bn-IN': 'হ্যাঁ আমার সন্তান, আমি তোমার কথা শুনছি...',
      'ta-IN': 'ஆம் என் குழந்தையே, நான் உங்கள் கவலையை கவனிக்கிறேன்...',
      'en-IN': 'Yes, my child, let me share our traditional guidance with you...'
    };
    setSpokenText(instantAcks[selectedLang] || instantAcks['en-IN']);

    try {
      await askAvatarChatStream({
        query: cleanQ,
        persona: 'genji',
        language: selectedLang,
        search_enabled: true,
        signal: controller.signal,
        onStart: (data) => {
          const elapsed = Date.now() - activeRequestStartTimeRef.current;
          console.log(`⏱️ [START EVENT] at ${elapsed}ms: ${data.acknowledgement}`);
          if (data.acknowledgement) {
            setSpokenText(data.acknowledgement);
          }
        },
        onTextChunk: (data) => {
          const elapsed = Date.now() - activeRequestStartTimeRef.current;
          console.log(`⏱️ [FIRST SENTENCE / TEXT CHUNK #${data.chunk_index}] at ${elapsed}ms: "${data.text}"`);
          if (data.accumulated) {
            setSpokenText(data.accumulated);
          }
        },
        onAudioChunk: (data) => {
          const elapsed = Date.now() - activeRequestStartTimeRef.current;
          console.log(`🔊 [AUDIO CHUNK #${data.chunk_index} RECEIVED] at ${elapsed}ms -> enqueuing to FIFO player`);
          enqueueAudioChunk(data);
        },
        onStreamDone: (data) => {
          const elapsed = Date.now() - activeRequestStartTimeRef.current;
          console.log(`✅ [STREAM COMPLETED] at ${elapsed}ms | Total chunks: ${data.total_chunks}`);
          isStreamActiveRef.current = false;
          setIsProcessing(false);
          if (data.full_text) {
            setSpokenText(data.full_text);
          }
          if (audioQueueRef.current.length === 0 && !isPlayingAudioRef.current) {
            setAvatarState('idle');
          }
        },
        onError: async (err) => {
          console.warn('Streaming fallback triggered:', err);
          isStreamActiveRef.current = false;
          setIsProcessing(false);
          if (!hasSpokenFirstChunkRef.current) {
            try {
              const res = await askAvatarChat({
                query: cleanQ,
                persona: 'genji',
                language: selectedLang,
                search_enabled: true
              });
              const displayAns = res.spoken_text || res.response || 'I have analyzed your inquiry, my child.';
              setSpokenText(displayAns);
              enqueueAudioChunk({ text: displayAns, audio_base64: res.audio_base64, visemes: res.visemes });
            } catch (e) {
              const fallbackMsg = 'Our traditional wisdom holds timeless guidance for this path, my child.';
              setSpokenText(fallbackMsg);
              enqueueAudioChunk({ text: fallbackMsg, audio_base64: null });
            }
          }
        }
      });
    } catch (err) {
      if (err.name !== 'AbortError') {
        console.error('Avatar query error:', err);
        const fallbackMsg = 'Our traditional wisdom holds timeless guidance for this path, my child.';
        setSpokenText(fallbackMsg);
        enqueueAudioChunk({ text: fallbackMsg, audio_base64: null });
      }
      setIsProcessing(false);
      isStreamActiveRef.current = false;
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleExecuteQuery();
    }
  };

  const handleLanguageChange = async (newLang) => {
    setSelectedLang(newLang);
    handleStopSpeech();

    const greetings = {
      'hi-IN': 'सादर प्रणाम और बहुत सारा आशीर्वाद, मेरे बच्चे। मैं सरदार गेंजी हूँ। बताइए आज आप किस समस्या का सामना कर रहे हैं, हम मिलकर पारंपरिक और वैज्ञानिक समाधान निकालेंगे।',
      'pa-IN': 'ਸਤਿ ਸ੍ਰੀ ਅਕਾਲ ਅਤੇ ਬਹੁਤ ਸਾਰਾ ਪਿਆਰ, ਮੇਰੇ ਬੱਚੇ। ਮੈਂ ਸਰਦਾਰ ਗੇਂਜੀ ਹਾਂ। ਦੱਸੋ ਅੱਜ ਤੁਸੀਂ ਕਿਹੜੀ ਮੁਸ਼ਕਲ ਦਾ ਸਾਹਮਣਾ ਕਰ ਰਹੇ ਹੋ, ਆਪਾਂ ਰਲ ਕੇ ਹੱਲ ਲੱਭਾਂਗੇ।',
      'en-IN': 'Greetings and warm blessings, my child. I am Sardar Genji. Share with me what is in your heart today, and we will find a peaceful, time-tested traditional remedy together.',
      'bn-IN': 'নমস্কার এবং অনেক আশীর্বাদ, আমার সন্তান। আমি সরদার গেঞ্জি। বলো আজ তুমি কী ধরনের সমস্যা অনুভব করছ, আমরা ঐতিহ্যবাহী প্রতিকার খুঁজে নেব।',
      'ta-IN': 'வணக்கம் மற்றும் என் ஆசிகள், என் குழந்தையே. நான் சர்தார் கெஞ்சி. இன்று உங்கள் மனதில் உள்ளதை என்னிடம் பகிர்ந்து கொள்ளுங்கள், பாரம்பரிய தீர்வை காண்போம்.'
    };

    const greet = greetings[newLang] || greetings['en-IN'];
    setSpokenText(greet);
  };

  if (!isOpen) return null;

  const currentLangObj = SUPPORTED_LANGUAGES.find(l => l.code === selectedLang) || SUPPORTED_LANGUAGES[0];

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#080605]/85 backdrop-blur-md p-3 sm:p-5 selection:bg-orange-600 selection:text-white animate-fadeIn"
      role="dialog"
      aria-modal="true"
      aria-labelledby="voice-avatar-title"
    >
      {/* Background Ambient Radial Glow matching Setu_Avatar */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-amber-600/10 rounded-full blur-3xl animate-pulse-glow" />
        <div className="absolute top-10 right-1/4 w-[300px] h-[300px] bg-orange-600/5 rounded-full blur-2xl" />
      </div>

      {/* Main Centered Responsive Container with Zero Page Scroll */}
      <div className="relative z-10 w-full max-w-2xl sm:max-w-3xl h-full max-h-[96vh] flex flex-col justify-between items-center gap-1.5 sm:gap-2 py-1 select-none">
        
        {/* Header Strip: Close Button */}
        <div className="w-full flex items-center justify-end px-1 shrink-0 h-7 sm:h-8">
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-stone-900/85 border border-amber-500/20 text-stone-400 hover:text-white hover:bg-red-950/80 shadow-md transition-all flex items-center justify-center shrink-0 cursor-pointer pointer-events-auto active:scale-95 touch-manipulation"
            title="Close Voice Avatar (Esc)"
            aria-label="Close Voice Avatar"
          >
            <X className="w-4 h-4 sm:w-5 sm:h-5 pointer-events-none" />
          </button>
        </div>

        {/* 1. Responsive 60 FPS HTML5 Video Canvas Avatar - Shifted 30px Up */}
        <div className="flex-1 min-h-0 w-full flex items-center justify-center py-0.5 -translate-y-[30px]">
          <AvatarCanvas
            persona={selectedPersona}
            state={avatarState}
            audioLevel={speakerAudioLevel}
            isSpeaking={avatarState === 'speaking'}
            isListening={avatarState === 'listening'}
            isThinking={avatarState === 'thinking'}
            currentViseme={currentViseme}
            themeColor="#ea580c"
          />
        </div>

        {/* 2. Real-Time Dynamic Karaoke Subtitles (Fixed height & Internal text scroll) */}
        <KaraokeSubtitles
          words={wordsList}
          currentWordIndex={currentWordIndex}
          spokenText={spokenText}
          isSpeaking={avatarState === 'speaking'}
          isProcessing={isProcessing}
          onStopSpeech={handleStopSpeech}
          onPlaySpeech={() => handlePlaySpokenAnswer(spokenText)}
          onReplaySpeech={() => handlePlaySpokenAnswer(spokenText)}
          themeColor="#ea580c"
        />

        {/* Mic Notice / Permission Alert */}
        {micErrorNotice && (
          <div className="w-full px-3 py-1 rounded-xl bg-red-950/80 border border-red-500/40 text-xs text-red-200 flex items-center gap-2 animate-fadeIn shadow-lg shrink-0">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
            <span>{micErrorNotice}</span>
          </div>
        )}

        {/* 3. Bottom Unified Voice + Text Dock */}
        <div className="w-full h-[62px] sm:h-[68px] md:h-[74px] shrink-0 flex items-center gap-2 sm:gap-2.5 md:gap-3 bg-stone-900/90 backdrop-blur-2xl border border-amber-500/30 rounded-2xl sm:rounded-3xl p-2 sm:p-2.5 md:p-3 shadow-2xl transition-all focus-within:border-orange-500/70 focus-within:ring-2 focus-within:ring-orange-500/20">
          {/* Mic Trigger */}
          <button
            type="button"
            onClick={toggleListening}
            disabled={isProcessing || micPermissionDenied || !speechSupported}
            className={`relative p-3 sm:p-3.5 md:p-3.5 rounded-xl sm:rounded-2xl flex items-center justify-center transition-all duration-300 shrink-0 ${
              isListening
                ? 'bg-gradient-to-tr from-emerald-600 to-teal-500 text-white shadow-lg shadow-emerald-600/40 animate-pulse'
                : micPermissionDenied || !speechSupported
                ? 'bg-stone-800 text-stone-500 cursor-not-allowed opacity-50'
                : 'bg-stone-800/80 hover:bg-stone-700 text-amber-200 border border-amber-500/20 hover:border-amber-500/40 cursor-pointer'
            }`}
            title={
              !speechSupported
                ? 'Speech recognition not supported in this browser'
                : micPermissionDenied
                ? 'Microphone permission denied'
                : isListening
                ? 'Stop listening'
                : 'Start speaking (Hands-Free with Space)'
            }
          >
            {isListening ? (
              <MicOff className="w-4 h-4 sm:w-5 sm:h-5 md:w-5 md:h-5 text-white" />
            ) : (
              <Mic className="w-4 h-4 sm:w-5 sm:h-5 md:w-5 md:h-5 text-orange-400" />
            )}

            {/* Mic Audio volume pulse ring */}
            {isListening && (
              <span
                className="mic-pulse-ring"
                style={{ transform: `scale(${1 + micVolume * 0.45})` }}
              />
            )}
          </button>

          {/* Compact Multi-Language Selector Pill near Mic */}
          <div className="flex items-center gap-1.5 bg-stone-800/90 hover:bg-stone-800 px-2.5 sm:px-3 py-2 sm:py-2.5 rounded-xl sm:rounded-2xl border border-amber-500/25 shadow-sm transition-all shrink-0">
            <Globe className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-orange-400 shrink-0" />
            <select
              id="language-select-bar"
              value={selectedLang}
              onChange={(e) => handleLanguageChange(e.target.value)}
              className="bg-transparent text-xs sm:text-sm font-semibold text-amber-200 focus:outline-none cursor-pointer pr-0.5"
              aria-label="Select Language"
            >
              {SUPPORTED_LANGUAGES.map((lang) => (
                <option
                  key={lang.code}
                  value={lang.code}
                  className="bg-stone-950 text-stone-100 py-1"
                >
                  {lang.name}
                </option>
              ))}
            </select>
          </div>

          {/* Text Input */}
          <input
            ref={inputRef}
            type="text"
            value={transcript}
            onChange={(e) => setTranscript(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={
              isListening
                ? `Listening in ${currentLangObj.native}... Speak now.`
                : !speechSupported || micPermissionDenied
                ? `Type question in ${currentLangObj.native}...`
                : `Ask in ${currentLangObj.native} or type question...`
            }
            className="flex-1 min-w-0 bg-transparent border-none outline-none text-stone-100 text-sm sm:text-base md:text-lg px-2 sm:px-3 placeholder:text-stone-500 font-medium"
          />

          {/* Clear text button */}
          {transcript && (
            <button
              type="button"
              onClick={() => setTranscript('')}
              className="p-2 text-stone-400 hover:text-stone-200 rounded-full transition-colors shrink-0 cursor-pointer"
              title="Clear text"
            >
              <X className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
            </button>
          )}

          {/* Send / Execute Button */}
          <button
            type="button"
            onClick={() => handleExecuteQuery()}
            disabled={!transcript.trim() || isProcessing}
            className="btn-action-primary !p-3 sm:!p-3.5 md:!p-3.5 !rounded-xl sm:!rounded-2xl disabled:opacity-30 disabled:pointer-events-none shrink-0 cursor-pointer shadow-lg"
            title="Ask Avatar"
          >
            {isProcessing ? (
              <RefreshCw className="w-4 h-4 sm:w-5 sm:h-5 animate-spin text-white" />
            ) : (
              <Send className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
