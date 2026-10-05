/* NAIJA LIFE — world renderer: streets, traffic, weather, day/night, avatars */
import { buildLayout, TILE, MAP_W, MAP_H } from '/src/data/layout.js';
import { net } from './net.js';

const SKIN = ['#8d5524','#c68642','#e0ac69','#f1c27d','#ffdbac','#6b4423','#a9714b','#d9a066','#5c3317','#e8b98a'];
const SHIRTS = ['#e5484d','#3b82f6','#00c389','#f5b301','#a855f7','#ec4899','#14b8a6','#f97316','#6366f1','#84cc16','#e11d48','#0ea5e9'];

/* deterministic per-name colour */
export function colourFor(name, arr) {
  let h = 0; for (const c of String(name)) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return arr[h % arr.length];
}

export class WorldView {
  constructor(canvas) {
    this.cv = canvas;
    this.ctx = canvas.getContext('2d');
    this.cam = { x: 0, y: 0 };
    this.zoom = 1.5;
    this.layout = null;
    this.districtId = null;
    this.bake = null;
    this.cars = [];
    this.keys = new Set();
    this.target = null;              // click-to-move
    this.px = 32; this.py = 32;
    this.dir = 2; this.moving = false;
    this.walkPhase = 0;
    this.onPrompt = () => {};
    this.onMove = () => {};
    this.nearest = null;
    this.nearNpc = null;
    this.particles = [];
    this.t = 0;
    this.locked = false;
    this._resize();
    window.addEventListener('resize', () => this._resize());
    this._bindInput();
  }

  _resize() {
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    this.cv.width = Math.floor(window.innerWidth * dpr);
    this.cv.height = Math.floor(window.innerHeight * dpr);
    this.cv.style.width = window.innerWidth + 'px';
    this.cv.style.height = window.innerHeight + 'px';
    this.dpr = dpr;
    this.zoom = window.innerWidth < 760 ? 1.25 : window.innerWidth < 1200 ? 1.45 : 1.6;
  }

  _bindInput() {
    addEventListener('keydown', (e) => {
      if (document.activeElement && /INPUT|TEXTAREA/.test(document.activeElement.tagName)) return;
      this.keys.add(e.key.toLowerCase());
      if (['arrowup','arrowdown','arrowleft','arrowright',' '].includes(e.key.toLowerCase())) e.preventDefault();
    });
    addEventListener('keyup', (e) => this.keys.delete(e.key.toLowerCase()));
    addEventListener('blur', () => this.keys.clear());

    this.cv.addEventListener('pointerdown', (e) => {
      if (this.locked) return;
      const p = this.screenToTile(e.clientX, e.clientY);
      this.target = p;
    });

    // virtual joystick for touch devices
    this.touch = { x: 0, y: 0 };
    const stick = document.getElementById('stick');
    if (stick && matchMedia('(pointer: coarse)').matches) {
      document.body.classList.add('is-touch');
      document.getElementById('touch').classList.remove('hidden');
      let active = false, cx = 0, cy = 0;
      const knob = stick.querySelector('i');
      const start = (e) => {
        active = true; const r = stick.getBoundingClientRect();
        cx = r.left + r.width / 2; cy = r.top + r.height / 2; move(e);
      };
      const move = (e) => {
        if (!active) return;
        const t = e.touches ? e.touches[0] : e;
        let dx = (t.clientX - cx) / 46, dy = (t.clientY - cy) / 46;
        const len = Math.hypot(dx, dy);
        if (len > 1) { dx /= len; dy /= len; }
        this.touch.x = dx; this.touch.y = dy;
        knob.style.transform = `translate(${dx * 32}px, ${dy * 32}px)`;
        e.preventDefault();
      };
      const end = () => { active = false; this.touch.x = 0; this.touch.y = 0; knob.style.transform = ''; };
      stick.addEventListener('touchstart', start, { passive: false });
      stick.addEventListener('touchmove', move, { passive: false });
      stick.addEventListener('touchend', end);
      stick.addEventListener('touchcancel', end);
      document.getElementById('touchE').addEventListener('click', () => {
        window.dispatchEvent(new KeyboardEvent('keydown', { key: 'e' }));
      });
    }
  }

