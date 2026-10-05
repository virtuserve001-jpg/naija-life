/* NAIJA LIFE — network layer */
/* Backend URL. Defaults to the page's own origin (single-server deploys).
   Override with ?ws=wss://my-backend.example.com  or  window.__NL_WS__ = '...'
   when the static client is hosted somewhere else (e.g. Vercel + Render). */
const wsUrl = (() => {
  const q = new URLSearchParams(location.search).get('ws');   // ?ws= wins, for debugging
  if (q) return q;
  if (window.__NL_WS__) return window.__NL_WS__;              // baked in at static-build time
  return (location.protocol === 'https:' ? 'wss://' : 'ws://') + location.host;
})();

const SESSION_KEY = 'naija_session';

class Net {
  constructor() {
    this.ws = null;
    this.handlers = new Map();
    this.pending = new Map();
    this.rid = 1;
    this.state = { me: null, world: null, nearby: [], npcs: [], district: null, auth: null };
    this.connected = false;
    this.queue = [];
    this.lastMoveSent = 0;

    /* ── session + reconnect ─────────────────────────────────────────────
       The server hands out a token at sign-in and stores it on the player,
       so it survives a restart. We keep it in localStorage and replay it on
       every reconnect — a redeploy then costs players a few seconds of
       "reconnecting…" instead of a trip back to the login screen.        */
    this.session = null;
    try { this.session = JSON.parse(localStorage.getItem(SESSION_KEY) || 'null'); } catch (e) {}
    this.wantReconnect = true;
    this.reconnectDelay = 800;
    this.reconnectTimer = null;
    this.paused = false;

    // A background tab shouldn't hammer the server or burn mobile data.
    // Wait quietly, then reconnect the moment the player comes back.
    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', () => {
        if (!document.hidden && this.paused) { this.paused = false; this.scheduleReconnect(); }
      });
    }
  }

  saveSession(token, username) {
    this.session = { token, username };
    try { localStorage.setItem(SESSION_KEY, JSON.stringify(this.session)); } catch (e) {}
  }
  clearSession() {
    this.session = null;
    try { localStorage.removeItem(SESSION_KEY); } catch (e) {}
  }

  connect() {
    return new Promise((resolve, reject) => {
      try { this.ws = new WebSocket(wsUrl); } catch (e) { reject(e); return; }
      let settled = false;
      this.ws.onopen = () => {
        this.connected = true;
        this.reconnectDelay = 800;                       // reset backoff on success
        for (const m of this.queue) this.ws.send(JSON.stringify(m));
        this.queue = [];
        if (this.session && this.session.token) this.send({ t: 'resume', token: this.session.token });
        this.emit('open', {});
        if (!settled) { settled = true; resolve(); }
      };
      this.ws.onerror = (e) => { if (!settled) { settled = true; reject(e); } };
      this.ws.onclose = () => {
        this.connected = false;
        if (!settled) { settled = true; reject(new Error('socket closed')); }
        this.emit('closed', {});
        this.scheduleReconnect();
      };
      this.ws.onmessage = (ev) => {
        let msg; try { msg = JSON.parse(ev.data); } catch (e) { return; }
        this.handle(msg);
      };
    });
  }

  /* Reconnect with exponential backoff + jitter — 0.8s doubling to 60s.
     Jitter stops every player from retrying on the same beat after an outage. */
  scheduleReconnect() {
    if (!this.wantReconnect || this.reconnectTimer || this.paused) return;
    if (typeof document !== 'undefined' && document.hidden) {
      this.paused = true;                      // resume on visibilitychange
      return;
    }
    const base = this.reconnectDelay;
    this.reconnectDelay = Math.min(this.reconnectDelay * 2, 60000);
    const delay = Math.round(base * (0.5 + Math.random()));
    this.emit('reconnecting', { in: Math.round(delay / 1000) });
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      this.connect().catch(() => {});          // failures reschedule via onclose
    }, delay);
  }

  handle(msg) {
    switch (msg.t) {
      case 'you':   this.state.me = msg.player; break;
      case 'world': this.state.world = msg; break;
      case 'nearby':
        this.state.nearby = msg.players || [];
        this.state.npcs = msg.npcs || [];
        this.state.district = msg.district;
        break;
      case 'res': {
        const p = this.pending.get(msg.rid);
        if (p) { this.pending.delete(msg.rid); p({ ok: msg.ok, msg: msg.msg, data: msg.data }); }
        break;
      }
    }
    this.emit(msg.t, msg);
  }

  on(type, fn) {
    if (!this.handlers.has(type)) this.handlers.set(type, []);
    this.handlers.get(type).push(fn);
    return () => {
      const a = this.handlers.get(type) || [];
      const i = a.indexOf(fn); if (i >= 0) a.splice(i, 1);
    };
  }
  emit(type, msg) { for (const fn of this.handlers.get(type) || []) { try { fn(msg); } catch (e) { console.error(e); } } }

  send(obj) {
    const s = JSON.stringify(obj);
    if (this.ws && this.ws.readyState === 1) this.ws.send(s);
    else this.queue.push(obj);
  }

  act(a, p = {}) {
    return new Promise((resolve) => {
      const rid = 'r' + (this.rid++);
      this.pending.set(rid, resolve);
      this.send({ t: 'act', a, p, rid });
      setTimeout(() => {
        if (this.pending.has(rid)) { this.pending.delete(rid); resolve({ ok: false, msg: 'Network delay. Try again.' }); }
      }, 12000);
    });
  }

  move(x, y, dir, moving, districtId) {
    const now = Date.now();
    if (now - this.lastMoveSent < 90) return;
    this.lastMoveSent = now;
    this.send({ t: 'move', x: +x.toFixed(2), y: +y.toFixed(2), dir, moving, districtId });
  }

  chat(scope, text, to) { this.send({ t: 'chat', scope, text, to }); }
  logout() { this.wantReconnect = false; this.clearSession(); try { this.ws && this.ws.close(); } catch (e) {} }
  register(o) { this.send({ t: 'register', ...o }); }
  login(u, p) { this.send({ t: 'login', username: u, password: p }); }
}

export const net = new Net();
export const me = () => net.state.me;
export const wld = () => net.state.world;
