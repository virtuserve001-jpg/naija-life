/**
 * NAIJA LIFE — THE SIM (player state + all the maths)
 */
import { CITY_BY_ID, DISTRICT_BY_ID } from '../data/cities.js';
import { BACKSTORIES, CAREER_BY_ID, SKILLS, ITEM_BY_ID, TITLES } from '../data/content.js';
import { NEEDS, TIME, HOUSING, clamp, naira, chance, pick } from '../config.js';

export const EDU_LEVELS = ['No formal schooling','Primary School','Secondary (WAEC)','ND / NCE','BSc / HND','MSc','PhD'];
export const SKILL_MAX = 10;

let seq = 1;
export const newId = (p = 'p') => p + Date.now().toString(36) + (seq++).toString(36);

/* ─────────────── create ─────────────── */
export function createPlayer({ username, name, backstoryId, skin = 1 }) {
  const bs = BACKSTORIES.find(b => b.id === backstoryId) || BACKSTORIES[1];
  const city = CITY_BY_ID[bs.city] || CITY_BY_ID.lagos;
  const district = city.districts[Math.floor(city.districts.length / 2)];

  const p = {
    id: newId(),
    username: String(username).toLowerCase(),
    name: name || username,
    pass: null,
    createdAt: Date.now(),
    lastSeen: Date.now(),
    online: true,

    // avatar / position
    skin, emoji: bs.emoji,
    cityId: city.id,
    districtId: `${city.id}:${district.id}`,
    venueId: null,
    x: 32, y: 32, dir: 0,
    backstory: bs.id,

    // money
    cash: bs.cash,
    bank: 0,
    debts: [],
    ledger: [],

    // body
    needs: {
      energy: NEEDS.energy.start, hunger: NEEDS.hunger.start,
      hygiene: NEEDS.hygiene.start, fun: NEEDS.fun.start, health: NEEDS.health.start,
    },
    sleeping: false,
    hoursAwake: 0,

    // self
    stats: { clout: bs.id === 'ijgb' ? 12 : 2, heat: 0, reputation: 50, netWorth: bs.cash, peakNetWorth: bs.cash, monthsSurvived: 0 },
    skills: Object.fromEntries(SKILLS.map(s => [s, (bs.skills && bs.skills[s]) || 0])),

    // life
    edu: { level: bs.edu, institution: null, course: null, year: 1, feesDue: 0, enrolled: false, waec: null, jamb: null, nysc: bs.id === 'corper', excluded: false, attended: 0 },
    job: null,
    gig: null,
    travel: null,
    items: (bs.items || []).map(id => ({ id, qty: 1, cond: (ITEM_BY_ID[id] && ITEM_BY_ID[id].cond) || 1 })),
    properties: [],
    home: { districtId: `${city.id}:${district.id}`, type: bs.id === 'graduate' ? 'parents' : 'rent', tier: 'single', rentMonthly: 0, landlord: 'Pa Johnson', paidMonths: 0 },
    util: { units: 6, genFuel: 0, hasGen: false, blackout: false },
    telco: { network: 'MTL', airtime: 500, dataMB: 900, planDays: 30 },
    faith: { faith: pickFaithByCity(city.id), devotion: 20, streak: 0, lastServiceMonth: -1, scandal: 0 },
    politics: { pvc: false, party: null, office: null, votes: 0, campaigning: 0, votedMonths: [] },
    family: { parentsAlive: true, approval: 70, kids: 0, spouse: null, pressure: 10, lastCallMonth: 0 },
    social: { friends: [], beefs: [], followers: bs.id === 'ijgb' ? 300 : 12, following: [] },
    health: { illnesses: [], hmo: false, lastCheckup: 0 },
    music: { singles: [], streams: 0, fans: 0 },
    crime: { record: [], cellMonths: 0 },

    feed: [],
    titles: [],
    tutorial: { done: false, step: 0 },
    settings: { sound: true, push: false, dataSaver: false },
  };

  // starter home economics
  if (p.home.type === 'rent') {
    const tier = 'single';
    p.home.tier = tier;
    p.home.rentMonthly = monthlyRent(p, district.id);
  }
  log(p, bs.emoji, `You arrive in ${city.name}. ${bs.blurb}`);
  return p;
}

