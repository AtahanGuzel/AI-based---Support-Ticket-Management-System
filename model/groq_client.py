import os
import json
from groq import Groq
from dotenv import load_dotenv
from prompts import SYSTEM_PROMPT

load_dotenv()

client = Groq(api_key=os.environ.get("GROQ_API_KEY"))


def analyze(user_message: str, history: list = None) -> dict:
    """
    Sends a user message to Llama 3.3 70B and returns parsed JSON.

    Args:
        user_message: The raw message from the user.
        history: Optional list of previous messages for conversation context.
                 Format: [{"role": "user"|"assistant", "content": "..."}]

    Returns:
        Parsed JSON dict matching the helpdesk schema.
    """
    messages = [{"role": "system", "content": SYSTEM_PROMPT}]

    if history:
        messages.extend(history)

    messages.append({"role": "user", "content": user_message})

    response = client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        messages=messages,
        temperature=0.2,       # low temp for consistent structured output
        max_tokens=512,
        response_format={"type": "json_object"},  # forces JSON output at API level
    )

    raw = response.choices[0].message.content

    try:
        return json.loads(raw)
    except json.JSONDecodeError as e:
        # Fallback: return error payload instead of crashing
        return {
            "intent": "clarify",
            "department": None,
            "urgency": 1,
            "clarification_question": None,
            "kb_query": None,
            "duplicate_of": None,
            "response_to_user": "Sorry, I encountered an error processing your request. Please try again.",
            "_error": f"JSON parse failed: {str(e)}",
            "_raw": raw
        }


if __name__ == "__main__":
    # Quick manual tests — run with: python groq_client.py
    test_cases = [
        "I can't connect to VPN",
        "something is broken",
        "my VPN keeps disconnecting every few minutes",
        "I haven't received my paycheck this month",
        "the entire office network is down, nobody can work",
    ]

    for msg in test_cases:
        print(f"\nInput: {msg}")
        result = analyze(msg)
        print(json.dumps(result, indent=2))
        print("-" * 50)