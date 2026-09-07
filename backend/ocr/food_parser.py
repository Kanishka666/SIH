import re
from typing import Any, Dict, List, Optional


# ============================================================
# FIELD DEFINITIONS
# ============================================================

FIELD_KEYS = [
    "product_name",
    "brand",
    "net_quantity",
    "mrp",
    "unit_sale_price",
    "batch_number",
    "packed_date",
    "use_by_date",
    "ingredients",
    "allergens",
    "nutrition",
    "fssai_licenses",
    "warnings",
    "country_of_origin",
]


# ============================================================
# COMMON SECTION HEADINGS
# ============================================================

SECTION_HEADINGS = {
    "ingredients",
    "ingredient",
    "nutritional information",
    "nutrition information",
    "nutrition facts",
    "nutritional facts",
    "nutrition",
    "directions",
    "direction",
    "usage",
    "usage level composition",
    "composition",
    "storage",
    "storage instructions",
    "warning",
    "warnings",
    "caution",
    "contents",
    "contains",
    "allergen information",
    "allergens",
    "manufactured by",
    "marketed by",
    "imported by",
    "customer care",
    "customer service",
    "disclaimer",
    "legal metrology",
}


# ============================================================
# COMMON BRANDS
# ============================================================

KNOWN_BRANDS = [
    "MuscleBlaze",
    "Muscle Blaze",
    "The Coca-Cola Company",
    "Coca-Cola",
    "Pepsi",
    "PepsiCo",
    "Nestle",
    "Nestlé",
    "Amul",
    "Britannia",
    "Parle",
    "Haldiram's",
    "Haldirams",
    "ITC",
    "Dabur",
    "Patanjali",
    "Horlicks",
    "Boost",
    "Ensure",
    "Complan",
    "Mother Dairy",
    "Tata",
    "Tata Consumer",
    "Red Bull",
    "Monster",
    "Paper Boat",
    "Real",
    "Maaza",
    "Thums Up",
    "Sprite",
    "Fanta",
    "Limca",
    "Kinley",
    "Bisleri",
]


# ============================================================
# COMMON PRODUCT TERMS
# ============================================================

PRODUCT_TERMS = [
    "creatine monohydrate",
    "whey protein",
    "whey",
    "protein powder",
    "mass gainer",
    "pre workout",
    "pre-workout",
    "bcaa",
    "amino acids",
    "glutamine",
    "creatine",
    "electrolyte",
    "energy drink",
    "soft drink",
    "carbonated soft drink",
    "juice",
    "fruit juice",
    "drink",
    "beverage",
    "biscuits",
    "cookies",
    "chocolate",
    "noodles",
    "chips",
    "namkeen",
    "cereal",
    "oats",
    "milk",
    "curd",
    "yogurt",
    "butter",
    "cheese",
]


# ============================================================
# STOP WORDS FOR PRODUCT NAME
# ============================================================

PRODUCT_STOP_PHRASES = [
    "usage level composition",
    "nutritional information",
    "nutrition information",
    "nutrition facts",
    "ingredients",
    "ingredient",
    "directions",
    "storage",
    "storage instructions",
    "warning",
    "warnings",
    "caution",
    "manufactured by",
    "marketed by",
    "imported by",
    "customer care",
    "customer service",
    "fssai",
    "lic no",
    "lic. no",
    "batch no",
    "batch number",
    "mfg date",
    "mfg. date",
    "packed",
    "packed date",
    "expiry",
    "exp",
    "mrp",
    "net weight",
    "netweight",
    "net wt",
    "net qty",
    "composition",
    "contains",
]


# ============================================================
# EMPTY RESULT
# ============================================================

def empty_label_data() -> Dict[str, Any]:
    return {
        "product_name": None,
        "brand": None,
        "net_quantity": None,
        "mrp": None,
        "unit_sale_price": None,
        "batch_number": None,
        "packed_date": None,
        "use_by_date": None,
        "ingredients": None,
        "allergens": [],
        "nutrition": {},
        "fssai_licenses": [],
        "warnings": [],
        "country_of_origin": None,
    }


# ============================================================
# TEXT CLEANING
# ============================================================

def clean_text(text: str) -> str:
    if not text:
        return ""

    text = text.replace("\r\n", "\n")
    text = text.replace("\r", "\n")

    # Remove null characters
    text = text.replace("\x00", " ")

    # Normalize spaces but preserve newlines
    text = re.sub(r"[ \t]+", " ", text)

    # Remove excessive blank lines
    text = re.sub(r"\n{3,}", "\n\n", text)

    return text.strip()


