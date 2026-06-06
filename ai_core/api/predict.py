import base64
import io
import os
import time

from fastapi import APIRouter, File, HTTPException, UploadFile
from PIL import Image, ImageOps

from models.yolo_model import model
from schemas.prediction import PredictionResult

router = APIRouter()

ALLOWED_CONTENT_TYPES = {"image/jpeg", "image/png", "image/webp", "image/gif"}
MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024  # 10 MB


@router.get("/")
def read_root():
    return {"message": "May chu AI Core dang hoat dong!"}


@router.get("/health")
def healthcheck():
    from core.config import MODEL_PATH
    return {"success": True, "model_path": str(MODEL_PATH)}


@router.post("/predict", response_model=PredictionResult)
async def predict(file: UploadFile = File(...)):
    total_start = time.perf_counter()
    # Validate MIME type truoc khi doc noi dung.
    if file.content_type not in ALLOWED_CONTENT_TYPES:
        raise HTTPException(
            status_code=415,
            detail=f"Dinh dang khong ho tro: {file.content_type}. Chi chap nhan JPEG, PNG, WebP, GIF.",
        )

    # Doc file theo tung chunk de tranh load toan bo vao RAM.
    buffer = io.BytesIO()
    total = 0
    chunk_size = 1024 * 64  # 64 KB

    read_start = time.perf_counter()
    while True:
        chunk = await file.read(chunk_size)
        if not chunk:
            break
        total += len(chunk)
        if total > MAX_FILE_SIZE_BYTES:
            raise HTTPException(status_code=413, detail="Kich thuoc file vuot qua gioi han 10 MB.")
        buffer.write(chunk)
    read_ms = (time.perf_counter() - read_start) * 1000

    decode_start = time.perf_counter()
    buffer.seek(0)
    image = Image.open(buffer).convert("RGB")
    image = ImageOps.exif_transpose(image)
    decode_ms = (time.perf_counter() - decode_start) * 1000

    predict_start = time.perf_counter()
    results = model.predict(source=image, conf=0.25)
    predict_ms = (time.perf_counter() - predict_start) * 1000

    encode_start = time.perf_counter()
    img_buffer = io.BytesIO()
    image.save(img_buffer, format="JPEG")
    img_base64_str = base64.b64encode(img_buffer.getvalue()).decode("utf-8")
    encode_ms = (time.perf_counter() - encode_start) * 1000

    postprocess_start = time.perf_counter()
    extracted_boxes = []
    for box in results[0].boxes:
        coords = box.xyxy[0].tolist()
        conf = float(box.conf[0].item())
        class_id = int(box.cls[0].item())
        class_name = model.names[class_id]

        extracted_boxes.append(
            {
                "x1": round(coords[0], 2),
                "y1": round(coords[1], 2),
                "x2": round(coords[2], 2),
                "y2": round(coords[3], 2),
                "confidence": round(conf, 3),
                "class_name": class_name,
            }
        )
    postprocess_ms = (time.perf_counter() - postprocess_start) * 1000

    log_inference_timing(
        "ai-core-predict",
        {
            "readMs": round(read_ms),
            "decodeMs": round(decode_ms),
            "predictMs": round(predict_ms),
            "encodeMs": round(encode_ms),
            "postprocessMs": round(postprocess_ms),
            "totalMs": round((time.perf_counter() - total_start) * 1000),
            "bytes": total,
            "boxes": len(extracted_boxes),
            "width": image.width,
            "height": image.height,
        },
    )

    return {
        "success": True,
        "filename": file.filename,
        "boxes": extracted_boxes,
        "image_base64": img_base64_str,
        "image_width": image.width,
        "image_height": image.height,
    }


def log_inference_timing(label: str, metrics: dict):
    if os.getenv("ENV") == "production" or os.getenv("INFERENCE_TIMING_LOGS") != "1":
        return
    print(f"[InferenceTiming] {label} {metrics}")
