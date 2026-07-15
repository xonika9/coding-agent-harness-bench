#!/usr/bin/env bash
# setup-task.sh <task>   (honors RUN, default 1)  -> runs/<task>/r<RUN>/<col> git baselines
set -eu
BASE="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"; source "$BASE/scripts/cols.env"
task="${1:?usage: [RUN=n] setup-task.sh <task>}"; RUN="${RUN:-1}"
fx="$BASE/tasks/$task/fixture"; [ -d "$fx" ] || { echo "no fixture: $fx"; exit 1; }
for col in "${COLS[@]}"; do
  d="$BASE/runs/$task/r$RUN/$col"; rm -rf "$d"; mkdir -p "$d"; cp -R "$fx/." "$d/"
  git -C "$d" init -q; git -C "$d" add -A
  git -C "$d" -c user.email=b@b -c user.name=bench commit -qm baseline; git -C "$d" tag baseline
done
echo "ready: runs/$task/r$RUN/{$(IFS=,; echo "${COLS[*]}")}"