def get_lines(text: str) -> List[str]:
    text = clean_text(text)

    lines = []

    for line in text.splitlines():
        line = line.strip()

        if not line:
            continue

        line = re.sub(r"\s+", " ", line)

        lines.append(line)

    return lines


def normalize_for_search(text: str) -> str:
    text = text.lower()

    replacements = {
        "₹": "rs",
        "rs.": "rs",
        "rupees": "rs",
    }

    for old, new in replacements.items():
        text = text.replace(old, new)

    text = re.sub(r"\s+", " ", text)

    return text.strip()


_normalize_for_search = normalize_for_search


# ============================================================
# GENERIC HELPERS
# ============================================================

def _is_heading(line: str) -> bool:
    normalized = normalize_for_search(line)

    normalized = re.sub(r"[:\-]+$", "", normalized).strip()

    return normalized in {
        normalize_for_search(x)
        for x in SECTION_HEADINGS
    }


def _looks_like_product_name(line: str) -> bool:
    if not line:
        return False

    normalized = normalize_for_search(line)

    if len(line) < 3:
        return False

    if len(line) > 100:
        return False

    for phrase in PRODUCT_STOP_PHRASES:
        if phrase in normalized:
            return False

    # Mostly numbers = unlikely product name
    letters = len(re.findall(r"[A-Za-z]", line))
    digits = len(re.findall(r"\d", line))

    if letters < 3:
        return False

    if digits > letters:
        return False

    # Legal/code-like lines
    if re.search(
        r"\b(lic|license|fssai|batch|mfg|manufactured|marketed|mrp|exp)\b",
        normalized,
    ):
        return False

    return True


def _clean_value(value: Optional[str]) -> Optional[str]:
    if value is None:
        return None

    value = value.strip()

    value = re.sub(r"\s+", " ", value)

    value = value.strip(" .,:;-")

    if not value:
        return None

    return value


# ============================================================
# PRODUCT NAME
# ============================================================

def _find_product_name(text: str) -> Optional[str]:
    lines = get_lines(text)

    # --------------------------------------------------------
    # 1. Strong known product terms
    # --------------------------------------------------------

    lower_text = normalize_for_search(text)

    strong_products = [
        "creatine monohydrate",
        "whey protein",
        "mass gainer",
        "protein powder",
        "pre workout",
        "pre-workout",
        "energy drink",
        "carbonated soft drink",
        "fruit juice",
    ]

    for product in strong_products:
        if product in lower_text:
            # Return proper capitalization from the OCR when possible
            pattern = re.compile(re.escape(product), re.IGNORECASE)

            match = pattern.search(text)

            if match:
                value = match.group(0).strip()

                if value.lower() == "pre-workout":
                    return "Pre-Workout"

                return value.title() if value.islower() else value

    # --------------------------------------------------------
    # 2. Product after a known brand
    # --------------------------------------------------------

    for i, line in enumerate(lines):
        normalized = normalize_for_search(line)

        for brand in KNOWN_BRANDS:
            brand_norm = normalize_for_search(brand)

            if brand_norm in normalized:
                # Look at the next few lines
                for next_line in lines[i + 1:i + 5]:

                    if not _looks_like_product_name(next_line):
                        continue

                    normalized_next = normalize_for_search(next_line)

                    # Avoid company/legal lines
                    if any(
                        phrase in normalized_next
                        for phrase in [
                            "private limited",
                            "pvt ltd",
                            "lifecare",
                            "manufactured",
                            "marketed",
                            "fssai",
                            "lic",
                        ]
                    ):
                        continue

                    return _clean_value(next_line)

    # --------------------------------------------------------
    # 3. Look for product terms inside individual lines
    # --------------------------------------------------------

    for line in lines:
        normalized = normalize_for_search(line)

        for term in PRODUCT_TERMS:
            if term in normalized:
                match = re.search(
                    re.escape(term),
                    line,
                    flags=re.IGNORECASE,
                )

                if match:
                    value = match.group(0)

                    if len(value) >= 4:
                        return value.title()

    # --------------------------------------------------------
    # 4. Conservative fallback
    # --------------------------------------------------------

    candidates = []

    for line in lines[:15]:

        if not _looks_like_product_name(line):
            continue

        normalized = normalize_for_search(line)

        # Ignore marketing sentences
        if len(line.split()) > 8:
            continue

        if any(
            x in normalized
            for x in [
                "shake",
                "serve",
                "level scoop",
                "scoop",
                "flavour",
                "flavor",
                "available",
                "free",
                "premium",
                "quality",
                "best",
                "formula",
            ]
        ):
            continue

        candidates.append(line)

    if candidates:
        # Prefer shorter clean candidates
        candidates.sort(key=lambda x: len(x))

        return _clean_value(candidates[0])

    return None


