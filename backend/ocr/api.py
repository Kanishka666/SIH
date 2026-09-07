import os
import shutil
import uuid

from fastapi import FastAPI, File, UploadFile
from typing import List

from starlette.concurrency import run_in_threadpool

from food_label_scanner import (
    scan_food_label,
    scan_food_labels,
)


app = FastAPI(
    title="Food Label OCR API",
    description="OCR API for extracting information from food labels",
    version="1.0.0",
)


@app.get("/")
def home():
    return {
        "message": "Food Label OCR API is running",
        "endpoints": [
            "/scan",
            "/scan-multiple",
        ],
    }


@app.post("/scan")
async def scan_product(
    file: UploadFile = File(...)
):
    """
    Scan one food label image.
    """

    temp_file = _save_upload(file)

    try:

        result = await run_in_threadpool(
            scan_food_label,
            temp_file,
        )

        return {
            "success": True,
            "data": result,
        }

    except Exception as e:

        return {
            "success": False,
            "error": str(e),
        }

    finally:

        _cleanup(temp_file)




def _save_upload(file: UploadFile):
    """
    Save uploaded image temporarily.
    """

    suffix = os.path.splitext(
        file.filename or ""
    )[1]

    if not suffix:
        suffix = ".jpg"

    temp_file = (
        f"upload_{uuid.uuid4().hex}{suffix}"
    )

    with open(
        temp_file,
        "wb",
    ) as buffer:

        shutil.copyfileobj(
            file.file,
            buffer,
        )

    return temp_file


def _cleanup(path):
    """
    Delete temporary uploaded file.
    """

    if os.path.exists(path):

        try:
            os.remove(path)

        except Exception:
            pass