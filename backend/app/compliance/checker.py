import re
from .rules import ALL_RULE_CHECKS


def structure_data(ocr_text: str, extra_data: dict = None) -> dict:
    """
    Converts raw OCR text into a structured dict.

    `extra_data` is an optional dict for fields that a future Computer
    Vision or POS module will supply (e.g. measured_numeral_height_mm,
    sticker_tampering_detected, fill_level_ratio, actual_sale_price).
    It is merged in as-is - when those fields are absent (as they are
    today, text-only), the corresponding rules simply stay pending.
    """
    original_text = ocr_text or ""
    text = original_text.lower()

    data = {
        "mrp": None,
        "mrp_tax_inclusive": False,
        "net_quantity": None,
        "net_quantity_unit": None,
        "packing_date": None,
        "manufacturer_name": None,
        "generic_name": None,
        "consumer_care": None,
        "raw_text": original_text.strip(),
    }

    # ---- MRP: supports both plain (1150) and comma-grouped (1,150) numbers ----
    mrp_match = re.search(
        r"(?:mrp|maximum\s*retail\s*price|max\.?\s*retail\s*price)"
        r"[^\d]{0,20}(?:rs\.?|₹|inr)?\s*"
        r"((?:\d{1,3}(?:,\d{2,3})+|\d+)(?:\.\d{1,2})?)",
        text,
    )
    if mrp_match:
        data["mrp"] = mrp_match.group(1).replace(",", "")
        window = text[max(0, mrp_match.start() - 10): mrp_match.end() + 50]
        if any(k in window for k in ["incl", "inclusive", "including"]):
            data["mrp_tax_inclusive"] = True

    # ---- Net quantity: weight/volume, then fallback to count-based units ----
    qty_match = re.search(
        r"(?:net\s*wt\.?|net\s*weight|net\s*quantity|net\s*qty|net\s*vol\.?|net\s*volume)"
        r"[^\d]{0,15}(\d+(?:\.\d+)?)\s*(mg|g|gm|grams?|kg|kilograms?|ml|litres?|liters?|l)\b",
        text,
    )
    if qty_match:
        data["net_quantity"] = qty_match.group(1)
        data["net_quantity_unit"] = qty_match.group(2).lower()
    else:
        count_match = re.search(
            r"(?:net\s*(?:qty|quantity)|contains?|containing|case|carton|master\s*pack|outer\s*pack)"
            r"\s*(?:of)?\s*(\d+(?:\.\d+)?)\s*(pcs?|pieces?|nos?\.?|units?|count)\b",
            text,
        )
        if count_match:
            data["net_quantity"] = count_match.group(1)
            data["net_quantity_unit"] = count_match.group(2).strip(".").lower()

    # ---- Packing / manufacturing date ----
    date_match = re.search(
        r"(?:pack(?:ed|ing)?|mfg\.?|mfd\.?|manufactured)[^\dA-Za-z]{0,8}"
        r"(jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|"
        r"aug(?:ust)?|sep(?:tember)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)?"
        r"[^\dA-Za-z]{0,8}(\d{4})",
        text,
    )
    if date_match:
        month, year = date_match.group(1), date_match.group(2)
        data["packing_date"] = f"{month.capitalize()} {year}" if month else year

    # ---- Manufacturer / packer / importer ----
    mfg_match = re.search(
        r"(?:mfg\.?\s*by|manufactured\s*by|packed\s*by|marketed\s*by|imported\s*by)"
        r"\s*[:\-]?\s*([a-zA-Z0-9 &.,'()\-]+)",
        text,
    )
    if mfg_match:
        name = mfg_match.group(1).strip()
        name = re.split(r"\b(customer\s*care|consumer\s*care|net\s*wt|mrp|packed)\b", name)[0].strip(" :-,")
        if name:
            data["manufacturer_name"] = name.title()

    # ---- Consumer care ----
    care_match = re.search(
        r"(?:customer\s*care|consumer\s*care|helpline|contact)"
        r"[^\dA-Za-z@]{0,20}(\d{6,12}|[\w.\-+]+@[\w.\-]+\.[A-Za-z]{2,})",
        text,
    )
    if care_match:
        data["consumer_care"] = care_match.group(1)

    data["generic_name"] = _guess_generic_name(original_text)

    if extra_data:
        data.update(extra_data)

    return data


def _guess_generic_name(ocr_text: str):
    """Simple line-based heuristic for the product's generic/common name."""
    skip_patterns = [
        r"mrp", r"net\s*(wt|weight|qty|quantity|vol|volume)", r"pack(ed|ing)?",
        r"mfg", r"manufactured", r"marketed\s*by", r"imported\s*by",
        r"customer\s*care", r"consumer\s*care", r"helpline", r"contact",
        r"\d{6,}", r"@", r"batch", r"lot", r"expiry", r"best\s*before",
        r"country\s*of\s*origin", r"made\s*in", r"contains?\s+\d+",
        r"this\s*case", r"case\s*of", r"carton\s*of",
    ]
    for line in ocr_text.splitlines():
        clean = line.strip()
        if not clean or len(clean) < 3:
            continue
        if any(re.search(p, clean.lower()) for p in skip_patterns):
            continue
        return clean
    return None


def check_compliance(data: dict) -> list:
    """Runs every rule-check function from rules.py against the structured data."""
    all_results = []
    for rule_check_fn in ALL_RULE_CHECKS:
        all_results.extend(rule_check_fn(data))
    return all_results


def summarize(results: list) -> dict:
    """
    Overall status is based only on checks that can be resolved right now
    (needs_extra_module == False). Checks still waiting on a CV/POS/DB
    module are counted separately as pending, so a fully-declared package
    is not marked "inconclusive" just because future modules aren't wired up yet.
    """
    checkable = [r for r in results if not r.get("needs_extra_module")]
    pending = [r for r in results if r.get("needs_extra_module")]
    statuses = [r["status"] for r in checkable]

    if "VIOLATION" in statuses:
        overall_status = "NON_COMPLIANT"
    elif "UNABLE_TO_VERIFY" in statuses:
        overall_status = "INCONCLUSIVE"
    else:
        overall_status = "COMPLIANT"

    return {"overall_status": overall_status, "pending_module_checks": len(pending)}


def run_pipeline(ocr_text: str, extra_data: dict = None) -> dict:
    """
    Full pipeline: OCR text (+ optional CV/POS data) -> structured JSON -> rule results.
    Passing extra_data is how a future OCR+CV pipeline plugs in without
    changing this function or rules.py.
    """
    structured = structure_data(ocr_text, extra_data)
    results = check_compliance(structured)
    summary = summarize(results)
    return {
        "structured_data": structured,
        "rule_results": results,
        "overall_status": summary["overall_status"],
        "pending_module_checks": summary["pending_module_checks"],
    }