# ============================================================
# BRAND
# ============================================================

def _find_brand(text: str) -> Optional[str]:
    lower_text = normalize_for_search(text)

    # Strong known brands first
    for brand in KNOWN_BRANDS:

        brand_norm = normalize_for_search(brand)

        if brand_norm in lower_text:

            # Normalize known brands to preferred spelling
            if brand_norm in ["muscleblaze", "muscle blaze"]:
                return "MuscleBlaze"

            if brand_norm in ["nestle", "nestlé"]:
                return "Nestlé"

            if brand_norm in ["haldirm's", "haldirams"]:
                return "Haldiram's"

            return brand

    # OCR-tolerant MuscleBlaze detection
    muscle_match = re.search(
        r"muscle\s*blaze",
        text,
        flags=re.IGNORECASE,
    )

    if muscle_match:
        return "MuscleBlaze"

    return None


# ============================================================
# NET QUANTITY
# ============================================================

def _extract_quantity(value: str) -> Optional[str]:
    if not value:
        return None

    value = value.replace("O", "0")

    match = re.search(
        r"\b(\d+(?:\.\d+)?)\s*(kg|g|gm|grams?|mg|ml|l|litre|liter|litres|liters)\b",
        value,
        flags=re.IGNORECASE,
    )

    if not match:
        return None

    number = match.group(1)
    unit = match.group(2).lower()

    unit_map = {
        "kg": "kg",
        "g": "g",
        "gm": "g",
        "gram": "g",
        "grams": "g",
        "mg": "mg",
        "ml": "ml",
        "l": "L",
        "litre": "L",
        "liter": "L",
        "litres": "L",
        "liters": "L",
    }

    unit = unit_map.get(unit, unit)

    return f"{number} {unit}"


def _find_net_quantity(text: str) -> Optional[str]:
    lines = get_lines(text)

    # --------------------------------------------------------
    # Strong explicit labels
    # --------------------------------------------------------

    net_patterns = [
        r"net\s*weight",
        r"netweight",
        r"net\s*wt",
        r"net\s*qty",
        r"net\s*quantity",
        r"net\s*content",
        r"net\s*contents",
    ]

    for i, line in enumerate(lines):

        normalized = normalize_for_search(line)

        if any(re.search(pattern, normalized) for pattern in net_patterns):

            # Same line
            quantity = _extract_quantity(line)

            if quantity:
                return quantity

            # Next few lines
            for next_line in lines[i + 1:i + 4]:

                # Do not cross into nutrition table
                if any(
                    x in normalize_for_search(next_line)
                    for x in [
                        "nutrition",
                        "nutritional information",
                        "serving size",
                        "amount per serving",
                        "qty./100",
                        "qty/100",
                    ]
                ):
                    break

                quantity = _extract_quantity(next_line)

                if quantity:
                    return quantity

    # --------------------------------------------------------
    # Avoid falsely returning values from:
    # "Qty./100 g"
    # "Per 100 g"
    # "Serving 3 g"
    # --------------------------------------------------------

    for line in lines:

        normalized = normalize_for_search(line)

        if any(
            x in normalized
            for x in [
                "qty./100",
                "qty/100",
                "per 100 g",
                "per 100ml",
                "per 100 ml",
                "serving size",
                "amount per serving",
            ]
        ):
            continue

    return None


# ============================================================
# MRP
# ============================================================

def _extract_price(value: str) -> Optional[str]:
    if not value:
        return None

    # ₹ 699
    match = re.search(
        r"(?:₹|rs\.?|inr)\s*([0-9]{1,7}(?:[.,][0-9]{1,2})?)",
        value,
        flags=re.IGNORECASE,
    )

    if match:
        number = match.group(1).replace(",", "")

        return f"Rs. {number}"

    # Plain price such as 699.00
    matches = re.findall(
        r"\b([0-9]{2,7}\.[0-9]{1,2})\b",
        value,
    )

    if matches:
        return f"Rs. {matches[-1]}"

    # Plain integer price
    matches = re.findall(
        r"\b([1-9][0-9]{1,5})\b",
        value,
    )

    if matches:
        return f"Rs. {matches[-1]}"

    return None


def _find_mrp(text: str) -> Optional[str]:
    lines = get_lines(text)

    for i, line in enumerate(lines):

        normalized = normalize_for_search(line)

        if not re.search(r"\bmrp\b", normalized):
            continue

        # ----------------------------------------------------
        # Search same line and next few lines
        # ----------------------------------------------------

        candidates = [line]

        candidates.extend(lines[i + 1:i + 5])

        for candidate in candidates:

            # Avoid USP price being mistaken as MRP
            candidate_norm = normalize_for_search(candidate)

            if "usp" in candidate_norm and "mrp" not in candidate_norm:
                continue

            price = _extract_price(candidate)

            if price:
                return price

    return None


