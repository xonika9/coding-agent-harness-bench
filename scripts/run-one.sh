#!/usr/bin/env bash
# run-one.sh <task> <col>   (honors RUN, default 1)
set -u
BASE="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"; source "$BASE/scripts/cols.env"
task="${1:?usage: [RUN=n] run-one.sh <task> <col>}"; col="${2:?}"; RUN="${RUN:-1}"
d="$BASE/runs/$task/r$RUN/$col"; [ -d "$d" ] || { echo "run: [RUN=$RUN] scripts/setup-task.sh $task"; exit 1; }
export PROMPT="$(cat "$BASE/tasks/$task/PROMPT.md")"; export SID="$(uuidgen)"
cd "$d"; start=$(date +%s)
perl "$BASE/lib/timeout.pl" "$TIMEOUT_SEC" \
  bash -c "source \"$BASE/scripts/harness.env\"; launch_$col" >run.out 2>run.err
code=$?; end=$(date +%s)
printf 'col\t%s\nstart\t%s\nend\t%s\nwall_s\t%s\nexit\t%s\nsid\t%s\n' \
  "$col" "$start" "$end" "$((end-start))" "$code" "$SID" > run.meta
echo "[r$RUN $col] $task done in $((end-start))s (exit $code)"
