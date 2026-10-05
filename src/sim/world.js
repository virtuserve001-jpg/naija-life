import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

/**
 * NAIJA LIFE — WORLD STATE, TIME, WEATHER, NEWS, NPCs
 */
import { DISTRICTS, DISTRICT_BY_ID, CITY_BY_ID, CITIES, distanceKm } from '../data/cities.js';
import { EVENTS, NPC_TYPES, NAMES, AMBIENT, RADIO_LINES, ILLNESS_BY_ID, CAREER_BY_ID } from '../data/content.js';
import { TIME, MACRO, NEEDS, SLEEP_RECOVERY_PER_HOUR, STARVE_DAMAGE, TUNING, chance, pick, rand, clamp } from '../config.js';
import { need, damage, log, earn, spend, addSkill, addItem, recalc, monthlyRent, monthlyIncome } from './player.js';

// Where the world is persisted. Hosts with an ephemeral filesystem (Render, Railway,
// Heroku) wipe the disk on redeploy — mount a volume and point NAIJA_DATA_DIR at it
// to keep your citizens alive across deploys.
/* Pick the first directory we can actually write to. Containers sometimes mount
   a read-only or missing volume — falling back beats silently losing the world. */
function pickDataDir() {
  const candidates = [];
  if (process.env.NAIJA_DATA_DIR) candidates.push(path.resolve(process.env.NAIJA_DATA_DIR));
  candidates.push(path.join(path.dirname(fileURLToPath(import.meta.url)), '..', '..', 'data'));
  candidates.push(path.join(os.tmpdir(), 'naija-life'));
  for (const dir of candidates) {
    try {
      fs.mkdirSync(dir, { recursive: true });
      const probe = path.join(dir, '.write-test');
      fs.writeFileSync(probe, 'ok');
      fs.unlinkSync(probe);
      return dir;
    } catch (e) { /* try the next candidate */ }
  }
  return candidates[candidates.length - 1];
}
export const DATA_DIR = pickDataDir();
const SAVE_PATH = path.join(DATA_DIR, 'world.json');

export const world = {
  version: 1,
  tick: 0,
  gameMinutes: 7 * 60,       // start at 07:00
  monthIndex: 1,
  weather: 'clear',
  weatherUntil: 0,
  macro: {
    fuelPrice: MACRO.fuelPrice,
    usdNaira: MACRO.usdNaira,
    inflation: MACRO.inflation,
    travelDanger: 0.10,
    blackoutRisk: 0.22,
    foodPriceMult: 1,
    okadaBan: false,
    closings: [],        // venue types shut (strikes, protests)
    election: null,      // {month, type, candidates:[]}
  },
  news: [],
  posts: [],
  listings: [],
  chat: [],              // global/public log (short)
  npcsByDistrict: {},
  online: {},            // id -> true
  stats: { visits: 0, peakOnline: 0 },
  lastEventTick: 0,
};

export const players = new Map();     // id -> player
export const byUsername = new Map();

/* ───────────────────────── time ───────────────────────── */
export const clock = () => {
  const t = world.gameMinutes;
  return {
    hour: Math.floor(t / 60) % 24,
    day: Math.floor(t / 1440) + 1,
    month: world.monthIndex,
    minute: Math.floor(t) % 60,
    total: t,
  };
};
export const isNight = () => { const h = clock().hour; return h >= 19 || h < 6; };
export const timeString = () => {
  const c = clock();
  const ampm = c.hour >= 12 ? 'PM' : 'AM';
  const h = ((c.hour + 11) % 12) + 1;
  return `${h}:${String(c.minute).padStart(2,'0')} ${ampm}`;
};