# ============================================================
# UNIT SALE PRICE / USP
# ============================================================

def _find_usp(text: str) -> Optional[str]:
    lines = get_lines(text)

    for i, line in enumerate(lines):

        normalized = normalize_for_search(line)

        if "usp" not in normalized:
            continue

        candidates = [line]
        candidates.extend(lines[i + 1:i + 3])

        for candidate in candidates:

            # ₹6.99 / g
            match = re.search(
                r"(?:₹|rs\.?|inr)\s*"
                r"([0-9]+(?:\.[0-9]+)?)"
                r"\s*/\s*"
                r"([a-zA-Z]+)",
                candidate,
                flags=re.IGNORECASE,
            )

            if match:
                amount = match.group(1)
                unit = match.group(2)

                return f"Rs. {amount}/{unit}"

    # Do NOT guess badly OCR'd USP values.
    return None


# ============================================================
# BATCH NUMBER
# ============================================================

BAD_BATCH_WORDS = {
    "and",
    "the",
    "for",
    "with",
    "from",
    "date",
    "india",
    "indian",
    "application",
    "patent",
    "marketed",
    "manufactured",
    "company",
    "private",
    "limited",
    "pvt",
    "ltd",
    "here",
    "scratch",
}


def _looks_like_batch(value: str) -> bool:
    if not value:
        return False

    value = value.strip()

    if value.lower() in BAD_BATCH_WORDS:
        return False

    if len(value) < 4:
        return False

    if len(value) > 30:
        return False

    # Must contain both letters and/or digits
    if not re.search(r"[A-Za-z]", value):
        return False

    # Avoid normal words
    if value.lower() in BAD_BATCH_WORDS:
        return False

    # Batch-like values normally contain digits
    if not re.search(r"\d", value):
        return False

    return True


def _find_batch_number(text: str) -> Optional[str]:
    lines = get_lines(text)

    # --------------------------------------------------------
    # Strong explicit Batch No pattern
    # --------------------------------------------------------

    for i, line in enumerate(lines):

        normalized = normalize_for_search(line)

        if not re.search(
            r"\bbatch\s*(?:no|number|#)\b",
            normalized,
        ):
            continue

        # Same line after Batch No
        after = re.split(
            r"batch\s*(?:no|number|#)\s*[:.\-]?",
            line,
            flags=re.IGNORECASE,
        )

        if len(after) > 1:

            candidate_text = after[1]

            # Remove unrelated section words
            candidate_text = re.sub(
                r"\b(usp|mfg|mfg\.|date|expiry|exp)\b.*",
                "",
                candidate_text,
                flags=re.IGNORECASE,
            )

            tokens = re.findall(
                r"\b[A-Za-z0-9][A-Za-z0-9./_-]{3,29}\b",
                candidate_text,
            )

            for token in tokens:

                if _looks_like_batch(token):
                    return token

        # Search next 3 lines
        for next_line in lines[i + 1:i + 4]:

            normalized_next = normalize_for_search(next_line)

            # Stop when another field starts
            if re.search(
                r"\b(mfg|mfg\.|manufactured|mrp|expiry|exp|net\s*weight)\b",
                normalized_next,
            ):
                break

            tokens = re.findall(
                r"\b[A-Za-z0-9][A-Za-z0-9./_-]{3,29}\b",
                next_line,
            )

            for token in tokens:

                if _looks_like_batch(token):
                    return token

    # --------------------------------------------------------
    # Never return arbitrary words like "and"
    # --------------------------------------------------------

    return None


# ============================================================
# DATE NORMALIZATION
# ============================================================

MONTHS = {
    "JAN": "01",
    "JANUARY": "01",
    "FEB": "02",
    "FEBRUARY": "02",
    "MAR": "03",
    "MARCH": "03",
    "APR": "04",
    "APRIL": "04",
    "MAY": "05",
    "JUN": "06",
    "JUNE": "06",
    "JUL": "07",
    "JULY": "07",
    "AUG": "08",
    "AUGUST": "08",
    "SEP": "09",
    "SEPT": "09",
    "SEPTEMBER": "09",
    "OCT": "10",
    "OCTOBER": "10",
    "NOV": "11",
    "NOVEMBER": "11",
    "DEC": "12",
    "DECEMBER": "12",
}


