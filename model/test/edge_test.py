"""
Edge case + normal test suite for the IT Helpdesk AI model.
20 test cases: 12 normal, 8 edge cases.
Run from model/ directory: python test/edge_test.py
"""
import sys
import os
import time

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from groq_client import analyze
from rag.knowledge_base import query_knowledge_base, seed_knowledge_base
from rag.duplicate import check_duplicate, seed_open_tickets

seed_knowledge_base()
seed_open_tickets()

# ── Schema validation constants ───────────────────────────────────────────────
REQUIRED_FIELDS = {
    "intent":                 str,
    "department":             (str, type(None)),
    "urgency":                int,
    "clarification_question": (str, type(None)),
    "duplicate_of":           (str, type(None)),
    "response_to_user":       str,
}
VALID_INTENTS     = {"create_ticket", "suggest_solution", "clarify"}
VALID_DEPARTMENTS = {"IT", "HR", "Finance", "Other", None}

# ── Pipeline (mirrors api.py, without HTTP) ───────────────────────────────────
def run_pipeline(message: str) -> dict:
    result = analyze(message)
    if "_error" in result:
        return result

    kb_query = result.get("kb_query")
    if kb_query and result.get("intent") != "clarify":
        kb_match = query_knowledge_base(kb_query)
        if kb_match:
            result["intent"] = "suggest_solution"
            result["_kb_match"] = kb_match["id"]

    if result.get("intent") == "create_ticket":
        dup = check_duplicate(message)
        if dup:
            result["duplicate_of"] = dup

    return result

# ── Schema checker ────────────────────────────────────────────────────────────
def check_schema(result: dict) -> list:
    issues = []
    for field, expected_type in REQUIRED_FIELDS.items():
        if field not in result:
            issues.append(f"missing field '{field}'")
            continue
        if not isinstance(result[field], expected_type):
            issues.append(f"'{field}' wrong type: {type(result[field]).__name__}")
    if result.get("intent") not in VALID_INTENTS:
        issues.append(f"invalid intent value: {result.get('intent')!r}")
    if result.get("department") not in VALID_DEPARTMENTS:
        issues.append(f"invalid department value: {result.get('department')!r}")
    urgency = result.get("urgency")
    if not isinstance(urgency, int) or not (1 <= urgency <= 5):
        issues.append(f"urgency={urgency!r} out of range [1-5]")
    return issues

# ── Field-level evaluator ─────────────────────────────────────────────────────
# Use "any" as expected value to skip that check entirely.
def evaluate(result: dict, expected: dict) -> dict:
    checks = {}

    intent_exp = expected.get("intent")
    if intent_exp != "any":
        checks["intent"] = result.get("intent") == intent_exp

    dept_exp = expected.get("department")
    if dept_exp != "any":
        if dept_exp is not None:
            checks["department"] = result.get("department") == dept_exp
        else:
            checks["department"] = result.get("department") is None

    u_min = expected.get("urgency_min")
    u_max = expected.get("urgency_max")
    if u_min is not None:
        urgency = result.get("urgency", 0)
        checks["urgency"] = u_min <= urgency <= u_max

    dup_exp = expected.get("duplicate_of")
    if dup_exp != "any":
        if dup_exp is not None:
            checks["duplicate"] = result.get("duplicate_of") == dup_exp
        else:
            checks["duplicate"] = result.get("duplicate_of") is None

    return checks