  screenToTile(sx, sy) {
    const z = this.zoom * this.dpr;
    const x = (sx * this.dpr - this.cv.width / 2) / (TILE * z) + this.cam.x;
    const y = (sy * this.dpr - this.cv.height / 2) / (TILE * z) + this.cam.y;
    return { x, y };
  }

  setDistrict(districtId, x, y) {
    if (this.districtId === districtId && this.bake) { this.px = x ?? this.px; this.py = y ?? this.py; return; }
    this.districtId = districtId;
    this.layout = buildLayout(districtId);
    this.bake = this.bakeDistrict(this.layout);
    this.px = x ?? MAP_W / 2; this.py = y ?? MAP_H / 2;
    this.cars = this.spawnCars(this.layout);
    this.particles = [];
    this.target = null;
  }

  /* ───────── bake static geometry to offscreen canvases ───────── */
  bakeDistrict(L) {
    const W = L.w * TILE, H = L.h * TILE;
    const base = document.createElement('canvas'); base.width = W; base.height = H;
    const night = document.createElement('canvas'); night.width = W; night.height = H;
    const g = base.getContext('2d'), n = night.getContext('2d');

    // ground
    g.fillStyle = L.palette.ground; g.fillRect(0, 0, W, H);
    // subtle ground texture
    g.globalAlpha = .06;
    for (let i = 0; i < 2600; i++) {
      const x = Math.random() * W, y = Math.random() * H;
      g.fillStyle = Math.random() < .5 ? '#000' : '#fff';
      g.fillRect(x, y, 2, 2);
    }
    g.globalAlpha = 1;

    // roads
    g.fillStyle = L.palette.road;
    for (const r of L.roads) g.fillRect(r.x * TILE, r.y * TILE, r.w * TILE, r.h * TILE);
    // road markings
    g.strokeStyle = 'rgba(255,255,255,.28)'; g.lineWidth = 2; g.setLineDash([10, 12]);
    for (const r of L.roads) {
      if (r.hz) { const y = (r.y + r.h / 2) * TILE; g.beginPath(); g.moveTo(0, y); g.lineTo(W, y); g.stroke(); }
      else { const x = (r.x + r.w / 2) * TILE; g.beginPath(); g.moveTo(x, 0); g.lineTo(x, H); g.stroke(); }
    }
    g.setLineDash([]);
    // potholes — because Nigeria
    g.fillStyle = 'rgba(0,0,0,.35)';
    for (const r of L.roads) {
      const count = L.zone === 'rich' ? 1 : 5;
      for (let i = 0; i < count; i++) {
        const x = (r.x + Math.random() * r.w) * TILE, y = (r.y + Math.random() * r.h) * TILE;
        g.beginPath(); g.ellipse(x, y, 4 + Math.random() * 7, 3 + Math.random() * 5, Math.random() * 3, 0, 7); g.fill();
      }
    }

    // buildings
    for (const b of L.buildings) this.drawBuilding(g, n, b, L);

    // deco
    for (const d of L.deco) this.drawDeco(g, d);

    // street lamps (night layer)
    for (const r of L.roads) {
      if (r.hz) { for (let x = 6; x < L.w; x += 9) this.lamp(n, x * TILE, (r.y + .2) * TILE); }
      else { for (let y = 6; y < L.h; y += 8) this.lamp(n, (r.x + .2) * TILE, y * TILE); }
    }

    return { base, night, W, H };
  }

  lamp(n, x, y) {
    const grad = n.createRadialGradient(x, y, 2, x, y, 62);
    grad.addColorStop(0, 'rgba(255,214,140,.5)');
    grad.addColorStop(1, 'rgba(255,214,140,0)');
    n.fillStyle = grad; n.beginPath(); n.arc(x, y, 62, 0, 7); n.fill();
  }

