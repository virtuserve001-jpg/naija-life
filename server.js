/**
 * NAIJA LIFE — SERVER
 * Realtime multiplayer: one WebSocket, one shared Nigeria.
 */
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

/* Prefer the real `ws` package (npm install). Fall back to the vendored copy in
   vendor/ws so the game also runs with zero install. */
const require = createRequire(import.meta.url);
let WebSocketServer;
try { ({ WebSocketServer } = require('ws')); }
catch (e) { ({ WebSocketServer } = await import('./vendor/ws/index.js').then(m => m.default || m)); }

import { world, players, byUsername, tickWorld, clock, timeString, saveWorld, loadWorld, npcsIn, ambientFor, radioLine, addNews } from './src/sim/world.js';
import { createPlayer, publicPlayer, log, recalc, need, EDU_LEVELS } from './src/sim/player.js';
import { ACTIONS } from './src/sim/actions.js';
import { ACTIONS_LIFE } from './src/sim/actions_life.js';
import { TUNING, naira, clamp } from './src/config.js';
import { CITY_BY_ID, DISTRICT_BY_ID, VENUE_BY_ID } from './src/data/cities.js';
import { BACKSTORIES, CAREER_BY_ID } from './src/data/content.js';
import { initVenuePositions } from './src/data/layout.js';

const ROOT = path.dirname(fileURLToPath(import.meta.url));
const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST || '0.0.0.0';
const ALL = { ...ACTIONS, ...ACTIONS_LIFE };

/* ───────────────────────── static files ───────────────────────── */
const MIME = { '.html':'text/html', '.js':'text/javascript', '.mjs':'text/javascript', '.css':'text/css', '.json':'application/json',
  '.png':'image/png', '.jpg':'image/jpeg', '.svg':'image/svg+xml', '.ico':'image/x-icon', '.woff2':'font/woff2', '.webmanifest':'application/manifest+json' };

const server = http.createServer((req, res) => {
  try {
    let urlPath = decodeURIComponent(req.url.split('?')[0]);
    if (urlPath === '/') urlPath = '/index.html';
    // health check — Render / Fly / Railway / uptime monitors poll this
    if (urlPath === '/healthz' || urlPath === '/health') {
      res.writeHead(200, { 'content-type':'application/json' });
      res.end(JSON.stringify({ ok:true, players: players.size, month: world.monthIndex,
        tick: world.tick, fuel: Math.round(world.macro.fuelPrice), uptime: Math.round(process.uptime()) }));
      return;
    }
    let file;
    if (urlPath.startsWith('/src/') || urlPath.startsWith('/vendor/')) file = path.join(ROOT, urlPath);
    else file = path.join(ROOT, 'public', urlPath);
    if (!file.startsWith(ROOT)) { res.writeHead(403).end('no'); return; }
    fs.readFile(file, (err, buf) => {
      if (err) {
        res.writeHead(404, { 'content-type':'text/plain' }); res.end('404'); return;
      }
      const ext = path.extname(file);
      res.writeHead(200, { 'content-type': MIME[ext] || 'application/octet-stream', 'cache-control':'no-cache' });
      res.end(buf);
    });
  } catch (e) { res.writeHead(500).end('err'); }
});

/* ───────────────────────── auth helpers ───────────────────────── */
const hashPassword = (pw, salt = crypto.randomBytes(16).toString('hex')) => {
  const hash = crypto.scryptSync(String(pw), salt, 64).toString('hex');
  return { salt, hash };
};
const verifyPassword = (pw, p) => {
  if (!p.pass) return false;
  const h = crypto.scryptSync(String(pw), p.pass.salt, 64).toString('hex');
  return crypto.timingSafeEqual(Buffer.from(h, 'hex'), Buffer.from(p.pass.hash, 'hex'));
};
const token = () => crypto.randomBytes(18).toString('hex');

/* ───────────────────────── connections ───────────────────────── */
const wss = new WebSocketServer({ server });
const sockets = new Map();          // playerId -> ws
const lastChat = new Map();         // playerId -> ms
const lastAct = new Map();

