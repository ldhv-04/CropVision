from ultralytics import YOLO
from core.config import MODEL_PATH


def load_model() -> YOLO:
    """Load YOLO model, raising a clear error if the weight file is missing."""
    if not MODEL_PATH.exists():
        raise FileNotFoundError(f"Khong tim thay model tai: {MODEL_PATH}")
    return YOLO(str(MODEL_PATH))


# Singleton — loaded once when the module is first imported.
model = load_model()
