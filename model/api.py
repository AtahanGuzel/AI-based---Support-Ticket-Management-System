from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from groq_client import analyze
from session import get_history, save_history, clear_session
from rag.knowledge_base import query_knowledge_base, seed_knowledge_base
from rag.duplicate import check_duplicate, store_ticket, seed_open_tickets

app = FastAPI(title="IT Helpdesk AI Service")

from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Seed ChromaDB collections on startup
@app.on_event("startup")
def startup():
    seed_knowledge_base()
    seed_open_tickets()


# --- Request / Response Models ---

class AnalyzeRequest(BaseModel):
    user_id: str
    session_id: str
    message: str


class StoreTicketRequest(BaseModel):
    ticket_id: str
    message: str


class AnalyzeResponse(BaseModel):
    intent: str
    department: str | None
    urgency: int
    clarification_question: str | None
    kb_query: str | None
    duplicate_of: str | None
    response_to_user: str
    kb_title: str | None = None

# --- Endpoints ---

@app.delete("/ai/ticket/{ticket_id}")
def remove_ticket_endpoint(ticket_id: str):
    from rag.duplicate import remove_ticket
    remove_ticket(ticket_id)
    return {"message": f"Ticket {ticket_id} removed from duplicate detection."}



@app.post("/ai/analyze", response_model=AnalyzeResponse)
def analyze_endpoint(request: AnalyzeRequest):
    # 1. Retrieve existing history for this session
    history = get_history(request.session_id)

    # 2. Call the AI model
    result = analyze(request.message, history)

    # 3. Check for internal errors from groq_client fallback
    if "_error" in result:
        raise HTTPException(status_code=500, detail=result["_error"])

    # 4. RAG — query knowledge base if model produced a kb_query
    kb_query = result.get("kb_query")
    if kb_query and result.get("intent") != "clarify":
        kb_match = query_knowledge_base(kb_query)
        if kb_match:
            result["intent"] = "suggest_solution"
            result["kb_title"] = kb_match["problem"]
            result["response_to_user"] = kb_match["solution"]

    # 5. Duplicate detection — only for create_ticket intent
    # 5. Duplicate detection — only for create_ticket intent
    if result.get("intent") == "create_ticket":
        duplicate_id = check_duplicate(request.message)
        if duplicate_id:
            result["duplicate_of"] = duplicate_id
            result["intent"] = "duplicate_found"
            result["response_to_user"] = (
                f"There is already an open ticket ({duplicate_id}) for a similar issue. "
                f"You can follow up on that ticket instead of creating a new one."
            )

    # 6. Save this turn to session history
    save_history(request.session_id, request.message, result)

    # 7. Clear session when conversation is resolved
    if result.get("intent") in ("create_ticket", "suggest_solution", "duplicate_found"):

        clear_session(request.session_id)

    return result


@app.post("/ai/store_ticket")
def store_ticket_endpoint(request: StoreTicketRequest):
    """
    Called by the backend after a ticket is officially created.
    Stores the ticket embedding for future duplicate detection.
    """
    store_ticket(request.ticket_id, request.message)
    return {"message": f"Ticket {request.ticket_id} stored for duplicate detection."}


@app.delete("/ai/session/{session_id}")
def delete_session(session_id: str):
    """Manually clear a session."""
    clear_session(session_id)
    return {"message": f"Session {session_id} cleared."}


@app.get("/health")
def health():
    return {"status": "ok"}
