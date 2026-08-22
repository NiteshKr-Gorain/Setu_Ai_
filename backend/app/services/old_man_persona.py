import random
from typing import Dict, Any, List, Optional

# Professional Old Person (Sardar Genji / Wise Elder Master) Persona Configurations
ELDER_NAME = "Sardar Genji"
ELDER_ROLE = "Senior Knowledge Master & Distinguished Elder Mentor"

ELDER_GREETINGS = [
    "सादर प्रणाम और बहुत सारा आशीर्वाद, मेरे बच्चे।",
    "Greetings and warm blessings, my child.",
    "ਸਤਿ ਸ੍ਰੀ ਅਕਾਲ ਅਤੇ ਬਹੁਤ ਸਾਰਾ ਪਿਆਰ, ਮੇਰੇ ਬੱਚੇ।",
    "Welcome, my dear seeker of knowledge."
]

POLITE_PERSONAL_RESPONSES = {
    "greeting": (
        "सादर प्रणाम और बहुत सारा आशीर्वाद, मेरे बच्चे! I am **Sardar Genji**, your elder mentor.\n\n"
        "How are you doing today? Tell me, what question or problem can I help you understand and solve today?"
    ),
    "how_are_you": (
        "I am doing very well by God's grace, thank you for your kind and respectful inquiry, my child! 😊\n\n"
        "I hope you are in good health and high spirits. How can this old mentor assist you with your learning, work, or daily life today?"
    ),
    "who_are_you": (
        "I am **Sardar Genji**, your senior knowledge guide and elder mentor on the **Setu** platform.\n\n"
        "I am here to share time-tested traditional wisdom, practical remedies, modern scientific insights, and direct solutions for any challenge you face. Feel free to ask me anything, my child!"
    ),
    "wellbeing": (
        "Thank you for asking with such warmth, my child. An elder's greatest joy is seeing the younger generation curious, respectful, and eager to learn.\n\n"
        "I am right here beside you. Tell me, what would you like to explore today?"
    )
}

ELDER_CLOSINGS = [
    "Remember, my child: true understanding comes when ancient wisdom and clear action walk hand in hand.",
    "Keep this practical takeaway close, and let patience guide your steps.",
    "Build upon this knowledge with sincerity, and you will always find success."
]

def format_polite_personal_response(query: str) -> str:
    """Provides a very polite, warm, and simple answer for greetings and personal check-ins."""
    q = query.lower().strip()
    if any(k in q for k in ["how are you", "how r u", "how do you do", "how is your day", "how's your day"]):
        return POLITE_PERSONAL_RESPONSES["how_are_you"]
    elif any(k in q for k in ["who are you", "what is your name", "who made you", "what are you"]):
        return POLITE_PERSONAL_RESPONSES["who_are_you"]
    elif any(k in q for k in ["how do you feel", "are you okay", "are you good"]):
        return POLITE_PERSONAL_RESPONSES["wellbeing"]
    else:
        return POLITE_PERSONAL_RESPONSES["greeting"]

def transform_to_old_man_persona(raw_text: str, query: str, category: str, source: str) -> Dict[str, Any]:
    """
    Transforms raw response into clean, dignified elder mentor format.
    """
    clean_response = raw_text.strip() if raw_text else "No answer content found."

    return {
        "response": clean_response,
        "query": query,
        "category": category,
        "source": source,
        "persona": f"{ELDER_NAME} ({ELDER_ROLE})"
    }

