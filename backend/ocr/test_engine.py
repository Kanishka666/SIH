from ocr_engine import extract_text

images = [
    "test_label.jpeg",
    "test_label_back.jpeg"
]

text = extract_text(images)

print("\n========== COMBINED OCR TEXT ==========\n")
print(text)
print("\n=======================================\n")