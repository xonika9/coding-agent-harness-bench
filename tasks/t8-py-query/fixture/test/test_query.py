import unittest
from src.query import run_query


class TestFilter(unittest.TestCase):
    def test_eq(self):
        self.assertEqual(run_query([{"a": 1}, {"a": 2}], {"where": [{"field": "a", "op": "==", "value": 1}]}),
                         [{"a": 1}])

    def test_neq(self):
        self.assertEqual(run_query([{"a": 1}, {"a": 2}], {"where": [{"field": "a", "op": "!=", "value": 1}]}),
                         [{"a": 2}])

    def test_lt(self):
        self.assertEqual(run_query([{"a": 1}, {"a": 2}, {"a": 3}], {"where": [{"field": "a", "op": "<", "value": 3}]}),
                         [{"a": 1}, {"a": 2}])

    def test_gte(self):
        self.assertEqual(run_query([{"a": 1}, {"a": 2}, {"a": 3}], {"where": [{"field": "a", "op": ">=", "value": 2}]}),
                         [{"a": 2}, {"a": 3}])

    def test_string_eq(self):
        self.assertEqual(run_query([{"c": "B"}, {"c": "P"}], {"where": [{"field": "c", "op": "==", "value": "B"}]}),
                         [{"c": "B"}])

    def test_in(self):
        self.assertEqual(run_query([{"a": 1}, {"a": 2}, {"a": 3}],
                                   {"where": [{"field": "a", "op": "in", "value": [1, 3]}]}),
                         [{"a": 1}, {"a": 3}])

    def test_contains_string(self):
        self.assertEqual(run_query([{"n": "berlin"}, {"n": "paris"}],
                                   {"where": [{"field": "n", "op": "contains", "value": "er"}]}),
                         [{"n": "berlin"}])

    def test_missing_field_excluded(self):
        self.assertEqual(run_query([{"a": 1}, {"b": 2}], {"where": [{"field": "a", "op": ">", "value": 0}]}),
                         [{"a": 1}])

    def test_and_of_two(self):
        rows = [{"age": 20, "city": "B"}, {"age": 20, "city": "P"}, {"age": 16, "city": "B"}]
        spec = {"where": [{"field": "age", "op": ">=", "value": 18}, {"field": "city", "op": "==", "value": "B"}]}
        self.assertEqual(run_query(rows, spec), [{"age": 20, "city": "B"}])


class TestSort(unittest.TestCase):
    def test_asc(self):
        self.assertEqual(run_query([{"a": 2}, {"a": 1}, {"a": 3}], {"order_by": [{"field": "a"}]}),
                         [{"a": 1}, {"a": 2}, {"a": 3}])

    def test_desc(self):
        self.assertEqual(run_query([{"a": 2}, {"a": 1}, {"a": 3}], {"order_by": [{"field": "a", "dir": "desc"}]}),
                         [{"a": 3}, {"a": 2}, {"a": 1}])

    def test_string_sort(self):
        self.assertEqual(run_query([{"c": "b"}, {"c": "a"}, {"c": "c"}], {"order_by": [{"field": "c"}]}),
                         [{"c": "a"}, {"c": "b"}, {"c": "c"}])

    def test_multi_key(self):
        rows = [{"city": "B", "age": 20}, {"city": "A", "age": 30}, {"city": "B", "age": 10}]
        spec = {"order_by": [{"field": "city"}, {"field": "age", "dir": "desc"}]}
        self.assertEqual(run_query(rows, spec),
                         [{"city": "A", "age": 30}, {"city": "B", "age": 20}, {"city": "B", "age": 10}])

    def test_stable(self):
        rows = [{"k": 1, "id": "a"}, {"k": 1, "id": "b"}, {"k": 0, "id": "c"}]
        self.assertEqual(run_query(rows, {"order_by": [{"field": "k"}]}),
                         [{"k": 0, "id": "c"}, {"k": 1, "id": "a"}, {"k": 1, "id": "b"}])

    def test_missing_field_sorts_first_asc(self):
        self.assertEqual(run_query([{"a": 2}, {"b": 9}, {"a": 1}], {"order_by": [{"field": "a"}]}),
                         [{"b": 9}, {"a": 1}, {"a": 2}])


class TestDistinctPaginate(unittest.TestCase):
    def test_distinct(self):
        self.assertEqual(run_query([{"a": 1}, {"a": 1}, {"a": 2}], {"distinct": True}),
                         [{"a": 1}, {"a": 2}])

    def test_offset_limit(self):
        rows = [{"a": i} for i in range(5)]
        self.assertEqual(run_query(rows, {"offset": 1, "limit": 2}), [{"a": 1}, {"a": 2}])

    def test_limit_only(self):
        rows = [{"a": i} for i in range(5)]
        self.assertEqual(run_query(rows, {"limit": 2}), [{"a": 0}, {"a": 1}])

    def test_offset_beyond(self):
        self.assertEqual(run_query([{"a": 1}], {"offset": 5}), [])


class TestProject(unittest.TestCase):
    def test_select_list(self):
        self.assertEqual(run_query([{"a": 1, "b": 2, "c": 3}], {"select": ["a", "c"]}),
                         [{"a": 1, "c": 3}])

    def test_select_missing_is_none(self):
        self.assertEqual(run_query([{"a": 1}], {"select": ["a", "x"]}), [{"a": 1, "x": None}])

    def test_select_rename(self):
        self.assertEqual(run_query([{"a": 1, "b": 2}], {"select": {"first": "a", "second": "b"}}),
                         [{"first": 1, "second": 2}])


class TestPipeline(unittest.TestCase):
    def test_filter_sort_project(self):
        rows = [{"name": "x", "age": 30}, {"name": "y", "age": 10}, {"name": "z", "age": 20}]
        spec = {"where": [{"field": "age", "op": ">=", "value": 20}],
                "order_by": [{"field": "age", "dir": "desc"}],
                "select": ["name"]}
        self.assertEqual(run_query(rows, spec), [{"name": "x"}, {"name": "z"}])

    def test_input_not_mutated(self):
        rows = [{"a": 1}]
        run_query(rows, {"select": ["a"]})
        self.assertEqual(rows, [{"a": 1}])


class TestErrors(unittest.TestCase):
    def test_unknown_op(self):
        with self.assertRaises(ValueError):
            run_query([{"a": 1}], {"where": [{"field": "a", "op": "~", "value": 1}]})

    def test_ordered_type_mismatch(self):
        with self.assertRaises(ValueError):
            run_query([{"a": 1}], {"where": [{"field": "a", "op": "<", "value": "x"}]})

    def test_in_non_list(self):
        with self.assertRaises(ValueError):
            run_query([{"a": 1}], {"where": [{"field": "a", "op": "in", "value": 1}]})

    def test_bad_dir(self):
        with self.assertRaises(ValueError):
            run_query([{"a": 1}], {"order_by": [{"field": "a", "dir": "up"}]})

    def test_negative_limit(self):
        with self.assertRaises(ValueError):
            run_query([{"a": 1}], {"limit": -1})


if __name__ == "__main__":
    unittest.main()
