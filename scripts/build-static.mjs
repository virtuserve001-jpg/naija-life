#!/usr/bin/env node
/**
 * Builds dist/ for a STATIC-ONLY host (Vercel, Netlify, Cloudflare Pages, GitHub Pages).
 *
 * The game's realtime backend needs a long-lived Node process, so it can't live on
 * those hosts. This bundles just the browser client, and bakes in the URL of your
 * separately-hosted game server:
 *
 *   NAIJA_WS_URL=wss://naija-life.onrender.com node scripts/build-static.mjs
 *
 * If NAIJA_WS_URL is unset the client defaults to its own origin (single-server deploys).
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const DIST = path.join(ROOT, 'dist');
const WS = process.env.NAIJA_WS_URL || '';

fs.rmSync(DIST, { recursive: true, force: true });
const cp = (from, to) => fs.cpSync(path.join(ROOT, from), path.join(DIST, to), { recursive: true });

cp('public', '.');            // index.html, css, js
cp('src/data', 'src/data');   // cities, content, layout — imported by the browser at runtime
cp('src/config.js', 'src/config.js');

// bake the backend URL into the page so ?ws= isn't needed
if (WS) {
  const f = path.join(DIST, 'index.html');
  const html = fs.readFileSync(f, 'utf8').replace('</head>',
    `  <script>window.__NL_WS__ = ${JSON.stringify(WS)};</script>\n</head>`);
  fs.writeFileSync(f, html);
}

const count = (d) => fs.readdirSync(d, { recursive: true }).filter(f => !fs.statSync(path.join(d, f)).isDirectory()).length;
console.log(`✓ dist/ built — ${count(DIST)} files${WS ? `\n✓ backend pinned to ${WS}` : '\n⚠ NAIJA_WS_URL not set — client will connect to its own origin'}`);
