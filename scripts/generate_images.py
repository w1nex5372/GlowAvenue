#!/usr/bin/env python3
"""
GlamAvenue image generation pipeline.

Usage:
  python scripts/generate_images.py --category necklaces --profile basic
  python scripts/generate_images.py --category necklaces --types hero model
  python scripts/generate_images.py --all --profile premium --force
"""

import argparse
import csv
import json
import sys
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
PROFILES_DIR = ROOT / "config" / "profiles"
PROMPTS_FILE = ROOT / "config" / "prompts.json"
PRODUCTS_FILE = ROOT / "config" / "products.json"
MANIFEST_FILE = ROOT / "product_manifest.csv"

# Sibling-script import — resize_images lives in the same scripts/ directory.
sys.path.insert(0, str(Path(__file__).parent))
from resize_images import resize_image, load_resize_mode, load_resize_size  # noqa: E402

ALL_IMAGE_TYPES = ["hero", "model", "closeup", "lifestyle"]

MANIFEST_FIELDS = [
    "product_id",
    "product_name",
    "category",
    "generation_profile",
    "requested_image_types",
    "generated_image_types",
    "generated_at",
]


# ---------------------------------------------------------------------------
# Config loading
# ---------------------------------------------------------------------------

def load_json(path: Path):
    with open(path) as f:
        return json.load(f)


def load_prompts() -> dict:
    if not PROMPTS_FILE.exists():
        sys.exit(f"Error: prompts file not found at {PROMPTS_FILE}")
    return load_json(PROMPTS_FILE)


def load_profile(name: str) -> list:
    path = PROFILES_DIR / f"{name}.json"
    if not path.exists():
        available = sorted(p.stem for p in PROFILES_DIR.glob("*.json"))
        sys.exit(f"Error: profile '{name}' not found. Available: {', '.join(available)}")
    return load_json(path)["image_types"]


def load_products() -> list:
    if not PRODUCTS_FILE.exists():
        return []
    return load_json(PRODUCTS_FILE)


# ---------------------------------------------------------------------------
# Image type resolution
# ---------------------------------------------------------------------------

def resolve_image_types(args, valid_types: set) -> tuple:
    """Return (image_types, profile_label). --types overrides --profile."""
    if args.types:
        types, label = args.types, "custom"
    elif args.profile:
        types, label = load_profile(args.profile), args.profile
    else:
        types, label = list(ALL_IMAGE_TYPES), "premium"

    unknown = [t for t in types if t not in valid_types]
    if unknown:
        sys.exit(
            f"Error: unknown image type(s): {', '.join(unknown)}. "
            f"Valid: {', '.join(sorted(valid_types))}"
        )
    return types, label


# ---------------------------------------------------------------------------
# Output filenames — index comes from the canonical ALL_IMAGE_TYPES order
# ---------------------------------------------------------------------------

def output_filename(image_type: str) -> str:
    return f"{ALL_IMAGE_TYPES.index(image_type) + 1:02d}_{image_type}.png"


# ---------------------------------------------------------------------------
# Image generation
# ---------------------------------------------------------------------------

def generate_image(prompt: str, out: Path, dry_run: bool) -> bool:
    if dry_run:
        print(f"      [dry-run] would write {out.name}")
        return True
    try:
        from openai import OpenAI
        import urllib.request

        client = OpenAI()
        resp = client.images.generate(
            model="dall-e-3",
            prompt=prompt,
            size="1024x1024",
            quality="standard",
            n=1,
        )
        urllib.request.urlretrieve(resp.data[0].url, out)
        return True
    except Exception as exc:
        print(f"      Error generating {out.name}: {exc}", file=sys.stderr)
        return False


# ---------------------------------------------------------------------------
# Manifest (CSV)
# ---------------------------------------------------------------------------

def load_manifest() -> list:
    if not MANIFEST_FILE.exists():
        return []
    with open(MANIFEST_FILE, newline="") as f:
        return list(csv.DictReader(f))


def save_manifest(rows: list) -> None:
    with open(MANIFEST_FILE, "w", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=MANIFEST_FIELDS, extrasaction="ignore")
        writer.writeheader()
        writer.writerows(rows)


