import unittest

from src.accumulate import running_totals


class TestDemo(unittest.TestCase):
    def test_independent_calls(self):
        # Each call should be independent.
        self.assertEqual(running_totals([1, 2, 3]), [1, 3, 6])
        # This second call fails today: state leaks from the first call.
        self.assertEqual(running_totals([10]), [10])


if __name__ == "__main__":
    unittest.main()
