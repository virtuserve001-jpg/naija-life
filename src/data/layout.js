/**
 * NAIJA LIFE — PROCEDURAL STREET LAYOUT
 * Same seed → same streets, every time, on server and client.
 */
import { DISTRICTS, DISTRICT_BY_ID, VENUE_BY_ID } from './cities.js';

export const TILE = 26;
export const MAP_W = 64;
export const MAP_H = 48;

const CELL_W = 12;   // 10 buildable + 2 road
const CELL_H = 11;   // 9 buildable + 2 road
const LOT_W = 4, LOT_H = 3;
const ROAD_W = 2, ROAD_H = 2;

const PALETTES = {
  lagos:      { wall:['#f2e6cf','#e8d5b5','#efe3cd','#dfc9a6'], roof:['#b4453c','#8c5a3c','#3f6e7a','#6b7f5e'], road:'#3a3f47', ground:'#c9c39d' },
  abuja:      { wall:['#f6f2e8','#e9e4d6','#fbf7ee','#ded8c8'], roof:['#7a8f6a','#4f6b53','#9c5b4a','#596d80'], road:'#3d424a', ground:'#cfcfa8' },
  ph:         { wall:['#eee4d3','#e0d3bd','#f0e7d6','#d6c6ab'], roof:['#4a6b7a','#7c5a44','#5c7a5a','#8a5b4f'], road:'#39404a', ground:'#b9c39a' },
  ibadan:     { wall:['#e8dcc4','#dccbaf','#eee2cd','#cdb896'], roof:['#8a4a3a','#6b5439','#4d6b6b','#7a6a48'], road:'#3b3f45', ground:'#c2bb92' },
  kano:       { wall:['#e3cfa5','#d6bd8e','#ecd9b0','#c9ae7c'], roof:['#9c6b3f','#7a5a35','#8f7a4a','#5f6f52'], road:'#4a4238', ground:'#d8c79b' },
  enugu:      { wall:['#ece2cf','#dfd1b8','#f2e8d6','#cfbf9f'], roof:['#6b5b8a','#4f6b7a','#7a5a44','#5c7a5a'], road:'#3c4149', ground:'#c4c096' },
  benin:      { wall:['#eadfc9','#dccfb2','#efe5d1','#cbbd9b'], roof:['#7a4f3c','#5f6b4a','#4d6b6b','#8a6b4a'], road:'#3b3f45', ground:'#c1bd94' },
  onitsha:    { wall:['#e9dfcb','#dbcfb5','#f0e7d6','#c9bda0'], roof:['#8a5a44','#4f6b7a','#6b7a4a','#7a4f5c'], road:'#3a3f47', ground:'#c3bf96' },
  jos:        { wall:['#f0e9da','#e2dac7','#f5efe2','#d2c9b2'], roof:['#5f7a5a','#4f6b7a','#7a6a4a','#6b5b8a'], road:'#3f444c', ground:'#cbc79e' },
  calabar:    { wall:['#f2ece0','#e5dfd0','#f7f2e8','#d8d1bf'], roof:['#4f6b7a','#6b7a4a','#7a5a44','#5f5f8a'], road:'#3d424a', ground:'#cac69d' },
  kaduna:     { wall:['#e6d6b4','#d8c79e','#ecdcb8','#c8b48b'], roof:['#8f6b3f','#6b5439','#7a6a48','#5f6f52'], road:'#453d33', ground:'#d5c496' },
  maiduguri:  { wall:['#e8d7b2','#dac79b','#edddb9','#c9b58d'], roof:['#9c7a4a','#7a5f35','#8f7a4a','#6b7a52'], road:'#4a4238', ground:'#dac99c' },
};

const ZONE_TWEAK = {
  rich:       { wallShift: 1, roofIx: [0,1], trees: 0.10, vacant: 0.30, fence: 0.35 },
  mid:        { wallShift: 0, roofIx: [0,1,2,3], trees: 0.06, vacant: 0.18, fence: 0.20 },
  poor:       { wallShift: -1, roofIx: [1,2], trees: 0.03, vacant: 0.10, fence: 0.10 },
  industrial: { wallShift: -1, roofIx: [2,3], trees: 0.02, vacant: 0.35, fence: 0.45 },
  campus:     { wallShift: 1, roofIx: [0,3], trees: 0.16, vacant: 0.35, fence: 0.10 },
};

function makeRng(seed) {
  let s = (seed >>> 0) || 1;
  return () => {
    s ^= s << 13; s >>>= 0; s ^= s >>> 17; s ^= s << 5; s >>>= 0;
    return s / 4294967296;
  };
}

const cache = new Map();