function send(ws, obj) { try { ws.send(JSON.stringify(obj)); } catch (e) {} }
function sendTo(p, obj) { const ws = sockets.get(p.id); if (ws) send(ws, obj); }
function broadcast(obj, filter) {
  const s = JSON.stringify(obj);
  for (const [id, ws] of sockets) {
    if (filter && !filter(players.get(id))) continue;
    try { ws.send(s); } catch (e) {}
  }
}

function fullYou(p) {
  return {
    t: 'you', player: {
      ...p, pass: undefined,
      levelName: EDU_LEVELS[p.edu.level],
      jobName: p.job ? CAREER_BY_ID[p.job.careerId].name : null,
      jobEmoji: p.job ? CAREER_BY_ID[p.job.careerId].emoji : '😐',
      income: p.job ? Math.round((p.job.hoursThisMonth || 0)) : 0,
      monthlyIncome: p.job ? Math.round(require_pay(p)) : (p.edu.nysc ? 77_000 : 0),
    },
  };
}
function require_pay(p) {
  const c = CAREER_BY_ID[p.job.careerId];
  return c ? c.pay[Math.min(p.job.level, c.pay.length - 1)] * (CITY_BY_ID[p.cityId]?.wageMult || 1) : 0;
}

function worldSnapshot() {
  return {
    t: 'world',
    time: clock(), timeString: timeString(),
    weather: world.weather,
    macro: world.macro,
    news: world.news.slice(0, 12),
    online: sockets.size,
    totalPlayers: players.size,
    election: world.macro.election,
  };
}

