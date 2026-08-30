import os
import tempfile
import time
import unittest
from pathlib import Path

IMPORT_DATA_DIR = tempfile.TemporaryDirectory()
os.environ["PENTELL_DATA_DIR"] = IMPORT_DATA_DIR.name

import server


class TestingStuffLinkTests(unittest.TestCase):
    def setUp(self):
        self.temp_dir = tempfile.TemporaryDirectory()
        self.original_path = server.TESTING_LINKS_PATH
        server.TESTING_LINKS_PATH = Path(self.temp_dir.name) / "links.json"

    def tearDown(self):
        server.TESTING_LINKS_PATH = self.original_path
        self.temp_dir.cleanup()

    def test_round_trip_and_public_view_hide_destination(self):
        link = server.normalize_testing_link({
            "title": "Field Notes",
            "slug": "field-notes",
            "destination": "https://chatgpt.com/",
            "note": "Prototype walkthrough",
            "listed": True,
        })
        server.save_testing_links([link])

        loaded = server.load_testing_links()[0]
        self.assertEqual(loaded["destination"], "https://chatgpt.com/")
        self.assertNotIn("destination", server.public_testing_link(loaded))
        self.assertEqual(server.owner_testing_link(loaded)["destination"], "https://chatgpt.com/")

    def test_rejects_unsafe_destination_and_reserved_slug(self):
        with self.assertRaisesRegex(ValueError, "complete http"):
            server.normalize_testing_link({"title": "Unsafe", "slug": "unsafe", "destination": "javascript:alert(1)"})
        with self.assertRaisesRegex(ValueError, "lowercase"):
            server.normalize_testing_link({"title": "Manager", "slug": "manage", "destination": "https://example.com"})

    def test_expiration(self):
        active = {"expires_at": int(time.time()) + 60}
        expired = {"expires_at": int(time.time()) - 60}
        permanent = {"expires_at": None}

        self.assertTrue(server.testing_link_active(active))
        self.assertFalse(server.testing_link_active(expired))
        self.assertTrue(server.testing_link_active(permanent))
        self.assertFalse(server.testing_link_active({"expires_at": "invalid"}))


if __name__ == "__main__":
    unittest.main()