export function buildLayout(districtId) {
  if (cache.has(districtId)) return cache.get(districtId);
  const d = DISTRICT_BY_ID[districtId];
  if (!d) return null;
  const seed = d.seed;
  const rnd = makeRng(seed);
  const pal = PALETTES[d.cityId] || PALETTES.lagos;
  const zt = ZONE_TWEAK[d.zone] || ZONE_TWEAK.mid;

  const solid = new Uint8Array(MAP_W * MAP_H);
  const buildings = [];
  const roads = [];
  const deco = [];
  const lots = [];

  /* ── roads ── */
  const roadCols = [], roadRows = [];
  for (let x = 0; x < MAP_W; x += CELL_W) { if (x + CELL_W - ROAD_W < MAP_W) roadCols.push(x + CELL_W - ROAD_W); }
  for (let y = 0; y < MAP_H; y += CELL_H) { if (y + CELL_H - ROAD_H < MAP_H) roadRows.push(y + CELL_H - ROAD_H); }
  for (const rx of roadCols) roads.push({ x: rx, y: 0, w: ROAD_W, h: MAP_H, hz: false });
  for (const ry of roadRows) roads.push({ x: 0, y: ry, w: MAP_W, h: ROAD_H, hz: true });

  /* ── blocks & lots ── */
  const colStarts = [...roadCols].map(rx => rx - CELL_W + ROAD_W);
  const rowStarts = [...roadRows].map(ry => ry - CELL_H + ROAD_H);
  for (const bx of colStarts) {
    for (const by of rowStarts) {
      for (let lx = 0; lx < CELL_W - ROAD_W; lx += LOT_W + 1) {
        for (let ly = 0; ly < CELL_H - ROAD_H; ly += LOT_H + 1) {
          if (lx + LOT_W > CELL_W - ROAD_W || ly + LOT_H > CELL_H - ROAD_H) continue;
          lots.push({ x: bx + lx, y: by + ly, w: LOT_W, h: LOT_H });
        }
      }
    }
  }
  // shuffle lots deterministically
  for (let i = lots.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [lots[i], lots[j]] = [lots[j], lots[i]]; }

  /* ── place venues ── */
  const venueList = d.venues.map((v, i) => ({ ...v, id: `${d.cityId}:${d.id}:v${i}` }));
  const venueLots = lots.splice(0, venueList.length);
  const venues = venueList.map((v, i) => {
    const lot = venueLots[i] || lots[0] || { x: 2, y: 2, w: LOT_W, h: LOT_H };
    // venues get a slightly bigger plot (merge with neighbour space)
    const b = {
      ...lot, venueId: v.id, name: v.name, emoji: v.emoji, type: v.type,
      colour: pick(pal.wall, rnd), roof: pick(zt.roofIx.map(ix => pal.roof[ix]), rnd),
      isVenue: true, height: 0.9 + rnd() * 0.6,
    };
    buildings.push(b);
    markSolid(solid, b);
    return { id: v.id, name: v.name, emoji: v.emoji, type: v.type, x: lot.x, y: lot.y, w: lot.w, h: lot.h, px: lot.x + lot.w / 2, py: lot.y + lot.h + 0.9 };
  });

  /* ── ordinary buildings ── */
  for (const lot of lots) {
    if (rnd() < zt.vacant) {
      // vacant plot / compound yard
      if (rnd() < 0.5) deco.push({ kind: 'yard', x: lot.x, y: lot.y, w: lot.w, h: lot.h });
      continue;
    }
    const b = {
      ...lot,
      colour: pick(pal.wall, rnd), roof: pick(pal.roof, rnd),
      isVenue: false, height: 0.6 + rnd() * 0.8,
      fence: rnd() < zt.fence,
      ac: rnd() < (d.zone === 'rich' ? 0.5 : 0.12),      // generator/AC unit
      dish: rnd() < (d.zone === 'poor' ? 0.35 : 0.2),    // DStv dish
      zinc: d.zone === 'poor' && rnd() < 0.5,
    };
    buildings.push(b);
    markSolid(solid, b);
  }

  /* ── trees / palms / street furniture ── */
  for (let x = 0; x < MAP_W; x++) {
    for (let y = 0; y < MAP_H; y++) {
      if (solid[y * MAP_W + x]) continue;
      const onRoad = isRoad(x, y, roadCols, roadRows);
      if (onRoad && rnd() < 0.02) deco.push({ kind: 'sign', x, y });
      else if (!onRoad && rnd() < zt.trees) deco.push({ kind: rnd() < 0.55 ? 'palm' : 'tree', x, y });
      else if (!onRoad && rnd() < 0.012) deco.push({ kind: 'borehole', x, y });
    }
  }

  /* ── road traffic lanes (for NPC cars) ── */
  const lanes = [];
  for (const ry of roadRows) lanes.push({ hz: true, y: ry + 0.4, x0: 0, x1: MAP_W, dir: 1 });
  for (const ry of roadRows) lanes.push({ hz: true, y: ry + 1.4, x0: MAP_W, x1: 0, dir: -1 });
  for (const rx of roadCols) lanes.push({ hz: false, x: rx + 0.4, y0: 0, y1: MAP_H, dir: 1 });
  for (const rx of roadCols) lanes.push({ hz: false, x: rx + 1.4, y0: MAP_H, y1: 0, dir: -1 });

  const layout = { districtId, seed, w: MAP_W, h: MAP_H, tile: TILE, solid, buildings, roads, deco, venues, lanes, palette: pal, zone: d.zone, cityId: d.cityId, name: d.name };
  cache.set(districtId, layout);
  return layout;
}

function markSolid(solid, b) {
  for (let y = b.y; y < b.y + b.h; y++)
    for (let x = b.x; x < b.x + b.w; x++)
      if (x >= 0 && y >= 0 && x < MAP_W && y < MAP_H) solid[y * MAP_W + x] = 1;
}
function isRoad(x, y, roadCols, roadRows) {
  for (const rx of roadCols) if (x >= rx && x < rx + ROAD_W) return true;
  for (const ry of roadRows) if (y >= ry && y < ry + ROAD_H) return true;
  return false;
}
function pick(arr, rnd) { return arr[Math.floor(rnd() * arr.length) % arr.length]; }

/* assign px/py to every venue on the server so teleport/travel knows where to drop you */
export function initVenuePositions() {
  let n = 0;
  for (const d of DISTRICTS) {
    const L = buildLayout(d.cityId + ':' + d.id);
    for (const v of L.venues) {
      const target = VENUE_BY_ID[v.id];
      if (target) { target.px = v.px; target.py = v.py; n++; }
    }
  }
  return n;
}

export function isSolid(layout, tx, ty) {
  if (tx < 0 || ty < 0 || tx >= layout.w || ty >= layout.h) return true;
  return layout.solid[(ty | 0) * layout.w + (tx | 0)] === 1;
}
