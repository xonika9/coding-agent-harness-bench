import unittest
from src.cron import next_runs


class TestBasic(unittest.TestCase):
    def test_daily_midnight(self):
        self.assertEqual(
            next_runs("0 0 * * *", "2026-07-15T12:00", 3),
            ["2026-07-16T00:00", "2026-07-17T00:00", "2026-07-18T00:00"])

    def test_every_15_min(self):
        self.assertEqual(
            next_runs("*/15 * * * *", "2026-07-15T10:07", 4),
            ["2026-07-15T10:15", "2026-07-15T10:30", "2026-07-15T10:45", "2026-07-15T11:00"])

    def test_specific_minute_hour(self):
        self.assertEqual(
            next_runs("30 10 * * *", "2026-07-15T00:00", 1),
            ["2026-07-15T10:30"])

    def test_list_of_minutes(self):
        self.assertEqual(
            next_runs("0,30 9 * * *", "2026-07-15T00:00", 2),
            ["2026-07-15T09:00", "2026-07-15T09:30"])

    def test_range(self):
        self.assertEqual(
            next_runs("0 9-11 * * *", "2026-07-15T00:00", 3),
            ["2026-07-15T09:00", "2026-07-15T10:00", "2026-07-15T11:00"])


class TestStrictlyAfter(unittest.TestCase):
    def test_exact_match_excluded(self):
        # 10:30 matches, but result must be strictly after the given instant
        self.assertEqual(
            next_runs("30 10 * * *", "2026-07-15T10:30", 1),
            ["2026-07-16T10:30"])

    def test_seconds_floored_to_minute(self):
        self.assertEqual(
            next_runs("30 10 * * *", "2026-07-15T10:29:59", 1),
            ["2026-07-15T10:30"])


class TestDayOfWeek(unittest.TestCase):
    def test_monday(self):
        self.assertEqual(
            next_runs("0 0 * * MON", "2026-07-15T00:00", 2),
            ["2026-07-20T00:00", "2026-07-27T00:00"])

    def test_sunday_as_zero(self):
        self.assertEqual(
            next_runs("0 0 * * 0", "2026-07-15T00:00", 2),
            ["2026-07-19T00:00", "2026-07-26T00:00"])

    def test_sunday_as_seven(self):
        self.assertEqual(
            next_runs("0 0 * * 7", "2026-07-15T00:00", 2),
            ["2026-07-19T00:00", "2026-07-26T00:00"])


class TestMonthAndDom(unittest.TestCase):
    def test_month_name(self):
        self.assertEqual(
            next_runs("0 12 1 JAN *", "2026-06-01T00:00", 1),
            ["2027-01-01T12:00"])

    def test_dom_31_skips_short_months(self):
        self.assertEqual(
            next_runs("0 0 31 * *", "2026-01-15T00:00", 3),
            ["2026-01-31T00:00", "2026-03-31T00:00", "2026-05-31T00:00"])

    def test_year_end(self):
        self.assertEqual(
            next_runs("59 23 31 12 *", "2026-01-01T00:00", 1),
            ["2026-12-31T23:59"])


class TestErrors(unittest.TestCase):
    def test_wrong_field_count(self):
        with self.assertRaises(ValueError):
            next_runs("0 0 * *", "2026-07-15T00:00", 1)

    def test_minute_out_of_range(self):
        with self.assertRaises(ValueError):
            next_runs("60 0 * * *", "2026-07-15T00:00", 1)

    def test_reversed_range(self):
        with self.assertRaises(ValueError):
            next_runs("0 10-9 * * *", "2026-07-15T00:00", 1)

    def test_zero_step(self):
        with self.assertRaises(ValueError):
            next_runs("*/0 * * * *", "2026-07-15T00:00", 1)

    def test_bad_after(self):
        with self.assertRaises(ValueError):
            next_runs("0 0 * * *", "not-a-date", 1)

    def test_count_zero(self):
        with self.assertRaises(ValueError):
            next_runs("0 0 * * *", "2026-07-15T00:00", 0)


if __name__ == "__main__":
    unittest.main()
