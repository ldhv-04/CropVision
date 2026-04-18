import pytest
from fastapi.testclient import TestClient

# Mock the YOLO model load before importing the app
import sys
from unittest.mock import MagicMock

# Create a fake model object
mock_model = MagicMock()
mock_model.names = {0: "Healthy", 1: "DiseaseA", 2: "DiseaseB"}

# We create a fake results object as YOLO predict returns a list of results
class MockBox:
    def __init__(self):
        # xyxy[0].tolist() -> [10.0, 10.0, 50.0, 50.0]
        # conf[0].item() -> 0.95
        # cls[0].item() -> 1 (DiseaseA)
        class MockTensor:
            def __init__(self, val, tolist_val=None):
                self.val = val
                self.tolist_val = tolist_val
            def item(self):
                return self.val
            def tolist(self):
                return self.tolist_val
            
            def __getitem__(self, idx):
                return MockTensor(self.val[idx] if isinstance(self.val, list) else self.val, self.tolist_val)

        self.xyxy = MockTensor([[10.0, 10.0, 50.0, 50.0]], [10.0, 10.0, 50.0, 50.0])
        self.conf = MockTensor([0.95])
        self.cls = MockTensor([1])

class MockResult:
    def __init__(self):
        self.boxes = [MockBox()]

mock_model.predict.return_value = [MockResult()]

# Inject mock into models module
class MockYoloModule:
    model = mock_model

sys.modules['models.yolo_model'] = MockYoloModule

from main import app

@pytest.fixture
def client():
    with TestClient(app) as test_client:
        yield test_client
