import importlib


diff_module = importlib.import_module("tools._diff")


def assert_no_empty_lines(unified: str) -> None:
    assert "" not in unified.splitlines()


def test_compute_unified_diff_for_create():
    result = diff_module.compute_unified_diff(None, "a\nb\n", "foo.txt")

    assert result["added"] == 2
    assert result["removed"] == 0
    assert "--- a/foo.txt" in result["unified"]
    assert "+++ b/foo.txt" in result["unified"]
    assert "+a" in result["unified"]
    assert "+b" in result["unified"]
    assert_no_empty_lines(result["unified"])


def test_compute_unified_diff_for_overwrite():
    result = diff_module.compute_unified_diff("a\nb\nc\n", "a\nB\nc\n", "foo.txt")

    assert result["added"] == 1
    assert result["removed"] == 1
    assert "-b" in result["unified"]
    assert "+B" in result["unified"]
    assert result["unified"].count("-b") == 1
    assert result["unified"].count("+B") == 1
    assert_no_empty_lines(result["unified"])


def test_compute_unified_diff_for_noop():
    result = diff_module.compute_unified_diff("x\n", "x\n", "foo.txt")

    assert result == {"unified": "", "added": 0, "removed": 0}


def test_compute_unified_diff_handles_newline_boundary():
    result = diff_module.compute_unified_diff("abc", "abc\n", "foo.txt")

    assert result["added"] == 1
    assert result["removed"] == 1


def test_compute_unified_diff_for_delete():
    result = diff_module.compute_unified_diff("a\n", "", "foo.txt")

    assert result["added"] == 0
    assert result["removed"] == 1


def test_compute_unified_diff_skips_large_payloads(monkeypatch):
    monkeypatch.setattr(diff_module, "DIFF_MAX_INPUT_BYTES", 10)

    result = diff_module.compute_unified_diff("old-content", "new-content", "foo.txt")

    assert result == {"unified": "", "added": 0, "removed": 0}


def test_compute_unified_diff_handles_unicode():
    result = diff_module.compute_unified_diff("привет\n", "пока\n", "foo.txt")

    assert result["added"] == 1
    assert result["removed"] == 1
    assert "-привет" in result["unified"]
    assert "+пока" in result["unified"]


def test_compute_unified_diff_for_empty_create():
    result = diff_module.compute_unified_diff(None, "", "foo.txt")

    assert result == {"unified": "", "added": 0, "removed": 0}


def test_compute_unified_diff_handles_empty_input():
    result = diff_module.compute_unified_diff("", "", "foo.txt")

    assert result == {"unified": "", "added": 0, "removed": 0}


def test_compute_unified_diff_preserves_headers_without_blank_lines():
    result = diff_module.compute_unified_diff(
        None,
        "line1\nline2\nline3\n",
        "x.txt",
    )

    assert result["added"] == 3
    assert result["removed"] == 0
    assert result["unified"].splitlines()[:3] == [
        "--- a/x.txt",
        "+++ b/x.txt",
        "@@ -0,0 +1,3 @@",
    ]
    assert "+line1\n+line2\n+line3" in result["unified"]
    assert_no_empty_lines(result["unified"])


def test_compute_unified_diff_large_create_has_no_blank_lines():
    result = diff_module.compute_unified_diff(None, "a\n" * 2000, "big.txt")

    assert result["added"] == 2000
    assert result["removed"] == 0
    assert_no_empty_lines(result["unified"])
