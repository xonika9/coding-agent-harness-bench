import unittest

from src.intervals import Interval, merge


class TestMerge(unittest.TestCase):
    def test_empty(self):
        self.assertEqual(merge([]), [])

    def test_single(self):
        self.assertEqual(merge([Interval(1, 4)]), [Interval(1, 4)])

    def test_disjoint(self):
        self.assertEqual(
            merge([Interval(1, 3), Interval(5, 7)]),
            [Interval(1, 3), Interval(5, 7)],
        )

    def test_overlap(self):
        self.assertEqual(
            merge([Interval(1, 4), Interval(2, 6)]), [Interval(1, 6)]
        )

    def test_nested(self):
        self.assertEqual(
            merge([Interval(1, 10), Interval(3, 5)]), [Interval(1, 10)]
        )

    def test_unsorted_input(self):
        self.assertEqual(
            merge([Interval(5, 7), Interval(1, 3), Interval(2, 6)]),
            [Interval(1, 7)],
        )

    def test_adjacent_merges(self):
        # [1,3) and [3,5) are contiguous and must merge into [1,5)
        self.assertEqual(
            merge([Interval(1, 3), Interval(3, 5)]), [Interval(1, 5)]
        )


if __name__ == "__main__":
    unittest.main()
