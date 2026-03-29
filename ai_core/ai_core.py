import base64
import io
import os
from pathlib import Path

from fastapi import FastAPI, File, UploadFile
from PIL import Image, ImageOps
from pydantic import BaseModel
from ultralytics import YOLO

APP_DIR = Path(__file__).resolve().parent
DEFAULT_MODEL_PATH = APP_DIR / "weight" / "archive" / "best.pt"
MODEL_PATH = Path(os.getenv("MODEL_PATH", str(DEFAULT_MODEL_PATH))).expanduser()
HOST = os.getenv("HOST", "127.0.0.1")
PORT = int(os.getenv("PORT", "8000"))

app = FastAPI(title="CropVision AI Core")

if not MODEL_PATH.exists():
    raise FileNotFoundError(f"Khong tim thay model tai: {MODEL_PATH}")

model = YOLO(str(MODEL_PATH))


class BoundingBox(BaseModel):
    x1: float
    y1: float
    x2: float
    y2: float
    confidence: float
    class_name: str


class PredictionResult(BaseModel):
    success: bool
    filename: str
    boxes: list[BoundingBox]
    image_base64: str
    image_width: int
    image_height: int


@app.get("/")
def read_root():
    return {"message": "May chu AI Core dang hoat dong!"}


@app.get("/health")
def healthcheck():
    return {"success": True, "model_path": str(MODEL_PATH)}


@app.post("/predict", response_model=PredictionResult)
async def predict(file: UploadFile = File(...)):
    contents = await file.read()
    image = Image.open(io.BytesIO(contents)).convert("RGB")
    image = ImageOps.exif_transpose(image)

    results = model.predict(source=image, conf=0.25)

    buffered = io.BytesIO()
    image.save(buffered, format="JPEG")
    img_base64_str = base64.b64encode(buffered.getvalue()).decode("utf-8")

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

    print(f"Da phan tich xong {file.filename}: Tim thay {len(extracted_boxes)} vung benh.")

    return {
        "success": True,
        "filename": file.filename,
        "boxes": extracted_boxes,
        "image_base64": img_base64_str,
        "image_width": image.width,
        "image_height": image.height,
    }


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host=HOST, port=PORT)
