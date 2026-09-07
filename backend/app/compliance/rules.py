import re

# ------------------------------------------------------------------
# Status constants used by every rule-check function
# ------------------------------------------------------------------
PASS = "PASS"
VIOLATION = "VIOLATION"
NOT_APPLICABLE = "NOT_APPLICABLE"
UNABLE_TO_VERIFY = "UNABLE_TO_VERIFY"


def make_result(rule, clause, status, message, needs_extra_module=False):
    """Standard result object returned by every rule-check function."""
    return {
        "rule": rule,
        "clause": clause,
        "status": status,
        "message": message,
        "needs_extra_module": needs_extra_module,
    }


def check_with_optional_data(data, field, rule, clause, missing_message, evaluator):
    """
    Generic helper for rules that depend on data not available from OCR
    text alone (e.g. numeral height, sticker tampering, fill level).
    Stays UNABLE_TO_VERIFY until a CV/measurement module fills `field`;
    then this same function resolves to PASS/VIOLATION automatically.
    """
    value = data.get(field)
    if value is None:
        return make_result(rule, clause, UNABLE_TO_VERIFY, missing_message, needs_extra_module=True)
    return evaluator(value)


# ------------------------------------------------------------------
# Reference data: valid units, exemption keywords, thresholds
# ------------------------------------------------------------------
VALID_WEIGHT_UNITS = ["g", "gm", "gram", "grams", "kg", "kilogram", "kilograms", "mg"]
VALID_VOLUME_UNITS = ["ml", "millilitre", "milliliter", "l", "litre", "liter", "litres", "liters"]
VALID_COUNT_UNITS = ["pcs", "pieces", "count", "nos", "no.", "unit", "units"]
VALID_UNITS = VALID_WEIGHT_UNITS + VALID_VOLUME_UNITS + VALID_COUNT_UNITS

MONTHS = [
    "jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec",
    "january", "february", "march", "april", "june", "july", "august",
    "september", "october", "november", "december",
]

NO_DATE_REQUIRED_KEYWORDS = ["bidi", "incense stick", "agarbatti", "lpg cylinder"]
NO_MRP_REQUIRED_KEYWORDS = ["bidi", "lpg cylinder"]

EXEMPT_IF_ABOVE_KG = 25
EXEMPT_IF_ABOVE_LITRE = 25

WHOLESALE_PATTERN = re.compile(
    r"\b(?:wholesale|carton\s+of|case\s+of|master\s*pack|outer\s*pack|shipper|"
    r"not\s+for\s+retail\s+sale|contains?\s+\d+\s*(?:units?|pcs?|pieces?))\b",
    re.IGNORECASE,
)

DEVANAGARI_RANGE = re.compile(r"[\u0900-\u097F]")
LATIN_RANGE = re.compile(r"[A-Za-z]")

_UNIT_TO_BASE = {
    "mg": 0.001, "g": 1, "gm": 1, "gram": 1, "grams": 1,
    "kg": 1000, "kilogram": 1000, "kilograms": 1000,
    "ml": 1, "millilitre": 1, "milliliter": 1,
    "l": 1000, "litre": 1000, "liter": 1000, "litres": 1000, "liters": 1000,
}


def _get_min_numeral_height_mm(quantity, unit):
    """
    Simplified approximation of the minimum-numeral-height table under
    Rule 7 (Table I). Verify exact figures against the official Gazette
    schedule before relying on this for a real compliance decision.
    """
    base_qty = quantity * _UNIT_TO_BASE.get(unit, 1)
    if base_qty <= 200:
        return 2
    elif base_qty <= 500:
        return 3
    return 4


