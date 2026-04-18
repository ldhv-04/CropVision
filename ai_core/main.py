import sys
from pathlib import Path

# Ensure ai_core root is in the Python path so sub-packages resolve correctly.
sys.path.insert(0, str(Path(__file__).resolve().parent))

from fastapi import FastAPI
from api.predict import router

app = FastAPI(title="CropVision AI Core")
app.include_router(router)


if __name__ == "__main__":
    import uvicorn
    from core.config import HOST, PORT

    uvicorn.run(app, host=HOST, port=PORT)
