import json
from food_label_scanner import scan_food_label


result = scan_food_label("test_label.jpeg")


print("\n========== FINAL RESULT ==========\n")

print(json.dumps(result, indent=4, ensure_ascii=False))

print("\n==================================\n")