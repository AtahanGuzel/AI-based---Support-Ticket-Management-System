import sys
import json
import os

# Works whether you run from model/ or model/test/
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from groq_client import analyze
from rag.knowledge_base import query_knowledge_base, seed_knowledge_base
from rag.duplicate import check_duplicate, seed_open_tickets

# Seed ChromaDB before running tests
seed_knowledge_base()
seed_open_tickets()

# -------------------------------------------------------------------
# Test Cases
# Each case: input message + expected output fields to validate
# None = "don't check this field"
# -------------------------------------------------------------------
TEST_CASES = [
    # --- IT: create_ticket ---
    {
        "id": "TC-001",
        "description": "Clear IT issue with no KB match",
        "message": "My keyboard is not working at all",
        "expected": {
            "intent": "create_ticket",
            "department": "IT",
            "urgency_min": 2,
            "urgency_max": 4,
            "duplicate_of": None,
        }
    },
    {
        "id": "TC-002",
        "description": "Critical IT outage — high urgency",
        "message": "The entire office network is down, no one can work",
        "expected": {
            "intent": "create_ticket",
            "department": "IT",
            "urgency_min": 4,
            "urgency_max": 5,
            "duplicate_of": None,
        }
    },
    {
        "id": "TC-003",
        "description": "IT issue — account locked",
        "message": "My account got locked after too many login attempts",
        "expected": {
            "intent": "create_ticket",
            "department": "IT",
            "urgency_min": 2,
            "urgency_max": 4,
            "duplicate_of": None,
        }
    },

    # --- IT: suggest_solution (KB matches) ---
    {
        "id": "TC-004",
        "description": "VPN issue — should match KB-001",
        "message": "I cannot connect to the VPN",
        "expected": {
            "intent": "suggest_solution",
            "department": "IT",
            "urgency_min": 2,
            "urgency_max": 4,
            "duplicate_of": None,
        }
    },
    {
        "id": "TC-005",
        "description": "Password reset — should match KB-005",
        "message": "I forgot my password and cannot log in",
        "expected": {
            "intent": "suggest_solution",
            "department": "IT",
            "urgency_min": 2,
            "urgency_max": 4,
            "duplicate_of": None,
        }
    },
    {
        "id": "TC-006",
        "description": "Outlook not working — should match KB-007",
        "message": "Outlook is not sending or receiving emails",
        "expected": {
            "intent": "suggest_solution",
            "department": "IT",
            "urgency_min": 2,
            "urgency_max": 4,
            "duplicate_of": None,
        }
    },
    {
        "id": "TC-007",
        "description": "Slow computer — should match KB-010",
        "message": "My computer is extremely slow and keeps freezing",
        "expected": {
            "intent": "suggest_solution",
            "department": "IT",
            "urgency_min": 2,
            "urgency_max": 3,
            "duplicate_of": None,
        }
    },
    {
        "id": "TC-008",
        "description": "Teams crashing — should match KB-008",
        "message": "Microsoft Teams crashes every time I open it",
        "expected": {
            "intent": "suggest_solution",
            "department": "IT",
            "urgency_min": 2,
            "urgency_max": 3,
            "duplicate_of": None,
        }
    },

    # --- IT: duplicate detection ---
    {
        "id": "TC-009",
        "description": "Duplicate of TK-0004 — shared drive",
        "message": "I cannot access the shared drive",
        "expected": {
            "intent": "create_ticket",
            "department": "IT",
            "urgency_min": 2,
            "urgency_max": 4,
            "duplicate_of": "TK-0004",
        }
    },
    {
        "id": "TC-010",
        "description": "Duplicate of TK-0009 — printer",
        "message": "The printer on the 3rd floor is not working",
        "expected": {
            "intent": "create_ticket",
            "department": "IT",
            "urgency_min": 1,
            "urgency_max": 3,
            "duplicate_of": "TK-0009",
        }
    },

    # --- HR: create_ticket ---
    {
        "id": "TC-011",
        "description": "HR — contract question",
        "message": "I have a question about my employment contract renewal",
        "expected": {
            "intent": "create_ticket",
            "department": "HR",
            "urgency_min": 1,
            "urgency_max": 3,
            "duplicate_of": None,
        }
    },
    {
        "id": "TC-012",
        "description": "HR — maternity leave",
        "message": "I need to apply for maternity leave starting next month",
        "expected": {
            "intent": "create_ticket",
            "department": "HR",
            "urgency_min": 2,
            "urgency_max": 4,
            "duplicate_of": None,
        }
    },

    # --- HR: suggest_solution (KB matches) ---
    {
        "id": "TC-013",
        "description": "Payroll not received — should match KB-014",
        "message": "I have not received my salary this month",
        "expected": {
            "intent": "suggest_solution",
            "department": "HR",
            "urgency_min": 3,
            "urgency_max": 5,
            "duplicate_of": None,
        }
    },
    {
        "id": "TC-014",
        "description": "Annual leave request — should match KB-016",
        "message": "How do I request annual leave?",
        "expected": {
            "intent": "suggest_solution",
            "department": "HR",
            "urgency_min": 1,
            "urgency_max": 3,
            "duplicate_of": None,
        }
    },

    # --- HR: duplicate detection ---
    {
        "id": "TC-015",
        "description": "Duplicate of TK-0010 — HR portal access",
        "message": "I need access to the HR portal for my onboarding",
        "expected": {
            "intent": "create_ticket",
            "department": "HR",
            "urgency_min": 2,
            "urgency_max": 4,
            "duplicate_of": "TK-0010",
        }
    },

    # --- Finance: create_ticket ---
    {
        "id": "TC-016",
        "description": "Finance — budget approval",
        "message": "I need approval for a budget increase for my project",
        "expected": {
            "intent": "create_ticket",
            "department": "Finance",
            "urgency_min": 2,
            "urgency_max": 4,
            "duplicate_of": None,
        }
    },

    # --- Finance: suggest_solution (KB matches) ---
    {
        "id": "TC-017",
        "description": "Expense reimbursement — should match KB-019",
        "message": "How do I submit an expense claim for a business trip?",
        "expected": {
            "intent": "suggest_solution",
            "department": "Finance",
            "urgency_min": 1,
            "urgency_max": 3,
            "duplicate_of": None,
        }
    },
    {
        "id": "TC-018",
        "description": "Invoice submission — should match KB-020",
        "message": "I need to submit a vendor invoice for payment",
        "expected": {
            "intent": "suggest_solution",
            "department": "Finance",
            "urgency_min": 1,
            "urgency_max": 3,
            "duplicate_of": None,
        }
    },

    # --- Clarify ---
    {
        "id": "TC-019",
        "description": "Vague message — should trigger clarify",
        "message": "Something is not working",
        "expected": {
            "intent": "clarify",
            "department": None,
            "urgency_min": 1,
            "urgency_max": 3,
            "duplicate_of": None,
        }
    },
    {
        "id": "TC-020",
        "description": "Slightly less vague — still should clarify",
        "message": "I have a problem with my account",
        "expected": {
            "intent": "clarify",
            "department": None,
            "urgency_min": 1,
            "urgency_max": 3,
            "duplicate_of": None,
        }
    },

    # --- Other department ---
    {
        "id": "TC-021",
        "description": "Facilities — does not fit IT/HR/Finance",
        "message": "The air conditioning in the office is broken",
        "expected": {
            "intent": "create_ticket",
            "department": "Other",
            "urgency_min": 1,
            "urgency_max": 3,
            "duplicate_of": None,
        }
    },
    {
        "id": "TC-022",
        "description": "Security incident — high urgency",
        "message": "I think my computer has been hacked, I see unknown programs running",
        "expected": {
            "intent": "create_ticket",
            "department": "IT",
            "urgency_min": 4,
            "urgency_max": 5,
            "duplicate_of": None,
        }
    },
]


