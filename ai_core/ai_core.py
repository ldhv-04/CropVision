from fastapi import FastAPI, UploadFile, File
from pydantic import BaseModel
from ultralytics import YOLO
from PIL import Image, ImageOps
import io
import base64

app = FastAPI(title="CropVision AI Core")

model = YOLO('F:\\Documents\\Khoa Luan 2026\\cropvision_db\\ai_core\\weight\\archive\\best.pt')


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


@app.post("/predict", response_model=PredictionResult)
async def predict(file: UploadFile = File(...)):
    contents = await file.read()
    image = Image.open(io.BytesIO(contents)).convert("RGB")
    image = ImageOps.exif_transpose(image)

    results = model.predict(source=image, conf=0.25)

    buffered = io.BytesIO()
    image.save(buffered, format="JPEG")
    img_base64_str = base64.b64encode(buffered.getvalue()).decode('utf-8')

    extracted_boxes = []
    for box in results[0].boxes:
      coords = box.xyxy[0].tolist()
      conf = float(box.conf[0].item())
      class_id = int(box.cls[0].item())
      class_name = model.names[class_id]

      extracted_boxes.append({
          "x1": round(coords[0], 2),
          "y1": round(coords[1], 2),
          "x2": round(coords[2], 2),
          "y2": round(coords[3], 2),
          "confidence": round(conf, 3),
          "class_name": class_name
      })

    print(f"Da phan tich xong {file.filename}: Tim thay {len(extracted_boxes)} vung benh.")

    return {
        "success": True,
        "filename": file.filename,
        "boxes": extracted_boxes,
        "image_base64": img_base64_str,
        "image_width": image.width,
        "image_height": image.height
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=8000)
