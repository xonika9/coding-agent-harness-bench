#!/usr/bin/env bash
# grade.sh <working_dir> ; exit 0 = PASS, 1 = FAIL
set -u
WD="${1:?usage: grade.sh <working_dir>}"
cd "$WD" || { echo "FAIL: no dir"; exit 1; }
fail=0
# tests untouched
if git rev-parse -q --verify baseline >/dev/null 2>&1; then
  git diff --quiet baseline -- test/ || { echo "FAIL: test files modified vs baseline"; fail=1; }
fi
# new interface present
grep -q 'interface LogEventInput' src/logger.ts || { echo "FAIL: LogEventInput not defined"; fail=1; }
# no positional call sites remain (positional call starts logEvent("...)
if grep -rEn 'logEvent\([[:space:]]*"' src >/dev/null 2>&1; then
  echo "FAIL: positional logEvent(\"...) call sites remain:"; grep -rEn 'logEvent\([[:space:]]*"' src | head; fail=1
fi
# typecheck
if out=$(tsc --noEmit -p tsconfig.json 2>&1); then echo "ok: tsc clean"; else
  echo "FAIL: tsc errors"; echo "$out" | head -15; fail=1
fi
# behavior
if out=$(node --test 'test/**/*.test.ts' 2>&1); then echo "ok: tests green"; else
  echo "FAIL: tests not green"; echo "$out" | grep -E "ℹ (tests|pass|fail)|not ok" | head; fail=1
fi
[ $fail -eq 0 ] && echo "RESULT: PASS" || echo "RESULT: FAIL"
exit $fail
