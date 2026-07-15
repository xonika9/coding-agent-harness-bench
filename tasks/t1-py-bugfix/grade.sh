#!/usr/bin/env bash
# grade.sh <working_dir> ; exit 0 = PASS, 1 = FAIL
set -u
WD="${1:?usage: grade.sh <working_dir>}"
cd "$WD" || { echo "FAIL: no dir"; exit 1; }
fail=0
if git rev-parse -q --verify baseline >/dev/null 2>&1; then
  git diff --quiet baseline -- test/ || { echo "FAIL: test files modified vs baseline"; fail=1; }
fi
if out=$(python3 -m unittest discover -s test -t . -p 'test_*.py' 2>&1); then
  echo "ok: tests green"
else
  echo "FAIL: tests not green"; echo "$out" | tail -15; fail=1
fi
[ $fail -eq 0 ] && echo "RESULT: PASS" || echo "RESULT: FAIL"
exit $fail
