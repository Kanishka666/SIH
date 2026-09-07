"""
Formats a run_pipeline() result into a readable compliance report,
matching the fixed-width report style used for reviewing packages.
"""

STATUS_MARK = {"PASS": "\u2713", "VIOLATION": "\u2717"}
LINE = "-" * 60
DLINE = "=" * 60


def _final_assessment(overall_status, pending_count):
    if overall_status == "NON_COMPLIANT":
        return "NON-COMPLIANT"
    if overall_status == "INCONCLUSIVE":
        return "INCONCLUSIVE - ADDITIONAL DATA REQUIRED"
    if pending_count > 0:
        return "COMPLIANT - SUBJECT TO PENDING CHECKS"
    return "COMPLIANT - FULLY VERIFIED"


def generate_report(sample_number: int, result: dict) -> str:
    rule_results = result["rule_results"]
    overall_status = result["overall_status"]
    pending_count = result["pending_module_checks"]

    rule6_items = [r for r in rule_results if r["rule"].startswith("Rule 6") and r["status"] in ("PASS", "VIOLATION")]
    other_items = [r for r in rule_results if not r["rule"].startswith("Rule 6") and r["status"] in ("PASS", "VIOLATION")]
    not_applicable_items = [r for r in rule_results if r["status"] == "NOT_APPLICABLE"]
    pending_items = [r for r in rule_results if r["status"] == "UNABLE_TO_VERIFY"]

    lines = []
    lines.append(DLINE)
    lines.append("        PRODUCT / LABEL COMPLIANCE REPORT")
    lines.append(DLINE)
    lines.append(f"Sample {sample_number}")
    lines.append(f"Overall Status : {overall_status}")
    lines.append(f"Verification   : {'PARTIALLY VERIFIED' if pending_count else 'FULLY VERIFIED'}")

    if rule6_items:
        lines.append(LINE)
        lines.append("RULE 6 - MANDATORY DECLARATIONS")
        lines.append(LINE)
        for r in rule6_items:
            mark = STATUS_MARK.get(r["status"], "-")
            lines.append(f"{mark} {r['rule']:<12} {r['clause']}")
            lines.append(f"  Status  : {r['status']}")
            lines.append(f"  Evidence: {r['message']}")

    if other_items:
        lines.append(LINE)
        lines.append("OTHER APPLICABLE RULES")
        lines.append(LINE)
        for r in other_items:
            mark = STATUS_MARK.get(r["status"], "-")
            lines.append(f"{mark} {r['rule']:<12} {r['clause']}")
            lines.append(f"  Status  : {r['status']}")
            lines.append(f"  Evidence: {r['message']}")

    if not_applicable_items:
        lines.append(LINE)
        lines.append("NOT APPLICABLE")
        lines.append(LINE)
        for r in not_applicable_items:
            lines.append(f"\u2022 {r['rule']} - {r['clause']}")

    if pending_items:
        lines.append(LINE)
        lines.append("VERIFICATION PENDING")
        lines.append(LINE)
        for r in pending_items:
            lines.append(f"\u2022 {r['rule']:<12} {r['clause']}")
            lines.append(f"  Status  : UNABLE TO VERIFY")
            lines.append(f"  Reason  : {r['message']}")

    pass_count = sum(1 for r in rule_results if r["status"] == "PASS")
    violation_count = sum(1 for r in rule_results if r["status"] == "VIOLATION")

    lines.append(LINE)
    lines.append("SUMMARY")
    lines.append(LINE)
    lines.append(f"PASS             : {pass_count}")
    lines.append(f"VIOLATIONS       : {violation_count}")
    lines.append(f"NOT APPLICABLE   : {len(not_applicable_items)}")
    lines.append(f"PENDING CHECKS   : {len(pending_items)}")
    lines.append(f"Final Assessment : {_final_assessment(overall_status, pending_count)}")
    lines.append(DLINE)

    return "\n".join(lines)