  drawBuilding(g, n, b, L) {
    const x = b.x * TILE, y = b.y * TILE, w = b.w * TILE, h = b.h * TILE;
    const lift = Math.round(6 * b.height);
    // shadow
    g.fillStyle = 'rgba(0,0,0,.30)';
    g.fillRect(x + 4, y + h - 3, w - 2, 8);
    // walls
    g.fillStyle = b.colour;
    g.fillRect(x, y - lift, w, h + lift);
    // side shading
    g.fillStyle = 'rgba(0,0,0,.14)';
    g.fillRect(x + w - 7, y - lift, 7, h + lift);
    // roof
    g.fillStyle = b.roof;
    g.fillRect(x - 1, y - lift - 5, w + 2, 8);
    if (b.zinc) { // corrugated zinc roof lines
      g.strokeStyle = 'rgba(255,255,255,.18)'; g.lineWidth = 1;
      for (let i = 0; i < w; i += 4) { g.beginPath(); g.moveTo(x + i, y - lift - 5); g.lineTo(x + i, y - lift + 3); g.stroke(); }
    }
    // windows
    const cols = Math.max(1, Math.floor(w / 13)), rows = Math.max(1, Math.floor((h + lift) / 15));
    for (let cx = 0; cx < cols; cx++) {
      for (let cy = 0; cy < rows; cy++) {
        const wx = x + 5 + cx * 13, wy = y - lift + 7 + cy * 15;
        if (wx + 8 > x + w - 2 || wy + 9 > y + h - 2) continue;
        const lit = Math.random() < (L.zone === 'rich' ? .5 : .34);
        g.fillStyle = lit ? 'rgba(60,90,110,.75)' : 'rgba(30,45,55,.7)';
        g.fillRect(wx, wy, 8, 9);
        if (lit) { n.fillStyle = 'rgba(255,206,120,.55)'; n.fillRect(wx, wy, 8, 9); }
      }
    }
    // AC unit
    if (b.ac) { g.fillStyle = '#cfd8dd'; g.fillRect(x + w - 15, y - lift + 12, 9, 7); g.fillStyle = '#9aa7ae'; g.fillRect(x + w - 14, y - lift + 14, 7, 4); }
    // DStv dish
    if (b.dish) { g.fillStyle = '#e6edf2'; g.beginPath(); g.arc(x + 8, y - lift - 9, 5, Math.PI * .15, Math.PI * .85); g.fill(); }
    // fence
    if (b.fence) {
      g.strokeStyle = 'rgba(0,0,0,.25)'; g.lineWidth = 1.5;
      g.strokeRect(x - 1.5, y - lift - 1, w + 3, h + lift + 4);
    }
    // venue sign
    if (b.isVenue) {
      g.fillStyle = 'rgba(8,12,16,.82)';
      g.fillRect(x - 2, y - lift - 26, w + 4, 20);
      g.strokeStyle = 'rgba(0,195,137,.65)'; g.lineWidth = 1.5;
      g.strokeRect(x - 2, y - lift - 26, w + 4, 20);
      g.font = '11px "Segoe UI",system-ui,sans-serif';
      g.fillStyle = '#dfeaf2';
      g.textAlign = 'center';
      const label = b.name.length > 16 ? b.name.slice(0, 15) + '…' : b.name;
      g.fillText(label, x + w / 2, y - lift - 12);
      // glowing marker on night layer
      const cx = x + w / 2, cy = y - lift - 26;
      const grad = n.createRadialGradient(cx, cy, 1, cx, cy, 30);
      grad.addColorStop(0, 'rgba(0,220,150,.5)'); grad.addColorStop(1, 'rgba(0,220,150,0)');
      n.fillStyle = grad; n.beginPath(); n.arc(cx, cy, 30, 0, 7); n.fill();
    }
  }

