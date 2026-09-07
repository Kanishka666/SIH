import json
import time

from food_label_scanner import scan_food_label, scan_food_labels


def show(label, result):
    summary = {k: v for k, v in result.items() if k != "raw_text"}
    print(f"\n===== {label} =====")
    print(json.dumps(summary, indent=2, ensure_ascii=False))


start = time.time()

back = scan_food_label("test_label_back.jpeg")
show("BACK LABEL", back)

front = scan_food_label("test_label.jpeg")
show("FRONT LABEL", front)

combined = scan_food_labels(["test_label.jpeg", "test_label_back.jpeg"])
show("COMBINED", combined)

print(f"\nTotal time: {round(time.time() - start, 1)}s")
