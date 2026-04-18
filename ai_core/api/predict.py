import base64
import io

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

    while True:
        chunk = await file.read(chunk_size)
        if not chunk:
            break
        total += len(chunk)
        if total > MAX_FILE_SIZE_BYTES:
            raise HTTPException(status_code=413, detail="Kich thuoc file vuot qua gioi han 10 MB.")
        buffer.write(chunk)

    buffer.seek(0)
    image = Image.open(buffer).convert("RGB")
    image = ImageOps.exif_transpose(image)

    results = model.predict(source=image, conf=0.25)

    img_buffer = io.BytesIO()
    image.save(img_buffer, format="JPEG")
    img_base64_str = base64.b64encode(img_buffer.getvalue()).decode("utf-8")

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

    return {
        "success": True,
        "filename": file.filename,
        "boxes": extracted_boxes,
        "image_base64": img_base64_str,
        "image_width": image.width,
        "image_height": image.height,
    }
