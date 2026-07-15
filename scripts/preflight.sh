#!/usr/bin/env bash
# preflight.sh  -> verify each column launches autonomously + harvest parses, on a trivial task
set -u
BASE="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
source "$BASE/scripts/cols.env"
p="$BASE/runs/_preflight"; rm -rf "$p"
export PROMPT="Create a file named PING.txt containing exactly the word PONG, then stop."
for col in "${COLS[@]}"; do
  d="$p/$col"; mkdir -p "$d"; ( cd "$d" && git init -q )
  export SID="$(uuidgen)"; cd "$d"
  echo "=== $col : ${COL_LABEL[$col]} ==="
  start=$(date +%s)
  perl "$BASE/lib/timeout.pl" 180 \
    bash -c "source \"$BASE/scripts/harness.env\"; launch_$col" >run.out 2>run.err
  code=$?; echo "  exit=$code wall=$(( $(date +%s)-start ))s"
  [ -f PING.txt ] && echo "  PING.txt: OK ($(tr -d '\n' <PING.txt))" || { echo "  PING.txt: MISSING — launch/auth/perm issue"; echo "  stderr:"; sed -n '1,6p' run.err; }
  printf 'col\t%s\nwall_s\t0\nexit\t%s\nsid\t%s\n' "$col" "$code" "$SID" > run.meta
done
echo; echo "harvest parse check:"; task=_preflight
# reuse harvest on the preflight dir
COLS_BAK=("${COLS[@]}"); BASE_RUN="$p"
echo "(inspect $p/<col>/run.out to confirm token fields are present)"