# ── Test cases ────────────────────────────────────────────────────────────────
TEST_CASES = [

    # ── Normal cases (12) ─────────────────────────────────────────────────────
    {
        "id": "EC-001", "category": "normal",
        "description": "VPN issue → KB-001 suggest_solution",
        "message": "I cannot connect to the company VPN",
        "expected": {"intent": "suggest_solution", "department": "IT",
                     "urgency_min": 2, "urgency_max": 4, "duplicate_of": None},
    },
    {
        "id": "EC-002", "category": "normal",
        "description": "Salary not received → KB-014 HR suggest_solution",
        "message": "I have not received my salary this month",
        "expected": {"intent": "suggest_solution", "department": "HR",
                     "urgency_min": 3, "urgency_max": 5, "duplicate_of": None},
    },
    {
        "id": "EC-003", "category": "normal",
        "description": "Expense claim question → KB-019 Finance suggest_solution",
        "message": "How do I submit an expense claim for a business trip?",
        "expected": {"intent": "suggest_solution", "department": "Finance",
                     "urgency_min": 1, "urgency_max": 3, "duplicate_of": None},
    },
    {
        "id": "EC-004", "category": "normal",
        "description": "Full office network outage → critical IT create_ticket",
        "message": "The entire office network is down, nobody can work",
        "expected": {"intent": "create_ticket", "department": "IT",
                     "urgency_min": 4, "urgency_max": 5, "duplicate_of": None},
    },
    {
        "id": "EC-005", "category": "normal",
        "description": "Vague message → clarify, no department",
        "message": "Something is broken",
        "expected": {"intent": "clarify", "department": None,
                     "urgency_min": 1, "urgency_max": 3, "duplicate_of": None},
    },
    {
        "id": "EC-006", "category": "normal",
        "description": "Account compromise / security incident → IT create_ticket urgency 4-5",
        "message": "I think my account has been compromised, I can see logins from unknown locations",
        "expected": {"intent": "create_ticket", "department": "IT",
                     "urgency_min": 4, "urgency_max": 5, "duplicate_of": None},
    },
    {
        "id": "EC-007", "category": "normal",
        "description": "Maternity leave request → HR create_ticket",
        "message": "I need to apply for maternity leave starting next month",
        "expected": {"intent": "create_ticket", "department": "HR",
                     "urgency_min": 2, "urgency_max": 4, "duplicate_of": None},
    },
    {
        "id": "EC-008", "category": "normal",
        "description": "Forgot Windows password → KB-005 IT suggest_solution",
        "message": "I forgot my Windows password and cannot log into my computer",
        "expected": {"intent": "suggest_solution", "department": "IT",
                     "urgency_min": 2, "urgency_max": 4, "duplicate_of": None},
    },
    {
        "id": "EC-009", "category": "normal",
        "description": "2FA code rejected → KB-006 IT suggest_solution",
        "message": "My two-factor authentication code is not being accepted and I cannot log in",
        "expected": {"intent": "suggest_solution", "department": "IT",
                     "urgency_min": 2, "urgency_max": 4, "duplicate_of": None},
    },
    {
        "id": "EC-010", "category": "normal",
        "description": "Slow/freezing laptop → KB-010 IT suggest_solution",
        "message": "My laptop is extremely slow and keeps freezing every few minutes",
        "expected": {"intent": "suggest_solution", "department": "IT",
                     "urgency_min": 2, "urgency_max": 3, "duplicate_of": None},
    },
    {
        "id": "EC-011", "category": "normal",
        "description": "Office AC broken → Other create_ticket",
        "message": "The air conditioning in our office has stopped working",
        "expected": {"intent": "create_ticket", "department": "Other",
                     "urgency_min": 1, "urgency_max": 3, "duplicate_of": None},
    },
    {
        "id": "EC-012", "category": "normal",
        "description": "Phishing email clicked → IT create_ticket urgency 4-5",
        "message": "I received a suspicious phishing email and I may have accidentally clicked the link",
        "expected": {"intent": "create_ticket", "department": "IT",
                     "urgency_min": 4, "urgency_max": 5, "duplicate_of": None},
    },

    # ── Edge cases (8) ────────────────────────────────────────────────────────
    {
        "id": "EC-013", "category": "edge",
        "description": "EDGE: Empty string — no content whatsoever",
        "message": "",
        "expected": {"intent": "clarify", "department": None,
                     "urgency_min": 1, "urgency_max": 3, "duplicate_of": None},
    },
    {
        "id": "EC-014", "category": "edge",
        "description": "EDGE: Single word, completely vague",
        "message": "broken",
        "expected": {"intent": "clarify", "department": None,
                     "urgency_min": 1, "urgency_max": 3, "duplicate_of": None},
    },
    {
        "id": "EC-015", "category": "edge",
        "description": "EDGE: Completely unrelated question (not a support issue)",
        "message": "What is the capital of France?",
        "expected": {"intent": "any", "department": "any",
                     "urgency_min": 1, "urgency_max": 2, "duplicate_of": None},
    },
    {
        "id": "EC-016", "category": "edge",
        "description": "EDGE: Leet-speak / mangled special characters",
        "message": "My p@$$w0rd f0r 0utl00k !sn't w0rk!ng & I c@n't l0g !n",
        "expected": {"intent": "any", "department": "IT",
                     "urgency_min": 2, "urgency_max": 4, "duplicate_of": None},
    },
    {
        "id": "EC-017", "category": "edge",
        "description": "EDGE: Multiple unrelated issues across IT + HR + IT",
        "message": "My VPN is down AND my salary has not been paid AND the printer is broken",
        "expected": {"intent": "any", "department": "any",
                     "urgency_min": 1, "urgency_max": 5, "duplicate_of": None},
    },
    {
        "id": "EC-018", "category": "edge",
        "description": "EDGE: Angry all-caps, emotionally charged but IT-related",
        "message": "WHY IS NOTHING WORKING?! MY COMPUTER HAS BEEN BROKEN FOR 3 DAYS AND NO ONE HELPED ME!!!",
        "expected": {"intent": "any", "department": "IT",
                     "urgency_min": 3, "urgency_max": 5, "duplicate_of": None},
    },
    {
        "id": "EC-019", "category": "edge",
        "description": "EDGE: Very long rambling message with buried laptop freeze issue",
        "message": (
            "Hi there, I hope you are doing well. I wanted to reach out because I have been having "
            "a lot of trouble with my work laptop and I am not quite sure what is going on. It started "
            "about a week ago when things were running a bit slower than usual, but I did not think much "
            "of it at the time. However, over the past few days it has gotten progressively worse to the "
            "point where my computer is completely freezing every 10-15 minutes and I have to do a hard "
            "restart each time. I have already tried restarting it multiple times but the problem keeps "
            "coming back. I have a lot of important meetings this week and I really cannot afford for "
            "this to keep happening. Could someone please look into this for me? I would really "
            "appreciate any help you can provide as soon as possible. Thank you so much."
        ),
        "expected": {"intent": "suggest_solution", "department": "IT",
                     "urgency_min": 2, "urgency_max": 4, "duplicate_of": None},
    },
    {
        "id": "EC-020", "category": "edge",
        "description": "EDGE: Sarcastic/indirect phrasing — Teams not opening",
        "message": "Oh great, my computer has decided to go on vacation again. Teams won't even open.",
        "expected": {"intent": "suggest_solution", "department": "IT",
                     "urgency_min": 2, "urgency_max": 3, "duplicate_of": None},
    },
]