  drawDeco(g, d) {
    const x = d.x * TILE + TILE / 2, y = d.y * TILE + TILE / 2;
    if (d.kind === 'palm') {
      g.strokeStyle = '#7a5a35'; g.lineWidth = 3;
      g.beginPath(); g.moveTo(x, y + 8); g.quadraticCurveTo(x + 2, y - 6, x + 3, y - 16); g.stroke();
      g.fillStyle = '#2f8f52';
      for (let a = 0; a < 6; a++) {
        const ang = (a / 6) * Math.PI * 2;
        g.beginPath(); g.ellipse(x + 3 + Math.cos(ang) * 8, y - 16 + Math.sin(ang) * 4, 9, 3.4, ang * .5, 0, 7); g.fill();
      }
    } else if (d.kind === 'tree') {
      g.fillStyle = '#7a5a35'; g.fillRect(x - 2, y - 2, 4, 10);
      g.fillStyle = '#2c7a46'; g.beginPath(); g.arc(x, y - 8, 9, 0, 7); g.fill();
      g.fillStyle = '#37925a'; g.beginPath(); g.arc(x - 3, y - 11, 6, 0, 7); g.fill();
    } else if (d.kind === 'yard') {
      g.fillStyle = 'rgba(120,100,60,.35)';
      g.fillRect(d.x * TILE, d.y * TILE, d.w * TILE, d.h * TILE);
      g.strokeStyle = 'rgba(0,0,0,.2)'; g.strokeRect(d.x * TILE, d.y * TILE, d.w * TILE, d.h * TILE);
    } else if (d.kind === 'borehole') {
      g.fillStyle = '#5a6b74'; g.fillRect(x - 4, y - 6, 8, 8);
      g.fillStyle = '#3d8fb5'; g.fillRect(x - 3, y - 4, 6, 3);
    } else if (d.kind === 'sign') {
      g.fillStyle = 'rgba(255,255,255,.10)'; g.fillRect(x - 5, y - 6, 10, 12);
    }
  }

  spawnCars(L) {
    const types = ['danfo','keke','okada','car','car','truck','bus'];
    const cars = [];
    for (let i = 0; i < 16; i++) {
      const lane = L.lanes[Math.floor(Math.random() * L.lanes.length)];
      cars.push({
        type: types[Math.floor(Math.random() * types.length)],
        lane, t: Math.random(), speed: 0.02 + Math.random() * 0.035,
        colour: SHIRTS[Math.floor(Math.random() * SHIRTS.length)],
      });
    }
    return cars;
  }

  /* ───────── collision ───────── */
  solid(tx, ty) {
    const L = this.layout; if (!L) return false;
    if (tx < 0 || ty < 0 || tx >= L.w || ty >= L.h) return true;
    return L.solid[(ty | 0) * L.w + (tx | 0)] === 1;
  }
  free(x, y, r = 0.32) {
    return !this.solid(x - r, y - r) && !this.solid(x + r, y - r) && !this.solid(x - r, y + r) && !this.solid(x + r, y + r);
  }

