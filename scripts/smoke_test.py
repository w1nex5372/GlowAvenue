#!/usr/bin/env python3
"""
Smoke tests for generate_images.py and resize_images.py.

Runs compile checks and CLI tests without making any real OpenAI API calls.
Uses --dry-run so no network requests are issued.

Usage:
  python scripts/smoke_test.py
"""

import subprocess
import sys
import tempfile
from pathlib import Path

SCRIPTS_DIR = Path(__file__).resolve().parent
SCRIPT = SCRIPTS_DIR / "generate_images.py"
RESIZE_SCRIPT = SCRIPTS_DIR / "resize_images.py"
PYTHON = sys.executable

_failures = []


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def run(args: list, *, expect_ok: bool = True) -> bool:
    cmd = [PYTHON, str(SCRIPT)] + args
    result = subprocess.run(cmd, capture_output=True, text=True)
    passed = (result.returncode == 0) == expect_ok
    label = " ".join(args)
    print(f"  [{'OK  ' if passed else 'FAIL'}] {label}")
    if not passed:
        out = result.stdout.strip()
        err = result.stderr.strip()
        if out:
            print(f"         stdout: {out[:200]}")
        if err:
            print(f"         stderr: {err[:200]}")
        _failures.append(label)
    return passed


# ---------------------------------------------------------------------------
# Test suites
# ---------------------------------------------------------------------------

def suite_compile() -> None:
    print("\n=== Compile checks ===")
    for py in SCRIPTS_DIR.glob("*.py"):
        result = subprocess.run(
            [PYTHON, "-m", "py_compile", str(py)],
            capture_output=True,
            text=True,
        )
        passed = result.returncode == 0
        print(f"  [{'OK  ' if passed else 'FAIL'}] {py.name}")
        if not passed:
            print(f"         {result.stderr.strip()}")
            _failures.append(f"py_compile:{py.name}")


def suite_profiles() -> None:
    print("\n=== Profile flag ===")
    run(["--profile", "basic",    "--dry-run"])
    run(["--profile", "standard", "--dry-run"])
    run(["--profile", "premium",  "--dry-run"])


def suite_types() -> None:
    print("\n=== --types flag ===")
    run(["--types", "hero",                         "--dry-run"])
    run(["--types", "hero", "model",                "--dry-run"])
    run(["--types", "hero", "lifestyle",            "--dry-run"])
    run(["--types", "hero", "model", "closeup", "lifestyle", "--dry-run"])


def suite_filters() -> None:
    print("\n=== Filters ===")
    run(["--category", "necklaces",  "--profile", "basic",    "--dry-run"])
    run(["--category", "earrings",   "--profile", "standard", "--dry-run"])
    run(["--all",                    "--profile", "basic",    "--dry-run"])
    run(["--all",                    "--profile", "premium",  "--limit", "2", "--dry-run"])
    run(["--product", "p001",        "--types",   "hero",     "--dry-run"])


def suite_override() -> None:
    print("\n=== --types overrides --profile ===")
    # When both are provided, --types wins (should only generate hero).
    result = subprocess.run(
        [PYTHON, str(SCRIPT), "--profile", "premium", "--types", "hero", "--dry-run"],
        capture_output=True,
        text=True,
    )
    passed = result.returncode == 0 and "hero" in result.stdout and "model" not in result.stdout
    print(f"  [{'OK  ' if passed else 'FAIL'}] --profile premium --types hero  (only hero generated)")
    if not passed:
        print(f"         stdout: {result.stdout.strip()[:300]}")
        if not passed:
            _failures.append("--types overrides --profile")


def suite_errors() -> None:
    print("\n=== Error handling ===")
    run(["--profile", "nonexistent",   "--dry-run"], expect_ok=False)
    run(["--types",   "invalid_type",  "--dry-run"], expect_ok=False)
    run(["--product", "no_such_id",    "--dry-run"], expect_ok=False)


