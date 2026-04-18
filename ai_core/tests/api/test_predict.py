import io
from fastapi.testclient import TestClient
from PIL import Image

def test_read_root(client: TestClient):
    response = client.get("/")
    assert response.status_code == 200
    assert response.json() == {"message": "May chu AI Core dang hoat dong!"}

def test_health_check(client: TestClient):
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert "model_path" in data

def test_predict_invalid_file_type(client: TestClient):
    # Send a text file instead of an image
    files = {"file": ("test.txt", b"Hello text", "text/plain")}
    response = client.post("/predict", files=files)
    assert response.status_code == 415

def test_predict_file_too_large(client: TestClient):
    # Create fake bytes larger than 10MB
    large_bytes = b"0" * (10 * 1024 * 1024 + 1)
    files = {"file": ("test.jpg", large_bytes, "image/jpeg")}
    response = client.post("/predict", files=files)
    assert response.status_code == 413

def test_predict_success(client: TestClient):
    # Create a valid tiny image using PIL
    img = Image.new("RGB", (10, 10), color="blue")
    img_byte_arr = io.BytesIO()
    img.save(img_byte_arr, format="JPEG")
    img_byte_arr.seek(0)
    
    files = {"file": ("test.jpg", img_byte_arr, "image/jpeg")}
    response = client.post("/predict", files=files)
    
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert data["filename"] == "test.jpg"
    assert "image_base64" in data
    assert len(data["boxes"]) == 1
    assert data["boxes"][0]["class_name"] == "DiseaseA"

