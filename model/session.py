import json

# In-memory store: { session_id: [{"role": ..., "content": ...}] }
_sessions: dict[str, list] = {}

MAX_HISTORY_TURNS = 10  # 5 user + 5 assistant messages


def get_history(session_id: str) -> list:
    """Returns the conversation history for a session. Empty list if new session."""
    return _sessions.get(session_id, [])


def save_history(session_id: str, user_message: str, assistant_result: dict) -> None:
    """Appends the latest turn to the session history and enforces the cap."""
    history = _sessions.get(session_id, [])

    history.append({"role": "user", "content": user_message})
    history.append({"role": "assistant", "content": json.dumps(assistant_result)})

    # Keep only the last MAX_HISTORY_TURNS messages
    _sessions[session_id] = history[-MAX_HISTORY_TURNS:]


def clear_session(session_id: str) -> None:
    """Clears the history for a session. Call this when a ticket is created."""
    _sessions.pop(session_id, None)


def get_all_sessions() -> list[str]:
    """Returns all active session IDs. Useful for debugging."""
    return list(_sessions.keys())
