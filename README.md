# GlamAvenue

A minimal, luxury **mini catalog CMS** for GlamAvenue — affordable gold plated
stainless steel jewellery. It is **not** an e-commerce store: there is no cart,
checkout, payments or customer accounts. Instead it is a beautiful product
catalog with a simple admin panel and **redirect links** out to the marketplaces
where each product is actually sold (eBay, TikTok, Facebook, Instagram).

```
Public website  ·  Admin panel  ·  Product database  ·  Image uploads
Marketplace redirect links  ·  PostgreSQL  ·  Docker deployment
```

## Tech stack

| Layer     | Tech                                                |
| --------- | --------------------------------------------------- |
| Frontend  | Vite · React · TypeScript · Tailwind · Framer Motion |
| Backend   | Node.js · Fastify · Prisma                          |
| Database  | PostgreSQL 16                                       |
| Auth      | JWT admin login (bcrypt password hash)              |
| Uploads   | Local file storage, served at `/uploads`            |
| Proxy     | Nginx                                               |
| Deploy    | Docker Compose                                      |

## Project structure

```
glamavenue/
  frontend/        Vite + React + Tailwind SPA (public site + admin panel)
  backend/         Fastify API + Prisma schema, migrations, seed
    uploads/       Locally stored product images
  nginx/           Edge reverse proxy config
  docker-compose.yml
  .env.example
```

---

## 1. Quick start with Docker (recommended)

```bash
# 1. Configure environment
cp .env.example .env

# 2. Generate an admin password hash and paste it into .env (ADMIN_PASSWORD_HASH)
docker compose run --rm backend npm run hash -- "YourStrongPassword"

# 3. Edit .env: set POSTGRES_PASSWORD, DATABASE_URL password, JWT_SECRET, ADMIN_EMAIL

# 4. Build and start everything
docker compose up -d --build

# 5. (Optional) Seed sample products + default settings
docker compose exec backend npm run seed
```

The site is now available at **http://localhost** and the admin at
**http://localhost/admin/login**.

Database migrations run automatically on backend startup
(`prisma migrate deploy` via the container entrypoint).

### Default local admin login

This project's local `.env` is configured with these **development-only**
credentials:

| Field    | Value                    |
| -------- | ------------------------ |
| Email    | `admin@glamavenue.co.uk` |
| Password | `GlamAdmin2026!`         |

On a fresh clone you set your own password in step 2 above (`npm run hash`).

