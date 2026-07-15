#!/usr/bin/env bash
# grade.sh <working_dir> ; exit 0 = PASS, 1 = FAIL. Accepts expected line +/-1.
set -u
WD="${1:?usage: grade.sh <working_dir>}"
HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
exp=$(tr -d ' \t\r' < "$HERE/expected.txt")
exp_file=${exp%:*}; exp_line=${exp##*:}
ans=$(tr -d ' \t\r' < "$WD/ANSWER.txt" 2>/dev/null || true)
if [ -z "$ans" ]; then echo "FAIL: no ANSWER.txt"; echo "RESULT: FAIL"; exit 1; fi
ans_file=${ans%:*}; ans_line=${ans##*:}
ans_file=${ans_file#./}
if [ "$ans_file" = "$exp_file" ] && [ "$ans_line" -ge $((exp_line-1)) ] 2>/dev/null && [ "$ans_line" -le $((exp_line+1)) ]; then
  echo "ok: $ans matches $exp (+/-1)"; echo "RESULT: PASS"; exit 0
fi
echo "FAIL: got '$ans', expected '$exp' (+/-1 line)"; echo "RESULT: FAIL"; exit 1
