"""
MOCK AI / OCR / ML SERVICE
--------------------------
This module simulates what a real label-scanning AI pipeline will
eventually return: extracted label fields, a compliance score, and a
list of Legal Metrology violations.

WHEN THE REAL AI/ML MODEL IS READY:
- Keep the function signature `process_label(image_path: str) -> dict`
  identical (or close to it).
- Replace the body of `process_label` with a call to the real OCR/ML
  pipeline (local model, or an internal microservice call).
- The return shape (dict with the same keys) should stay the same so
  that scan_service.py and the response schemas keep working unchanged.

Nothing in this file talks to the database or the HTTP layer directly.
"""
import random
from typing import List

DEMO_RULES = [
    {
        "id": "RULE-001",
        "title": "MRP Declaration",
        "description": "The Maximum Retail Price (inclusive of all taxes) should be "
        "declared clearly on the package.",
        "severity": "high",
    },
    {
        "id": "RULE-002",
        "title": "Net Quantity Declaration",
        "description": "The net quantity of the commodity contained in the package "
        "should be declared in standard units.",
        "severity": "high",
    },
    {
        "id": "RULE-003",
        "title": "Manufacturer/Packer/Importer Details",
        "description": "Name and address of the manufacturer, packer, or importer "
        "should be declared on the package.",
        "severity": "medium",
    },
    {
        "id": "RULE-004",
        "title": "Consumer Care Details",
        "description": "Name, address, and contact details (telephone/email) for "
        "consumer complaints should be declared.",
        "severity": "medium",
    },
    {
        "id": "RULE-005",
        "title": "Date of Manufacture / Expiry",
        "description": "Month and year of manufacture, and where applicable, expiry "
        "or 'best before' date, should be declared.",
        "severity": "low",
    },
]
# NOTE: These are placeholder/demo rules only for MVP wiring purposes.
# They do NOT represent the complete, verified Legal Metrology
# (Packaged Commodities) Rules. The real, verified rule set will be
# added by the team after legal review.


def get_demo_rules() -> List[dict]:
    return DEMO_RULES


def process_label(image_path: str) -> dict:
    """
    MOCK implementation. Returns a realistic but fabricated compliance
    result so the frontend can be built/tested against a stable shape
    before the real OCR/ML pipeline exists.

    `image_path` is accepted (and will be used by the real pipeline
    later) but is currently unused beyond existing as a parameter for
    interface compatibility.
    """
    compliance_score = random.choice([58, 65, 72, 82, 91])
    overall_status = "COMPLIANT" if compliance_score >= 85 else "NON_COMPLIANT"

    extracted_information = {
        "product_name": "Example Packaged Product",
        "mrp": "₹40",
        "manufacturer": "ABC Foods Pvt Ltd",
        "net_quantity": "200 g",
        "expiry_date": "August 2027",
        "consumer_care": "1800-123-4567",
    }

    violations = []
    if overall_status == "NON_COMPLIANT":
        violations = [
            {
                "id": "v1",
                "title": "Missing Declaration",
                "rule_number": "RULE-001",
                "reason": "MRP is not clearly visible or declared on the package image.",
                "severity": "high",
                "recommendation": "Ensure MRP (inclusive of all taxes) is printed clearly.",
            },
            {
                "id": "v2",
                "title": "Consumer Care Details Unclear",
                "rule_number": "RULE-004",
                "reason": "Consumer care contact information is partially obscured.",
                "severity": "medium",
                "recommendation": "Reprint consumer care details in a legible font size.",
            },
        ]

    recommendations = [
        "Verify all mandatory declarations against the latest checklist.",
        "Ensure MRP is clearly visible and legible.",
        "Double-check net quantity is declared in standard units.",
    ]

    return {
        "compliance_score": compliance_score,
        "overall_status": overall_status,
        "extracted_information": extracted_information,
        "violations": violations,
        "recommendations": recommendations,
    }