/* ───────────────────────── ws handling ───────────────────────── */
wss.on('connection', (ws) => {
  if (shuttingDown) { try { ws.send(JSON.stringify({ t:'restarting', in: 5 })); } catch (e) {} }
  ws.isAlive = true;
  ws.on('pong', () => ws.isAlive = true);
  let me = null;

  ws.on('message', (raw) => {
    let msg; try { msg = JSON.parse(raw); } catch (e) { return; }
    handle(ws, msg);
  });

  function handle(ws, msg) {
    const now = Date.now();

    /* ── register ── */
    if (msg.t === 'register') {
      const username = String(msg.username || '').trim().toLowerCase().replace(/[^a-z0-9_]/g, '');
      if (username.length < 3) return send(ws, { t:'auth', ok:false, msg:'Username needs 3+ characters (letters, numbers, underscore).' });
      if (byUsername.has(username)) return send(ws, { t:'auth', ok:false, msg:'That name is taken. Try another.' });
      if (String(msg.password || '').length < 4) return send(ws, { t:'auth', ok:false, msg:'Password needs 4+ characters.' });
      const p = createPlayer({ username, name: msg.name || username, backstoryId: msg.backstory, skin: msg.skin || 1 });
      p.pass = hashPassword(msg.password);
      p.world_inflation = world.macro.inflation;
      p.inbox = [];
      players.set(p.id, p); byUsername.set(username, p);
      me = p; ws.playerId = p.id; sockets.set(p.id, ws);
      p.online = true;
      p.token = token();
      send(ws, { t:'auth', ok:true, token: p.token, player: fullYou(p).player });
      send(ws, fullYou(p));
      send(ws, worldSnapshot());
      send(ws, { t:'nearby', players: nearby(p), npcs: npcsIn(p.districtId), district: p.districtId });
      send(ws, { t:'toast', emoji: p.emoji, text: `Welcome to Naija Life, ${p.name}.`, kind:'good' });
      console.log(`[+] ${username} joined (${players.size} total)`);
      return;
    }

    /* ── login ── */
    if (msg.t === 'login') {
      const username = String(msg.username || '').trim().toLowerCase();
      const p = byUsername.get(username);
      if (!p || !verifyPassword(msg.password, p)) return send(ws, { t:'auth', ok:false, msg:'Wrong name or password.' });
      const existing = sockets.get(p.id);
      if (existing) { try { existing.close(); } catch (e) {} }
      me = p; ws.playerId = p.id; sockets.set(p.id, ws);
      p.online = true; p.inbox = p.inbox || [];
      p.token = token();
      send(ws, { t:'auth', ok:true, token: p.token, player: fullYou(p).player });
      send(ws, fullYou(p));
      send(ws, worldSnapshot());
      send(ws, { t:'nearby', players: nearby(p), npcs: npcsIn(p.districtId), district: p.districtId });
      console.log(`[•] ${username} logged in`);
      return;
    }

    /* ── resume a session after a reconnect / server restart ── */
    if (msg.t === 'resume') {
      const tok = String(msg.token || '');
      const p = tok ? [...players.values()].find(q => q.token && q.token === tok) : null;
      if (!p) return send(ws, { t:'auth', ok:false, msg:'Session expired. Please sign in again.' });
      if (shuttingDown) return send(ws, { t:'restarting', in: 5 });
      const existing = sockets.get(p.id);
      if (existing) { try { existing.close(); } catch (e) {} }
      me = p; ws.playerId = p.id; sockets.set(p.id, ws);
      p.online = true; p.inbox = p.inbox || [];
      send(ws, { t:'auth', ok:true, token: p.token, player: fullYou(p).player, resumed: true });
      send(ws, fullYou(p));
      send(ws, worldSnapshot());
      send(ws, { t:'nearby', players: nearby(p), npcs: npcsIn(p.districtId), district: p.districtId });
      return;
    }

    if (!me) return;

    /* ── movement ── */
    if (msg.t === 'move') {
      // the server owns which district you are in — clients only report position within it
      if (me.travel) { /* on the road: position updates are ignored */ }
      else {
        me.x = clamp(+msg.x || 0, 0, 128);
        me.y = clamp(+msg.y || 0, 0, 128);
        me.dir = +msg.dir || 0;
        me.moving = !!msg.moving;
        me.sleeping = false;
      }
      return;
    }

    /* ── chat ── */
    if (msg.t === 'chat') {
      const text = String(msg.text || '').slice(0, 300).trim();
      if (!text) return;
      if (now - (lastChat.get(me.id) || 0) < TUNING.chatCooldownMs) {
        return send(ws, { t:'toast', emoji:'⏳', text:'Slow down. Even agbero takes breath.' });
      }
      lastChat.set(me.id, now);
      const scope = msg.scope || 'local';
      const payload = { t:'chat', scope, from: me.name, username: me.username, text, ts: Date.now() };
      if (scope === 'dm') {
        const target = byUsername.get(String(msg.to || '').toLowerCase().replace(/^@/, ''));
        if (!target) return send(ws, { t:'toast', emoji:'❌', text:'No such player.' });
        payload.to = target.username; payload.fromMe = true;
        sendTo(me, payload);
        const t2 = { ...payload, fromMe: false };
        sendTo(target, t2);
        target.inbox = target.inbox || [];
        target.inbox.unshift({ from: me.name, username: me.username, text, t: Date.now() });
        if (target.inbox.length > 40) target.inbox.length = 40;
        return;
      }
      if (scope === 'global') { broadcast(payload); world.chat.unshift(payload); if (world.chat.length > 10) world.chat.length = 10; return; }
      if (scope === 'city') {
        broadcast(payload, (q) => q.cityId === me.cityId);
        return;
      }
      // local: district + venue
      broadcast(payload, (q) => q.districtId === me.districtId);
      return;
    }

    /* ── actions ── */
    if (msg.t === 'act') {
      const readOnly = /\.(info|list|quote|catalogue|feed|people)$/.test(msg.a || '');
      if (!readOnly && now - (lastAct.get(me.id) || 0) < TUNING.actionCooldownMs) {
        return send(ws, { t:'res', rid: msg.rid, ok:false, msg:'One minute — you are doing that too fast.' });
      }
      lastAct.set(me.id, now);
      const fn = ALL[msg.a];
      if (!fn) return send(ws, { t:'res', rid: msg.rid, ok:false, msg:'Unknown action.' });
      let res;
      try {
        res = fn({ p: me, world, players, byUsername, notify }, msg.p || {});
      } catch (e) {
        console.error('action error', msg.a, e.message);
        res = { ok:false, msg:'Something broke. Try again.' };
      }
      send(ws, fullYou(me));            // state first…
      send(ws, { t:'res', rid: msg.rid, ok: !!res.ok, msg: res.msg, data: res.data || null });
      if (res.msg) send(ws, { t:'toast', emoji: res.ok ? '✅' : '⚠️', text: res.msg, kind: res.ok ? 'good' : 'bad' });
      recalc(me);
      return;
    }

    if (msg.t === 'sync') { send(ws, fullYou(me)); send(ws, worldSnapshot()); return; }
    if (msg.t === 'ping') { send(ws, { t:'pong', ts: now }); return; }
    if (msg.t === 'delete') {
      // account deletion, per NDPA
      players.delete(me.id); byUsername.delete(me.username); sockets.delete(me.id);
      send(ws, { t:'deleted' });
      return;
    }
  }

  ws.on('close', () => {
    if (me) {
      me.online = false; me.lastSeen = Date.now();
      sockets.delete(me.id);
    }
  });
});

