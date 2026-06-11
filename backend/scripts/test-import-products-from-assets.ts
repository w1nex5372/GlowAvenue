import assert from 'node:assert/strict';
import path from 'node:path';
import { findImages } from './import-products-from-assets';

async function main(): Promise<void> {
  const sourceFolder = path.resolve(__dirname, 'fixtures/import-products-uploads-url');
  const productFolder = path.join(sourceFolder, 'Product_A');
  const expected = path.join(productFolder, '01_ai', 'GA-BR-0001-hero.png');

  const matched = await findImages(sourceFolder, productFolder, {
    images: ['/uploads/products/GA-BR-0001-hero.png'],
  });
  assert.deepEqual(matched, [expected]);

  const fallback = await findImages(sourceFolder, productFolder, {
    images: ['/uploads/products/missing.png'],
  });
  assert.deepEqual(fallback, [expected]);

  await assert.rejects(
    findImages(sourceFolder, productFolder, { images: ['../../outside.png'] }),
    /escapes source folder/,
  );
  await assert.rejects(
    findImages(sourceFolder, productFolder, { images: ['/uploads/products/../outside.png'] }),
    /Invalid upload image URL/,
  );

  console.log('Product asset importer image resolution tests passed.');
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
