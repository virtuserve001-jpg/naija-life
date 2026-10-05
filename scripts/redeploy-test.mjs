#!/usr/bin/env node
/**
 * NAIJA LIFE — REDEPLOY / SESSION PERSISTENCE TEST
 *
 * Proves that shipping a new version does NOT sign players out:
 *
 *   1. boot the server, register a player, change their state
 *   2. SIGTERM it (exactly what Render / Fly / Railway send on deploy)
 *   3. boot a NEW process against the same data dir
 *   4. reconnect with only the stored token — no password
 *   5. assert it's the same player with the same money
 *
 *   npm test        (runs this after the smoke test)
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

console.log('\n\x1b[1m🔄  Redeploy test — do sessions survive an upgrade?\x1b[0m\n');

const PORT = await freePort();
const DATA_DIR = fs.mkdtempSync(path.join(os.tmpdir(), 'naija-redeploy-'));

function boot(tag) {
  const c = spawn(process.execPath, ['server.js'], {
    cwd: ROOT,
    env: { ...process.env, PORT: String(PORT), NAIJA_DATA_DIR: DATA_DIR, HOST: '127.0.0.1' },
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  c.stderr.on('data', d => process.stderr.write(`[${tag}] ${d}`));
  return c;
}
async function waitUp(ms = 20000) {
  const t0 = Date.now();
  while (Date.now() - t0 < ms) {
    try { const r = await fetch(`http://127.0.0.1:${PORT}/healthz`); if (r.ok) return true; } catch {}
    await sleep(200);
  }
  return false;
}

function client() {
  return new Promise((resolve, reject) => {
    const ws = new WebSocket(`ws://127.0.0.1:${PORT}`);
    const c = {
      ws, seen: [],
      send(o) { ws.send(JSON.stringify(o)); },
      wait(type, pred = () => true, ms = 8000) {
        const hit = c.seen.find(m => m.t === type && pred(m));
        if (hit) return Promise.resolve(hit);
        return new Promise((res, rej) => {
          const t = setTimeout(() => rej(new Error(`timed out waiting for "${type}"`)), ms);
          const on = (raw) => {
            let m; try { m = JSON.parse(raw); } catch { return; }
            c.seen.push(m);
            if (m.t === type && pred(m)) { clearTimeout(t); ws.off('message', on); res(m); }
          };
          ws.on('message', on);
        });
      },
      close() { try { ws.close(); } catch {} },
    };
    ws.on('error', reject);
    ws.on('open', () => resolve(c));
  });
}

let child = boot('v1');
const cleanup = () => {
  try { child && child.kill('SIGKILL'); } catch {}
  try { fs.rmSync(DATA_DIR, { recursive: true, force: true }); } catch {}
};

try {
  if (!await waitUp()) throw new Error('server v1 never started');
  check('server v1 boots', true);

  /* ── sign in and change some state ── */
  const a = await client();
  const user = 'redeploy_' + Math.floor(Math.random() * 1e6);
  a.send({ t: 'register', username: user, password: 'test1234', name: 'Redeploy Test' });
  const auth = await a.wait('auth', m => m.ok);
  const token = auth.token;
  await a.wait('you');
  check('player signs in and gets a session token', !!token, `${token.slice(0, 10)}…`);

  a.send({ t: 'act', rid: 1, a: 'bank.deposit', p: { amount: 750 } });
  await a.wait('res', m => m.rid === 1 && m.ok);
  await sleep(1200);   // let a periodic save land too
  const beforeBank = (await a.wait('you', m => m.player.bank >= 750)).player.bank;
  const beforeId = a.seen.filter(m => m.t === 'you').pop().player.id;
  check('state changed before the deploy', beforeBank >= 750, `₦${beforeBank} in bank`);
  a.close();

  /* ── the deploy: SIGTERM ── */
  const exited = new Promise(res => child.once('exit', res));
  child.kill('SIGTERM');
  const code = await Promise.race([exited, sleep(8000).then(() => 'timeout')]);
  check('SIGTERM exits cleanly after saving', code === 0, `exit code ${code}`);
  await sleep(400);

  /* ── new version boots ── */
  child = boot('v2');
  if (!await waitUp()) throw new Error('server v2 never started');
  const h = await (await fetch(`http://127.0.0.1:${PORT}/healthz`)).json();
  check('server v2 boots and loads the saved world', h.players >= 1, `${h.players} player(s) restored`);

  /* ── reconnect with NOTHING but the stored token ── */
  const b2 = await client();
  b2.send({ t: 'resume', token });
  const resumed = await b2.wait('auth', m => m.ok);
  const you = await b2.wait('you');
  check('token alone resumes the session (no password)', resumed.ok === true && resumed.resumed === true);
  check('same player comes back', you.player.id === beforeId, you.player.name);
  check('money survived the redeploy', you.player.bank === beforeBank, `₦${you.player.bank}`);
  check('position in the world survived', !!you.player.districtId, you.player.districtId);
  b2.close();

  /* ── a forged token must be rejected ── */
  const c3 = await client();
  c3.send({ t: 'resume', token: 'deadbeefdeadbeefdeadbeefdeadbeef' });
  const denied = await c3.wait('auth', m => m.ok === false);
  check('a forged token is rejected', denied.ok === false);
  c3.close();
} catch (e) {
  check(e.message, false);
  console.error('\n\x1b[31m' + (e.stack || e) + '\x1b[0m');
}

cleanup();
console.log(`\n\x1b[1m${pass.length} passed, ${fail.length} failed\x1b[0m`);
if (fail.length) { console.log('\x1b[31mFailed:\x1b[0m ' + fail.join(', ') + '\n'); process.exit(1); }
console.log('\x1b[32mPlayers keep their session across a redeploy.\x1b[0m\n');
process.exit(0);
