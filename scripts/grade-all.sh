#!/usr/bin/env bash
# grade-all.sh <task>  (honors RUN)  -> results/<task>/r<RUN>/grades.tsv
set -u
BASE="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"; source "$BASE/scripts/cols.env"
task="${1:?usage: [RUN=n] grade-all.sh <task>}"; RUN="${RUN:-1}"
g="$BASE/tasks/$task/grade.sh"; out="$BASE/results/$task/r$RUN"; mkdir -p "$out"
tsv="$out/grades.tsv"; echo -e "col\tresult" > "$tsv"
for col in "${COLS[@]}"; do
  d="$BASE/runs/$task/r$RUN/$col"
  if [ ! -d "$d" ]; then echo -e "$col\tNO_RUN" >> "$tsv"; continue; fi
  if bash "$g" "$d" >"$out/$col.grade.log" 2>&1; then res=PASS; else res=FAIL; fi
  echo -e "$col\t$res" >> "$tsv"; echo "[r$RUN $task/$col] $res"
done
echo "-> $tsv"
