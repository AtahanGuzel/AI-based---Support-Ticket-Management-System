from rag.chromadb_client import get_knowledge_base

# Similarity threshold — tune this during Phase 5 testing
KB_SIMILARITY_THRESHOLD = 0.65

# -------------------------------------------------------------------
# Seed Data
# Each entry: id, problem description, solution, department
# -------------------------------------------------------------------
KB_ENTRIES = [
    # IT — Network & Connectivity
    {
        "id": "KB-001",
        "problem": "VPN not connecting or keeps disconnecting",
        "solution": "Restart the VPN client. If the issue persists, check your network adapter drivers are up to date. Try switching to a different VPN server endpoint. If still failing, reinstall the VPN client.",
        "department": "IT"
    },
    {
        "id": "KB-002",
        "problem": "No internet access or network connection lost",
        "solution": "Run ipconfig /release and ipconfig /renew in CMD. Restart your router and network adapter. Check if other devices on the same network are affected — if yes, escalate to network team.",
        "department": "IT"
    },
    {
        "id": "KB-003",
        "problem": "Cannot access shared drive or network folder",
        "solution": "Verify you are connected to the VPN if working remotely. Check if your account has permissions to the shared folder. Try mapping the drive manually via \\\\server\\share.",
        "department": "IT"
    },

    # IT — Account & Access
    {
        "id": "KB-004",
        "problem": "Cannot login to computer or account is locked",
        "solution": "Wait 15 minutes for automatic unlock after failed attempts. If still locked, contact IT to reset your account via Active Directory. Do not attempt further logins while locked.",
        "department": "IT"
    },
    {
        "id": "KB-005",
        "problem": "Forgot password or need to reset password",
        "solution": "Go to the self-service password reset portal at reset.company.com. You will need your employee ID and registered mobile number. If you cannot access the portal, call the IT helpdesk directly.",
        "department": "IT"
    },
    {
        "id": "KB-006",
        "problem": "Two-factor authentication not working or 2FA code rejected",
        "solution": "Ensure your device clock is synchronized (time drift causes 2FA failures). Re-sync your authenticator app. If using SMS, check signal. As a last resort, IT can generate a temporary bypass code.",
        "department": "IT"
    },

    # IT — Email & Communication
    {
        "id": "KB-007",
        "problem": "Cannot send or receive emails in Outlook",
        "solution": "Check your internet connection first. In Outlook, go to File > Account Settings and verify your account is connected. Try running Outlook in safe mode (outlook.exe /safe). If the issue persists, recreate your Outlook profile.",
        "department": "IT"
    },
    {
        "id": "KB-008",
        "problem": "Microsoft Teams not loading or crashing",
        "solution": "Clear the Teams cache by closing Teams and deleting contents of %appdata%\\Microsoft\\Teams. Restart Teams. If crashing continues, reinstall the application.",
        "department": "IT"
    },

    # IT — Hardware & Devices
    {
        "id": "KB-009",
        "problem": "Printer not working or cannot print",
        "solution": "Check the printer is powered on and connected to the network. Remove and re-add the printer from Windows Settings > Printers. Clear the print queue. If a network printer, verify it appears in the printer list with the correct IP.",
        "department": "IT"
    },
    {
        "id": "KB-010",
        "problem": "Computer running slow or freezing",
        "solution": "Open Task Manager and check for processes consuming high CPU or RAM. Restart the machine. Run a disk cleanup. If the issue is persistent, IT will run diagnostics and may upgrade RAM or storage.",
        "department": "IT"
    },
    {
        "id": "KB-011",
        "problem": "External monitor not detected or display issues",
        "solution": "Check the cable connection at both ends. Press Windows + P and select Extend or Duplicate. Update display drivers via Device Manager. Try a different cable or port if available.",
        "department": "IT"
    },

    # IT — Software
    {
        "id": "KB-012",
        "problem": "Software installation request or missing application",
        "solution": "Submit a software request via the IT portal. Approved software will be pushed to your machine within 1 business day. Do not attempt to install software manually without IT approval.",
        "department": "IT"
    },
    {
        "id": "KB-013",
        "problem": "Application error or software keeps crashing",
        "solution": "Note the error message and application version. Try reinstalling the application. Check if the issue occurs for other users — if yes, it may be a server-side problem. Submit a ticket with screenshots of the error.",
        "department": "IT"
    },

    # HR — Payroll & Benefits
    {
        "id": "KB-014",
        "problem": "Salary or paycheck not received on time",
        "solution": "Verify your bank account details are up to date in the HR portal. Check if there is a public holiday causing a delay. Contact HR payroll team directly if the payment is more than 2 business days late.",
        "department": "HR"
    },
    {
        "id": "KB-015",
        "problem": "Payslip missing or cannot access payslip",
        "solution": "Log into the HR self-service portal to download your payslip. Payslips are typically available by the 25th of each month. If unavailable after the 25th, contact HR.",
        "department": "HR"
    },
    {
        "id": "KB-016",
        "problem": "Annual leave request or vacation approval",
        "solution": "Submit leave requests through the HR portal at least 5 business days in advance. Your manager will receive an approval notification. Check your remaining leave balance on the HR portal dashboard.",
        "department": "HR"
    },
    {
        "id": "KB-017",
        "problem": "Sick leave or medical leave submission",
        "solution": "Notify your manager as early as possible. Submit your sick leave via the HR portal within 2 business days of returning. Medical certificates are required for absences longer than 3 consecutive days.",
        "department": "HR"
    },
    {
        "id": "KB-018",
        "problem": "New employee onboarding access or equipment setup",
        "solution": "New employee access requests must be submitted by the hiring manager 3 business days before the start date. IT will provision accounts and equipment. Contact HR if onboarding checklist items are missing.",
        "department": "HR"
    },

    # Finance — Expenses & Invoices
    {
        "id": "KB-019",
        "problem": "Expense reimbursement request or claim submission",
        "solution": "Submit expense claims via the Finance portal with receipts attached. Claims must be submitted within 30 days of the expense. Approved reimbursements are processed in the next payroll cycle.",
        "department": "Finance"
    },
    {
        "id": "KB-020",
        "problem": "Invoice submission or vendor payment request",
        "solution": "Send invoices to invoices@company.com with the purchase order number in the subject line. Payment terms are net-30 from invoice receipt. For urgent payments, contact the Finance team directly.",
        "department": "Finance"
    },
    {
        "id": "KB-021",
        "problem": "Budget approval request or budget exceeded",
        "solution": "Submit a budget exception request via the Finance portal with a business justification. Requests under $500 are approved by your manager. Requests above $500 require Finance director approval.",
        "department": "Finance"
    },
    {
        "id": "KB-022",
        "problem": "Corporate credit card issue or card declined",
        "solution": "Check your available credit limit on the Finance portal. For international transactions, notify Finance in advance. If the card is blocked, contact the Finance team to unblock it — do not contact the bank directly.",
        "department": "Finance"
    },
]