# -------------------------------------------------------------------
# Pipeline — mirrors api.py logic without HTTP layer
# -------------------------------------------------------------------
def run_pipeline(message: str) -> dict:
    result = analyze(message)

    if "_error" in result:
        return result

    kb_query = result.get("kb_query")
    if kb_query and result.get("intent") != "clarify":
        kb_match = query_knowledge_base(kb_query)
        if kb_match:
            result["intent"] = "suggest_solution"
            result["response_to_user"] = (
                f"I found a solution:\n\n{kb_match['solution']}\n\n"
                f"If this does not resolve your problem, reply and I will create a ticket."
            )

    if result.get("intent") == "create_ticket":
        duplicate_id = check_duplicate(message)
        if duplicate_id:
            result["duplicate_of"] = duplicate_id

    return result


# -------------------------------------------------------------------
# Evaluation
# -------------------------------------------------------------------
def evaluate(result: dict, expected: dict) -> dict:
    checks = {}

    # Intent
    checks["intent"] = result.get("intent") == expected["intent"]

    # Department — None means "don't check"
    if expected["department"] is not None:
        checks["department"] = result.get("department") == expected["department"]
    else:
        checks["department"] = result.get("department") is None

    # Urgency — checked as a range to allow model flexibility
    urgency = result.get("urgency", 0)
    checks["urgency"] = expected["urgency_min"] <= urgency <= expected["urgency_max"]

    # Duplicate — None means "expect no duplicate"
    if expected["duplicate_of"] is not None:
        checks["duplicate"] = result.get("duplicate_of") == expected["duplicate_of"]
    else:
        checks["duplicate"] = result.get("duplicate_of") is None

    return checks


