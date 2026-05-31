from rag.chromadb_client import get_open_tickets

DUPLICATE_SIMILARITY_THRESHOLD = 0.77

SEED_TICKETS = [
    {"id": "TK-0001", "message": "I cannot connect to the VPN from home"},
    {"id": "TK-0002", "message": "My Outlook is not syncing emails"},
    {"id": "TK-0003", "message": "I need a password reset for my Windows account"},
    {"id": "TK-0004", "message": "The shared drive is not accessible"},
    {"id": "TK-0005", "message": "My laptop is running very slow and freezing"},
    {"id": "TK-0006", "message": "I have not received my salary for this month"},
    {"id": "TK-0007", "message": "Need to submit an expense reimbursement for a client dinner"},
    {"id": "TK-0008", "message": "Teams is crashing every time I try to join a meeting"},
    {"id": "TK-0009", "message": "Printer on the 3rd floor is offline"},
    {"id": "TK-0010", "message": "I need access to the new HR portal for onboarding"},
]


def seed_open_tickets() -> None:
    """Seeds open_tickets from the real backend API. Falls back to mock data."""
    import requests
    collection = get_open_tickets()
    existing_ids = set(collection.get()["ids"])

    try:
        response = requests.get("http://localhost:8000/tickets/internal/all")
        rows = response.json()

        new_tickets = [
            {"id": f"TK-{row['ticket_id']}", "message": row['description']}
            for row in rows
            if f"TK-{row['ticket_id']}" not in existing_ids
        ]

        if not new_tickets:
            print("Open tickets already seeded, skipping.")
            return

        collection.add(
            ids=[t["id"] for t in new_tickets],
            documents=[t["message"] for t in new_tickets],
            metadatas=[{"message": t["message"]} for t in new_tickets]
        )
        print(f"Seeded {len(new_tickets)} real tickets from backend API.")

    except Exception as e:
        print(f"Could not seed from backend, falling back to mock data: {e}")
        new_tickets = [t for t in SEED_TICKETS if t["id"] not in existing_ids]
        if not new_tickets:
            print("Mock tickets already seeded, skipping.")
            return
        collection.add(
            ids=[t["id"] for t in new_tickets],
            documents=[t["message"] for t in new_tickets],
            metadatas=[{"message": t["message"]} for t in new_tickets]
        )
        print(f"Seeded {len(new_tickets)} mock tickets as fallback.")


def store_ticket(ticket_id: str, message: str) -> None:
    """Stores a newly created ticket embedding in open_tickets."""
    collection = get_open_tickets()
    collection.add(
        ids=[ticket_id],
        documents=[message],
        metadatas=[{"message": message}]
    )


def remove_ticket(ticket_id: str) -> None:
    """Removes a resolved/closed ticket from duplicate detection."""
    collection = get_open_tickets()
    try:
        collection.delete(ids=[ticket_id])
        print(f"Removed {ticket_id} from duplicate detection.")
    except Exception as e:
        print(f"Could not remove {ticket_id}: {e}")


def check_duplicate(message: str) -> str | None:
    """
    Checks if an incoming message is a duplicate of an existing open ticket.
    Returns the ticket ID if a duplicate is found, otherwise None.
    """
    collection = get_open_tickets()

    if collection.count() == 0:
        return None

    results = collection.query(
        query_texts=[message],
        n_results=1,
        include=["distances"]
    )

    if not results["ids"][0]:
        return None

    distance = results["distances"][0][0]
    similarity = 1 - distance

    if similarity >= DUPLICATE_SIMILARITY_THRESHOLD:
        return results["ids"][0][0]

    return None


if __name__ == "__main__":
    seed_open_tickets()

    test_messages = [
        "I can't connect to VPN",
        "Outlook is not receiving new emails",
        "Teams keeps crashing when I open it",
        "My keyboard stopped working",
        "I want to request reimbursement for travel",
    ]

    print("\n--- Duplicate Detection Tests ---")
    for msg in test_messages:
        result = check_duplicate(msg)
        if result:
            print(f"\nMessage: {msg}")
            print(f"Duplicate of: {result}")
        else:
            print(f"\nMessage: {msg}")
            print("No duplicate found.")