-- Preserve the existing homepage hero once, then allow Hero Featured and
-- Featured Collection to be managed independently.
UPDATE "Product"
SET "heroFeatured" = true
WHERE "id" = (
  SELECT "id"
  FROM "Product"
  WHERE "featured" = true
  ORDER BY "updatedAt" DESC
  LIMIT 1
);