def _normalize_date(value: str) -> Optional[str]:
    if not value:
        return None

    value = value.strip()

    value = value.replace("\\", "/")
    value = value.replace("-", "/")
    value = re.sub(r"\s+", "", value)

    # --------------------------------------------------------
    # DD/MM/YYYY
    # --------------------------------------------------------

    match = re.fullmatch(
        r"(\d{1,2})/(\d{1,2})/(\d{4})",
        value,
    )

    if match:
        day, month, year = match.groups()

        return f"{int(day):02d}/{int(month):02d}/{year}"

    # --------------------------------------------------------
    # DD/MON/YYYY
    # Example: 21/JUL/2026
    # --------------------------------------------------------

    match = re.fullmatch(
        r"(\d{1,2})/([A-Za-z]+)/(\d{4})",
        value,
    )

    if match:

        day, month, year = match.groups()

        month_num = MONTHS.get(month.upper())

        if month_num:
            return f"{int(day):02d}/{month_num}/{year}"

    # --------------------------------------------------------
    # DD MON YYYY
    # --------------------------------------------------------

    match = re.fullmatch(
        r"(\d{1,2})([A-Za-z]+)(\d{4})",
        value,
    )

    if match:

        day, month, year = match.groups()

        month_num = MONTHS.get(month.upper())

        if month_num:
            return f"{int(day):02d}/{month_num}/{year}"

    return None


# ============================================================
# DATE SEARCH HELPER
# ============================================================

def _find_date_after_label(
    lines: List[str],
    labels: List[str],
) -> Optional[str]:

    for i, line in enumerate(lines):

        normalized = normalize_for_search(line)

        if not any(
            re.search(label, normalized)
            for label in labels
        ):
            continue

        candidates = [line]
        candidates.extend(lines[i + 1:i + 4])

        for candidate in candidates:

            # Numeric date
            match = re.search(
                r"\b\d{1,2}[/-]\d{1,2}[/-]\d{2,4}\b",
                candidate,
            )

            if match:
                normalized_date = _normalize_date(
                    match.group(0)
                )

                if normalized_date:
                    return normalized_date

            # Month-name date
            match = re.search(
                r"\b\d{1,2}[/-][A-Za-z]{3,12}[/-]\d{4}\b",
                candidate,
            )

            if match:
                normalized_date = _normalize_date(
                    match.group(0)
                )

                if normalized_date:
                    return normalized_date

            # OCR may remove separators:
            # 21JUL2026
            match = re.search(
                r"\b\d{1,2}[A-Za-z]{3,12}\d{4}\b",
                candidate,
            )

            if match:
                normalized_date = _normalize_date(
                    match.group(0)
                )

                if normalized_date:
                    return normalized_date

            month_year = re.search(
                r"\b[A-Za-z]{3,12}\s+\d{4}\b",
                candidate,
            )
            if month_year:
                month = MONTHS.get(month_year.group(0).split()[0].upper())
                if month:
                    return f"{month}/{month_year.group(0).split()[1]}"

            year = re.search(r"\b\d{4}\b", candidate)
            if year:
                return year.group(0)

    return None


# ============================================================
# PACKED / MANUFACTURING DATE
# ============================================================

def _find_packed_date(text: str) -> Optional[str]:
    lines = get_lines(text)

    return _find_date_after_label(
        lines,
        [
            r"\bmfg\b",
            r"\bmfg\.",
            r"\bmanufacturing\s*date\b",
            r"\bmanufactured\s*date\b",
            r"\bpacked\s*date\b",
            r"\bpack\s*date\b",
            r"\bpacked\b",
            r"\bpack\b",
            r"\bdate\s*of\s*manufacture\b",
            r"\bdom\b",
        ],
    )


# ============================================================
# EXPIRY / USE-BY DATE
# ============================================================

def _find_use_by_date(text: str) -> Optional[str]:
    lines = get_lines(text)

    return _find_date_after_label(
        lines,
        [
            r"\bexp\b",
            r"\bexpiry\b",
            r"\bexpires\b",
            r"\bexpiry\s*date\b",
            r"\buse\s*by\b",
            r"\bbest\s*before\b",
            r"\bbest\s*by\b",
        ],
    )


def _find_manufacturer(text: str) -> Optional[str]:
    match = re.search(
        r"(?:mfg\.?\s*by|manufactured\s*by|packed\s*by|marketed\s*by|imported\s*by)"
        r"\s*[:\-]?\s*([^\n]+)",
        text,
        flags=re.IGNORECASE,
    )
    return _clean_value(match.group(1)) if match else None


def _find_consumer_care(text: str) -> Optional[str]:
    match = re.search(
        r"(?:customer\s*care|consumer\s*care|helpline|contact)"
        r"[^\dA-Za-z@]{0,20}(\d{6,12}|[\w.\-+]+@[\w.\-]+\.[A-Za-z]{2,})",
        text,
        flags=re.IGNORECASE,
    )
    return match.group(1) if match else None


