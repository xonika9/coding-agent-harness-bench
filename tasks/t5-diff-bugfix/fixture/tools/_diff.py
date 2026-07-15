import difflib


DIFF_MAX_INPUT_BYTES = 1_048_576


def compute_unified_diff(
    old_content: str | None, new_content: str, path: str
) -> dict[str, str | int]:
    old_text = old_content or ""
    if (
        len(old_text.encode("utf-8")) + len(new_content.encode("utf-8"))
        > DIFF_MAX_INPUT_BYTES
    ):
        return {"unified": "", "added": 0, "removed": 0}

    unified = "".join(
        line if line.endswith("\n") else f"{line}\n"
        for line in difflib.unified_diff(
            old_text.splitlines(keepends=True),
            new_content.splitlines(keepends=True),
            fromfile=f"a/{path}",
            tofile=f"b/{path}",
            n=3,
            lineterm="",
        )
    ).rstrip("\n")
    if not unified:
        return {"unified": "", "added": 0, "removed": 0}

    return {
        "unified": unified,
        "added": sum(
            1
            for line in unified.splitlines()
            if line.startswith("+")
        ),
        "removed": sum(
            1
            for line in unified.splitlines()
            if line.startswith("-") and not line.startswith("---")
        ),
    }
