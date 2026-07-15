#!/usr/bin/env bash
# collect-blind.sh <task>  (honors RUN)  -> blinded diffs + hidden mapping
set -u
BASE="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"; source "$BASE/scripts/cols.env"
task="${1:?usage: [RUN=n] collect-blind.sh <task>}"; RUN="${RUN:-1}"
base="$BASE/results/$task/r$RUN"; out="$base/blind"; rm -rf "$out"; mkdir -p "$out"
mapfile -t shuffled < <(printf '%s\n' "${COLS[@]}" | perl -MList::Util=shuffle -e 'print shuffle(<>)')
letters=(A B C D E F); : > "$base/mapping.tsv"; i=0
for col in "${shuffled[@]}"; do
  L="${letters[$i]}"; d="$BASE/runs/$task/r$RUN/$col"
  if [ -d "$d" ]; then ( cd "$d" && git add -A >/dev/null 2>&1; git diff --cached baseline -- . ':(exclude)run.out' ':(exclude)run.err' ':(exclude)run.meta' 2>/dev/null ) > "$out/$L.diff"; else echo "(no run)" > "$out/$L.diff"; fi
  echo -e "$L\t$col\t${COL_LABEL[$col]}" >> "$base/mapping.tsv"; i=$((i+1))
done
echo "blinded diffs -> results/$task/r$RUN/blind/{A..}.diff"
echo "hidden mapping -> results/$task/r$RUN/mapping.tsv (open only after review is written)"