# ------------------------------------------------------------------
# Rule 3 - Applicability based on declared quantity threshold
# ------------------------------------------------------------------
def check_rule_3(data):
    qty, unit = data.get("net_quantity"), data.get("net_quantity_unit")
    rule, clause = "Rule 3", "Applicability (quantity threshold)"

    if not qty or not unit:
        return [make_result(rule, clause, UNABLE_TO_VERIFY, "Net quantity/unit not detected.")]

    try:
        quantity = float(qty)
    except (ValueError, TypeError):
        return [make_result(rule, clause, UNABLE_TO_VERIFY, f"Quantity '{qty}' could not be converted to a number.")]

    unit = unit.strip().lower().rstrip(".")

    if unit in VALID_WEIGHT_UNITS:
        kg_value = quantity * _UNIT_TO_BASE.get(unit, 1) / 1000
        if kg_value > EXEMPT_IF_ABOVE_KG:
            return [make_result(rule, clause, NOT_APPLICABLE,
                                 f"{quantity:g} {unit} ({kg_value:g} kg) exceeds the {EXEMPT_IF_ABOVE_KG} kg threshold.")]
        return [make_result(rule, clause, PASS, f"{quantity:g} {unit} ({kg_value:g} kg) within threshold.")]

    if unit in VALID_VOLUME_UNITS:
        l_value = quantity * _UNIT_TO_BASE.get(unit, 1) / 1000
        if l_value > EXEMPT_IF_ABOVE_LITRE:
            return [make_result(rule, clause, NOT_APPLICABLE,
                                 f"{quantity:g} {unit} ({l_value:g} L) exceeds the {EXEMPT_IF_ABOVE_LITRE} L threshold.")]
        return [make_result(rule, clause, PASS, f"{quantity:g} {unit} ({l_value:g} L) within threshold.")]

    if unit in VALID_COUNT_UNITS:
        return [make_result(rule, clause, PASS,
                             f"'{quantity:g} {unit}' is count-based; weight/volume threshold not applicable.")]

    return [make_result(rule, clause, UNABLE_TO_VERIFY, f"Unit '{unit}' not recognised.")]


# ------------------------------------------------------------------
# Rule 6 - Mandatory declarations on every package (core rule)
# 6(1)(a)-(e) and 6(2) are text-verifiable today.
# 6(3) (sticker tampering) depends on an image, so it uses the
# optional-data pattern and activates automatically once CV is connected.
# ------------------------------------------------------------------
def check_rule_6(data):
    results = []
    raw = (data.get("raw_text") or "").lower()

    if data.get("manufacturer_name"):
        results.append(make_result("Rule 6(1)(a)", "Manufacturer/Packer/Importer name & address",
                                    PASS, f"Detected: {data['manufacturer_name']}"))
    else:
        results.append(make_result("Rule 6(1)(a)", "Manufacturer/Packer/Importer name & address",
                                    UNABLE_TO_VERIFY, "Not detected in OCR text."))

    if data.get("generic_name"):
        results.append(make_result("Rule 6(1)(b)", "Generic/common name of commodity",
                                    PASS, f"Detected: {data['generic_name']}"))
    else:
        results.append(make_result("Rule 6(1)(b)", "Generic/common name of commodity",
                                    UNABLE_TO_VERIFY, "Not detected in OCR text."))

    qty, unit = data.get("net_quantity"), data.get("net_quantity_unit")
    if qty and unit:
        if unit.lower() in VALID_UNITS:
            results.append(make_result("Rule 6(1)(c)", "Net quantity", PASS, f"Detected: {qty} {unit}"))
        else:
            results.append(make_result("Rule 6(1)(c)", "Net quantity", VIOLATION,
                                        f"Unit '{unit}' is not a recognised standard unit."))
    elif qty:
        results.append(make_result("Rule 6(1)(c)", "Net quantity", UNABLE_TO_VERIFY,
                                    f"Quantity '{qty}' found but unit unclear."))
    else:
        results.append(make_result("Rule 6(1)(c)", "Net quantity", UNABLE_TO_VERIFY, "Not detected in OCR text."))

    if any(k in raw for k in NO_DATE_REQUIRED_KEYWORDS):
        results.append(make_result("Rule 6(1)(d)", "Month & Year of manufacture/packing",
                                    NOT_APPLICABLE, "Commodity falls under an exempt category."))
    else:
        pdate = data.get("packing_date")
        if pdate:
            has_month = any(m in pdate.lower() for m in MONTHS)
            if has_month:
                results.append(make_result("Rule 6(1)(d)", "Month & Year of manufacture/packing",
                                            PASS, f"Detected: {pdate}"))
            else:
                results.append(make_result("Rule 6(1)(d)", "Month & Year of manufacture/packing",
                                            VIOLATION, f"Only year found ('{pdate}'); month also required."))
        else:
            results.append(make_result("Rule 6(1)(d)", "Month & Year of manufacture/packing",
                                        UNABLE_TO_VERIFY, "No date detected in OCR text."))

    if any(k in raw for k in NO_MRP_REQUIRED_KEYWORDS):
        results.append(make_result("Rule 6(1)(e)", "Retail Sale Price (MRP)",
                                    NOT_APPLICABLE, "Commodity falls under an exempt category."))
    else:
        mrp = data.get("mrp")
        if mrp:
            if data.get("mrp_tax_inclusive"):
                results.append(make_result("Rule 6(1)(e)", "Retail Sale Price (MRP)",
                                            PASS, f"Detected: Rs {mrp}, tax-inclusive wording present."))
            else:
                results.append(make_result("Rule 6(1)(e)", "Retail Sale Price (MRP)",
                                            VIOLATION, f"MRP 'Rs {mrp}' found but tax-inclusive wording missing."))
        else:
            results.append(make_result("Rule 6(1)(e)", "Retail Sale Price (MRP)",
                                        UNABLE_TO_VERIFY, "Not detected in OCR text."))

    if data.get("consumer_care"):
        results.append(make_result("Rule 6(2)", "Consumer care details", PASS, f"Detected: {data['consumer_care']}"))
    else:
        results.append(make_result("Rule 6(2)", "Consumer care details", UNABLE_TO_VERIFY, "Not detected in OCR text."))

    sticker_result = check_with_optional_data(
        data, "sticker_tampering_detected", "Rule 6(3)", "Unauthorised sticker alteration",
        "Requires image-based CV inspection; not yet available.",
        lambda tampered: make_result("Rule 6(3)", "Unauthorised sticker alteration",
                                      VIOLATION if tampered else PASS,
                                      "Sticker alteration detected on package." if tampered
                                      else "No unauthorised sticker alteration detected.")
    )
    results.append(sticker_result)

    return results