function notify(id, obj) {
  const p = players.get(id); if (!p) return;
  p.inbox = p.inbox || [];
  p.inbox.unshift({ ...obj, t: Date.now() });
  if (p.inbox.length > 40) p.inbox.length = 40;
  sendTo(p, { t:'toast', ...obj });
}

/* ───────────────────────── presence ───────────────────────── */
function nearby(p) {
  const out = [];
  for (const q of players.values()) {
    if (q.id === p.id) continue;
    if (q.districtId !== p.districtId) continue;
    if (!q.online && !TUNING.offlinePresence) continue;
    out.push(publicPlayer(q));
  }
  return out;
}

let hb = setInterval(() => {
  for (const ws of wss.clients) {
    if (ws.isAlive === false) { try { ws.terminate(); } catch (e) {} continue; }
    ws.isAlive = false; try { ws.ping(); } catch (e) {}
  }
}, 25000);

/* ───────────────────────── world loop ───────────────────────── */
loadWorld();
const venuesPlaced = initVenuePositions();
if (!world.news.length) {
  addNews('🇳🇬', 'Welcome to Naija Life. 12 cities, one economy, and everybody is hustling.', 'general');
}

let nearbyCounter = 0;
const tickTimer = setInterval(() => {
  tickWorld();
  nearbyCounter++;
  const snap = worldSnapshot();
  broadcast(snap);
  // needs decay, illness, travel arrival, month-end — all happen on the tick,
  // so push each player's own state regularly, not just after their actions
  for (const [id, ws] of sockets) {
    const p = players.get(id); if (!p) continue;
    if (world.tick % 2 === 0) send(ws, fullYou(p));
    if (nearbyCounter % 4 === 0) send(ws, { t:'nearby', players: nearby(p), npcs: npcsIn(p.districtId), district: p.districtId });
  }
  if (world.tick % TUNING.saveEveryTicks === 0) saveWorld();
}, 1000);

/* ───────── graceful shutdown: never lose a session on redeploy ─────────
   Order matters: save the world FIRST, then tell everyone to reconnect,
   then drain the sockets. The new process boots while the old one is still
   draining, so it loads the file we just wrote.                          */
let shuttingDown = false;
function shutdown(sig) {
  if (shuttingDown) return;
  shuttingDown = true;
  console.log(`[naija-life] ${sig} — saving world, telling ${sockets.size} player(s) to reconnect…`);
  clearInterval(tickTimer);
  clearInterval(hb);
  saveWorld();                                   // persist first
  for (const [, ws] of sockets) try { send(ws, { t:'restarting', in: 5 }); } catch (e) {}
  setTimeout(() => {
    for (const [, ws] of sockets) try { ws.close(1001, 'server restarting'); } catch (e) {}
    setTimeout(() => process.exit(0), 400);
  }, 1200);
}
process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

server.listen(PORT, HOST, () => {
  console.log(`\n  🇳🇬  NAIJA LIFE running → http://localhost:${PORT}\n       ${venuesPlaced} venues placed · players: ${players.size} · month ${world.monthIndex} · fuel ₦${Math.round(world.macro.fuelPrice)}/L\n`);
});

