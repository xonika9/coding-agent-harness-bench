# Reference solution for t8-py-query. Not shown to agents.
# Implements run_query per spec.md.

_OPS = ("==", "!=", "<", "<=", ">", ">=", "in", "contains")


def _is_number(x):
    return isinstance(x, (int, float)) and not isinstance(x, bool)


def _is_nonneg_int(x):
    return isinstance(x, int) and not isinstance(x, bool) and x >= 0


def _match(row, cond):
    field = cond["field"]
    op = cond["op"]
    value = cond["value"]
    if op not in _OPS:
        raise ValueError("unknown op: %r" % (op,))
    if op == "in" and not isinstance(value, (list, tuple)):
        raise ValueError("'in' value must be a list or tuple")
    if field not in row:
        return False
    fv = row[field]
    if op == "==":
        return fv == value
    if op == "!=":
        return fv != value
    if op == "in":
        return fv in value
    if op == "contains":
        if isinstance(fv, (str, list)):
            return value in fv
        return False
    # ordered comparisons
    both_num = _is_number(fv) and _is_number(value)
    both_str = isinstance(fv, str) and isinstance(value, str)
    if not (both_num or both_str):
        raise ValueError("type mismatch in ordered comparison")
    if op == "<":
        return fv < value
    if op == "<=":
        return fv <= value
    if op == ">":
        return fv > value
    return fv >= value  # ">="


def _sort_key_value(v):
    if v is None:
        return (0,)
    return (1, v)


def _sort(rows, order_by):
    keys = []
    for k in order_by:
        field = k["field"]
        d = k.get("dir", "asc")
        if d not in ("asc", "desc"):
            raise ValueError("bad dir: %r" % (d,))
        keys.append((field, d))
    # validate: within each key, non-None values are a single ordinal kind
    for field, _d in keys:
        kind = None
        for r in rows:
            if field in r and r[field] is not None:
                v = r[field]
                if _is_number(v):
                    k2 = "num"
                elif isinstance(v, str):
                    k2 = "str"
                else:
                    raise ValueError("non-orderable value in sort key: %r" % (v,))
                if kind is None:
                    kind = k2
                elif kind != k2:
                    raise ValueError("mixed types in sort key %r" % (field,))
    result = list(rows)
    # stable multi-key: apply keys from least to most significant
    for field, d in reversed(keys):
        result.sort(key=lambda r, f=field: _sort_key_value(r.get(f)), reverse=(d == "desc"))
    return result


def _distinct(rows):
    out = []
    for r in rows:
        if r not in out:
            out.append(r)
    return out


def _paginate(rows, spec):
    offset = spec.get("offset", 0)
    limit = spec.get("limit", None)
    if not _is_nonneg_int(offset):
        raise ValueError("bad offset: %r" % (offset,))
    if limit is not None and not _is_nonneg_int(limit):
        raise ValueError("bad limit: %r" % (limit,))
    res = rows[offset:]
    if limit is not None:
        res = res[:limit]
    return res


def _project(rows, select):
    if isinstance(select, dict):
        return [{out: r.get(src) for out, src in select.items()} for r in rows]
    if isinstance(select, (list, tuple)):
        return [{f: r.get(f) for f in select} for r in rows]
    raise ValueError("bad select: %r" % (select,))


def run_query(rows: list, spec: dict) -> list:
    result = [dict(r) for r in rows]
    if "where" in spec:
        conds = spec["where"]
        result = [r for r in result if all(_match(r, c) for c in conds)]
    if "order_by" in spec:
        result = _sort(result, spec["order_by"])
    if spec.get("distinct"):
        result = _distinct(result)
    result = _paginate(result, spec)
    if "select" in spec:
        result = _project(result, spec["select"])
    return result