def upsert_manifest(
    product_id: str,
    product_name: str,
    category: str,
    profile_label: str,
    image_types: list,
    generated: list,
) -> None:
    rows = load_manifest()
    entry = {
        "product_id": product_id,
        "product_name": product_name,
        "category": category,
        "generation_profile": profile_label,
        "requested_image_types": "|".join(image_types),
        "generated_image_types": "|".join(generated),
        "generated_at": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
    }
    for i, row in enumerate(rows):
        if row.get("product_id") == product_id:
            rows[i] = entry
            break
    else:
        rows.append(entry)
    save_manifest(rows)


# ---------------------------------------------------------------------------
# Per-product processing
# ---------------------------------------------------------------------------

def process_product(
    product: dict,
    image_types: list,
    profile_label: str,
    prompts: dict,
    force: bool,
    dry_run: bool,
    resize_mode: str,
    resize_size: int,
) -> None:
    pid = product["id"]
    name = product["name"]
    category = product.get("category", "general")

    print(f"\n  {name}  [{pid}]  ({category})")

    out_dir = ROOT / "output" / "images" / category / pid
    out_dir.mkdir(parents=True, exist_ok=True)

    generated = []
    for t in image_types:
        out = out_dir / output_filename(t)
        if out.exists() and not force:
            print(f"      Skip {out.name} (already exists — use --force to regenerate)")
            generated.append(t)
            continue

        prompt = (
            prompts[t]
            .replace("{product_name}", name)
            .replace("{category}", category)
        )
        print(f"      Generating {out.name} ...")
        if generate_image(prompt, out, dry_run):
            if not dry_run:
                print(f"      Resizing  {out.name} ({resize_mode}, {resize_size}px) ...")
                resize_image(out, mode=resize_mode, size=resize_size)
            generated.append(t)

    if not dry_run:
        upsert_manifest(pid, name, category, profile_label, image_types, generated)

    print(f"      Result: {len(generated)}/{len(image_types)} images generated")


# ---------------------------------------------------------------------------
# Entry point
# ---------------------------------------------------------------------------

def main() -> None:
    parser = argparse.ArgumentParser(
        description="GlamAvenue image generation pipeline",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
examples:
  %(prog)s --category necklaces --profile basic
  %(prog)s --category necklaces --profile standard
  %(prog)s --category necklaces --profile premium
  %(prog)s --category necklaces --types hero lifestyle
  %(prog)s --all --profile premium --force
  %(prog)s --product p001 --types hero model --dry-run
        """,
    )
    parser.add_argument("--category", help="Filter products by category")
    parser.add_argument("--product", help="Process a single product by ID or name")
    parser.add_argument("--all", action="store_true", help="Process all products")
    parser.add_argument("--limit", type=int, metavar="N", help="Cap number of products to process")
    parser.add_argument("--force", action="store_true", help="Overwrite existing images")
    parser.add_argument("--profile", choices=["basic", "standard", "premium"],
                        help="Generation profile")
    parser.add_argument("--types", nargs="+", metavar="TYPE",
                        help="Explicit image types to generate (overrides --profile)")
    parser.add_argument("--dry-run", action="store_true",
                        help="Preview what would be generated without calling the API")
    args = parser.parse_args()

    prompts = load_prompts()
    image_types, profile_label = resolve_image_types(args, set(prompts))

    resize_mode = load_resize_mode()
    resize_size = load_resize_size()

    print(f"Profile  : {profile_label}")
    print(f"Types    : {', '.join(image_types)}")
    print(f"Resize   : {resize_mode} @ {resize_size}px")
    if args.dry_run:
        print("[DRY RUN — no API calls will be made]")

    products = load_products()

    if args.product:
        products = [p for p in products if p["id"] == args.product or p["name"] == args.product]
        if not products:
            sys.exit(f"Error: product '{args.product}' not found in {PRODUCTS_FILE}")
    elif not args.all:
        if args.category:
            products = [
                p for p in products
                if p.get("category", "").lower() == args.category.lower()
            ]

    if args.limit:
        products = products[: args.limit]

    if not products:
        print("No products found for the given filters.")
        return

    print(f"Products : {len(products)}")

    for product in products:
        process_product(product, image_types, profile_label, prompts,
                        force=args.force, dry_run=args.dry_run,
                        resize_mode=resize_mode, resize_size=resize_size)

    print("\nDone.")


if __name__ == "__main__":
    main()
