import copy
import importlib.util
import json
from pathlib import Path
import unittest

ROOT = Path(__file__).resolve().parents[2]
spec = importlib.util.spec_from_file_location("artifact_validator", ROOT / "scripts/validate_projection_artifact.py")
validator = importlib.util.module_from_spec(spec)
spec.loader.exec_module(validator)


class ArtifactValidationTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.payload = json.loads((ROOT / "public/projections.json").read_text())

    def test_entire_committed_artifact_is_valid(self):
        self.assertEqual(validator.validate_artifact(self.payload), [])

    def test_bad_value_after_first_25_is_reported(self):
        for value in (None, "", "bad", True, float("inf"), float("nan")):
            with self.subTest(value=value):
                payload = copy.deepcopy(self.payload)
                payload["players"][-1]["projections"]["pts"]["projected"] = value
                errors = validator.validate_artifact(payload)
                self.assertTrue(any(f"players[{len(payload['players']) - 1}]" in e and "pts.projected" in e for e in errors))

    def test_duplicate_id_is_reported(self):
        payload = copy.deepcopy(self.payload)
        payload["players"][-1]["id"] = payload["players"][0]["id"]
        self.assertTrue(any("duplicate id" in e for e in validator.validate_artifact(payload)))

    def test_missing_target_and_field_are_reported(self):
        payload = copy.deepcopy(self.payload)
        del payload["players"][-1]["projections"]["ast"]
        del payload["players"][0]["projections"]["pts"]["change"]
        errors = validator.validate_artifact(payload)
        self.assertTrue(any("ast: projection is required" in e for e in errors))
        self.assertTrue(any("pts.change" in e for e in errors))

    def test_malformed_envelopes_report_errors(self):
        for payload in (None, [], {"meta": None}, {"meta": {"targets": None}},
                        {"meta": {"targets": []}, "evaluation": None}):
            with self.subTest(payload=payload):
                self.assertTrue(validator.validate_artifact(payload))

    def test_zero_remains_valid(self):
        payload = copy.deepcopy(self.payload)
        payload["players"][-1]["projections"]["pts"]["projected"] = 0
        self.assertEqual(validator.validate_artifact(payload), [])


if __name__ == "__main__":
    unittest.main()
