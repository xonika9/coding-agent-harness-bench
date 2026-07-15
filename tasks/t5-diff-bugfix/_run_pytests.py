"""Run pytest-style test functions without pytest (zero-install).
Executes tests/test_diff.py from the current working directory, providing a
minimal `monkeypatch` shim. Assertions are the repo's real ones."""
import importlib.util, inspect, os, sys, traceback


class MonkeyPatch:
    def __init__(self): self._undo = []
    def setattr(self, target, name, value):
        self._undo.append((target, name, getattr(target, name)))
        setattr(target, name, value)
    def undo(self):
        for t, n, o in reversed(self._undo): setattr(t, n, o)


def main():
    sys.path.insert(0, os.getcwd())
    spec = importlib.util.spec_from_file_location("test_diff", "tests/test_diff.py")
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    fails = total = 0
    for name in sorted(vars(mod)):
        if not name.startswith("test_"): continue
        fn = vars(mod)[name]
        if not callable(fn): continue
        total += 1; mp = MonkeyPatch()
        try:
            if "monkeypatch" in inspect.signature(fn).parameters: fn(mp)
            else: fn()
            print(f"ok   {name}")
        except Exception:
            fails += 1; print(f"FAIL {name}"); traceback.print_exc()
        finally:
            mp.undo()
    print(f"\n{total-fails}/{total} passed")
    sys.exit(1 if fails else 0)


if __name__ == "__main__":
    main()
