#!/usr/bin/env node
/**
 * NAIJA LIFE — END-TO-END SMOKE TEST
 *
 * Boots the real server on a free port against a throwaway data dir, then drives
 * two WebSocket clients through the whole loop:
 *   register → see each other → move → local chat → DM → action → reconnect → save
 *
 *   npm test
 *
 * Exit code 0 = everything passed.
 */
import { spawn } from 'node:child_process';
import { createRequire } from 'node:module';
import net from 'node:net';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');

let WebSocket;
try { WebSocket = require('ws'); }
catch { WebSocket = (await import('../vendor/ws/index.js')).default; }

/* ─────────────────────────── helpers ─────────────────────────── */
const sleep = ms => new Promise(r => setTimeout(r, ms));
const pass = [], fail = [];
function check(name, ok, detail = '') {
  (ok ? pass : fail).push(name);
  console.log(`  ${ok ? '\x1b[32m✓\x1b[0m' : '\x1b[31m✗\x1b[0m'} ${name}${detail ? `  \x1b[90m${detail}\x1b[0m` : ''}`);
}
const freePort = () => new Promise(res => {
  const s = net.createServer();
  s.listen(0, '127.0.0.1', () => { const p = s.address().port; s.close(() => res(p)); });
});

/* ─────────────────────────── boot the server ─────────────────────────── */
console.log('\n\x1b[1m🇳🇬  NAIJA LIFE — smoke test\x1b[0m\n');
const PORT = await freePort();
const DATA_DIR = fs.mkdtempSync(path.join(os.tmpdir(), 'naija-smoke-'));
const child = spawn(process.execPath, ['server.js'], {
  cwd: ROOT,
  env: { ...process.env, PORT: String(PORT), NAIJA_DATA_DIR: DATA_DIR, HOST: '127.0.0.1' },
  stdio: ['ignore', 'pipe', 'pipe'],
});
let serverLog = '';
child.stdout.on('data', d => { serverLog += d; });
child.stderr.on('data', d => { serverLog += d; });
const stop = () => { try { child.kill('SIGKILL'); } catch {} try { fs.rmSync(DATA_DIR, { recursive: true, force: true }); } catch {} };

let up = false;
for (let i = 0; i < 40 && !up; i++) {
  await sleep(250);
  try { const r = await fetch(`http://127.0.0.1:${PORT}/healthz`); up = r.ok; } catch {}
}
if (!up) {
  console.error('\x1b[31mServer failed to start.\x1b[0m\n' + serverLog);
  stop(); process.exit(1);
}
check(`server boots on :${PORT} and answers /healthz`, true);

/* ─────────────────────────── a tiny client ─────────────────────────── */
function connect(label) {
  return new Promise((resolve, reject) => {
    const ws = new WebSocket(`ws://127.0.0.1:${PORT}`);
    const c = {
      label, ws, seen: [], me: null,
      on(type, fn) { c.handlers.push([type, fn]); return c; },
      handlers: [],
      send(o) { ws.send(JSON.stringify(o)); },
      /** resolve with the first message matching type (+ optional predicate) */
      wait(type, pred = () => true, ms = 6000) {
        const hit = c.seen.find(m => m.t === type && pred(m));
        if (hit) return Promise.resolve(hit);
        return new Promise((res, rej) => {
          const t = setTimeout(() => rej(new Error(`${label}: timed out waiting for "${type}"`)), ms);
          c.handlers.push(['__wait__', m => {
            if (m.t === type && pred(m)) { clearTimeout(t); res(m); return true; }
          }]);
        });
      },
      close() { try { ws.close(); } catch {} },
    };
    ws.on('message', raw => {
      let m; try { m = JSON.parse(raw); } catch { return; }
      c.seen.push(m);
      for (const [type, fn] of [...c.handlers]) {
        if (type === '__wait__') { if (fn(m) === true) c.handlers.splice(c.handlers.indexOf([type, fn]), 1); }
        else if (m.t === type) fn(m);
      }
    });
    ws.on('error', reject);
    ws.on('open', () => resolve(c));
  });
}

const stamp = Date.now().toString(36);
const A = await connect('A');
const B = await connect('B');

try {
  /* ── 1. register ── */
  A.send({ t: 'register', username: 'smoke_a_' + stamp, password: 'test1234', name: 'Smoke A', backstory: 'ijgb' });
  B.send({ t: 'register', username: 'smoke_b_' + stamp, password: 'test1234', name: 'Smoke B', backstory: 'ijgb' });
  const authA = await A.wait('auth', m => m.ok);
  const authB = await B.wait('auth', m => m.ok);
  check('register returns an auth token', !!authA.token && !!authB.token);
  const youA = await A.wait('you');
  const youB = await B.wait('you');
  check('server sends full player state', !!youA.player && typeof youA.player.cash === 'number',
    `₦${youA.player.cash.toLocaleString()} cash`);
  const w = await A.wait('world');
  check('server sends world snapshot', !!(w.macro && w.time && w.news),
    `fuel ₦${Math.round(w.macro.fuelPrice)}/L · ${w.news.length} headlines`);

  /* ── 2. presence: they can see each other ── */
  const nearA = await A.wait('nearby', m => (m.players || []).some(p => p.username === 'smoke_b_' + stamp), 9000);
  const seesB = nearA.players.find(p => p.username === 'smoke_b_' + stamp);
  check('players see each other in the same district', !!seesB,
    `${youA.player.cityId || 'lagos'} · ${nearA.players.length} nearby`);

  /* ── 3. movement is accepted and broadcast ── */
  A.send({ t: 'move', x: 40, y: 44, dir: 1, moving: true });
  await sleep(1400);
  const moved = await B.wait('nearby', m => (m.players || []).some(p => p.username === 'smoke_a_' + stamp && Math.abs(p.x - 40) < 6), 9000);
  check('walking position syncs to other players', !!moved,
    `A now at ${(moved.players.find(p => p.username === 'smoke_a_' + stamp) || {}).x?.toFixed?.(1)}`);

  /* ── 4. local chat ── */
  A.send({ t: 'chat', scope: 'local', text: 'Who dey Lekki this evening?' });
  const chatB = await B.wait('chat', m => m.text === 'Who dey Lekki this evening?');
  check('area chat reaches nearby players', chatB.from === 'Smoke A', `"${chatB.text}" from ${chatB.from}`);

  /* ── 5. DM (respect the 900ms chat cooldown) ── */
  await sleep(1100);
  A.send({ t: 'chat', scope: 'dm', to: 'smoke_b_' + stamp, text: 'send me your account number' });
  const dmB = await B.wait('chat', m => m.scope === 'dm' && m.text.startsWith('send me'));
  check('private DM is delivered', dmB.to === 'smoke_b_' + stamp && dmB.fromMe === false);

  /* ── 6. a real action round-trips ── */
  A.send({ t: 'act', rid: 1, a: 'work.list', p: {} });
  const res = await A.wait('res', m => m.rid === 1);
  check('actions execute and reply', res.ok === true, 'work.list ok');

  await sleep(200);   // respect TUNING.actionCooldownMs
  A.send({ t: 'act', rid: 2, a: 'bank.deposit', p: { amount: 100 } });
  const dep = await A.wait('res', m => m.rid === 2);
  check('economy action mutates state', dep.ok === true, (dep.msg || '').slice(0, 46));

  /* ── 7. reconnect / persistence ── */
  A.close();
  await sleep(400);
  const A2 = await connect('A2');
  A2.send({ t: 'login', username: 'smoke_a_' + stamp, password: 'test1234' });
  const auth2 = await A2.wait('auth', m => m.ok);
  const you2 = await A2.wait('you');
  check('account survives reconnect', auth2.ok && you2.player.bank >= 100,
    `bank ₦${you2.player.bank.toLocaleString()}`);

  /* ── 8. health endpoint reflects live players ── */
  const h = await (await fetch(`http://127.0.0.1:${PORT}/healthz`)).json();
  check('health endpoint reports live players', h.players >= 2, `${h.players} players · month ${h.month}`);

  A2.close(); B.close();

  /* ── 9. graceful shutdown persists the world ── */
  await sleep(300);
  const exited = new Promise(res => child.once('exit', code => res(code)));
  child.kill('SIGTERM');
  const code = await Promise.race([exited, sleep(4000).then(() => 'timeout')]);
  const saved = fs.existsSync(path.join(DATA_DIR, 'world.json'));
  check('SIGTERM saves the world and exits cleanly', code === 0 && saved, `exit code ${code}`);
} catch (e) {
  check(e.message, false);
  console.error('\n\x1b[31m' + (e.stack || e) + '\x1b[0m');
}

stop();
console.log(`\n\x1b[1m${pass.length} passed, ${fail.length} failed\x1b[0m`);
if (fail.length) { console.log('\x1b[31mFailed:\x1b[0m ' + fail.join(', ') + '\n'); process.exit(1); }
console.log('\x1b[32mAll good — the server is deploy-ready.\x1b[0m\n');
process.exit(0);