  /* ───────── update ───────── */
  update(dt, state) {
    if (!this.layout) return;
    this.t += dt;
    const speed = 4.6 * (dt / 1000);   // tiles per second
    let dx = 0, dy = 0;
    const k = this.keys;
    if (this.touch && (this.touch.x || this.touch.y)) { dx = this.touch.x; dy = this.touch.y; }
    if (!this.locked) {
      if (k.has('a') || k.has('arrowleft')) dx -= 1;
      if (k.has('d') || k.has('arrowright')) dx += 1;
      if (k.has('w') || k.has('arrowup')) dy -= 1;
      if (k.has('s') || k.has('arrowdown')) dy += 1;
    }
    if ((dx || dy) && this.target) this.target = null;

    if (!dx && !dy && this.target) {
      const tx = this.target.x - this.px, ty = this.target.y - this.py;
      const d = Math.hypot(tx, ty);
      if (d < 0.35) this.target = null;
      else { dx = tx / d; dy = ty / d; }
    }

    this.moving = !!(dx || dy);
    if (this.moving) {
      const len = Math.hypot(dx, dy) || 1;
      dx /= len; dy /= len;
      const nx = this.px + dx * speed, ny = this.py + dy * speed;
      if (this.free(nx, this.py)) this.px = nx; else if (this.target) this.target = null;
      if (this.free(this.px, ny)) this.py = ny; else if (this.target) this.target = null;
      if (Math.abs(dy) > Math.abs(dx)) this.dir = dy > 0 ? 2 : 0;
      else this.dir = dx > 0 ? 1 : 3;
      this.walkPhase += dt / 130;
    }

    // camera
    const tx = this.px, ty = this.py;
    this.cam.x += (tx - this.cam.x) * Math.min(1, dt / 110);
    this.cam.y += (ty - this.cam.y) * Math.min(1, dt / 110);

    if (this.moving) net.move(this.px, this.py, this.dir, true, this.districtId);
    else if (this.wasMoving) net.move(this.px, this.py, this.dir, false, this.districtId);
    this.wasMoving = this.moving;

    // nearest venue / npc
    this.updateNearest(state);

    // cars
    for (const c of this.cars) c.t += c.speed * (dt / 1000);

    // weather particles
    this.updateWeather(dt, state);
  }

  updateNearest(state) {
    let best = null, bestD = 3.4;
    for (const v of this.layout.venues) {
      const d = Math.hypot(v.px - this.px, v.py - this.py);
      if (d < bestD) { bestD = d; best = v; }
    }
    this.nearest = best;
    let bn = null, bd = 1.9;
    for (const n of state.npcs || []) {
      const d = Math.hypot(n.x - this.px, n.y - this.py);
      if (d < bd) { bd = d; bn = n; }
    }
    this.nearNpc = bn;
    if (bn) this.onPrompt({ kind: 'npc', npc: bn });
    else if (best) this.onPrompt({ kind: 'venue', venue: best });
    else this.onPrompt(null);
  }

  updateWeather(dt, state) {
    const w = state.world?.weather || 'clear';
    this.weather = w;
    const want = w === 'rain' ? 130 : w === 'harmattan' ? 55 : 0;
    while (this.particles.length < want) {
      this.particles.push({
        x: this.cam.x + (Math.random() - .5) * 46, y: this.cam.y + (Math.random() - .5) * 34,
        v: w === 'rain' ? 26 + Math.random() * 12 : .6 + Math.random(),
        l: w === 'rain' ? 9 + Math.random() * 9 : 2,
        o: Math.random() * 6,
      });
    }
    while (this.particles.length > want) this.particles.pop();
    for (const p of this.particles) {
      if (w === 'rain') { p.y += p.v * (dt / 1000); p.x += 3 * (dt / 1000); }
      else { p.x += Math.cos(p.o + this.t / 1800) * .35 * (dt / 60); p.y += Math.sin(p.o + this.t / 2200) * .22 * (dt / 60); }
      if (p.y > this.cam.y + 20) { p.y = this.cam.y - 20; p.x = this.cam.x + (Math.random() - .5) * 46; }
      if (p.x > this.cam.x + 26) p.x = this.cam.x - 26;
    }
  }