# ============================================================
# INGREDIENTS
# ============================================================

def _find_ingredients(text: str) -> Optional[str]:
    lines = get_lines(text)

    # --------------------------------------------------------
    # ONLY use explicit ingredient heading.
    #
    # IMPORTANT:
    # We deliberately DO NOT treat
    # "USAGE LEVEL COMPOSITION"
    # as ingredients.
    # --------------------------------------------------------

    for i, line in enumerate(lines):

        normalized = normalize_for_search(line)

        if not re.fullmatch(
            r"ingredients?\s*:?",
            normalized,
        ):
            continue

        collected = []

        # Collect next several lines
        for next_line in lines[i + 1:i + 8]:

            normalized_next = normalize_for_search(next_line)

            # Stop at another major section
            if any(
                x in normalized_next
                for x in [
                    "nutritional information",
                    "nutrition information",
                    "nutrition facts",
                    "serving size",
                    "directions",
                    "storage instructions",
                    "manufactured by",
                    "marketed by",
                    "fssai",
                    "lic no",
                    "batch no",
                    "mfg date",
                    "expiry",
                    "best before",
                    "allergen",
                    "contains",
                ]
            ):
                break

            collected.append(next_line)

        if collected:

            result = " ".join(collected)

            result = re.sub(
                r"\s+",
                " ",
                result,
            ).strip()

            return result

    return None


# ============================================================
# ALLERGENS
# ============================================================

ALLERGEN_TERMS = [
    "milk",
    "milk solids",
    "soy",
    "soya",
    "wheat",
    "gluten",
    "peanut",
    "peanuts",
    "tree nuts",
    "nuts",
    "almond",
    "almonds",
    "cashew",
    "cashews",
    "fish",
    "egg",
    "eggs",
    "sesame",
]


def _find_allergens(text: str) -> List[str]:
    lower_text = normalize_for_search(text)

    found = []

    # Prefer allergen-related sections
    allergen_context = ""

    for match in re.finditer(
        r"(allergen|contains|may contain|allergy)",
        lower_text,
    ):
        start = max(0, match.start() - 100)
        end = min(len(lower_text), match.end() + 250)

        allergen_context += " " + lower_text[start:end]

    search_text = allergen_context if allergen_context else lower_text

    for allergen in ALLERGEN_TERMS:

        pattern = r"\b" + re.escape(allergen) + r"\b"

        if re.search(pattern, search_text):

            if allergen in ["soya"]:
                display = "Soy"
            elif allergen in ["peanuts"]:
                display = "Peanut"
            elif allergen in ["almonds"]:
                display = "Almond"
            elif allergen in ["cashews"]:
                display = "Cashew"
            elif allergen in ["eggs"]:
                display = "Egg"
            else:
                display = allergen.title()

            if display not in found:
                found.append(display)

    return found


# ============================================================
# NUTRITION
# ============================================================

NUTRIENT_PATTERNS = {
    "energy": [
        r"\benergy\b",
    ],
    "protein": [
        r"\bprotein\b",
    ],
    "carbohydrate": [
        r"\bcarbohydrate\b",
        r"\bcarbohydrates\b",
    ],
    "sugars": [
        r"\bsugars\b",
    ],
    "added_sugars": [
        r"\badded\s+sugars\b",
    ],
    "total_fat": [
        r"\btotal\s+fat\b",
        r"\bfat\b",
    ],
    "saturated_fat": [
        r"\bsaturated\s+fat\b",
    ],
    "trans_fat": [
        r"\btrans\s+fat\b",
    ],
    "cholesterol": [
        r"\bcholesterol\b",
    ],
    "sodium": [
        r"\bsodium\b",
    ],
    "fiber": [
        r"\bfiber\b",
        r"\bfibre\b",
    ],
}


def _find_serving_size(text: str) -> Optional[str]:
    patterns = [
        r"serving\s*size\s*[:\-]?\s*.*?\(\s*(\d+(?:\.\d+)?)\s*(g|ml)\s*\)",
        r"serving\s*size\s*[:\-]?\s*(\d+(?:\.\d+)?)\s*(g|ml)",
        r"amount\s*per\s*serving\s*[:\-]?\s*(\d+(?:\.\d+)?)\s*(g|ml)",
    ]

    for pattern in patterns:

        match = re.search(
            pattern,
            text,
            flags=re.IGNORECASE,
        )

        if match:

            number = match.group(1)
            unit = match.group(2)

            return f"{number} {unit}"

    return None


