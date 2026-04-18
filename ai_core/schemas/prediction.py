from pydantic import BaseModel


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