/* ───────────────────────── news & events ───────────────────────── */
export function addNews(emoji, text, tag = 'general') {
  world.news.unshift({ t: Date.now(), emoji, text, tag, gameMin: world.gameMinutes });
  if (world.news.length > 30) world.news.length = 30;
}
function fireEvent() {
  const pool = [];
  for (const e of EVENTS) for (let i = 0; i < (e.weight || 1); i++) pool.push(e);
  const ev = pick(pool);
  const m = world.macro;
  if (ev.effects.fuel) m.fuelPrice = Math.max(700, Math.round(m.fuelPrice * (1 + ev.effects.fuel)));
  if (ev.effects.inflation) m.inflation = clamp(m.inflation + ev.effects.inflation, 0.02, 0.6);
  if (ev.effects.travelDanger) m.travelDanger = clamp(m.travelDanger + ev.effects.travelDanger, 0.02, 0.85);
  if (ev.effects.blackout) m.blackoutRisk = clamp(m.blackoutRisk + ev.effects.blackout, 0.05, 0.95);
  if (ev.effects.foodPrice) m.foodPriceMult = clamp(m.foodPriceMult * (1 + ev.effects.foodPrice), 0.7, 3);
  if (ev.effects.closes) m.closings = ev.effects.closes;
  if (ev.effects.weather) { world.weather = ev.effects.weather; world.weatherUntil = world.gameMinutes + rand(240, 900); }
  if (ev.effects.electionSoon) scheduleElection();
  if (ev.effects.okadaBan) m.okadaBan = !m.okadaBan;

  const text = ev.headline
    .replace('{fuel}', m.fuelPrice.toLocaleString('en-NG'))
    .replace('{usd}', m.usdNaira.toLocaleString('en-NG'))
    .replace('{rice}', Math.round(88_000 * m.foodPriceMult).toLocaleString('en-NG'));
  addNews(ev.emoji, text, ev.tag);
  if (ev.effects.mood) for (const p of players.values()) need(p, 'fun', ev.effects.mood * 0.5);
  return text;
}
function scheduleElection() {
  const types = ['Councillorship','LGA Chairmanship','Governorship','Presidential'];
  world.macro.election = { month: world.monthIndex + 2, type: pick(types) };
  addNews('🗳️', `Election scheduled: ${world.macro.election.type} — two months away. Time to pick a side.`, 'politics');
}

/* ───────────────────────── NPCs ───────────────────────── */
function makeNpcs(districtId) {
  const d = DISTRICT_BY_ID[districtId];
  if (!d) return [];
  let seed = d.seed;
  const rnd = () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; };
  const n = 10 + Math.floor(rnd() * 8);
  const npcs = [];
  for (let i = 0; i < n; i++) {
    const type = NPC_TYPES[Math.floor(rnd() * NPC_TYPES.length)];
    const pool = NAMES[['yoruba','igbo','hausa','others'][Math.floor(rnd() * 4)]];
    const first = pool[Math.floor(rnd() * pool.length)];
    const sur = NAMES.surnames[Math.floor(rnd() * NAMES.surnames.length)];
    npcs.push({
      id: `n${districtId.replace(/:/g,'')}_${i}`,
      name: `${first} ${sur}`,
      type: type.id, emoji: type.emoji, kindName: type.name,
      districtId,
      x: Math.floor(rnd() * 60) + 2, y: Math.floor(rnd() * 44) + 2,
      tx: 0, ty: 0, moving: false, speed: 0.035 + rnd() * 0.03,
      lines: type.lines, nextLine: world.tick + Math.floor(rnd() * 60),
    });
  }
  // a couple of venues get their own resident NPC standing outside
  return npcs;
}
export function npcsIn(districtId) {
  if (!world.npcsByDistrict[districtId]) world.npcsByDistrict[districtId] = makeNpcs(districtId);
  return world.npcsByDistrict[districtId];
}
function tickNpcs(activeDistricts) {
  for (const dId of activeDistricts) {
    for (const n of npcsIn(dId)) {
      if (!n.moving) {
        if (chance(0.035)) {
          n.tx = clamp(n.x + rand(-14, 14), 2, 62);
          n.ty = clamp(n.y + rand(-12, 12), 2, 46);
          n.moving = true;
        }
      } else {
        const dx = n.tx - n.x, dy = n.ty - n.y;
        const dist = Math.hypot(dx, dy);
        if (dist < 0.5) { n.moving = false; }
        else { n.x += (dx / dist) * n.speed * 4; n.y += (dy / dist) * n.speed * 4; }
      }
      if (world.tick >= n.nextLine) {
        n.nextLine = world.tick + rand(TUNING.npcChatEveryTicks[0], TUNING.npcChatEveryTicks[1]) | 0;
        n.say = pick(n.lines);
        n.sayAt = world.tick;
      }
    }
  }
}

/* ───────────────────────── travel maths ───────────────────────── */
export function intercityTrip(fromCityId, toCityId, mode = 'bus') {
  const a = CITY_BY_ID[fromCityId], b = CITY_BY_ID[toCityId];
  if (!a || !b) return null;
  const km = distanceKm(a, b);
  const defs = {
    bus:   { rate: 42,  speed: 62,  name: 'Luxury bus', emoji: '🚌', comfort: 0.5 },
    flight:{ rate: 165, speed: 480, name: 'Flight',     emoji: '✈️', comfort: 1.0 },
    road:  { rate: 58,  speed: 55,  name: 'Chartered car', emoji: '🚗', comfort: 0.85 },
  };
  const d = defs[mode] || defs.bus;
  const hours = Math.max(0.4, km / d.speed) * (1 + (mode === 'flight' ? 0.6 : (Math.max(a.traffic, b.traffic) * 0.7)));
  const fare = Math.round((km * d.rate + (mode === 'flight' ? 18_000 : 1_200)) * (1 + world.macro.fuelPrice / 6000));
  return { km, hours: Math.round(hours * 10) / 10, fare, mode, ...d };
}