def _extract_nutrient_value(
    text: str,
    patterns: List[str],
) -> Optional[str]:

    for pattern in patterns:

        match = re.search(
            pattern +
            r".{0,80}?"
            r"([0-9]+(?:\.[0-9]+)?)"
            r"\s*(kcal|g|mg|µg|ug)?",
            text,
            flags=re.IGNORECASE | re.DOTALL,
        )

        if match:

            number = match.group(1)
            unit = match.group(2)

            if unit:
                return f"{number} {unit}"

            return number

    return None


def _find_nutrition(text: str) -> Dict[str, Any]:
    nutrition = {}

    serving_size = _find_serving_size(text)

    if serving_size:
        nutrition["serving_size"] = serving_size

    # Only search nutrition section when possible
    nutrition_text = text

    nutrition_match = re.search(
        r"(nutritional\s+information|nutrition\s+information|nutrition\s+facts)"
        r"(.*)",
        text,
        flags=re.IGNORECASE | re.DOTALL,
    )

    if nutrition_match:
        nutrition_text = nutrition_match.group(2)

    for nutrient, patterns in NUTRIENT_PATTERNS.items():

        value = _extract_nutrient_value(
            nutrition_text,
            patterns,
        )

        if value is not None:
            nutrition[nutrient] = value

    return nutrition


# ============================================================
# FSSAI LICENSE
# ============================================================

def _find_fssai_licenses(text: str) -> List[str]:

    # FSSAI license numbers are commonly 14 digits.
    matches = re.findall(
        r"\b1\d{13}\b",
        text,
    )

    # Remove duplicates
    unique = []

    for value in matches:
        if value not in unique:
            unique.append(value)

    return unique


# ============================================================
# WARNINGS
# ============================================================

WARNING_PATTERNS = [
    r"\bwarning\b",
    r"\bwarnings\b",
    r"\bcaution\b",
    r"\bkeep\s+out\s+of\s+reach\s+of\s+children\b",
    r"\bnot\s+recommended\b",
    r"\bconsult\s+(?:your\s+)?doctor\b",
]


def _find_warnings(text: str) -> List[str]:
    lines = get_lines(text)

    warnings = []

    for i, line in enumerate(lines):

        normalized = normalize_for_search(line)

        matched = any(
            re.search(pattern, normalized)
            for pattern in WARNING_PATTERNS
        )

        if not matched:
            continue

        # If line itself is only heading, include next line
        if normalized in ["warning", "warnings", "caution"]:

            if i + 1 < len(lines):
                value = lines[i + 1]

                if value not in warnings:
                    warnings.append(value)

        else:

            if line not in warnings:
                warnings.append(line)

    return warnings


# ============================================================
# COUNTRY OF ORIGIN
# ============================================================

def _find_country_of_origin(text: str) -> Optional[str]:

    patterns = [
        r"country\s+of\s+origin\s*[:\-]?\s*([A-Za-z ]{2,50})",
        r"made\s+in\s*[:\-]?\s*([A-Za-z ]{2,50})",
        r"product\s+of\s*[:\-]?\s*([A-Za-z ]{2,50})",
    ]

    for pattern in patterns:

        match = re.search(
            pattern,
            text,
            flags=re.IGNORECASE,
        )

        if match:

            value = match.group(1).strip()

            value = re.sub(
                r"\s+",
                " ",
                value,
            )

            return value

    return None


# ============================================================
# MAIN PARSER
# ============================================================

def parse_food_label(text: str) -> Dict[str, Any]:

    data = empty_label_data()

    if not text:
        return data

    text = clean_text(text)

    # --------------------------------------------------------
    # Basic fields
    # --------------------------------------------------------

    data["product_name"] = _find_product_name(text)

    data["brand"] = _find_brand(text)

    data["net_quantity"] = _find_net_quantity(text)

    data["mrp"] = _find_mrp(text)

    data["unit_sale_price"] = _find_usp(text)

    data["batch_number"] = _find_batch_number(text)

    data["packed_date"] = _find_packed_date(text)

    data["use_by_date"] = _find_use_by_date(text)

    data["manufacturer_name"] = _find_manufacturer(text)

    data["consumer_care"] = _find_consumer_care(text)

    data["ingredients"] = _find_ingredients(text)

    data["allergens"] = _find_allergens(text)

    data["nutrition"] = _find_nutrition(text)

    data["fssai_licenses"] = _find_fssai_licenses(text)

    data["warnings"] = _find_warnings(text)

    data["country_of_origin"] = _find_country_of_origin(text)

    return data


# ============================================================
# FIELD VALIDATION / SCORING
# ============================================================

