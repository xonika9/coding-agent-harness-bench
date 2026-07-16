import unittest
from src.query import run_query


class TestStrictTypes(unittest.TestCase):
    def test_number_not_equal_string(self):
        # 5 == "5" is false, no coercion
        self.assertEqual(run_query([{"a": 5}], {"where": [{"field": "a", "op": "==", "value": "5"}]}), [])

    def test_ordered_mixed_raises(self):
        with self.assertRaises(ValueError):
            run_query([{"a": 5}], {"where": [{"field": "a", "op": "<", "value": "x"}]})

    def test_bool_is_not_a_number_in_ordered(self):
        with self.assertRaises(ValueError):
            run_query([{"a": True}], {"where": [{"field": "a", "op": ">=", "value": 1}]})

    def test_missing_field_with_neq_excluded(self):
        self.assertEqual(run_query([{"b": 1}], {"where": [{"field": "a", "op": "!=", "value": 5}]}), [])

    def test_contains_non_container_is_false(self):
        self.assertEqual(run_query([{"a": 5}], {"where": [{"field": "a", "op": "contains", "value": 5}]}), [])

    def test_contains_list_field(self):
        self.assertEqual(run_query([{"tags": ["x", "y"]}, {"tags": ["z"]}],
                                   {"where": [{"field": "tags", "op": "contains", "value": "x"}]}),
                         [{"tags": ["x", "y"]}])

    def test_in_with_tuple(self):
        self.assertEqual(run_query([{"a": 2}, {"a": 9}], {"where": [{"field": "a", "op": "in", "value": (1, 2)}]}),
                         [{"a": 2}])

    def test_empty_where_passes_all(self):
        self.assertEqual(run_query([{"a": 1}, {"a": 2}], {"where": []}), [{"a": 1}, {"a": 2}])


class TestSortStrict(unittest.TestCase):
    def test_desc_none_last(self):
        self.assertEqual(run_query([{"a": 2}, {"b": 9}, {"a": 1}], {"order_by": [{"field": "a", "dir": "desc"}]}),
                         [{"a": 2}, {"a": 1}, {"b": 9}])

    def test_mixed_types_in_sort_key_raises(self):
        with self.assertRaises(ValueError):
            run_query([{"a": 1}, {"a": "x"}], {"order_by": [{"field": "a"}]})

    def test_non_orderable_sort_value_raises(self):
        with self.assertRaises(ValueError):
            run_query([{"a": [1]}], {"order_by": [{"field": "a"}]})

    def test_multi_key_desc_then_asc(self):
        rows = [{"g": "b", "n": 1}, {"g": "a", "n": 2}, {"g": "b", "n": 3}, {"g": "a", "n": 1}]
        spec = {"order_by": [{"field": "g", "dir": "desc"}, {"field": "n"}]}
        self.assertEqual(run_query(rows, spec),
                         [{"g": "b", "n": 1}, {"g": "b", "n": 3}, {"g": "a", "n": 1}, {"g": "a", "n": 2}])


class TestPaginateStrict(unittest.TestCase):
    def test_negative_offset_raises(self):
        with self.assertRaises(ValueError):
            run_query([{"a": 1}], {"offset": -1})

    def test_bool_limit_raises(self):
        with self.assertRaises(ValueError):
            run_query([{"a": 1}], {"limit": True})

    def test_zero_limit(self):
        self.assertEqual(run_query([{"a": 1}, {"a": 2}], {"limit": 0}), [])


class TestDistinctStrict(unittest.TestCase):
    def test_distinct_key_order_independent(self):
        self.assertEqual(run_query([{"a": 1, "b": 2}, {"b": 2, "a": 1}, {"a": 1, "b": 3}], {"distinct": True}),
                         [{"a": 1, "b": 2}, {"a": 1, "b": 3}])


class TestPipelineOrder(unittest.TestCase):
    def test_distinct_before_paginate(self):
        rows = [{"a": 1}, {"a": 1}, {"a": 2}, {"a": 3}]
        self.assertEqual(run_query(rows, {"distinct": True, "limit": 2}), [{"a": 1}, {"a": 2}])

    def test_filter_then_paginate(self):
        rows = [{"a": i} for i in range(6)]
        spec = {"where": [{"field": "a", "op": ">=", "value": 2}], "offset": 1, "limit": 2}
        self.assertEqual(run_query(rows, spec), [{"a": 3}, {"a": 4}])

    def test_sort_then_limit_then_project(self):
        rows = [{"n": "x", "v": 3}, {"n": "y", "v": 1}, {"n": "z", "v": 2}]
        spec = {"order_by": [{"field": "v"}], "limit": 2, "select": ["n"]}
        self.assertEqual(run_query(rows, spec), [{"n": "y"}, {"n": "z"}])


class TestProjectStrict(unittest.TestCase):
    def test_rename_missing_is_none(self):
        self.assertEqual(run_query([{"a": 1}], {"select": {"x": "missing"}}), [{"x": None}])

    def test_project_does_not_mutate_input(self):
        rows = [{"a": 1, "b": 2}]
        run_query(rows, {"select": ["a"]})
        self.assertEqual(rows, [{"a": 1, "b": 2}])

    def test_empty_rows(self):
        self.assertEqual(run_query([], {"where": [{"field": "a", "op": "==", "value": 1}], "select": ["a"]}), [])


if __name__ == "__main__":
    unittest.main()
