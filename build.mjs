import { mkdir, copyFile, writeFile } from 'node:fs/promises';
await mkdir('dist/assets', { recursive: true });
for (const filename of ['index.html','styles.css','app.js','model.mjs','cloud-store.mjs','manifest.webmanifest','sw.js','assets/ego-mark.svg']) {
  await copyFile(filename, `dist/${filename}`);
}
await writeFile('dist/404.html', '<!doctype html><meta charset="utf-8"><meta http-equiv="refresh" content="0;url=/">');
console.log('Production build ready in dist/');