# ------------------------------------------------------------------
# Rule 7 - Numeral/letter height on the display panel.
# Activates once "measured_numeral_height_mm" is supplied by a CV module.
# ------------------------------------------------------------------
def check_rule_7(data):
    rule, clause = "Rule 7", "Numeral/letter height on display panel"
    measured = data.get("measured_numeral_height_mm")

    if measured is None:
        return [make_result(rule, clause, UNABLE_TO_VERIFY,
                             "Requires image-based measurement of numeral height (CV module).",
                             needs_extra_module=True)]

    qty, unit = data.get("net_quantity"), (data.get("net_quantity_unit") or "").lower()
    if not qty or unit not in (VALID_WEIGHT_UNITS + VALID_VOLUME_UNITS):
        return [make_result(rule, clause, UNABLE_TO_VERIFY,
                             "Measured height available but declared quantity/unit is missing.")]

    required = _get_min_numeral_height_mm(float(qty), unit)
    if measured < required:
        return [make_result(rule, clause, VIOLATION,
                             f"Measured numeral height {measured}mm is below the required {required}mm minimum.")]
    return [make_result(rule, clause, PASS,
                         f"Measured numeral height {measured}mm meets the required {required}mm minimum.")]


# ------------------------------------------------------------------
# Rule 8 - Declaration placement & spacing.
# Activates once "declaration_placement_ok" is supplied by a CV module.
# ------------------------------------------------------------------
def check_rule_8(data):
    return [check_with_optional_data(
        data, "declaration_placement_ok", "Rule 8", "Declaration placement & spacing",
        "Requires image-layout analysis (CV module).",
        lambda ok: make_result("Rule 8", "Declaration placement & spacing",
                                PASS if ok else VIOLATION,
                                "Declaration placement and spacing meet requirements." if ok
                                else "Declaration placement/spacing does not meet requirements.")
    )]