# -------------------------------------------------------------------
# Runner
# -------------------------------------------------------------------
def run_tests():
    results = {
        "intent": {"correct": 0, "total": 0},
        "department": {"correct": 0, "total": 0},
        "urgency": {"correct": 0, "total": 0},
        "duplicate": {"correct": 0, "total": 0},
    }

    failures = []

    print("=" * 60)
    print("HELPDESK AI — TEST SUITE")
    print("=" * 60)

    for case in TEST_CASES:
        print(f"\n[{case['id']}] {case['description']}")
        print(f"  Input: {case['message']}")

        result = run_pipeline(case["message"])

        if "_error" in result:
            print(f"  ERROR: {result['_error']}")
            failures.append({"id": case["id"], "error": result["_error"]})
            continue

        checks = evaluate(result, case["expected"])

        # Tally scores
        for metric, passed in checks.items():
            results[metric]["total"] += 1
            if passed:
                results[metric]["correct"] += 1

        # Print result row
        status_icons = {k: "✓" if v else "✗" for k, v in checks.items()}
        print(f"  Intent: {result.get('intent')} {status_icons['intent']} | "
              f"Dept: {result.get('department')} {status_icons['department']} | "
              f"Urgency: {result.get('urgency')} {status_icons['urgency']} | "
              f"Duplicate: {result.get('duplicate_of')} {status_icons['duplicate']}")

        # Log failures
        failed_checks = [k for k, v in checks.items() if not v]
        if failed_checks:
            failures.append({
                "id": case["id"],
                "description": case["description"],
                "failed": failed_checks,
                "expected": case["expected"],
                "got": {
                    "intent": result.get("intent"),
                    "department": result.get("department"),
                    "urgency": result.get("urgency"),
                    "duplicate_of": result.get("duplicate_of"),
                }
            })

    # -------------------------------------------------------------------
    # Summary
    # -------------------------------------------------------------------
    print("\n" + "=" * 60)
    print("RESULTS SUMMARY")
    print("=" * 60)

    total_checks = sum(v["total"] for v in results.values())
    total_correct = sum(v["correct"] for v in results.values())

    for metric, counts in results.items():
        pct = (counts["correct"] / counts["total"] * 100) if counts["total"] > 0 else 0
        print(f"  {metric.capitalize():<12} {counts['correct']}/{counts['total']}  ({pct:.1f}%)")

    overall = (total_correct / total_checks * 100) if total_checks > 0 else 0
    print(f"\n  {'Overall':<12} {total_correct}/{total_checks}  ({overall:.1f}%)")

    if failures:
        print(f"\n--- FAILURES ({len(failures)}) ---")
        for f in failures:
            print(f"\n  [{f['id']}] {f.get('description', 'error')}")
            if "error" in f:
                print(f"    Error: {f['error']}")
            else:
                print(f"    Failed checks: {f['failed']}")
                print(f"    Expected: {f['expected']}")
                print(f"    Got:      {f['got']}")
    else:
        print("\n  All tests passed.")

    print("=" * 60)


if __name__ == "__main__":
    run_tests()