ALTER TABLE "Product"
ADD COLUMN "shortDescription" TEXT,
ADD COLUMN "fullDescription" TEXT,
ADD COLUMN "features" JSONB NOT NULL DEFAULT '[]',
ADD COLUMN "careGuide" TEXT,
ADD COLUMN "shippingInfo" TEXT,
ADD COLUMN "dimensions" TEXT,
ADD COLUMN "weight" TEXT,
ADD COLUMN "internalNotes" TEXT,
ADD COLUMN "status" TEXT NOT NULL DEFAULT 'draft';

UPDATE "Product"
SET
  "fullDescription" = NULLIF("description", ''),
  "status" = CASE WHEN "visible" THEN 'published' ELSE 'draft' END;

CREATE INDEX "Product_status_idx" ON "Product"("status");
CREATE INDEX "Product_category_idx" ON "Product"("category");