# ------------------------------------------------------------------
# Rule 9 - Manner of declaration.
# 9(1) legibility/contrast needs CV; 9(4) language works from text today.
# ------------------------------------------------------------------
def check_rule_9(data):
    results = []
    results.append(check_with_optional_data(
        data, "legibility_ok", "Rule 9(1)", "Legible & contrasting declaration",
        "Requires image-based legibility/contrast analysis (CV module).",
        lambda ok: make_result("Rule 9(1)", "Legible & contrasting declaration",
                                PASS if ok else VIOLATION,
                                "Declaration is legible and contrasts with the background." if ok
                                else "Declaration fails legibility/contrast check.")
    ))

    raw = data.get("raw_text") or ""
    if not raw.strip():
        results.append(make_result("Rule 9(4)", "Declaration language (Hindi/English)",
                                    UNABLE_TO_VERIFY, "No OCR text available."))
    else:
        has_devanagari = bool(DEVANAGARI_RANGE.search(raw))
        has_latin = bool(LATIN_RANGE.search(raw))
        if has_devanagari or has_latin:
            script = "Devanagari" if has_devanagari else "Latin/English"
            results.append(make_result("Rule 9(4)", "Declaration language (Hindi/English)",
                                        PASS, f"Detected script: {script}"))
        else:
            results.append(make_result("Rule 9(4)", "Declaration language (Hindi/English)",
                                        VIOLATION, "Text does not appear to be Hindi or English."))

    return results


# ------------------------------------------------------------------
# Rule 23 - Deceptive package assessment.
# Activates once "fill_level_ratio" (0.0-1.0) is supplied by a CV module.
# ------------------------------------------------------------------
def check_rule_23(data):
    def _fill_check(ratio):
        if ratio < 0.6:
            return make_result("Rule 23", "Deceptive package assessment", VIOLATION,
                                f"Fill level ratio {ratio:.2f} suggests the package may be deceptive.")
        return make_result("Rule 23", "Deceptive package assessment", PASS,
                            f"Fill level ratio {ratio:.2f} is acceptable.")

    return [check_with_optional_data(
        data, "fill_level_ratio", "Rule 23", "Deceptive package assessment",
        "Requires physical/visual assessment of fill level (CV module).", _fill_check
    )]


# ------------------------------------------------------------------
# Rule 24 - Wholesale package declarations
# ------------------------------------------------------------------
def check_rule_24(data):
    raw = data.get("raw_text") or ""
    is_wholesale = bool(WHOLESALE_PATTERN.search(raw))

    if not is_wholesale:
        return [make_result("Rule 24", "Wholesale package declarations", NOT_APPLICABLE,
                             "No wholesale-package indicator found.")]

    results = []
    if data.get("manufacturer_name"):
        results.append(make_result("Rule 24(a)", "Manufacturer/Importer/Packer details",
                                    PASS, f"Detected: {data['manufacturer_name']}"))
    else:
        results.append(make_result("Rule 24(a)", "Manufacturer/Importer/Packer details",
                                    UNABLE_TO_VERIFY, "Not detected."))

    if data.get("generic_name"):
        results.append(make_result("Rule 24(b)", "Identity of commodity", PASS, f"Detected: {data['generic_name']}"))
    else:
        results.append(make_result("Rule 24(b)", "Identity of commodity", UNABLE_TO_VERIFY, "Not detected."))

    if data.get("net_quantity"):
        results.append(make_result("Rule 24(c)", "Quantity / number of retail packages", PASS,
                                    f"Detected: {data['net_quantity']} {data.get('net_quantity_unit') or ''}".strip()))
    else:
        results.append(make_result("Rule 24(c)", "Quantity / number of retail packages",
                                    UNABLE_TO_VERIFY, "Not detected."))

    return results


# ------------------------------------------------------------------
# Master registry used by checker.py, and a priority-ordered list for reporting
# ------------------------------------------------------------------
ALL_RULE_CHECKS = [
    check_rule_6, check_rule_3, check_rule_9, check_rule_24,
    check_rule_7, check_rule_8, check_rule_23,
]

IMPORTANT_RULES_ORDERED = [
    ("Rule 6", "Mandatory declarations on every package (core rule)"),
    ("Rule 3", "Applicability - quantity threshold"),
    ("Rule 9", "Manner of declaration - language/legibility"),
    ("Rule 24", "Wholesale package declarations"),
    ("Rule 7", "Numeral/letter size on display panel"),
    ("Rule 8", "Declaration placement & spacing"),
    ("Rule 23", "Deceptive package assessment"),
]