-- Add independent merchandising controls without changing existing featured products.
ALTER TABLE "Product"
ADD COLUMN "heroFeatured" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "bestSeller" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "newArrival" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "trending" BOOLEAN NOT NULL DEFAULT false;

CREATE INDEX "Product_heroFeatured_idx" ON "Product"("heroFeatured");
CREATE INDEX "Product_bestSeller_idx" ON "Product"("bestSeller");
CREATE INDEX "Product_newArrival_idx" ON "Product"("newArrival");
CREATE INDEX "Product_trending_idx" ON "Product"("trending");