function pickFaithByCity(cityId) {
  const north = ['kano','kaduna','maiduguri','abuja','jos'];
  if (north.includes(cityId)) return chance(0.72) ? 'muslim' : 'christian';
  return chance(0.82) ? 'christian' : 'muslim';
}

/* ─────────────── money ─────────────── */
export function earn(p, amount, reason, viaBank = false) {
  amount = Math.round(amount);
  if (viaBank) p.bank += amount; else p.cash += amount;
  p.stats.reputation = clamp(p.stats.reputation + 0.05, 0, 100);
  ledger(p, amount, reason);
  recalc(p);
  return amount;
}
export function spend(p, amount, reason, opts = {}) {
  amount = Math.round(amount);
  const src = opts.fromBank ? 'bank' : 'cash';
  const other = opts.fromBank ? 'cash' : 'bank';
  if (opts.fromBank && p.bank >= amount) { p.bank -= amount; }
  else if (!opts.fromBank && p.cash >= amount) { p.cash -= amount; }
  else if (p.cash + p.bank >= amount) { // auto-sweep
    const fromCash = Math.min(p.cash, amount);
    p.cash -= fromCash; p.bank -= (amount - fromCash);
  } else if (opts.allowDebt) {
    if (src === 'bank') p.bank -= amount; else p.cash -= amount;
  } else {
    return false;
  }
  ledger(p, -amount, reason);
  recalc(p);
  return true;
}
export function canAfford(p, amount) { return (p.cash + p.bank) >= amount; }
export function ledger(p, amount, reason) {
  p.ledger.unshift({ t: Date.now(), amount, reason });
  if (p.ledger.length > 60) p.ledger.length = 60;
}
export function recalc(p) {
  let nw = p.cash + p.bank;
  for (const it of p.items) {
    const def = ITEM_BY_ID[it.id];
    if (def) nw += itemValue(def, it.cond);
  }
  for (const prop of p.properties) nw += prop.value || 0;
  nw -= p.debts.reduce((s, d) => s + d.amount, 0);
  p.stats.netWorth = Math.round(nw);
  if (nw > p.stats.peakNetWorth) p.stats.peakNetWorth = Math.round(nw);
  checkTitles(p);
}
export function itemValue(def, cond = 1) {
  if (def.zonePrice) return 0;
  return Math.round((def.price || 0) * Math.max(0.15, cond) * 0.72); // resale is 72% of new
}

/* ─────────────── needs ─────────────── */
export function need(p, key, delta) {
  p.needs[key] = clamp(p.needs[key] + delta, 0, NEEDS[key]?.max || 100);
  return p.needs[key];
}
export function damage(p, key, amount) {
  if (p.health.hmo) amount *= 0.45;
  need(p, 'health', -amount);
}
export function log(p, emoji, text, kind = 'info') {
  p.feed.unshift({ t: Date.now(), emoji, text, kind });
  if (p.feed.length > 80) p.feed.length = 80;
}

/* ─────────────── skills & items ─────────────── */
export function addSkill(p, skill, xp = 1) {
  if (!SKILLS.includes(skill)) return;
  const cur = p.skills[skill] || 0;
  if (cur >= SKILL_MAX) return;
  // diminishing returns: xp is in tenths of a level
  const before = Math.floor(cur);
  p.skills[skill] = Math.min(SKILL_MAX, cur + xp);
  const after = Math.floor(p.skills[skill]);
  if (after > before) log(p, '📈', `${skill[0].toUpperCase() + skill.slice(1)} skill is now level ${after}.`, 'good');
}
export function hasItem(p, id) { return p.items.some(i => i.id === id); }
export function addItem(p, id, qty = 1) {
  const def = ITEM_BY_ID[id]; if (!def) return;
  const ex = p.items.find(i => i.id === id);
  if (ex && !def.cond) ex.qty += qty;
  else p.items.push({ id, qty, cond: def.cond ?? 1 });
  recalc(p);
}
export function removeItem(p, id, qty = 1) {
  const i = p.items.findIndex(i => i.id === id);
  if (i < 0) return false;
  p.items[i].qty -= qty;
  if (p.items[i].qty <= 0) p.items.splice(i, 1);
  recalc(p); return true;
}

