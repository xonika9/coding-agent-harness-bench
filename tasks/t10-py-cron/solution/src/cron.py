from datetime import datetime, date, timedelta

MONTHS = {n: i for i, n in enumerate(
    ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"], start=1)}
DOWS = {n: i for i, n in enumerate(
    ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"], start=0)}

HORIZON_YEARS = 4


def _parse_atom(tok, lo, hi, names):
    tok = tok.strip()
    if names is not None and tok.upper() in names:
        v = names[tok.upper()]
    elif tok.isdigit():
        v = int(tok)
    else:
        raise ValueError(f"cron: bad token {tok!r}")
    if v < lo or v > hi:
        raise ValueError(f"cron: value {v} out of range {lo}-{hi}")
    return v


def _parse_field(text, lo, hi, names=None):
    text = text.strip()
    if text == "":
        raise ValueError("cron: empty field")
    result = set()
    for term in text.split(","):
        term = term.strip()
        if term == "":
            raise ValueError("cron: empty list element")
        step = 1
        has_step = "/" in term
        if has_step:
            base, _, stxt = term.partition("/")
            if "/" in stxt or not stxt.isdigit():
                raise ValueError("cron: bad step")
            step = int(stxt)
            if step < 1:
                raise ValueError("cron: step must be >= 1")
            rng = base.strip()
        else:
            rng = term
        if rng == "*":
            a, b = lo, hi
        elif "-" in rng:
            parts = rng.split("-")
            if len(parts) != 2 or parts[0].strip() == "" or parts[1].strip() == "":
                raise ValueError("cron: bad range")
            a = _parse_atom(parts[0], lo, hi, names)
            b = _parse_atom(parts[1], lo, hi, names)
            if a > b:
                raise ValueError("cron: reversed range")
        else:
            a = _parse_atom(rng, lo, hi, names)
            b = hi if has_step else a
        for v in range(a, b + 1, step):
            result.add(v)
    return result


def _parse(expr):
    fields = expr.split()
    if len(fields) != 5:
        raise ValueError("cron: expected 5 fields")
    fmin, fhour, fdom, fmon, fdow = fields
    minutes = _parse_field(fmin, 0, 59)
    hours = _parse_field(fhour, 0, 23)
    doms = _parse_field(fdom, 1, 31)
    months = _parse_field(fmon, 1, 12, MONTHS)
    raw_dows = _parse_field(fdow, 0, 7, DOWS)
    dows = {0 if d == 7 else d for d in raw_dows}
    dom_star = fdom.strip() == "*"
    dow_star = fdow.strip() == "*"
    return minutes, hours, doms, months, dows, dom_star, dow_star


def _day_matches(day, doms, dows, dom_star, dow_star):
    dom_ok = day.day in doms
    cron_dow = day.isoweekday() % 7  # Sunday=0 .. Saturday=6
    dow_ok = cron_dow in dows
    if not dom_star and not dow_star:
        return dom_ok or dow_ok
    if dom_star and not dow_star:
        return dow_ok
    if dow_star and not dom_star:
        return dom_ok
    return True


def next_runs(expr, after, count):
    if not isinstance(count, int) or isinstance(count, bool) or count < 1:
        raise ValueError("cron: count must be a positive integer")
    minutes, hours, doms, months, dows, dom_star, dow_star = _parse(expr)
    start = datetime.fromisoformat(after)  # raises ValueError on bad input
    cand = start.replace(second=0, microsecond=0) + timedelta(minutes=1)
    hlist = sorted(hours)
    mlist = sorted(minutes)
    results = []
    day = date(cand.year, cand.month, cand.day)
    last_year = start.year + HORIZON_YEARS
    while day.year <= last_year and len(results) < count:
        if day.month in months and _day_matches(day, doms, dows, dom_star, dow_star):
            for h in hlist:
                for m in mlist:
                    dt = datetime(day.year, day.month, day.day, h, m)
                    if dt >= cand:
                        results.append(dt.strftime("%Y-%m-%dT%H:%M"))
                        if len(results) >= count:
                            break
                if len(results) >= count:
                    break
        day += timedelta(days=1)
    if len(results) < count:
        raise ValueError("cron: fewer than count matches within horizon")
    return results