/* ───────────────────────── the tick ───────────────────────── */
export function tickWorld() {
  world.tick++;
  const mins = TIME.minPerTick;
  world.gameMinutes += mins;

  // month rollover
  const newMonthIndex = Math.floor(world.gameMinutes / (TIME.hoursPerMonth * 60)) + 1;
  if (newMonthIndex !== world.monthIndex) {
    const monthsPassed = newMonthIndex - world.monthIndex;
    world.monthIndex = newMonthIndex;
    for (let i = 0; i < monthsPassed; i++) monthEnd();
  }

  // weather
  if (world.gameMinutes > world.weatherUntil && chance(0.01)) {
    const roll = Math.random();
    world.weather = roll < 0.55 ? 'clear' : roll < 0.78 ? 'rain' : roll < 0.9 ? 'harmattan' : 'heat';
    world.weatherUntil = world.gameMinutes + rand(200, 800);
  }

  // macro random walk
  if (chance(0.02)) world.macro.fuelPrice = clamp(world.macro.fuelPrice * (1 + rand(-0.02, 0.025)), 800, 3_000);
  if (chance(0.01)) world.macro.usdNaira = clamp(world.macro.usdNaira * (1 + rand(-0.012, 0.018)), 900, 3_000);
  world.macro.travelDanger = clamp(world.macro.travelDanger * 0.998, 0.05, 0.9);
  world.macro.blackoutRisk = clamp(world.macro.blackoutRisk * 0.999, 0.08, 0.95);

  // national events
  if (world.tick - world.lastEventTick > 95 && chance(0.35)) {
    world.lastEventTick = world.tick;
    fireEvent();
  }

  // per-player simulation
  const hours = mins / 60;
  const activeDistricts = new Set();
  for (const p of players.values()) {
    if (!p.online) continue;
    activeDistricts.add(p.districtId);
    tickPlayer(p, hours);
  }
  tickNpcs(activeDistricts);

  return { time: clock(), weather: world.weather };
}

function tickPlayer(p, hours) {
  // ── needs
  if (p.sleeping) {
    need(p, 'energy', SLEEP_RECOVERY_PER_HOUR * hours);
    need(p, 'hunger', NEEDS.hunger.drainPerHour * hours * 0.4);
    if (p.needs.energy >= 99) { p.sleeping = false; log(p, '😴', 'You wake up. Another day in Naija.', 'info'); }
  } else {
    need(p, 'energy', -NEEDS.energy.drainPerHour * hours * (isNight() ? 1.4 : 1));
    need(p, 'hunger', -NEEDS.hunger.drainPerHour * hours);
    need(p, 'hygiene', -NEEDS.hygiene.drainPerHour * hours);
    need(p, 'fun', -NEEDS.fun.drainPerHour * hours);
    p.hoursAwake += hours;
  }

  // ── starvation / exhaustion damage
  for (const [k, dmg] of Object.entries(STARVE_DAMAGE)) {
    if (p.needs[k] <= (NEEDS[k]?.low || 15)) damage(p, k, dmg * hours);
  }
  if (p.needs.hunger > 55 && p.needs.hygiene > 55 && p.needs.energy > 40) need(p, 'health', 0.25 * hours);

  // ── illnesses
  for (const ill of p.health.illnesses) {
    const def = ILLNESS_BY_ID[ill.id]; if (!def) continue;
    need(p, 'health', -def.healthDrain * hours * 0.25);
    ill.left -= hours;
  }
  p.health.illnesses = p.health.illnesses.filter(i => i.left > 0);
  if (p.needs.health <= 0) collapse(p);

  // ── electricity + generator at home
  if (p.venueId || true) {
    if (chance(0.004 * (1 + world.macro.blackoutRisk * 6))) {
      p.util.blackout = true; p.util.blackoutLeft = rand(2, 9);
      log(p, '💡', 'NEPA has taken the light. “Up NEPA!” somebody shouts outside.', 'bad');
    } else if (p.util.blackout) {
      p.util.blackoutLeft -= hours;
      if (p.util.blackoutLeft <= 0) { p.util.blackout = false; log(p, '💡', 'Light is back. Somebody’s generator switches off.', 'good'); }
    }
    if (p.util.blackout && p.util.genFuel > 0) {
      p.util.genFuel = Math.max(0, p.util.genFuel - 0.85 * hours);
      if (p.util.genFuel <= 0.05) log(p, '🔌', 'Generator fuel has finished. Silence.', 'bad');
    } else if (!p.util.blackout) {
      p.util.units = Math.max(0, p.util.units - 0.9 * hours);
    }
  }

  // ── active gig
  if (p.gig && world.tick >= p.gig.endsAt) finishGig(p);
  // ── travel
  if (p.travel && world.tick >= p.travel.endsAt) completeTravel(p);

  // ── heat cools down, slowly
  if (p.stats.heat > 0) p.stats.heat = Math.max(0, p.stats.heat - 0.05 * hours);
  if (p.faith.devotion > 0) p.faith.devotion = Math.max(0, p.faith.devotion - 0.03 * hours);
  if (p.stats.clout > 0) p.stats.clout = Math.max(0, p.stats.clout - 0.02 * hours);

  // ── family pressure builds with every month you’re not “settled”
  if (!p.family.spouse && p.edu.level >= 4) {
    p.family.pressure = clamp(p.family.pressure + 0.02 * hours, 0, 100);
  }

  // ── data/airtime trickle
  p.telco.dataMB = Math.max(0, p.telco.dataMB - 0.05 * hours);

  // ── skills from the job (learning on the clock)
  if (p.job && !p.sleeping) {
    const c = CAREER_BY_ID[p.job.careerId];
    if (c) addSkill(p, c.skill, 0.0025);
  }
}

