#!/usr/bin/env bash
set -u
WD="${1:?usage: grade.sh <working_dir>}"
HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$WD" || { echo "FAIL: no dir"; exit 1; }
fail=0
if git rev-parse -q --verify baseline >/dev/null 2>&1; then
  git diff --quiet baseline -- test/ || { echo "FAIL: visible test files modified vs baseline"; fail=1; }
fi
if out=$(tsc --noEmit -p tsconfig.json 2>&1); then echo "ok: tsc clean"; else
  echo "FAIL: tsc errors"; echo "$out" | head -10; fail=1; fi
if out=$(node --test 'test/**/*.test.ts' 2>&1); then echo "ok: visible tests green"; else
  echo "FAIL: visible tests not green"; echo "$out" | grep -E "# (tests|pass|fail)|not ok" | head; fail=1; fi
rm -rf _heldout; mkdir -p _heldout; cp "$HERE"/heldout/*.ts _heldout/
if out=$(node --test '_heldout/**/*.test.ts' 2>&1); then echo "ok: held-out tests green"; else
  echo "FAIL: held-out tests not green"; echo "$out" | grep -E "# (tests|pass|fail)|not ok" | head; fail=1; fi
rm -rf _heldout
[ $fail -eq 0 ] && echo "RESULT: PASS" || echo "RESULT: FAIL"
exit $fail
