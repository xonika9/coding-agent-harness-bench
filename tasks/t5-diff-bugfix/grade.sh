#!/usr/bin/env bash
# grade.sh <working_dir> ; exit 0 = PASS, 1 = FAIL
set -u
WD="${1:?usage: grade.sh <working_dir>}"
HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$WD" || { echo "FAIL: no dir"; exit 1; }
fail=0
if git rev-parse -q --verify baseline >/dev/null 2>&1; then
  git diff --quiet baseline -- tests/ || { echo "FAIL: test files modified vs baseline"; fail=1; }
fi
if python3 -c 'import pytest' >/dev/null 2>&1; then
  out=$(python3 -m pytest -q tests/ 2>&1); rc=$?
else
  out=$(python3 "$HERE/_run_pytests.py" 2>&1); rc=$?
fi
if [ $rc -eq 0 ]; then echo "ok: tests green"; else echo "FAIL: tests not green"; echo "$out" | tail -8; fail=1; fi
[ $fail -eq 0 ] && echo "RESULT: PASS" || echo "RESULT: FAIL"
exit $fail