  /* ───────── draw ───────── */
  draw(state) {
    const ctx = this.ctx, cv = this.cv;
    if (!this.layout || !this.bake) return;
    const hour = state.world?.time?.hour ?? 8;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.fillStyle = '#080c10'; ctx.fillRect(0, 0, cv.width, cv.height);

    const z = this.zoom * this.dpr;
    ctx.setTransform(z, 0, 0, z, cv.width / 2 - this.cam.x * TILE * z, cv.height / 2 - this.cam.y * TILE * z);

    // base map
    ctx.drawImage(this.bake.base, 0, 0);

    // night lighting
    const nightAmt = nightAmount(hour);
    if (nightAmt > 0.02) { ctx.globalAlpha = nightAmt; ctx.drawImage(this.bake.night, 0, 0); ctx.globalAlpha = 1; }

    // cars (behind walking entities)
    for (const c of this.cars) this.drawCar(ctx, c);

    // npcs
    for (const n of state.npcs || []) {
      this.drawPerson(ctx, n.x + .5, n.y + .5, n.moving ? 3 : 1, SKIN[hash(n.name) % SKIN.length], SHIRTS[hash(n.name + 's') % SHIRTS.length], n.name, false, n.emoji);
      if (n.say) this.drawBubble(ctx, n.x + .5, n.y + .2, n.say);
    }

    // other players
    for (const p of state.nearby || []) {
      if (p.venueId) continue;
      this.drawPerson(ctx, p.x + .5, p.y + .5, p.moving ? 2 : 0, SKIN[(p.skin || 1) % SKIN.length], SHIRTS[hash(p.name) % SHIRTS.length], p.name, true, p.emoji);
    }

    // me
    const mep = state.me;
    if (mep && !mep.venueId) {
      this.drawPerson(ctx, this.px + .5, this.py + .5, this.moving ? this.walkPhase : 0, SKIN[(mep.skin || 1) % SKIN.length], SHIRTS[hash(mep.name) % SHIRTS.length], mep.name, true, mep.emoji, true);
    }

    // click target marker
    if (this.target) {
      ctx.strokeStyle = 'rgba(0,195,137,.65)'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(this.target.x, this.target.y, .35 + Math.sin(this.t / 200) * .06, 0, 7); ctx.stroke();
    }

    // weather
    this.drawWeather(ctx, state);

    // compass pointing at the nearest place (venues are far apart in a real city)
    this.drawCompass();

    // day tint
    const tint = dayTint(hour);
    if (tint) {
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.fillStyle = tint; ctx.fillRect(0, 0, cv.width, cv.height);
    }
    // vignette handled by CSS
  }

  drawCompass() {
    const ctx = this.ctx, cv = this.cv;
    if (!this.layout || !this.layout.venues.length) return;
    let best = null, bd = 1e9;
    for (const v of this.layout.venues) {
      const d = Math.hypot(v.px - this.px, v.py - this.py);
      if (d < bd) { bd = d; best = v; }
    }
    if (!best || bd < 7) return;                 // close enough — no need to point
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    const cx = cv.width / 2, cy = cv.height / 2;
    const ang = Math.atan2(best.py - this.cam.y, best.px - this.cam.x);
    const R = Math.min(cv.width, cv.height) * 0.34;
    const x = cx + Math.cos(ang) * R, y = cy + Math.sin(ang) * R;
    ctx.globalAlpha = 0.92;
    ctx.fillStyle = 'rgba(8,13,18,.82)';
    ctx.beginPath(); ctx.arc(x, y, 27, 0, 7); ctx.fill();
    ctx.strokeStyle = 'rgba(0,195,137,.75)'; ctx.lineWidth = 2; ctx.stroke();
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.font = '21px system-ui';
    ctx.fillText(best.emoji, x, y - 5);
    ctx.font = '600 10px "Segoe UI",system-ui,sans-serif';
    ctx.fillStyle = '#9fb3c4';
    ctx.fillText(Math.round(bd * 8) + 'm', x, y + 14);
    ctx.restore();
  }

  drawWeather(ctx, state) {
    const w = this.weather;
    if (w === 'harmattan') {
      ctx.fillStyle = 'rgba(214,196,150,.16)';
      ctx.fillRect(this.cam.x - 30, this.cam.y - 24, 60, 48);
    }
    if (!this.particles.length) return;
    if (w === 'rain') {
      ctx.strokeStyle = 'rgba(174,214,241,.55)'; ctx.lineWidth = 1.4;
      for (const p of this.particles) { ctx.beginPath(); ctx.moveTo(p.x * TILE, p.y * TILE); ctx.lineTo(p.x * TILE - 2, p.y * TILE + p.l); ctx.stroke(); }
      ctx.fillStyle = 'rgba(10,18,28,.10)'; ctx.fillRect(this.cam.x - 30, this.cam.y - 24, 60, 48);
    } else if (w === 'harmattan') {
      ctx.fillStyle = 'rgba(226,214,180,.35)';
      for (const p of this.particles) { ctx.beginPath(); ctx.arc(p.x * TILE, p.y * TILE, p.l * .5, 0, 7); ctx.fill(); }
    } else if (w === 'heat') {
      ctx.fillStyle = 'rgba(255,180,80,.07)'; ctx.fillRect(this.cam.x - 30, this.cam.y - 24, 60, 48);
    }
  }

