from food_label_scanner import scan_food_labels
import json


images = [
    "test_label.jpeg",
    "test_label_back.jpeg",
]


print("\n========== PROCESSING IMAGES ==========\n")


try:

    result = scan_food_labels(images)

    print(
        "\n========== FINAL STRUCTURED RESULT ==========\n"
    )

    print(
        json.dumps(
            result,
            indent=4,
            ensure_ascii=False,
        )
    )

    print(
        "\n============================================\n"
    )

except Exception as e:

    print("\n========== ERROR ==========\n")
    print(str(e))