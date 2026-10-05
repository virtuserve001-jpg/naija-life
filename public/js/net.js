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
  }

  connect() {
    return new Promise((resolve, reject) => {
      try { this.ws = new WebSocket(wsUrl); } catch (e) { reject(e); return; }
      this.ws.onopen = () => {
        this.connected = true;
        for (const m of this.queue) this.ws.send(JSON.stringify(m));
        this.queue = [];
        resolve();
      };
      this.ws.onerror = (e) => reject(e);
      this.ws.onclose = () => { this.connected = false; this.emit('closed', {}); };
      this.ws.onmessage = (ev) => {
        let msg; try { msg = JSON.parse(ev.data); } catch (e) { return; }
        this.handle(msg);
      };
    });
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
  register(o) { this.send({ t: 'register', ...o }); }
  login(u, p) { this.send({ t: 'login', username: u, password: p }); }
}

export const net = new Net();
export const me = () => net.state.me;
export const wld = () => net.state.world;
