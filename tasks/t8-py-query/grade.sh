#!/usr/bin/env bash
set -u
WD="${1:?usage: grade.sh <working_dir>}"
HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$WD" || { echo "FAIL: no dir"; exit 1; }
fail=0
if git rev-parse -q --verify baseline >/dev/null 2>&1; then
  git diff --quiet baseline -- test/ || { echo "FAIL: visible test files modified vs baseline"; fail=1; }
fi
if out=$(python3 -m unittest discover -s test -t . 2>&1); then echo "ok: visible tests green"; else
  echo "FAIL: visible tests not green"; echo "$out" | tail -6; fail=1; fi
cp "$HERE"/heldout/*.py "$WD"/_heldout_test.py
if out=$(python3 -m unittest _heldout_test 2>&1); then echo "ok: held-out tests green"; else
  echo "FAIL: held-out tests not green"; echo "$out" | tail -6; fail=1; fi
rm -f "$WD"/_heldout_test.py
[ $fail -eq 0 ] && echo "RESULT: PASS" || echo "RESULT: FAIL"
exit $fail
