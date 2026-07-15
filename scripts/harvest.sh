#!/usr/bin/env bash
# harvest.sh <task>  (honors RUN)  -> results/<task>/r<RUN>/metrics.tsv
set -u
BASE="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"; source "$BASE/scripts/cols.env"
task="${1:?usage: [RUN=n] harvest.sh <task>}"; RUN="${RUN:-1}"
out="$BASE/results/$task/r$RUN"; mkdir -p "$out"; tsv="$out/metrics.tsv"
echo -e "col\twall_s\texit\ttok_in\ttok_out\tturns\tcost_usd\tsource" > "$tsv"
for col in "${COLS[@]}"; do
  d="$BASE/runs/$task/r$RUN/$col"; [ -d "$d" ] || { echo -e "$col\t\t\t\t\t\t\tNO_RUN" >>"$tsv"; continue; }
  wall=$(grep -m1 '^wall_s' "$d/run.meta" 2>/dev/null | cut -f2)
  ex=$(grep -m1 '^exit' "$d/run.meta" 2>/dev/null | cut -f2)
  IFS=$'\t' read -r ti to tn cost src < <(python3 - "$d/run.out" "${COL_KIND[$col]}" <<'PY'
import json,sys
path,kind=sys.argv[1],sys.argv[2]; ti=to=tn=cost=""; src="?"
try: raw=open(path,encoding="utf-8",errors="replace").read()
except Exception: raw=""
def dig(o,acc):
    if isinstance(o,dict):
        for k,v in o.items():
            lk=k.lower()
            if lk in("input_tokens","prompt_tokens") and isinstance(v,int): acc["in"]=v
            if lk in("output_tokens","completion_tokens") and isinstance(v,int): acc["out"]=v
            dig(v,acc)
    elif isinstance(o,list):
        for x in o: dig(x,acc)
if kind=="claude":
    src="claude-json"
    try:
        obj=json.loads(raw); u=obj.get("usage",{}) or {}
        ti=u.get("input_tokens",""); to=u.get("output_tokens","")
        tn=obj.get("num_turns",""); cost=obj.get("total_cost_usd","")
    except Exception: src="claude-json(parse-fail)"
else:
    src="codex-json"; bi=bo=None; turns=0
    for line in raw.splitlines():
        line=line.strip()
        if not line: continue
        try: e=json.loads(line)
        except Exception: continue
        acc={}; dig(e,acc)
        if "in" in acc: bi=acc["in"]
        if "out" in acc: bo=acc["out"]
        if isinstance(e,dict) and (str(e.get("type","")).endswith("message") or e.get("role")=="assistant"): turns+=1
    ti=bi if bi is not None else ""; to=bo if bo is not None else ""; tn=turns or ""
print("\t".join(str(x) for x in (ti,to,tn,cost,src)))
PY
)
  echo -e "$col\t${wall:-}\t${ex:-}\t$ti\t$to\t$tn\t$cost\t$src" >> "$tsv"
done
echo "-- $task r$RUN --"; column -t -s$'\t' "$tsv"
echo "note: codex \$ cross-check:  ccusage-codex session --json --since <YYYY-MM-DD>"
