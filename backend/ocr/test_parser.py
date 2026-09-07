import json

from ocr_engine import extract_text
from food_parser import parse_food_label


text = extract_text("test_label.jpeg")

data = parse_food_label(text)

print("\n========== PARSED FOOD LABEL ==========\n")

print(json.dumps(data, indent=4))

print("\n=======================================\n")