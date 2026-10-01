// End-to-end smoke test: launches the built app, stubs the OS dialogs from the
// main process, adds images, reorders, removes the bad one, exports, and
// verifies the PDF. Usage: node scripts/smoke.mjs <dir-with-images> [out.pdf]
import { _electron as electron } from 'playwright-core';
import { readdir, readFile, rm } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { PDFDocument } from 'pdf-lib';

const dir = resolve(process.argv[2] ?? 'test/fixtures');
const outPdf = resolve(process.argv[3] ?? join(dir, 'smoke-out.pdf'));
await rm(outPdf, { force: true });

const files = (await readdir(dir)).filter((f) => !f.endsWith('.pdf')).sort().map((f) => join(dir, f));
const expectedBad = files.filter((f) => /\.(txt|pdf)$/i.test(f)).length;
const expectedPages = files.length - expectedBad;

const app = await electron.launch({ args: ['out/main/index.js'] });
try {
  await app.evaluate(({ dialog }, { files, outPdf }) => {
    dialog.showOpenDialog = async () => ({ canceled: false, filePaths: files });
    dialog.showSaveDialog = async () => ({ canceled: false, filePath: outPdf });
  }, { files, outPdf });

  const page = await app.firstWindow();
  await page.waitForSelector('text=Drop images here');
  await page.click('text=Add images');
  await page.waitForFunction(() => document.querySelectorAll('.card-loading').length === 0, null, { timeout: 30000 });

  const errors = await page.$$eval('.card-error .error-text', (els) => els.map((e) => e.textContent));
  const dims = await page.$$eval('.card-ready', (els) =>
    els.map((e) => `${e.querySelector('.name').textContent}: ${e.querySelector('.dims').textContent}`),
  );
  console.log('ready:', dims);
  console.log('errors:', errors);
  if (errors.length !== expectedBad) throw new Error(`expected ${expectedBad} error cards, got ${errors.length}`);

  // Drag the last card's handle onto the first card.
  const handles = await page.$$('.card .handle');
  const first = await handles[0].boundingBox();
  const last = await handles[handles.length - 1].boundingBox();
  await page.mouse.move(last.x + 5, last.y + 5);
  await page.mouse.down();
  await page.mouse.move(last.x + 20, last.y + 20, { steps: 5 });
  await page.mouse.move(first.x + 5, first.y + 5, { steps: 15 });
  await page.mouse.up();
  // dnd-kit swallows a click issued in the same tick as the drop; give it a frame like a human would.
  await page.waitForTimeout(100);
  const orderAfter = await page.$$eval('.card .name', (els) => els.map((e) => e.textContent));
  console.log('order after drag:', orderAfter);
  const orderBefore = files.map((f) => f.split('/').pop());
  if (orderAfter[0] !== orderBefore[orderBefore.length - 1]) throw new Error('drag reorder did not move last card to first');

  // Remove error cards.
  for (const btn of await page.$$('.card-error .remove')) await btn.click();
  await page.waitForFunction(() => document.querySelectorAll('.card-error').length === 0);
  const count = await page.textContent('.count');
  console.log('count:', count.trim());
  if (!count.trim().endsWith(`${expectedPages} pages`) && !count.trim().endsWith(`${expectedPages} page`)) throw new Error(`count text wrong: ${count}`);

  await page.click('text=Export PDF');
  await page.waitForSelector('.toast-ok', { timeout: 30000 });
  console.log('toast:', await page.textContent('.toast-ok'));
} finally {
  await app.close();
}

const doc = await PDFDocument.load(await readFile(outPdf));
const sizes = Array.from({ length: doc.getPageCount() }, (_, i) => doc.getPage(i).getSize());
console.log('pdf pages:', doc.getPageCount(), sizes.map((s) => `${s.width}x${s.height}`));
if (doc.getPageCount() !== expectedPages) throw new Error(`expected ${expectedPages} pages, got ${doc.getPageCount()}`);
console.log('SMOKE OK');
