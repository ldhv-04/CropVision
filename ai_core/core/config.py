import os
from pathlib import Path

APP_DIR = Path(__file__).resolve().parent.parent

MODEL_PATH = Path(
    os.getenv("MODEL_PATH", str(APP_DIR / "weight" / "archive" / "best.pt"))
).expanduser()

HOST = os.getenv("HOST", "127.0.0.1")
PORT = int(os.getenv("PORT", "8000"))
