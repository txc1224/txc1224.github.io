import unittest

from scripts.fetch_daily_tech import dedupe_items, filter_content_items, is_noise_title, normalize_title_key


class DailyTechFiltersTest(unittest.TestCase):
    def test_noise_titles_are_filtered(self):
        self.assertTrue(is_noise_title("自我推广帖子"))
        self.assertTrue(is_noise_title("每月招聘和求职信息"))
        self.assertTrue(is_noise_title("State of the Subreddit January 2027: mods"))
        self.assertFalse(is_noise_title("Vite 8.0 正式发布"))

    def test_normalize_title_key_collapses_punctuation(self):
        self.assertEqual(
            normalize_title_key("Vite 8.0: 正式发布！"),
            normalize_title_key("Vite 8 0 正式发布"),
        )

    def test_filter_content_items_removes_noise_and_duplicates(self):
        items = [
            {"title": "自我推广帖子", "url": "https://example.com/noise"},
            {"title": "Vite 8.0 正式发布", "url": "https://example.com/vite"},
            {"title": "Vite 8.0 正式发布！", "url": "https://example.com/vite-dup"},
            {"title": "TurboQuant 权重量化", "url": "https://example.com/turbo"},
        ]

        filtered = filter_content_items(items)

        self.assertEqual(
            [item["title"] for item in filtered],
            ["Vite 8.0 正式发布", "TurboQuant 权重量化"],
        )

    def test_dedupe_items_uses_url_and_title(self):
        items = [
            {"title": "OpenSpace", "url": "https://example.com/open-space"},
            {"title": "OpenSpace", "url": "https://example.com/open-space#comments"},
            {"title": "Open Space", "url": "https://example.com/other"},
        ]

        deduped = dedupe_items(items)

        self.assertEqual(len(deduped), 2)


if __name__ == "__main__":
    unittest.main()