> ⚠️ **Change these before going live** — see
> [Changing the admin password](#changing-the-admin-password).

---

## 2. Local development (without Docker)

You need a local PostgreSQL instance (or run just the DB via Docker:
`docker compose up -d postgres`).

### Backend

```bash
cd backend
cp ../.env.example .env          # or create backend/.env
# Set DATABASE_URL to your local Postgres, e.g.
#   postgresql://glamavenue:glamavenue@localhost:5432/glamavenue_db
npm install
npm run hash -- "YourPassword"   # paste the printed hash into .env
npm run migrate:deploy           # or: npx prisma migrate dev
npm run seed                     # optional sample data
npm run dev                      # API on http://localhost:4000
```

### Frontend

```bash
cd frontend
npm install
npm run dev                      # site on http://localhost:5173
```

The Vite dev server proxies `/api` and `/uploads` to `http://localhost:4000`,
so the frontend and backend behave as one origin during development.

---

## 3. Environment variables

See [`.env.example`](./.env.example). Key values:

| Variable              | Description                                             |
| --------------------- | ------------------------------------------------------- |
| `POSTGRES_USER/PASSWORD/DB` | PostgreSQL credentials                            |
| `DATABASE_URL`        | Prisma connection string (uses the values above)        |
| `JWT_SECRET`          | Long random string for signing admin tokens             |
| `ADMIN_EMAIL`         | Admin login email                                       |
| `ADMIN_PASSWORD_HASH` | bcrypt hash of the admin password (`npm run hash`)      |

### Changing the admin password

```bash
# 1. Generate a new bcrypt hash
docker compose run --rm backend npm run hash -- "YourNewStrongPassword"

# 2. Copy the printed hash into .env as ADMIN_PASSWORD_HASH.
#    IMPORTANT: double every "$" -> "$$" so Docker Compose does not corrupt it
#    e.g.  $2a$12$abc...  becomes  $$2a$$12$$abc...

# 3. Verify it resolved correctly (no warnings, full hash intact)
docker compose config | grep ADMIN_PASSWORD_HASH

# 4. Recreate the backend so it picks up the new value
docker compose up -d backend
```

For production also set a strong `POSTGRES_PASSWORD` (and matching
`DATABASE_URL`) and a random `JWT_SECRET` (`openssl rand -hex 32`).

---

## 4. API overview

**Public**

```
GET  /api/products            List visible products (?category=…)
GET  /api/products/featured   Featured products
GET  /api/products/:slug      Single visible product
GET  /api/settings            Store settings
```

**Admin** (require `Authorization: Bearer <token>`)

```
POST   /api/admin/login
GET    /api/admin/products
GET    /api/admin/products/:id
POST   /api/admin/products
PUT    /api/admin/products/:id
DELETE /api/admin/products/:id
POST   /api/admin/upload          multipart image upload → { urls: [...] }
GET    /api/admin/settings
PUT    /api/admin/settings
```

> Risk level (`safe` / `risky` / `bundle`) is **admin-only** and is never
> returned by the public product endpoints.

---

## 5. Admin panel

`/admin/login` → `/admin`

- **Dashboard** — totals: products, visible, hidden, low stock, risky, featured
- **Products** — table with search, add / edit / delete, image upload, visibility,
  featured and risk controls
- **Settings** — store name, tagline, hero text, banner, contact email, shipping
  text, social + eBay store links

---

## 6. Uploads

Uploaded images are written to the host folder **`./uploads/products/`** (bind
mounted into the backend at `/app/uploads/products/`) and served publicly at
`/uploads/products/<file>`. Allowed: JPG, PNG, WEBP, max 5MB each. Only image
URLs are stored in the database, never binary data.

---

## Data persistence

Your data lives in two places and **survives rebuilds**:

| What | Where it lives | Survives `down` + `up --build`? |
| ---- | -------------- | ------------------------------- |
| **PostgreSQL data** (products, settings) | Docker named volume `glamavenue_postgres_data` | ✅ Yes |
| **Uploaded images** | Host folder **`./uploads/`** (bind mount) | ✅ Yes |

- Uploaded images are **not** stored only inside the backend container — they
  are real files in `./uploads/products/` on the host, easy to see and back up.
- The seed **only runs on an empty database** (zero products), so it can never
  overwrite real products or image links.

### Safe restart (keeps all data)

```bash
docker compose down
docker compose up -d --build
```

### ⚠️ Dangerous — wipes the database

```bash
docker compose down -v      # removes named volumes → DELETES all products/settings
```

`down -v` deletes the `glamavenue_postgres_data` volume. Uploaded images in
`./uploads/` are **not** removed by `-v` (they're a host folder), but the
products referencing them would be gone, so re-seed/re-add afterwards.

### Verify persistence (quick test)

1. In the admin, **add a product and upload an image**, then save.
2. Note the product page URL and the image URL (`/uploads/products/<file>`).
3. Rebuild:
   ```bash
   docker compose down
   docker compose up -d --build
   ```
4. Confirm the product still exists:
   ```bash
   curl -s http://localhost/api/products | grep -o '"slug":"[^"]*"'
   ```
5. Confirm the uploaded image still loads publicly (expect `HTTP 200`):
   ```bash
   curl -s -o /dev/null -w "%{http_code}\n" http://localhost/uploads/products/<file>
   ```

### Back up

```bash
# Database
docker compose exec -T postgres pg_dump -U glamavenue glamavenue_db \
  | gzip > backups/glamavenue-$(date +%F).sql.gz

# Uploaded images — just copy the folder
cp -r ./uploads ./backups/uploads-$(date +%F)
```

---

## 7. Deployment to a VPS

**Prerequisites:** a Linux VPS with Docker Engine + the Docker Compose plugin,
and ports 80/443 open.

### 1. Clone

```bash
git clone https://github.com/w1nex5372/GlowAvenue.git glamavenue
cd glamavenue
```

### 2. Configure environment

```bash
cp .env.example .env

# Generate the admin password hash and copy it into .env (double every "$" -> "$$")
docker compose run --rm backend npm run hash -- "YourStrongPassword"

# Edit .env and set:
#   POSTGRES_PASSWORD  + matching password in DATABASE_URL
#   JWT_SECRET         (openssl rand -hex 32)
#   ADMIN_EMAIL        + ADMIN_PASSWORD_HASH (escaped, see above)
nano .env

# Sanity-check that secrets resolve (no "variable is not set" warnings)
docker compose config | grep -E "ADMIN_PASSWORD_HASH|DATABASE_URL"
```

### 3. Build and start

```bash
docker compose up -d --build
```

### 4. Migrations (run automatically)

Migrations are applied on every backend start (`prisma migrate deploy` via the
container entrypoint), so you normally do nothing. To run them manually:

```bash
docker compose exec backend npx prisma migrate deploy
```

### 5. (Optional) Seed sample products + default settings

```bash
docker compose exec backend npm run seed
```

### 6. Verify

```bash
docker compose ps                       # all services up, postgres healthy
curl -s http://localhost/api/health     # {"status":"ok"}
```

The site is served on port 80. Point your domain's DNS A record at the VPS IP.

### Updating to a new version

```bash
git pull
docker compose up -d --build            # migrations re-apply automatically
```

### SSL (Let's Encrypt)

The bundled nginx listens on port 80. For HTTPS, either run certbot on the host
in front of the stack or extend `nginx/default.conf` with a TLS server block:

```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d shopglamavenue.co.uk -d www.shopglamavenue.co.uk
```

### Backups

```bash
mkdir -p backups

# Daily database dump (cron; rotate to keep last 7)
docker compose exec -T postgres pg_dump -U glamavenue glamavenue_db \
  | gzip > backups/glamavenue-$(date +%F).sql.gz
find backups -name 'glamavenue-*.sql.gz' -mtime +7 -delete

# Weekly uploaded-images backup — uploads are a host folder, just archive it
tar czf backups/uploads-$(date +%F).tar.gz ./uploads
```

> Restore a DB dump with:
> `gunzip -c backups/glamavenue-YYYY-MM-DD.sql.gz | docker compose exec -T postgres psql -U glamavenue -d glamavenue_db`

---

## 8. Brand

| Token        | Hex       |
| ------------ | --------- |
| Black (ink)  | `#111111` |
| Gold         | `#C89B3C` |
| Warm beige   | `#D8C7B5` |
| Cream        | `#F4EFE8` |
| White        | `#FFFFFF` |

Headings use **Playfair Display**, body uses **Inter**. The logo is recreated as
an SVG in `frontend/src/components/Logo.tsx` — drop in the official artwork there
(or in `frontend/public/`) to replace the monogram.

---

## 9. Image generation pipeline

Generates product images via the OpenAI Images API (DALL-E 3).

### Setup

```bash
pip install openai
export OPENAI_API_KEY=sk-...
```

Add your products to `config/products.json`.

### By profile

```bash
# Basic — hero only
python scripts/generate_images.py --category necklaces --profile basic

# Standard — hero + model
python scripts/generate_images.py --category necklaces --profile standard

# Premium — all four types
python scripts/generate_images.py --category necklaces --profile premium
```

### Custom image types

```bash
python scripts/generate_images.py --category necklaces --types hero lifestyle

python scripts/generate_images.py --category necklaces --types hero model closeup lifestyle
```

> `--types` overrides `--profile` when both are provided.

### All flags

| Flag | Description |
|------|-------------|
| `--category <name>` | Filter products by category |
| `--product <id\|name>` | Process a single product |
| `--all` | Process every product in `config/products.json` |
| `--limit <n>` | Cap the number of products processed |
| `--force` | Regenerate images that already exist |
| `--dry-run` | Preview actions without calling the API |

### Output

```
output/images/<category>/<product_id>/
  01_hero.png
  02_model.png
  03_closeup.png
  04_lifestyle.png
```

### Profiles

| Profile | Images |
|---------|--------|
| `basic` | `01_hero.png` |
| `standard` | `01_hero.png`, `02_model.png` |
| `premium` | `01_hero.png`, `02_model.png`, `03_closeup.png`, `04_lifestyle.png` |

### Manifest

Every run writes / updates `product_manifest.csv` with:
`product_id`, `product_name`, `category`, `generation_profile`,
`requested_image_types`, `generated_image_types`, `generated_at`.

### Image resizing

After each image is generated it is automatically resized to a 2000×2000 PNG.
The resize mode is controlled by `config/settings.json`:

```json
{
  "resize_mode": "cover",
  "resize_size": 2000
}
```

| Mode | Behaviour |
|------|-----------|
| `cover` **(default)** | Resize so the shorter side reaches the target size, then center-crop the longer side. Fills the full frame — no white borders, no padding. |
| `contain` | Fit inside the target frame preserving aspect ratio, pad remainder with white. |

**Cover crop steps:**
1. Open image.
2. Scale proportionally so both dimensions are >= target (shorter side = target).
3. Center-crop to exact target × target square.
4. Save as PNG.

You can also run the resizer standalone on existing files:

```bash
# Single file
python scripts/resize_images.py output/images/earrings/p001/01_hero.png

# Entire directory (all PNGs recursively)
python scripts/resize_images.py output/images/ --mode cover

# Override mode or size
python scripts/resize_images.py img.png --mode contain --size 1024
```

### Smoke tests

```bash
python scripts/smoke_test.py
```
