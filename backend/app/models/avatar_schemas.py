from datetime import datetime, timezone
from enum import Enum
from typing import List, Dict, Any, Optional
from pydantic import BaseModel, Field


class IntentType(str, Enum):
    CASUAL_CHAT = "CASUAL_CHAT"
    SETU_KNOWLEDGE = "SETU_KNOWLEDGE"
    WEB_SEARCH = "WEB_SEARCH"
    MEMORY_RECALL = "MEMORY_RECALL"
    HYBRID = "HYBRID"


class MemoryType(str, Enum):
    SHORT_TERM_MEMORY = "SHORT_TERM_MEMORY"
    LONG_TERM_MEMORY = "LONG_TERM_MEMORY"
    EPISODIC_MEMORY = "EPISODIC_MEMORY"
    SEMANTIC_MEMORY = "SEMANTIC_MEMORY"


class LifeEventType(str, Enum):
    AVATAR_CREATED = "AVATAR_CREATED"
    FIRST_CONVERSATION = "FIRST_CONVERSATION"
    FIRST_USER_INTERACTION = "FIRST_USER_INTERACTION"
    FIRST_KNOWLEDGE_LEARNED = "FIRST_KNOWLEDGE_LEARNED"
    KNOWLEDGE_CONTRIBUTED = "KNOWLEDGE_CONTRIBUTED"
    IMPORTANT_CONVERSATION = "IMPORTANT_CONVERSATION"
    NEW_EXPERIENCE = "NEW_EXPERIENCE"
    MILESTONE = "MILESTONE"


class AvatarState(str, Enum):
    IDLE = "IDLE"
    LISTENING = "LISTENING"
    THINKING = "THINKING"
    LEARNING = "LEARNING"
    SPEAKING = "SPEAKING"
    ERROR = "ERROR"


# ----------------- Core Data Models -----------------

class Message(BaseModel):
    id: Optional[str] = None
    role: str = Field(..., description="'user', 'avatar', or 'system'")
    content: str
    timestamp: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())


class Conversation(BaseModel):
    id: str
    userId: str
    messages: List[Message] = []
    createdAt: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    updatedAt: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())


class MemoryItem(BaseModel):
    id: str
    userId: str
    type: MemoryType = MemoryType.EPISODIC_MEMORY
    summary: str
    importance: float = Field(0.5, ge=0.0, le=1.0)
    source: Optional[str] = "user_conversation"
    createdAt: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    lastAccessedAt: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    accessCount: int = 0


class LifeEventItem(BaseModel):
    id: str
    type: LifeEventType
    description: str
    timestamp: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    source: str = "system"
    importance: float = Field(0.8, ge=0.0, le=1.0)
    metadata: Dict[str, Any] = {}


class KnowledgeItem(BaseModel):
    id: str
    documentId: str
    title: str
    category: str
    content: str
    state: Optional[str] = "All India"
    district: Optional[str] = None
    language: Optional[str] = "English"
    sourceType: str = "Traditional Heritage"
    contributorId: Optional[str] = "system"
    verified: bool = True
    createdAt: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())


class KnowledgeContribution(BaseModel):
    id: str
    userId: str
    title: str
    category: str
    content: str
    state: Optional[str] = None
    district: Optional[str] = None
    language: Optional[str] = "English"
    sourceType: str = "User Contributed"
    status: str = "confirmed"  # 'pending', 'confirmed', 'verified'
    createdAt: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())


# ----------------- API Requests & Responses -----------------

class AvatarChatRequest(BaseModel):
    # Support both new payload ('message', 'userId') and existing frontend ('query')
    query: Optional[str] = Field(None, description="User voice or text query")
    message: Optional[str] = Field(None, description="Alternative key for query")
    userId: Optional[str] = Field("guest_user", description="Unique user identifier")
    conversationId: Optional[str] = Field(None, description="Conversation session ID")
    persona: Optional[str] = Field("genji", description="Avatar persona ID")
    language: Optional[str] = Field("en-IN", description="Language code")
    search_enabled: Optional[bool] = Field(True, description="Whether web search is allowed")


class SourceItem(BaseModel):
    type: Optional[str] = "web"
    title: str
    url: Optional[str] = "#"
    snippet: Optional[str] = ""
    documentId: Optional[str] = None
    category: Optional[str] = None
    verified: Optional[bool] = None


class AvatarChatResponse(BaseModel):
    query: str
    spoken_text: str  # Pristine display text for UI & subtitles
    response: str     # Pristine display text
    tts_text: str = "" # Phonetically processed pronunciation text for TTS speech engine
    ssml_text: Optional[str] = None
    debug_tts: Optional[Dict[str, Any]] = None
    visemes: List[Dict[str, Any]] = []
    intent: IntentType
    state: AvatarState = AvatarState.SPEAKING
    memoryCreated: bool = False
    lifeEventCreated: bool = False
    knowledgeLearned: bool = False
    suggestPreservation: bool = False
    extractedKnowledge: Optional[Dict[str, Any]] = None
    sources: List[Dict[str, Any]] = []
    word_count: int = 0
    sentence_count: int = 0
    persona: str = "genji"
    userId: str = "guest_user"
    conversationId: str = ""
    search_performed: bool = False
    latency_ms: float = 0.0
    audio_base64: Optional[str] = None


class MemoryCreateRequest(BaseModel):
    userId: str
    type: MemoryType = MemoryType.LONG_TERM_MEMORY
    summary: str
    importance: float = 0.8


class KnowledgeContributeRequest(BaseModel):
    userId: str = "guest_user"
    title: str
    category: str
    content: str
    state: Optional[str] = None
    district: Optional[str] = None
    language: Optional[str] = "English"
    sourceType: str = "User Contributed"


class KnowledgeConfirmRequest(BaseModel):
    userId: str = "guest_user"
    title: str
    category: str
    content: str
    state: Optional[str] = None
    district: Optional[str] = None
    language: Optional[str] = "English"


class TTSRequest(BaseModel):
    text: str
    language: Optional[str] = "en-IN"
    voice_gender: Optional[str] = "male"


class STTRequest(BaseModel):
    audio_base64: str
    language: Optional[str] = "en-IN"


class AvatarStatsResponse(BaseModel):
    avatarName: str = "Setu Avatar"
    role: str = "AI Knowledge Bridge"
    createdAt: str
    ageDays: int
    totalInteractions: int
    totalMemories: int
    totalKnowledgeLearned: int
    totalMilestones: int
    milestones: List[str] = []
    activeUsersCount: int = 1
