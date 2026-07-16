import unittest
from src.cron import next_runs


class TestDomDowOrRule(unittest.TestCase):
    def test_or_when_both_restricted(self):
        # dom=13 OR friday -> both restricted -> union of the two
        self.assertEqual(
            next_runs("0 0 13 * FRI", "2026-01-01T00:00", 5),
            ["2026-01-02T00:00", "2026-01-09T00:00", "2026-01-13T00:00",
             "2026-01-16T00:00", "2026-01-23T00:00"])

    def test_star_slash_one_is_not_a_star(self):
        # dom "*/1" is restricted (not a literal star) -> OR with MON -> every day matches
        self.assertEqual(
            next_runs("0 0 */1 * MON", "2026-07-15T00:00", 3),
            ["2026-07-16T00:00", "2026-07-17T00:00", "2026-07-18T00:00"])

    def test_literal_star_dom_only_mondays(self):
        self.assertEqual(
            next_runs("0 0 * * MON", "2026-07-15T00:00", 3),
            ["2026-07-20T00:00", "2026-07-27T00:00", "2026-08-03T00:00"])


class TestStepsAndRanges(unittest.TestCase):
    def test_single_value_with_step_extends_to_max(self):
        # hour "6/6" -> 6,12,18
        self.assertEqual(
            next_runs("30 6/6 * * *", "2026-07-15T00:00", 4),
            ["2026-07-15T06:30", "2026-07-15T12:30", "2026-07-15T18:30", "2026-07-16T06:30"])

    def test_range_with_step_dom(self):
        self.assertEqual(
            next_runs("0 0 10-20/5 * *", "2026-07-01T00:00", 3),
            ["2026-07-10T00:00", "2026-07-15T00:00", "2026-07-20T00:00"])

    def test_month_name_range(self):
        self.assertEqual(
            next_runs("0 0 1 JAN-MAR *", "2026-06-01T00:00", 3),
            ["2027-01-01T00:00", "2027-02-01T00:00", "2027-03-01T00:00"])

    def test_dow_name_range_excludes_weekend(self):
        # from Fri 23:00, MON-FRI at 08-10; weekend skipped -> Monday
        self.assertEqual(
            next_runs("0 8-10 * * MON-FRI", "2026-07-17T23:00", 4),
            ["2026-07-20T08:00", "2026-07-20T09:00", "2026-07-20T10:00", "2026-07-21T08:00"])

    def test_list_of_dom(self):
        self.assertEqual(
            next_runs("0 0 1,15,20 * *", "2026-07-16T00:00", 3),
            ["2026-07-20T00:00", "2026-08-01T00:00", "2026-08-15T00:00"])

    def test_minute_list_rolls_over_day(self):
        self.assertEqual(
            next_runs("15,45 * * * *", "2026-07-15T23:50", 3),
            ["2026-07-16T00:15", "2026-07-16T00:45", "2026-07-16T01:15"])


class TestSparseAndHorizon(unittest.TestCase):
    def test_feb29_leap_only(self):
        self.assertEqual(
            next_runs("0 0 29 2 *", "2026-01-01T00:00", 1),
            ["2028-02-29T00:00"])

    def test_feb29_beyond_horizon_raises(self):
        # only one Feb 29 within 4 years of 2026 -> asking for 2 raises
        with self.assertRaises(ValueError):
            next_runs("0 0 29 2 *", "2026-01-01T00:00", 2)

    def test_feb30_never_matches(self):
        with self.assertRaises(ValueError):
            next_runs("0 0 30 2 *", "2026-01-01T00:00", 1)


class TestParseErrors(unittest.TestCase):
    def test_name_in_numeric_field(self):
        with self.assertRaises(ValueError):
            next_runs("JAN 0 * * *", "2026-01-01T00:00", 1)

    def test_unknown_name(self):
        with self.assertRaises(ValueError):
            next_runs("0 0 * * FOO", "2026-01-01T00:00", 1)

    def test_empty_list_element(self):
        with self.assertRaises(ValueError):
            next_runs("0 0 1,,2 * *", "2026-01-01T00:00", 1)

    def test_dangling_range(self):
        with self.assertRaises(ValueError):
            next_runs("0 0 1- * *", "2026-01-01T00:00", 1)

    def test_double_slash_step(self):
        with self.assertRaises(ValueError):
            next_runs("*/2/3 * * * *", "2026-01-01T00:00", 1)

    def test_dom_zero_out_of_range(self):
        with self.assertRaises(ValueError):
            next_runs("0 0 0 * *", "2026-01-01T00:00", 1)

    def test_dow_eight_out_of_range(self):
        with self.assertRaises(ValueError):
            next_runs("0 0 * * 8", "2026-01-01T00:00", 1)

    def test_month_thirteen(self):
        with self.assertRaises(ValueError):
            next_runs("0 0 * 13 *", "2026-01-01T00:00", 1)

    def test_negative_count(self):
        with self.assertRaises(ValueError):
            next_runs("0 0 * * *", "2026-01-01T00:00", -1)

    def test_non_numeric_step(self):
        with self.assertRaises(ValueError):
            next_runs("*/x * * * *", "2026-01-01T00:00", 1)


if __name__ == "__main__":
    unittest.main()