/* ─────────────── employment maths ─────────────── */
export function careerPay(p, careerId, level = 0) {
  const c = CAREER_BY_ID[careerId]; if (!c) return 0;
  const city = CITY_BY_ID[p.cityId];
  let pay = c.pay[Math.min(level, c.pay.length - 1)] * (city?.wageMult || 1);
  // skill & education modifiers
  const skill = p.skills[c.skill] || 0;
  pay *= 1 + skill * 0.055;
  if (p.edu.level > c.edu) pay *= 1 + 0.04 * (p.edu.level - c.edu);
  // item income boosts
  for (const it of p.items) {
    const def = ITEM_BY_ID[it.id];
    if (def?.incomeBoost?.[c.id]) pay *= 1 + def.incomeBoost[c.id];
  }
  return Math.round(pay);
}
export function monthlyIncome(p) {
  if (!p.job) return p.edu.nysc ? 77_000 : 0;
  return careerPay(p, p.job.careerId, p.job.level);
}
export function monthlyExpenses(p) {
  return (p.home.rentMonthly || 0)
    + Math.round(p.util.units > 0 ? 4_000 : 2_000)
    + 4_000 + 2_500 // water + waste
    + (p.health.hmo ? 14_000 : 0)
    + p.debts.reduce((s, d) => s + Math.round(d.amount * 0.06), 0);
}

/* ─────────────── housing ─────────────── */
export function monthlyRent(p, districtId) {
  const d = DISTRICT_BY_ID[districtId] || DISTRICT_BY_ID[p.districtId];
  const city = CITY_BY_ID[d.cityId];
  const tier = p.home.tier || 'single';
  return Math.round(annualRent(p, districtId, tier) / 12);
}
export function annualRent(p, districtId, tier, inflation = 0) {
  const d = DISTRICT_BY_ID[districtId] || DISTRICT_BY_ID[p.districtId];
  const city = CITY_BY_ID[d.cityId];
  const t = HOUSING[tier] || HOUSING.single;
  const base = t[d.zone] || t.mid || 200_000;
  return Math.round(base * (city?.costMult || 1) * (1 + inflation));
}

/* ─────────────── titles ─────────────── */
export function checkTitles(p) {
  for (const t of TITLES) {
    if (!p.titles.includes(t.id)) {
      try { if (t.test(p)) { p.titles.push(t.id); log(p, t.emoji, `New title unlocked: ${t.name}`, 'good'); } } catch (e) {}
    }
  }
}

/* ─────────────── derived read model for the client ─────────────── */
export function publicPlayer(p) {
  return {
    id: p.id, name: p.name, username: p.username, skin: p.skin, emoji: p.emoji,
    x: p.x, y: p.y, dir: p.dir, districtId: p.districtId, venueId: p.venueId,
    online: p.online, sleeping: p.sleeping, backstory: p.backstory,
    clout: Math.round(p.stats.clout), heat: Math.round(p.stats.heat),
    job: p.job ? CAREER_BY_ID[p.job.careerId]?.name : null,
    titles: p.titles.slice(0, 3),
    vip: netWorthTier(p),
  };
}
function netWorthTier(p) {
  const n = p.stats.netWorth;
  if (n >= 100_000_000) return 'Odogwu';
  if (n >= 20_000_000) return 'Big Man';
  if (n >= 3_000_000) return 'Comfortable';
  if (n >= 400_000) return 'Managing';
  return 'Hustling';
}

/* ─────────────── human-readable summary ─────────────── */
export function summary(p) {
  const job = p.job ? `${CAREER_BY_ID[p.job.careerId].name} (L${p.job.level + 1})` : (p.edu.nysc ? 'NYSC Corper' : 'Unemployed');
  return {
    name: p.name, job, money: naira(p.cash + p.bank),
    edu: EDU_LEVELS[p.edu.level], where: (DISTRICT_BY_ID[p.districtId]?.name || '?') + ', ' + (CITY_BY_ID[p.cityId]?.name || '?'),
  };
}
