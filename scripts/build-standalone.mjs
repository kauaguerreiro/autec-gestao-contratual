// Gera um único arquivo HTML (dist/autec.html) com CSS e JS embutidos.
// Útil para abrir o Autec offline, em "modo local", com dois cliques.
// Uso: node scripts/build-standalone.mjs
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import path from 'node:path';

const root = path.resolve('frontend');
let html = readFileSync(path.join(root, 'index.html'), 'utf8');

html = html.replace(/<link rel="stylesheet" href="(css\/[^"]+)">/g, (_, href) =>
  `<style>\n${readFileSync(path.join(root, href), 'utf8')}\n</style>`);
html = html.replace(/<script src="(js\/[^"]+)"><\/script>/g, (_, src) =>
  `<script>\n${readFileSync(path.join(root, src), 'utf8').replace(/<\/script>/g, '<\\/script>')}\n</script>`);
const fav = readFileSync(path.join(root, 'assets/favicon.svg'), 'utf8');
html = html.replace(/<link rel="icon" href="assets\/favicon.svg"[^>]*>/, `<link rel="icon" href="data:image/svg+xml,${encodeURIComponent(fav)}">`);

mkdirSync('dist', { recursive: true });
writeFileSync('dist/autec.html', html);
console.log(`dist/autec.html gerado (${(html.length / 1024).toFixed(0)} KB)`);