  drawCar(ctx, c) {
    let x, y, ang;
    const L = this.layout;
    if (c.lane.hz) { x = c.lane.x0 + (c.lane.x1 - c.lane.x0) * (c.t % 1); y = c.lane.y; ang = c.lane.dir > 0 ? 0 : Math.PI; }
    else { x = c.lane.x; y = c.lane.y0 + (c.lane.y1 - c.lane.y0) * (c.t % 1); ang = c.lane.dir > 0 ? Math.PI / 2 : -Math.PI / 2; }
    ctx.save();
    ctx.translate(x * TILE, y * TILE);
    ctx.rotate(ang);
    const w = c.type === 'truck' ? 30 : c.type === 'danfo' || c.type === 'bus' ? 26 : c.type === 'keke' ? 16 : c.type === 'okada' ? 12 : 20;
    const h = c.type === 'truck' ? 13 : c.type === 'danfo' || c.type === 'bus' ? 12 : c.type === 'keke' ? 11 : c.type === 'okada' ? 7 : 10;
    ctx.fillStyle = 'rgba(0,0,0,.28)';
    ctx.fillRect(-w / 2 + 2, -h / 2 + 3, w, h);
    if (c.type === 'danfo') { ctx.fillStyle = '#f5c518'; ctx.fillRect(-w / 2, -h / 2, w, h); ctx.fillStyle = '#1c2733'; ctx.fillRect(-w / 2, -h / 2 + 2, w, 3); ctx.fillRect(-w / 2, h / 2 - 4, w, 2); }
    else if (c.type === 'keke') { ctx.fillStyle = '#f5c518'; ctx.fillRect(-w / 2, -h / 2, w, h); ctx.fillStyle = '#1c2733'; ctx.fillRect(w / 2 - 5, -h / 2, 5, h); }
    else if (c.type === 'okada') { ctx.fillStyle = '#c0392b'; ctx.fillRect(-w / 2, -h / 2, w, h); ctx.fillStyle = '#2c3e50'; ctx.fillRect(-2, -h / 2 - 3, 6, 4); }
    else { ctx.fillStyle = c.colour; ctx.fillRect(-w / 2, -h / 2, w, h); ctx.fillStyle = 'rgba(255,255,255,.22)'; ctx.fillRect(-w / 2 + 3, -h / 2 + 1, w - 6, 3); }
    // headlights at night
    const hour = (window.__naijaHour ?? 12);
    if (hour >= 19 || hour < 6) {
      ctx.fillStyle = 'rgba(255,240,190,.5)';
      ctx.beginPath(); ctx.arc(w / 2, 0, 5, 0, 7); ctx.fill();
    }
    ctx.restore();
  }

