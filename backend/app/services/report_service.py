"""
Report business logic — builds the structured report the frontend
Report Viewer needs, and renders a simple PDF version of it.

route (reports.py) -> report_service.py -> memory_store.py
"""
import io
from datetime import datetime, timezone

from fastapi import HTTPException, status
from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import cm
from reportlab.platypus import (
    Paragraph,
    SimpleDocTemplate,
    Spacer,
    Table,
    TableStyle,
)

from app.storage import memory_store


def _safe_currency(value: str) -> str:
    """
    reportlab's built-in fonts don't include the ₹ glyph (renders as a
    black box), so for the PDF we swap it for 'Rs.' — the JSON API
    response still returns the real ₹ symbol untouched.
    """
    return value.replace("₹", "Rs. ")


def get_report_or_404(scan_id: str, owner_id: str | None = None) -> dict:
    scan = memory_store.get_scan(scan_id)
    if not scan or (owner_id is not None and scan["owner_id"] != owner_id):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Scan '{scan_id}' not found.",
        )
    if scan["status"] != "completed" or not scan["result"]:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Report for scan '{scan_id}' is not available yet.",
        )
    return scan


def build_report(scan: dict) -> dict:
    result = scan["result"]
    extracted = result["extracted_information"]
    return {
        "scan_id": scan["id"],
        "product_name": extracted.get("product_name", "Unknown Product"),
        "product_category": "Uncategorized",  # placeholder until product linkage exists
        "scan_date": scan["created_at"],
        "compliance_score": result["compliance_score"],
        "overall_status": result["overall_status"],
        "violations": result["violations"],
        "notes": "This report is generated from MOCK AI/ML processing for MVP "
        "demonstration purposes. It will be replaced by verified output once "
        "the real OCR/ML pipeline is integrated.",
    }


def generate_report_pdf(scan: dict) -> bytes:
    report = build_report(scan)
    result = scan["result"]
    extracted = result["extracted_information"]

    buffer = io.BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=A4,
        topMargin=2 * cm,
        bottomMargin=2 * cm,
        leftMargin=2 * cm,
        rightMargin=2 * cm,
    )
    styles = getSampleStyleSheet()
    title_style = ParagraphStyle(
        "LabelLensTitle", parent=styles["Title"], textColor=colors.HexColor("#1D4ED8")
    )
    heading_style = styles["Heading2"]
    normal_style = styles["Normal"]

    story = []

    story.append(Paragraph("LabelLens", title_style))
    story.append(Paragraph("AI-Powered Legal Metrology Compliance Report", styles["Heading3"]))
    story.append(Spacer(1, 12))

    story.append(Paragraph(f"<b>Scan ID:</b> {report['scan_id']}", normal_style))
    story.append(Paragraph(f"<b>Scan Date:</b> {report['scan_date']}", normal_style))
    story.append(Spacer(1, 16))

    story.append(Paragraph("Product Information", heading_style))
    product_rows = [
        ["Product Name", extracted.get("product_name", "-")],
        ["Manufacturer", extracted.get("manufacturer", "-")],
        ["MRP", _safe_currency(extracted.get("mrp", "-"))],
        ["Net Quantity", extracted.get("net_quantity", "-")],
        ["Expiry Date", extracted.get("expiry_date", "-")],
        ["Consumer Care", extracted.get("consumer_care", "-")],
    ]
    product_table = Table(product_rows, colWidths=[5 * cm, 10 * cm])
    product_table.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (0, -1), colors.HexColor("#EFF6FF")),
                ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#CBD5E1")),
                ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
                ("FONTSIZE", (0, 0), (-1, -1), 10),
                ("TOPPADDING", (0, 0), (-1, -1), 6),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
            ]
        )
    )
    story.append(product_table)
    story.append(Spacer(1, 16))

    story.append(Paragraph("Compliance Summary", heading_style))
    status_color = (
        colors.HexColor("#16A34A")
        if report["overall_status"] == "COMPLIANT"
        else colors.HexColor("#DC2626")
    )
    story.append(
        Paragraph(
            f"<b>Compliance Score:</b> {report['compliance_score']} / 100",
            normal_style,
        )
    )
    story.append(
        Paragraph(
            f'<b>Overall Status:</b> <font color="{status_color.hexval()}">'
            f"{report['overall_status']}</font>",
            normal_style,
        )
    )
    story.append(Spacer(1, 16))

    story.append(Paragraph("Violations", heading_style))
    if report["violations"]:
        violation_rows = [["Rule", "Title", "Severity", "Reason"]]
        for v in report["violations"]:
            violation_rows.append(
                [v["rule_number"], v["title"], v["severity"].upper(), v["reason"]]
            )
        violation_table = Table(
            violation_rows, colWidths=[2.2 * cm, 3.8 * cm, 2.2 * cm, 6.8 * cm]
        )
        violation_table.setStyle(
            TableStyle(
                [
                    ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#1D4ED8")),
                    ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
                    ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#CBD5E1")),
                    ("FONTSIZE", (0, 0), (-1, -1), 9),
                    ("VALIGN", (0, 0), (-1, -1), "TOP"),
                    ("TOPPADDING", (0, 0), (-1, -1), 5),
                    ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
                ]
            )
        )
        story.append(violation_table)
    else:
        story.append(Paragraph("No violations detected.", normal_style))
    story.append(Spacer(1, 16))

    story.append(Paragraph("Recommendations", heading_style))
    for rec in result["recommendations"]:
        story.append(Paragraph(f"• {rec}", normal_style))
    story.append(Spacer(1, 16))

    story.append(Paragraph("Notes", heading_style))
    story.append(Paragraph(report["notes"], normal_style))
    story.append(Spacer(1, 20))

    generated_at = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M UTC")
    story.append(
        Paragraph(
            f"<i>Generated by LabelLens (MVP mock pipeline) on {generated_at}.</i>",
            ParagraphStyle("footer", parent=normal_style, fontSize=8, textColor=colors.grey),
        )
    )

    doc.build(story)
    pdf_bytes = buffer.getvalue()
    buffer.close()
    return pdf_bytes