# ── Runner ────────────────────────────────────────────────────────────────────
def run_tests():
    metrics = {
        "schema":     {"correct": 0, "total": 0},
        "intent":     {"correct": 0, "total": 0},
        "department": {"correct": 0, "total": 0},
        "urgency":    {"correct": 0, "total": 0},
        "duplicate":  {"correct": 0, "total": 0},
    }
    failures = []

    normal_count = sum(1 for c in TEST_CASES if c["category"] == "normal")
    edge_count   = sum(1 for c in TEST_CASES if c["category"] == "edge")

    print("=" * 72)
    print(f"HELPDESK AI — TEST SUITE  ({len(TEST_CASES)} cases: {normal_count} normal, {edge_count} edge)")
    print("=" * 72)

    for i, case in enumerate(TEST_CASES):
        tag   = "[EDGE]" if case["category"] == "edge" else "      "
        preview = (case["message"][:75] + "...") if len(case["message"]) > 75 else case["message"]

        print(f"\n{tag} [{case['id']}] {case['description']}")
        print(f"         Input: {preview!r}")

        result = run_pipeline(case["message"])

        # Schema
        metrics["schema"]["total"] += 1
        if "_error" in result:
            print(f"         !! API/parse error: {result['_error']}")
            failures.append({"id": case["id"], "description": case["description"],
                              "failed": ["api_error"], "error": result["_error"]})
            continue

        schema_issues = check_schema(result)
        schema_ok = len(schema_issues) == 0
        if schema_ok:
            metrics["schema"]["correct"] += 1

        # Field checks
        checks = evaluate(result, case["expected"])
        for metric, passed in checks.items():
            metrics[metric]["total"] += 1
            if passed:
                metrics[metric]["correct"] += 1

        def sym(k): return checks.get(k, " ")
        def tick(v):
            if isinstance(v, bool): return "✓" if v else "✗"
            return "?"

        kb_note = f"  [KB:{result.get('_kb_match')}]" if result.get("_kb_match") else ""
        print(
            f"         Intent: {str(result.get('intent')):<16} {tick(checks.get('intent'))}  "
            f"Dept: {str(result.get('department')):<8} {tick(checks.get('department'))}  "
            f"Urgency: {result.get('urgency')} {tick(checks.get('urgency'))}  "
            f"Dup: {str(result.get('duplicate_of')):<10} {tick(checks.get('duplicate'))}"
            f"{kb_note}"
        )
        if not schema_ok:
            print(f"         !! Schema issues: {schema_issues}")

        failed = [k for k, v in checks.items() if not v]
        if not schema_ok:
            failed.append("schema")
        if failed:
            failures.append({
                "id": case["id"],
                "description": case["description"],
                "failed": failed,
                "schema_issues": schema_issues,
                "expected": case["expected"],
                "got": {
                    "intent":       result.get("intent"),
                    "department":   result.get("department"),
                    "urgency":      result.get("urgency"),
                    "duplicate_of": result.get("duplicate_of"),
                    "kb_match":     result.get("_kb_match"),
                    "response":     result.get("response_to_user", "")[:120],
                },
            })

        # Small delay to respect rate limits
        if i < len(TEST_CASES) - 1:
            time.sleep(0.3)

    # ── Summary ───────────────────────────────────────────────────────────────
    print("\n" + "=" * 72)
    print("RESULTS SUMMARY")
    print("=" * 72)

    total_checks  = sum(v["total"]   for v in metrics.values() if v["total"] > 0)
    total_correct = sum(v["correct"] for v in metrics.values())

    for metric, counts in metrics.items():
        if counts["total"] == 0:
            continue
        pct = counts["correct"] / counts["total"] * 100
        filled = int(pct / 5)
        bar = "█" * filled + "░" * (20 - filled)
        print(f"  {metric.capitalize():<12} {counts['correct']:>2}/{counts['total']:<2}  {bar}  {pct:.0f}%")

    overall = (total_correct / total_checks * 100) if total_checks > 0 else 0
    print(f"\n  {'Overall':<12} {total_correct}/{total_checks}  ({overall:.1f}%)")

    if failures:
        print(f"\n{'─' * 72}")
        print(f"FAILURES  ({len(failures)})")
        print(f"{'─' * 72}")
        for f in failures:
            print(f"\n  [{f['id']}] {f['description']}")
            if "error" in f:
                print(f"    Error: {f['error']}")
            else:
                if f.get("schema_issues"):
                    print(f"    Schema: {f['schema_issues']}")
                print(f"    Failed checks : {f['failed']}")
                print(f"    Expected      : {f['expected']}")
                print(f"    Got           : {f['got']}")
    else:
        print("\n  All tests passed!")

    print("=" * 72)
    return failures


if __name__ == "__main__":
    run_tests()
