#!/usr/bin/env python3
"""
Image resize utility — cover crop or contain to a square canvas.

Default behaviour (from config/settings.json): cover crop to 2000x2000.

  cover   — resize so shorter side >= target, then center-crop to target×target.
            No white borders, no padding. Fills the full frame.
  contain — fit inside target×target, pad remainder with white.

Can be run standalone on one file or a whole directory, or imported by
generate_images.py to post-process freshly generated images.

Standalone usage:
  python scripts/resize_images.py output/images/earrings/p001/01_hero.png
  python scripts/resize_images.py output/images/  --mode cover
  python scripts/resize_images.py img.png --mode contain --size 1024
"""

import argparse
import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SETTINGS_FILE = ROOT / "config" / "settings.json"

DEFAULT_SIZE = 2000
DEFAULT_MODE = "cover"
SUPPORTED_MODES = ("cover", "contain")


# ---------------------------------------------------------------------------
# Settings
# ---------------------------------------------------------------------------

def load_settings() -> dict:
    if SETTINGS_FILE.exists():
        with open(SETTINGS_FILE) as f:
            return json.load(f)
    return {}


def load_resize_mode() -> str:
    return load_settings().get("resize_mode", DEFAULT_MODE)


def load_resize_size() -> int:
    return int(load_settings().get("resize_size", DEFAULT_SIZE))


# ---------------------------------------------------------------------------
# PIL — imported lazily so py_compile / import checks pass without Pillow
# ---------------------------------------------------------------------------

def _pil():
    try:
        from PIL import Image
        return Image
    except ImportError:
        sys.exit("Error: Pillow is required. Install with:  pip install Pillow")


# ---------------------------------------------------------------------------
# Core resize logic
# ---------------------------------------------------------------------------

def cover_crop(img, size: int):
    """
    Resize proportionally so the shorter side reaches `size`, then
    center-crop the longer side down to `size`. Result is size×size.
    No padding, no white borders.
    """
    Image = _pil()
    w, h = img.size
    scale = size / min(w, h)
    new_w = max(size, round(w * scale))
    new_h = max(size, round(h * scale))
    img = img.resize((new_w, new_h), Image.LANCZOS)
    left = (new_w - size) // 2
    top = (new_h - size) // 2
    return img.crop((left, top, left + size, top + size))


def contain_pad(img, size: int):
    """
    Fit inside size×size preserving aspect ratio, pad remainder with white.
    """
    Image = _pil()
    img.thumbnail((size, size), Image.LANCZOS)
    canvas = Image.new("RGBA", (size, size), (255, 255, 255, 255))
    x = (size - img.width) // 2
    y = (size - img.height) // 2
    canvas.paste(img, (x, y))
    return canvas


def resize_image(path: Path, mode: str = DEFAULT_MODE, size: int = DEFAULT_SIZE) -> None:
    """Resize `path` in-place and save as PNG."""
    if mode not in SUPPORTED_MODES:
        sys.exit(f"Error: unknown resize_mode '{mode}'. Supported: {', '.join(SUPPORTED_MODES)}")

    Image = _pil()
    img = Image.open(path).convert("RGBA")

    if mode == "cover":
        result = cover_crop(img, size)
    else:
        result = contain_pad(img, size)

    result.convert("RGB").save(path, "PNG", optimize=True)


# ---------------------------------------------------------------------------
# Batch helper
# ---------------------------------------------------------------------------

def resize_path(target: Path, mode: str, size: int, verbose: bool) -> int:
    """Resize one file or all PNGs under a directory. Returns count."""
    if target.is_file():
        paths = [target]
    elif target.is_dir():
        paths = sorted(target.rglob("*.png"))
    else:
        sys.exit(f"Error: path not found: {target}")

    for p in paths:
        if verbose:
            print(f"  {p}")
        resize_image(p, mode=mode, size=size)
    return len(paths)


# ---------------------------------------------------------------------------
# CLI
# ---------------------------------------------------------------------------

def main() -> None:
    settings = load_settings()
    default_mode = settings.get("resize_mode", DEFAULT_MODE)
    default_size = int(settings.get("resize_size", DEFAULT_SIZE))

    parser = argparse.ArgumentParser(
        description="Resize images to a square canvas (cover crop by default)",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
examples:
  %(prog)s output/images/earrings/p001/01_hero.png
  %(prog)s output/images/  --mode cover
  %(prog)s img.png --mode contain --size 1024
        """,
    )
    parser.add_argument("paths", nargs="+", metavar="PATH",
                        help="Image file(s) or director(ies) to resize in-place")
    parser.add_argument("--mode", choices=SUPPORTED_MODES, default=default_mode,
                        help=f"Resize mode (default from settings.json: {default_mode})")
    parser.add_argument("--size", type=int, default=default_size,
                        help=f"Output size in pixels (default: {default_size})")
    parser.add_argument("--quiet", action="store_true", help="Suppress per-file output")
    args = parser.parse_args()

    total = 0
    for p in args.paths:
        total += resize_path(Path(p), mode=args.mode, size=args.size, verbose=not args.quiet)

    print(f"Done: {total} image(s) resized [{args.mode}, {args.size}x{args.size}]")


if __name__ == "__main__":
    main()
