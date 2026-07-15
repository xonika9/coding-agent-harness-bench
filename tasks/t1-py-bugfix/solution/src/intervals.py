"""Merge half-open integer intervals [start, end)."""
from dataclasses import dataclass


@dataclass(frozen=True)
class Interval:
    start: int
    end: int  # exclusive


def merge(intervals):
    """Merge overlapping or adjacent half-open intervals [start, end).

    Adjacent intervals like [1, 3) and [3, 5) must merge into [1, 5).
    """
    if not intervals:
        return []
    ordered = sorted(intervals, key=lambda i: i.start)
    result = [ordered[0]]
    for cur in ordered[1:]:
        last = result[-1]
        if cur.start <= last.end:
            result[-1] = Interval(last.start, max(last.end, cur.end))
        else:
            result.append(cur)
    return result
