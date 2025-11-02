import io
import sys
import types
from pathlib import Path
import unittest


# Ensure the app package directory is on sys.path
THIS_DIR = Path(__file__).resolve().parent
APP_DIR = THIS_DIR.parent
if str(APP_DIR) not in sys.path:
    sys.path.insert(0, str(APP_DIR))


def _ensure_mock_deps():
    """Provide lightweight mocks for torch and whisper to avoid heavy installs/downloads."""
    if "torch" not in sys.modules:
        torch_mock = types.SimpleNamespace(
            cuda=types.SimpleNamespace(is_available=lambda: False)
        )
        sys.modules["torch"] = torch_mock
    if "whisper" not in sys.modules:

        class DummyWhisper:  # pragma: no cover - placeholder type
            pass

        def load_model(name, download_root=None, device=None):  # pragma: no cover
            return DummyWhisper()

        sys.modules["whisper"] = types.SimpleNamespace(
            Whisper=DummyWhisper, load_model=load_model
        )


class WhisperServerRouteTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        _ensure_mock_deps()
        # Import here after mocks are in place
        global TestClient, app, settings
        from fastapi.testclient import TestClient
        from whisper_server.main import app
        from whisper_server.config import settings

        cls.client = TestClient(app)
        cls.settings = settings

    def test_health_ok(self):
        res = self.client.get("/health")
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res.json(), {"status": "ok"})

    def test_models_list(self):
        res = self.client.get("/models")
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertIsInstance(data, list)
        self.assertGreater(len(data), 0)
        self.assertIn("id", data[0])
        self.assertIn("name", data[0])

    def test_transcribe_success(self):
        # Patch load_model to avoid real model loading and return a fake transcriber
        from whisper_server import models as models_mod

        class FakeModel:
            def transcribe(self, path, language=None, fp16=False):  # pragma: no cover
                return {"text": "  hello world  "}

        orig = models_mod.load_model
        try:
            models_mod.load_model = lambda name: (FakeModel(), name)
            content = io.BytesIO(b"RIFF....fake-wav-data....")
            files = {"file": ("test.wav", content, "audio/wav")}
            res = self.client.post("/transcribe", files=files)
            self.assertEqual(res.status_code, 200)
            self.assertEqual(res.json(), {"text": "hello world"})
        finally:
            models_mod.load_model = orig

    def test_transcribe_size_limit(self):
        # Temporarily reduce max upload size to force 413
        orig_mb = self.settings.MAX_UPLOAD_MB
        orig_bytes = self.settings.MAX_UPLOAD_BYTES
        try:
            self.settings.MAX_UPLOAD_MB = 0
            self.settings.MAX_UPLOAD_BYTES = 0
            content = io.BytesIO(b"12345")
            files = {"file": ("small.wav", content, "audio/wav")}
            res = self.client.post("/transcribe", files=files)
            self.assertEqual(res.status_code, 413)
            self.assertIn("File too large", res.json().get("detail", ""))
        finally:
            self.settings.MAX_UPLOAD_MB = orig_mb
            self.settings.MAX_UPLOAD_BYTES = orig_bytes

    def test_transcribe_invalid_model(self):
        # Force ValueError from load_model to assert a 400 response
        from whisper_server import models as models_mod

        def raise_value_error(_):  # pragma: no cover
            raise ValueError("Invalid model name: invalid")

        orig = models_mod.load_model
        try:
            models_mod.load_model = raise_value_error
            content = io.BytesIO(b"RIFF....fake-wav-data....")
            files = {"file": ("test.wav", content, "audio/wav")}
            data = {"model": "invalid"}
            res = self.client.post("/transcribe", files=files, data=data)
            self.assertEqual(res.status_code, 400)
        finally:
            models_mod.load_model = orig


if __name__ == "__main__":  # pragma: no cover
    unittest.main()
