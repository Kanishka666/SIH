from ocr_engine import extract_text
from food_parser import merge_label_data, parse_food_label


def scan_food_label(image_path):
    """
    Scan one food label image.
    """

    text = extract_text(image_path)

    if not text or not text.strip():
        data = parse_food_label("")
        data["raw_text"] = ""
        data["images_processed"] = 0
        return data

    data = parse_food_label(text)

    data["raw_text"] = text
    data["images_processed"] = 1

    return data


def scan_food_labels(image_paths):
    """
    Scan multiple food label images.

    Each image is OCR'd exactly once.
    Results from individual images are merged.
    """

    if isinstance(image_paths, str):
        image_paths = [image_paths]

    parsed_results = []
    raw_sections = []
    per_image = []

    for image_path in image_paths:

        # OCR THIS IMAGE EXACTLY ONCE
        text = extract_text(image_path)

        if not text or not text.strip():
            continue

        raw_sections.append(text)

        # Parse ONLY this image
        result = parse_food_label(text)

        result["raw_text"] = text

        parsed_results.append(result)
        per_image.append(result)

    # Nothing detected
    if not parsed_results:

        empty = parse_food_label("")

        empty["raw_text"] = ""
        empty["images_processed"] = 0
        empty["per_image"] = []

        return empty

    # IMPORTANT:
    # Do NOT parse combined OCR text again.
    #
    # The old code did:
    #
    # combined_raw = ...
    # parse_food_label(combined_raw)
    #
    # That caused information from different images
    # to interfere with each other.

    merged = merge_label_data(parsed_results)

    # Combined raw OCR is ONLY for displaying/debugging.
    merged["raw_text"] = "\n\n---\n\n".join(raw_sections)

    merged["images_processed"] = len(parsed_results)

    merged["per_image"] = per_image

    return merged