import sys
import types
import importlib
from pathlib import Path
import unittest


# Ensure the app package directory is on sys.path
THIS_DIR = Path(__file__).resolve().parent
APP_DIR = THIS_DIR.parent
if str(APP_DIR) not in sys.path:
    sys.path.insert(0, str(APP_DIR))


def _mock_deps_before_import():
    if "torch" not in sys.modules:
        torch_mock = types.SimpleNamespace(
            cuda=types.SimpleNamespace(is_available=lambda: False)
        )
        sys.modules["torch"] = torch_mock
    if "whisper" not in sys.modules:

        class DummyWhisper:  # pragma: no cover
            pass

        def load_model(name, download_root=None, device=None):  # pragma: no cover
            return DummyWhisper()

        sys.modules["whisper"] = types.SimpleNamespace(
            Whisper=DummyWhisper, load_model=load_model
        )


class ModelResolverTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        _mock_deps_before_import()
        # Import module after injecting mocks
        global models
        models = importlib.import_module("whisper_server.models")

    def test_resolve_model_name_defaults(self):
        self.assertEqual(models.resolve_model_name(None), "tiny")
        self.assertEqual(models.resolve_model_name(""), "tiny")

    def test_resolve_model_name_aliases(self):
        self.assertEqual(models.resolve_model_name("Tiny"), "tiny")
        self.assertEqual(models.resolve_model_name("large-v3"), "large-v3")

    def test_get_available_models_contains_expected(self):
        available = models.get_available_models()
        ids = {m.id for m in available}
        self.assertIn("tiny", ids)
        self.assertIn("base", ids)
        self.assertIn("large", ids)

    def test_load_model_rejects_invalid(self):
        with self.assertRaises(ValueError):
            models.load_model("not-a-model")


if __name__ == "__main__":  # pragma: no cover
    unittest.main()
