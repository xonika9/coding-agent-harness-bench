"""Running totals helper.

Something is wrong: calling running_totals twice gives wrong numbers on the
second call, as if state leaked between calls. Find the root cause.
"""


def running_totals(values, acc=[]):
    out = []
    for v in values:
        acc.append(v)
        out.append(sum(acc))
    return out