  drawPerson(ctx, tx, ty, phase, skin, shirt, name, showName, emoji, isMe) {
    const x = tx * TILE, y = ty * TILE;
    const bob = phase ? Math.sin(phase) * 1.4 : 0;
    ctx.save();
    // shadow
    ctx.fillStyle = 'rgba(0,0,0,.32)';
    ctx.beginPath(); ctx.ellipse(x, y + 3, 8, 3.4, 0, 0, 7); ctx.fill();
    // legs
    ctx.fillStyle = '#26313d';
    const step = phase ? Math.sin(phase) * 3 : 0;
    ctx.fillRect(x - 4.5 + step * .4, y - 9, 3.6, 10 + bob * .2);
    ctx.fillRect(x + 1 - step * .4, y - 9, 3.6, 10 + bob * .2);
    // body
    ctx.fillStyle = shirt;
    roundRect(ctx, x - 6, y - 21 + bob, 12, 13, 3); ctx.fill();
    // arms
    ctx.fillStyle = skin;
    ctx.fillRect(x - 8, y - 20 + bob, 2.6, 8 - step * .3);
    ctx.fillRect(x + 5.4, y - 20 + bob, 2.6, 8 + step * .3);
    // head
    ctx.fillStyle = skin;
    ctx.beginPath(); ctx.arc(x, y - 24 + bob, 5.6, 0, 7); ctx.fill();
    // hair
    ctx.fillStyle = '#241a12';
    ctx.beginPath(); ctx.arc(x, y - 25.5 + bob, 5.4, Math.PI, Math.PI * 2); ctx.fill();
    // face detail
    ctx.fillStyle = 'rgba(0,0,0,.55)';
    ctx.fillRect(x - 2.4, y - 25 + bob, 1.5, 1.6);
    ctx.fillRect(x + 1, y - 25 + bob, 1.5, 1.6);
    ctx.restore();

    if (showName) {
      ctx.save();
      ctx.font = (isMe ? '700 ' : '') + '10px "Segoe UI",system-ui,sans-serif';
      ctx.textAlign = 'center';
      const w = ctx.measureText(name || '').width + 12;
      ctx.fillStyle = isMe ? 'rgba(0,195,137,.92)' : 'rgba(10,14,18,.72)';
      roundRect(ctx, x - w / 2, y - 44 + bob, w, 14, 7); ctx.fill();
      ctx.fillStyle = '#eaf3f9';
      ctx.fillText(name || '', x, y - 34 + bob);
      if (isMe) {
        ctx.font = '9px "Segoe UI",system-ui,sans-serif';
        ctx.fillStyle = 'rgba(0,0,0,.6)';
      }
      ctx.restore();
    }
  }

  drawBubble(ctx, tx, ty, text) {
    const x = tx * TILE, y = ty * TILE;
    ctx.save();
    ctx.font = '9.5px "Segoe UI",system-ui,sans-serif';
    const maxW = 120;
    const words = String(text).split(' ');
    const lines = []; let line = '';
    for (const wd of words) {
      const t = line ? line + ' ' + wd : wd;
      if (ctx.measureText(t).width > maxW - 12) { lines.push(line); line = wd; } else line = t;
    }
    if (line) lines.push(line);
    const bw = Math.min(maxW, Math.max(...lines.map(l => ctx.measureText(l).width)) + 14);
    const bh = lines.length * 12 + 9;
    ctx.fillStyle = 'rgba(250,250,252,.95)';
    roundRect(ctx, x - bw / 2, y - bh - 22, bw, bh, 8); ctx.fill();
    ctx.fillStyle = 'rgba(250,250,252,.95)';
    ctx.beginPath(); ctx.moveTo(x - 4, y - 22); ctx.lineTo(x + 4, y - 22); ctx.lineTo(x, y - 15); ctx.fill();
    ctx.fillStyle = '#16202a';
    ctx.textAlign = 'center';
    lines.forEach((l, i) => ctx.fillText(l, x, y - bh - 12 + i * 12));
    ctx.restore();
  }
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}
function hash(s) { let h = 0; for (const c of String(s)) h = (h * 33 + c.charCodeAt(0)) >>> 0; return h; }
function nightAmount(hour) {
  if (hour >= 20 || hour < 5) return .82;
  if (hour >= 19) return .45;
  if (hour >= 18) return .18;
  if (hour < 7) return .55;
  return 0;
}
function dayTint(hour) {
  if (hour >= 6 && hour < 8) return 'rgba(255,150,90,.10)';
  if (hour >= 8 && hour < 16) return null;
  if (hour >= 16 && hour < 18) return 'rgba(255,140,60,.12)';
  if (hour >= 18 && hour < 20) return 'rgba(255,90,50,.16)';
  return 'rgba(20,30,80,.30)';
}