function collapse(p) {
  const bill = 40_000 + Math.round(Math.random() * 90_000);
  p.needs.health = 35;
  p.cash = Math.max(0, p.cash - bill);
  recalc(p);
  log(p, '🚑', `You collapsed. A Good Samaritan rushed you to a private hospital. Bill: ₦${bill.toLocaleString('en-NG')}.`, 'bad');
  need(p, 'energy', -20); need(p, 'hunger', -15);
}

/* ───────────────────────── month end: salaries, rent, bills ───────────────────────── */
function monthEnd() {
  for (const p of players.values()) {
    p.stats.monthsSurvived++;
    let income = 0, outgo = 0, notes = [];

    // income
    const sal = monthlyIncome(p);
    if (sal > 0) {
      const strike = world.macro.closings.includes('uni') && p.job && CITY_BY_ID[p.cityId] && p.job.careerId === 'lecturer';
      if (strike) { notes.push('Salary withheld — strike.'); }
      else { earn(p, sal, 'Salary', true); income += sal; notes.push(`Salary: ₦${sal.toLocaleString('en-NG')}`); }
    }
    if (p.edu.nysc && !p.job) { earn(p, 77_000, 'NYSC allawee', true); income += 77_000; notes.push('NYSC allawee: ₦77,000'); }

    // rent
    if (p.home.type === 'rent' && p.home.rentMonthly > 0) {
      const rent = monthlyRent(p, p.home.districtId);
      if (spend(p, rent, 'Rent', { allowDebt: true })) { outgo += rent; notes.push(`Rent: ₦${rent.toLocaleString('en-NG')}`); }
      else { notes.push('You could not pay rent. Your landlord is not smiling.'); p.family.approval = clamp(p.family.approval - 4, 0, 100); p.needs.fun -= 8; }
      p.home.paidMonths++;
    } else if (p.home.type === 'parents') {
      p.family.approval = clamp(p.family.approval - 2, 0, 100);
      notes.push('You still live with your parents. They have started sighing loudly.');
    }

    // utilities
    const util = 4_000 + 2_500 + (p.util.units > 0 ? 3_500 : 0) + (p.health.hmo ? 14_000 : 0);
    if (spend(p, util, 'Utilities (water, waste, light)', { allowDebt: true })) outgo += util;

    // debts
    for (const d of p.debts) {
      d.amount = Math.round(d.amount * (1 + (d.rate || 0.06)));
      d.monthsLeft--;
      if (d.monthsLeft <= 0 && d.amount > 0) {
        if (spend(p, d.amount, 'Debt repayment', { allowDebt: true })) { outgo += d.amount; notes.push(`Repaid ₦${d.amount.toLocaleString('en-NG')} to ${d.to}.`); }
        else { notes.push(`${d.to} is looking for you.`); p.stats.reputation = clamp(p.stats.reputation - 6, 0, 100); }
      }
    }
    p.debts = p.debts.filter(d => d.monthsLeft > 0 || d.amount > 0);

    // school fees
    if (p.edu.enrolled && p.edu.feesDue > 0) {
      if (spend(p, p.edu.feesDue, 'School fees', { allowDebt: true })) { outgo += p.edu.feesDue; p.edu.feesDue = 0; notes.push('School fees paid.'); }
      else { p.edu.excluded = true; notes.push('You have been sent home for school fees.'); }
    }

    // relationships decay
    p.family.approval = clamp(p.family.approval - 1, 0, 100);

    // elections
    const el = world.macro.election;
    if (el && world.monthIndex >= el.month) { runElection(); }

    recalc(p);
    if (p.online) {
      log(p, '📅', `MONTH ${world.monthIndex} — In: ₦${income.toLocaleString('en-NG')} · Out: ₦${outgo.toLocaleString('en-NG')}. ${notes.slice(0,2).join(' ')}`, 'money');
    }
  }
}