def suite_resize() -> None:
    print("\n=== resize_images.py ===")

    # --help must succeed
    result = subprocess.run([PYTHON, str(RESIZE_SCRIPT), "--help"],
                            capture_output=True, text=True)
    _record("resize --help", result.returncode == 0)

    # nonexistent path must fail
    result = subprocess.run([PYTHON, str(RESIZE_SCRIPT), "nonexistent_file.png"],
                            capture_output=True, text=True)
    _record("resize nonexistent path -> error", result.returncode != 0)

    # invalid mode must fail
    result = subprocess.run([PYTHON, str(RESIZE_SCRIPT), "--mode", "stretch",
                             "nonexistent_file.png"],
                            capture_output=True, text=True)
    _record("resize --mode stretch -> argparse error", result.returncode != 0)

    # pixel-level tests (require Pillow)
    try:
        from PIL import Image  # noqa: PLC0415
    except ImportError:
        print("  [SKIP] Pillow not installed — skipping pixel-level tests")
        return

    # cover: 500×800 -> 2000×2000 (no white borders)
    with tempfile.NamedTemporaryFile(suffix=".png", delete=False) as f:
        tmp = Path(f.name)
    try:
        Image.new("RGB", (500, 800), (200, 100, 50)).save(tmp, "PNG")
        result = subprocess.run(
            [PYTHON, str(RESIZE_SCRIPT), str(tmp), "--mode", "cover", "--size", "2000"],
            capture_output=True, text=True,
        )
        if result.returncode == 0:
            out = Image.open(tmp)
            _record("cover: 500×800 -> 2000×2000", out.size == (2000, 2000))
        else:
            _record("cover: resize call succeeded", False,
                    detail=result.stderr.strip())
    finally:
        tmp.unlink(missing_ok=True)

    # cover: already-square 300×300 -> 2000×2000
    with tempfile.NamedTemporaryFile(suffix=".png", delete=False) as f:
        tmp = Path(f.name)
    try:
        Image.new("RGB", (300, 300), (50, 150, 200)).save(tmp, "PNG")
        result = subprocess.run(
            [PYTHON, str(RESIZE_SCRIPT), str(tmp), "--mode", "cover", "--size", "2000"],
            capture_output=True, text=True,
        )
        if result.returncode == 0:
            out = Image.open(tmp)
            _record("cover: 300×300 -> 2000×2000", out.size == (2000, 2000))
        else:
            _record("cover: square resize call succeeded", False,
                    detail=result.stderr.strip())
    finally:
        tmp.unlink(missing_ok=True)

    # cover: wide 1600×400 -> 2000×2000
    with tempfile.NamedTemporaryFile(suffix=".png", delete=False) as f:
        tmp = Path(f.name)
    try:
        Image.new("RGB", (1600, 400), (80, 80, 80)).save(tmp, "PNG")
        result = subprocess.run(
            [PYTHON, str(RESIZE_SCRIPT), str(tmp), "--mode", "cover", "--size", "2000"],
            capture_output=True, text=True,
        )
        if result.returncode == 0:
            out = Image.open(tmp)
            _record("cover: 1600×400 -> 2000×2000", out.size == (2000, 2000))
        else:
            _record("cover: wide resize call succeeded", False,
                    detail=result.stderr.strip())
    finally:
        tmp.unlink(missing_ok=True)

    # contain: 500×800 -> 2000×2000 (has white padding)
    with tempfile.NamedTemporaryFile(suffix=".png", delete=False) as f:
        tmp = Path(f.name)
    try:
        Image.new("RGB", (500, 800), (200, 100, 50)).save(tmp, "PNG")
        result = subprocess.run(
            [PYTHON, str(RESIZE_SCRIPT), str(tmp), "--mode", "contain", "--size", "2000"],
            capture_output=True, text=True,
        )
        if result.returncode == 0:
            out = Image.open(tmp)
            _record("contain: 500×800 -> 2000×2000", out.size == (2000, 2000))
        else:
            _record("contain: resize call succeeded", False,
                    detail=result.stderr.strip())
    finally:
        tmp.unlink(missing_ok=True)


def _record(label: str, passed: bool, detail: str = "") -> None:
    print(f"  [{'OK  ' if passed else 'FAIL'}] {label}")
    if not passed:
        if detail:
            print(f"         {detail[:200]}")
        _failures.append(label)


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

def main() -> None:
    suite_compile()
    suite_profiles()
    suite_types()
    suite_filters()
    suite_override()
    suite_errors()
    suite_resize()

    print("\n" + "=" * 50)
    if _failures:
        print(f"FAILED ({len(_failures)} test(s)):")
        for f in _failures:
            print(f"  - {f}")
        sys.exit(1)
    else:
        print(f"All tests passed.")
        sys.exit(0)


if __name__ == "__main__":
    main()