def _field_score(field: str, value: Any) -> float:

    if value is None:
        return 0.0

    if isinstance(value, str):

        if not value.strip():
            return 0.0

    if isinstance(value, list):

        if not value:
            return 0.0

    if isinstance(value, dict):

        if not value:
            return 0.0

    score = 1.0

    # --------------------------------------------------------
    # Field-specific confidence
    # --------------------------------------------------------

    if field == "brand":

        if value == "MuscleBlaze":
            return 10.0

        if value in KNOWN_BRANDS:
            return 9.0

        return 5.0

    if field == "product_name":

        normalized = normalize_for_search(str(value))

        if "creatine monohydrate" in normalized:
            return 10.0

        if "whey protein" in normalized:
            return 10.0

        if "mass gainer" in normalized:
            return 10.0

        if normalized in PRODUCT_STOP_PHRASES:
            return 0.0

        if len(str(value)) < 4:
            return 1.0

        return 7.0

    if field == "net_quantity":

        if re.search(
            r"\d+(?:\.\d+)?\s*(kg|g|mg|ml|l)\b",
            str(value),
            re.IGNORECASE,
        ):
            return 8.0

    if field == "mrp":

        if re.search(
            r"rs\.\s*\d",
            str(value),
            re.IGNORECASE,
        ):
            return 9.0

    if field == "batch_number":

        if _looks_like_batch(str(value)):
            return 8.0

        return 0.0

    if field in ["packed_date", "use_by_date"]:

        if re.fullmatch(
            r"\d{2}/\d{2}/\d{4}",
            str(value),
        ):
            return 10.0

        return 0.0

    if field == "ingredients":

        if len(str(value)) >= 5:
            return 8.0

    if field == "fssai_licenses":

        if isinstance(value, list):

            valid = [
                x for x in value
                if re.fullmatch(r"1\d{13}", str(x))
            ]

            if valid:
                return 10.0

    return score


# ============================================================
# MERGE MULTIPLE IMAGE RESULTS
# ============================================================

def merge_label_data(results: List[Dict[str, Any]]) -> Dict[str, Any]:

    merged = empty_label_data()

    if not results:
        return merged

    # --------------------------------------------------------
    # Scalar fields
    # --------------------------------------------------------

    scalar_fields = [
        "product_name",
        "brand",
        "net_quantity",
        "mrp",
        "unit_sale_price",
        "batch_number",
        "packed_date",
        "use_by_date",
        "ingredients",
        "country_of_origin",
    ]

    for field in scalar_fields:

        candidates = []

        for result in results:

            value = result.get(field)

            if value is None:
                continue

            if isinstance(value, str) and not value.strip():
                continue

            score = _field_score(
                field,
                value,
            )

            if score <= 0:
                continue

            candidates.append(
                (
                    score,
                    value,
                )
            )

        if candidates:

            # Highest confidence first
            candidates.sort(
                key=lambda x: x[0],
                reverse=True,
            )

            merged[field] = candidates[0][1]

    # --------------------------------------------------------
    # Allergens
    # --------------------------------------------------------

    allergens = []

    for result in results:

        values = result.get("allergens", [])

        if not isinstance(values, list):
            continue

        for value in values:

            if value not in allergens:
                allergens.append(value)

    merged["allergens"] = allergens

    # --------------------------------------------------------
    # FSSAI licenses
    # --------------------------------------------------------

    licenses = []

    for result in results:

        values = result.get(
            "fssai_licenses",
            [],
        )

        if not isinstance(values, list):
            continue

        for value in values:

            if re.fullmatch(
                r"1\d{13}",
                str(value),
            ):

                if value not in licenses:
                    licenses.append(value)

    merged["fssai_licenses"] = licenses

    # --------------------------------------------------------
    # Warnings
    # --------------------------------------------------------

    warnings = []

    for result in results:

        values = result.get(
            "warnings",
            [],
        )

        if not isinstance(values, list):
            continue

        for value in values:

            if value not in warnings:
                warnings.append(value)

    merged["warnings"] = warnings

    # --------------------------------------------------------
    # Nutrition
    #
    # Combine nutrition fields from all images.
    # --------------------------------------------------------

    nutrition = {}

    for result in results:

        result_nutrition = result.get(
            "nutrition",
            {},
        )

        if not isinstance(result_nutrition, dict):
            continue

        for key, value in result_nutrition.items():

            if value is None:
                continue

            if key not in nutrition:
                nutrition[key] = value

    merged["nutrition"] = nutrition

    return merged


# ============================================================
# DEBUG HELPER
# ============================================================

def debug_parse(text: str) -> Dict[str, Any]:
    """
    Useful when debugging OCR results.

    Returns both parsed data and cleaned OCR lines.
    """

    return {
        "parsed": parse_food_label(text),
        "lines": get_lines(text),
    }