function runElection() {
  const el = world.macro.election;
  const type = el.type;
  const candidates = [];
  for (const p of players.values()) {
    if (p.politics.party && p.politics.campaigning > 0) {
      const votes = Math.round(p.stats.clout * 120 + p.politics.campaigning * 90 + (p.skills.clout || 0) * 260 + Math.random() * 400);
      candidates.push({ name: p.name, party: p.politics.party, votes });
    }
  }
  // NPC parties get the rest of the vote
  const NPC_PARTIES = [
    { name:'Adewale “Oga” Balogun', party:'apc', votes: 400 + Math.floor(Math.random()*900) },
    { name:'Dr. Ngozi Eze', party:'pdp', votes: 350 + Math.floor(Math.random()*900) },
    { name:'Comrade Tunde Adebayo', party:'lp', votes: 300 + Math.floor(Math.random()*900) },
  ];
  candidates.push(...NPC_PARTIES);
  candidates.sort((a, b) => b.votes - a.votes);
  const winner = candidates[0];
  addNews('🗳️', `${type} result: ${winner.name} (${String(winner.party).toUpperCase()}) wins with ${winner.votes.toLocaleString('en-NG')} votes.`, 'politics');
  for (const p of players.values()) {
    if (p.politics.party === winner.party) {
      p.stats.clout = clamp(p.stats.clout + 6, 0, 100);
      addSkill(p, 'clout', 0.4);
      if (p.online) log(p, '🗳️', `Your party won the ${type}. Your star is rising.`, 'good');
    }
    p.politics.campaigning = 0;
  }
  world.macro.election = null;
}

/* ───────────────────────── gigs & travel completion ───────────────────────── */
export function finishGig(p) {
  const g = p.gig; if (!g) return;
  let pay = g.pay;
  // skill multiplier
  if (g.skill) pay *= 1 + (p.skills[g.skill] || 0) * 0.18;
  pay = Math.round(pay);
  earn(p, pay, `Gig: ${g.name}`);
  addSkill(p, g.skill || 'street', 0.35);
  need(p, 'fun', -3);
  log(p, g.emoji, `${g.name} done. ₦${pay.toLocaleString('en-NG')} in hand.`, 'money');
  p.gig = null;
}
export function completeTravel(p) {
  const t = p.travel; if (!t) return;
  p.districtId = t.toDistrict;
  p.cityId = t.toCity;
  p.x = t.x ?? 32; p.y = t.y ?? 32;
  p.venueId = null;
  p.travel = null;
  log(p, t.emoji, `You have arrived in ${t.toName}.`, 'info');
  need(p, 'energy', -t.energy || -3);
}

/* ───────────────────────── persistence ───────────────────────── */
export function saveWorld() {
  try {
    const data = {
      world: { ...world, npcsByDistrict: {}, chat: world.chat.slice(0, 40), posts: world.posts.slice(0, 60) },
      players: [...players.values()],
    };
    fs.mkdirSync(DATA_DIR, { recursive: true });
    fs.writeFileSync(SAVE_PATH, JSON.stringify(data));
    return true;
  } catch (e) { console.error('save failed', e.message); return false; }
}
export function loadWorld() {
  try {
    const raw = fs.readFileSync(SAVE_PATH, 'utf8');
    const data = JSON.parse(raw);
    Object.assign(world, data.world || {});
    world.npcsByDistrict = {};
    for (const p of data.players || []) { p.online = false; players.set(p.id, p); byUsername.set(p.username, p); }
    console.log(`[naija-life] loaded ${players.size} players, month ${world.monthIndex}`);
    return true;
  } catch (e) { console.log('[naija-life] fresh world'); return false; }
}

/* ───────────────────────── ambient flavour ───────────────────────── */
export function ambientFor(cityId) {
  const lines = AMBIENT[cityId] || AMBIENT.default;
  return pick(lines);
}
export function radioLine() { return pick(RADIO_LINES); }
