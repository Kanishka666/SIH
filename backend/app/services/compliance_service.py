from app.compliance.checker import run_pipeline
from app.compliance.report import generate_report


def evaluate_ocr_text(ocr_text: str, extra_data: dict | None = None) -> dict:
    return run_pipeline(ocr_text, extra_data)


def format_report(sample_number: int, result: dict) -> str:
    return generate_report(sample_number, result)
