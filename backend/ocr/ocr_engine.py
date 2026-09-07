import re
from functools import lru_cache

import cv2
import numpy as np
from paddleocr import PaddleOCR


@lru_cache(maxsize=1)
def _get_ocr():
    """
    Load PaddleOCR only once.
    The model is loaded when the first OCR request is made.
    """

    return PaddleOCR(
        lang="en",
        enable_mkldnn=False,
        use_doc_orientation_classify=False,
        use_doc_unwarping=False,
        use_textline_orientation=False,
        text_det_limit_side_len=1600,
        text_rec_score_thresh=0.25,
    )


def _normalize_ocr_text(text):
    """
    Fix common OCR mistakes and formatting issues.
    """

    replacements = [
        # Units
        (r"\bm1\b", "ml"),
        (r"\bmI\b", "ml"),
        (r"\bMI\b", "ml"),
        (r"\b(\d+)\s*m[1iI]\b", r"\1 ml"),
        (r"\b(\d+)g\b", r"\1 g"),
        (r"\b(\d+)ml\b", r"\1 ml"),
        (r"\b(\d+)kg\b", r"\1 kg"),
        (r"\b(\d+)l\b", r"\1 l"),

        # Calories / table zeros
        (r"\bO(?=\s*kcal)", "0"),
        (r"\bO\s*g\b", "0 g"),
        (r"\bO\s*%", "0%"),

        # Pricing
        (r"Rs\.?\s*/-", "Rs. "),
        (r"Rs\.?\s*[:\-]\s*", "Rs. "),
        (r"₹\s*", "Rs. "),

        # Section headers
        (r"\bUSE\s*BY\s*[:.]?\s*", "USE BY: "),
        (r"\bEXP\s*[:.]?\s*", "EXP: "),
        (r"\bPKD\s*[:.]?\s*", "PKD: "),
        (r"\bMFD\s*[:.]?\s*", "MFD: "),
        (r"\bMRP\s*[:.]?\s*", "MRP: "),
        (r"\bNET\s+QUAN\b", "NET QUANTITY"),
        (r"\bNET\s+QTY\b", "NET QUANTITY"),
    ]

    for pattern, replacement in replacements:
        text = re.sub(
            pattern,
            replacement,
            text,
            flags=re.IGNORECASE,
        )

    text = re.sub(r"[ \t]+", " ", text)

    return text.strip()


def _sort_text_lines(rec_texts, rec_boxes):
    """
    Organize OCR results from top-to-bottom and left-to-right.
    """

    if not rec_texts:
        return []

    if rec_boxes is None or len(rec_boxes) != len(rec_texts):
        return [
            text.strip()
            for text in rec_texts
            if text and text.strip()
        ]

    raw = []

    for text, box in zip(rec_texts, rec_boxes):

        text = text.strip() if text else ""

        if not text:
            continue

        if hasattr(box, "tolist"):
            box = box.tolist()

        # [x1, y1, x2, y2]
        if (
            len(box) == 4
            and isinstance(box[0], (int, float))
        ):
            x1, y1, x2, y2 = box

            yc = (y1 + y2) / 2.0
            xc = (x1 + x2) / 2.0
            h = max(abs(y2 - y1), 1.0)

            raw.append(
                {
                    "t": text,
                    "x1": x1,
                    "x2": x2,
                    "yc": yc,
                    "xc": xc,
                    "h": h,
                }
            )

        # Polygon format
        elif (
            len(box) == 4
            and isinstance(box[0], (list, tuple))
        ):
            yc = sum(p[1] for p in box) / len(box)
            xc = sum(p[0] for p in box) / len(box)

            min_x = min(p[0] for p in box)
            max_x = max(p[0] for p in box)

            h = max(
                max(p[1] for p in box)
                - min(p[1] for p in box),
                1.0,
            )

            raw.append(
                {
                    "t": text,
                    "x1": min_x,
                    "x2": max_x,
                    "yc": yc,
                    "xc": xc,
                    "h": h,
                }
            )

        else:
            raw.append(
                {
                    "t": text,
                    "x1": 0,
                    "x2": 0,
                    "yc": 0,
                    "xc": 0,
                    "h": 10,
                }
            )

    if not raw:
        return []

    # Top to bottom
    raw.sort(key=lambda item: item["yc"])

    lines = []

    for item in raw:

        placed = False

        for line in lines:

            line_yc = (
                sum(it["yc"] for it in line)
                / len(line)
            )

            avg_h = (
                sum(it["h"] for it in line)
                / len(line)
            )

            # Same horizontal text line
            if abs(item["yc"] - line_yc) <= avg_h * 0.45:

                has_x_overlap = any(
                    not (
                        item["x2"] <= it["x1"] + 5
                        or item["x1"] >= it["x2"] - 5
                    )
                    for it in line
                )

                if not has_x_overlap:
                    line.append(item)
                    placed = True
                    break

        if not placed:
            lines.append([item])

    output = []

    for line in lines:

        # Left to right
        line.sort(key=lambda it: it["xc"])

        text = " ".join(
            it["t"]
            for it in line
        ).strip()

        yc = (
            sum(it["yc"] for it in line)
            / len(line)
        )

        if text:
            output.append((yc, text))

    # Top to bottom
    output.sort(key=lambda x: x[0])

    return [
        text
        for _, text in output
    ]


def _prepare_image(image):
    """
    Resize very large images so OCR doesn't become unnecessarily slow.
    """

    if image is None:
        return None

    h, w = image.shape[:2]

    max_side = max(h, w)

    if max_side > 1600:

        scale = 1600.0 / max_side

        new_w = int(w * scale)
        new_h = int(h * scale)

        image = cv2.resize(
            image,
            (new_w, new_h),
            interpolation=cv2.INTER_AREA,
        )

    return image


def _run_ocr_on_image(image):
    """
    Run PaddleOCR on one image.
    """

    ocr = _get_ocr()

    result = ocr.predict(image)[0]

    texts = _sort_text_lines(
        result.get("rec_texts", []),
        result.get("rec_boxes"),
    )

    return texts


def extract_text(image_path):
    """
    Extract ordered text from one food label image.
    """

    # Allow accidental list input
    if isinstance(image_path, list):

        results = [
            extract_text(path)
            for path in image_path
        ]

        return "\n\n---\n\n".join(
            result
            for result in results
            if result
        )

    image = cv2.imread(image_path)

    if image is None:
        raise ValueError(
            f"Could not read image: {image_path}"
        )

    prepared = _prepare_image(image)

    lines = _run_ocr_on_image(prepared)

    # Fallback enhancement
    if len(lines) < 2:

        gray = cv2.cvtColor(
            prepared,
            cv2.COLOR_BGR2GRAY,
        )

        clahe = cv2.createCLAHE(
            clipLimit=2.5,
            tileGridSize=(8, 8),
        )

        enhanced_gray = clahe.apply(gray)

        enhanced = cv2.cvtColor(
            enhanced_gray,
            cv2.COLOR_GRAY2BGR,
        )

        fallback_lines = _run_ocr_on_image(
            enhanced
        )

        if len(fallback_lines) > len(lines):
            lines = fallback_lines

    full_text = "\n".join(lines)

    return _normalize_ocr_text(full_text)


def warmup_ocr():
    """
    Optional manual warm-up.
    Not called automatically by FastAPI.
    """

    ocr = _get_ocr()

    dummy = np.zeros(
        (100, 100, 3),
        dtype=np.uint8,
    )

    try:
        ocr.predict(dummy)
    except Exception:
        pass