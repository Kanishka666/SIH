from paddleocr import PaddleOCR

ocr = PaddleOCR(
    lang="en",
    enable_mkldnn=False
)

result = ocr.predict("test_label.jpeg")

for res in result:
    for text, score in zip(res["rec_texts"], res["rec_scores"]):
        print(f"{text}  |  Confidence: {score:.2f}")