def seed_knowledge_base() -> None:
    """Seeds the KB collection with starter entries. Safe to call multiple times — skips existing IDs."""
    collection = get_knowledge_base()
    existing = collection.get()["ids"]

    new_entries = [e for e in KB_ENTRIES if e["id"] not in existing]
    if not new_entries:
        print("Knowledge base already seeded, skipping.")
        return

    collection.add(
        ids=[e["id"] for e in new_entries],
        documents=[f"{e['problem']} {e['solution']}" for e in new_entries],
        metadatas=[{"problem": e["problem"], "solution": e["solution"], "department": e["department"]} for e in new_entries]
    )
    print(f"Seeded {len(new_entries)} entries into knowledge base.")


def query_knowledge_base(kb_query: str, n_results: int = 1) -> dict | None:
    """
    Queries the KB for a matching solution.

    Returns the best match if similarity is above threshold, otherwise None.
    """
    collection = get_knowledge_base()

    results = collection.query(
        query_texts=[kb_query],
        n_results=n_results,
        include=["metadatas", "distances"]
    )

    if not results["ids"][0]:
        return None

    # ChromaDB cosine distance: 0 = identical, 1 = completely different
    # Convert to similarity: similarity = 1 - distance
    distance = results["distances"][0][0]
    similarity = 1 - distance

    if similarity < KB_SIMILARITY_THRESHOLD:
        return None

    metadata = results["metadatas"][0][0]
    return {
        "id": results["ids"][0][0],
        "problem": metadata["problem"],
        "solution": metadata["solution"],
        "department": metadata["department"],
        "similarity": round(similarity, 4)
    }


if __name__ == "__main__":
    seed_knowledge_base()

    # Quick test
    test_queries = [
        "VPN keeps dropping connection",
        "forgot my windows password",
        "haven't received my salary",
        "need to submit an expense claim",
        "my cat knocked over my monitor",  # should return None
    ]

    print("\n--- KB Query Tests ---")
    for q in test_queries:
        result = query_knowledge_base(q)
        if result:
            print(f"\nQuery: {q}")
            print(f"Match: [{result['id']}] {result['problem']} (similarity: {result['similarity']})")
            print(f"Solution: {result['solution'][:80]}...")
        else:
            print(f"\nQuery: {q}")
            print("No match found — would create ticket.")