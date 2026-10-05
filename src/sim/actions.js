/**
 * NAIJA LIFE — ACTIONS, PART 1: MONEY, WORK, MARKET, TRANSPORT
 * Every action: fn(ctx, params) => {ok, msg, data}
 */
import { CITY_BY_ID, DISTRICT_BY_ID, VENUE_BY_ID, VENUE_TYPES, distanceKm, CITIES } from '../data/cities.js';
import { CAREER_BY_ID, GIGS, ITEM_BY_ID, ITEMS } from '../data/content.js';
import { FOOD as FOODS, TRANSPORT, DATA_PLANS, DATA_COST_MB, UTIL, TUNING, MACRO, AIRTIME_RATE, naira, clamp, chance, pick, rand } from '../config.js';
import {
  earn, spend, canAfford, need, log, addSkill, addItem, removeItem, hasItem,
  recalc, careerPay, monthlyIncome, monthlyRent, annualRent, itemValue,
} from './player.js';
import { world, players, byUsername, clock, timeString, isNight, intercityTrip, addNews } from './world.js';
import { NEEDS } from '../config.js';

export const ok = (msg, data) => ({ ok: true, msg, data });
export const no = (msg) => ({ ok: false, msg });

export const REQUIRED_WORK_HOURS = 18;   // per compressed game-month

/* ─────────────── helpers ─────────────── */
export function ff(p, hours) {  // fast-forward personal needs
  need(p, 'energy', -NEEDS.energy.drainPerHour * hours * 1.15);
  need(p, 'hunger', -NEEDS.hunger.drainPerHour * hours);
  need(p, 'hygiene', -NEEDS.hygiene.drainPerHour * hours * 0.55);
  need(p, 'fun', -NEEDS.fun.drainPerHour * hours * 0.5);
}
export function useData(p, mb = DATA_COST_MB.default) {
  if (p.telco.dataMB < mb) {
    p.telco.dataMB = 0;
    return false;
  }
  p.telco.dataMB -= mb;
  return true;
}
function venueHere(p) { return p.venueId ? VENUE_BY_ID[p.venueId] : null; }
function atType(p, types) {
  const v = venueHere(p);
  if (!v) return { v: null, match: false };
  return { v, match: types.includes(v.type) };
}
function travelCost(fromCityId, toDistrictId, mode) {
  const a = CITY_BY_ID[fromCityId];
  const d = DISTRICT_BY_ID[toDistrictId];
  const b = CITY_BY_ID[d.cityId];
  if (a.id !== b.id) return null;
  const km = Math.max(3, Math.round(rand(4, 26) * (b.id === 'lagos' ? 1.6 : 1)));
  const t = TRANSPORT[mode] || TRANSPORT.danfo;
  const traffic = 1 + (b.traffic || 0.4) * (isNight() ? 0.3 : 1);
  const fare = Math.round((t.base + t.kmRate * km) * (1 + world.macro.fuelPrice / 9000));
  const minutes = Math.max(6, Math.round((km / t.speedKmh) * 60 * traffic));
  return { km, fare, minutes, mode, name: t.name, emoji: t.emoji };
}

/* ══════════════════════════ BANK ══════════════════════════ */
export const ACTIONS = {
  'bank.deposit': (ctx, { amount }) => {
    const p = ctx.p; amount = Math.round(amount);
    if (amount <= 0) return no('Enter a real amount.');
    if (p.cash < amount) return no(`You only have ${naira(p.cash)} in cash.`);
    if (!useData(p, DATA_COST_MB.bank)) return no('No data connection. Buy a bundle.');
    p.cash -= amount; p.bank += amount; recalc(p);
    return ok(`Deposited ${naira(amount)}. Account balance: ${naira(p.bank)}.`);
  },
  'bank.withdraw': (ctx, { amount }) => {
    const p = ctx.p; amount = Math.round(amount);
    if (p.bank < amount) return no(`Your account has ${naira(p.bank)}.`);
    if (!useData(p, DATA_COST_MB.bank)) return no('No data connection. Buy a bundle.');
    // ATM charges
    const charge = 65 + (amount > 10_000 ? 35 : 0);
    p.bank -= amount + charge; p.cash += amount; recalc(p);
    log(p, '🏧', `Withdrew ${naira(amount)}. ATM charge ${naira(charge)}. (₦65 is ₦65.)`, 'money');
    return ok(`Withdrew ${naira(amount)}. Cash in hand: ${naira(p.cash)}.`);
  },
  'bank.transfer': (ctx, { to, amount, narration }) => {
    const p = ctx.p; amount = Math.round(amount);
    const target = byUsername.get(String(to || '').toLowerCase().replace(/^@/, ''));
    if (!target) return no(`No Naija Life account called "${to}".`);
    if (target.id === p.id) return no('You cannot send money to yourself. Even banks draw a line here.');
    if (amount <= 0) return no('Enter a real amount.');
    // like a real banking app: if the account is short, it funds from your cash wallet first
    let toppedUp = 0;
    if (p.bank < amount) {
      const short = amount - p.bank;
      if (p.cash >= short) { toppedUp = short; p.cash -= short; p.bank += short; }
      else return no(`Insufficient balance. You have ${naira(p.bank)} in the bank and ${naira(p.cash)} in cash — ${naira(amount)} needed.`);
    }
    if (!useData(p, DATA_COST_MB.bank)) return no('No data connection — transfer failed.');
    p.bank -= amount; target.bank += amount; recalc(p); recalc(target);
    log(p, '💸', `Sent ${naira(amount)} to @${target.name}${narration ? ` — "${narration}"` : ''}.${toppedUp ? ` (Funded ${naira(toppedUp)} from cash.)` : ''}`, 'money');
    log(target, '💰', `@${p.name} sent you ${naira(amount)}${narration ? ` — "${narration}"` : ''}.`, 'money');
    ctx.notify(target.id, { emoji: '💰', from: p.name, username: p.username, text: `@${p.name} sent you ${naira(amount)}.`, kind: 'money' });
    return ok(`Sent ${naira(amount)} to @${target.name}.${toppedUp ? ` ${naira(toppedUp)} moved from your cash wallet to fund it.` : ''}`);
  },
  'bank.loan': (ctx, { amount }) => {
    const p = ctx.p; amount = Math.round(amount);
    if (amount < 10_000) return no('Minimum loan is ₦10,000.');
    if (amount > 5_000_000) return no('Maximum is ₦5,000,000. This is not the CBN.');
    const rate = 0.07 + (world.macro.inflation * 0.1) + (p.stats.reputation < 40 ? 0.05 : 0);
    if (p.stats.reputation < 25) return no('Your name is not clean. No bank will touch you right now.');
    p.bank += amount;
    p.debts.push({ to: 'SabiPay Loan', amount: Math.round(amount * (1 + rate)), monthsLeft: 6, rate });
    recalc(p);
    log(p, '🏦', `Loan of ${naira(amount)} approved at ${(rate * 100).toFixed(1)}% monthly. Repay in 6 months or else.`, 'money');
    return ok(`Loan of ${naira(amount)} disbursed. Repay ${naira(Math.round(amount * (1 + rate)))} in 6 months.`);
  },
  'bank.repay': (ctx, { index }) => {
    const p = ctx.p;
    const d = p.debts[index ?? 0];
    if (!d) return no('You have no debts. Congratulations, actually.');
    if (!spend(p, d.amount, `Repaid ${d.to}`, { allowDebt: false })) return no(`You cannot cover ${naira(d.amount)}.`);
    p.debts.splice(index ?? 0, 1); recalc(p);
    return ok(`Cleared ${naira(d.amount)} to ${d.to}. Your name is clean-ish.`);
  },

  /* ══════════════════════════ TELCO ══════════════════════════ */
  'telco.data': (ctx, { planId, network }) => {
    const p = ctx.p;
    const plan = DATA_PLANS.find(d => d.id === planId);
    if (!plan) return no('Pick a plan.');
    if (!spend(p, plan.price, `Data: ${plan.label}`)) return no(`That bundle is ${naira(plan.price)}. You have ${naira(p.cash + p.bank)}.`);
    if (network && network !== p.telco.network) { p.telco.network = network; }
    p.telco.dataMB += plan.mb; p.telco.planDays = plan.days;
    return ok(`You are now on ${p.telco.network} ${plan.label}. Data balance: ${Math.round(p.telco.dataMB)}MB.`);
  },
  'telco.airtime': (ctx, { amount }) => {
    const p = ctx.p; amount = Math.round(amount);
    if (amount < 100) return no('Minimum recharge is ₦100.');
    if (!spend(p, amount, 'Airtime')) return no('You do not have that much.');
    p.telco.airtime += amount;
    return ok(`Recharged ${naira(amount)}. Airtime: ${naira(p.telco.airtime)}.`);
  },

  /* ══════════════════════════ HOME & NEEDS ══════════════════════════ */
  'act.eat': (ctx, { foodId }) => {
    const p = ctx.p;
    const f = FOODS.find(x => x.id === foodId);
    if (!f) return no('Eat what?');
    const price = Math.round(f.price * world.macro.foodPriceMult);
    const v = venueHere(p);
    if (v && !(f.where || ['food']).includes(v.type)) {
      // can still eat at home if you carry it — otherwise must be at a food place
      if (!hasItem(p, foodId)) return no(`You can only buy ${f.name.toLowerCase()} at a food place.`);
    }
    if (!spend(p, price, `Ate ${f.name}`)) return no(`${f.name} is ${naira(price)}. You have ${naira(p.cash)}.`);
    need(p, 'hunger', f.hunger || 25);
    if (f.fun) need(p, 'fun', f.fun);
    need(p, 'health', f.health || 0);
    ff(p, 0.4);
    return ok(`You ate ${f.name.toLowerCase()}. ${naira(price)}. ${chance(0.4) ? pick(['“God bless the chef.”','“This one sweet die.”','“Sha, food is food.”']) : ''}`);
  },
  'act.sleep': (ctx, { hours }) => {
    const p = ctx.p;
    hours = clamp(Math.round(hours) || 6, 1, 12);
    if (p.sleeping) return no('You are already asleep.');
    if (p.needs.energy > 92) return no('You are not tired. Go and hustle.');
    p.sleeping = true;
    need(p, 'energy', SLEEP_RECOVERY * hours);
    need(p, 'hunger', -NEEDS.hunger.drainPerHour * hours * 0.45);
    need(p, 'hygiene', -NEEDS.hygiene.drainPerHour * hours * 0.4);
    p.sleeping = false;
    // NEPA could wake you
    if (chance(world.macro.blackoutRisk * 0.8)) {
      log(p, '💡', 'NEPA took the light at 2am. You slept in the heat and woke up angry.', 'bad');
      need(p, 'fun', -6);
    }
    return ok(`You slept ${hours} hours. Energy: ${Math.round(p.needs.energy)}%.`);
  },
  'act.bath': (ctx, {}) => {
    const p = ctx.p;
    if (p.util.units <= 0 && p.util.blackout && p.util.genFuel <= 0) {
      // cold bucket bath — very Nigerian
      need(p, 'hygiene', 55); need(p, 'fun', -4);
      return ok('No light, no geyser. You fetched water and bathed with a bucket. Character building.');
    }
    need(p, 'hygiene', 70); need(p, 'energy', 3);
    ff(p, 0.35);
    return ok('Hot bath. You are a different human being now.');
  },
  'act.rest': (ctx, { hours }) => {
    const p = ctx.p; hours = clamp(Math.round(hours) || 2, 1, 8);
    useData(p, hours * 6);
    need(p, 'fun', hours * 9); need(p, 'energy', hours * 3);
    ff(p, hours * 0.6);
    return ok(`You scrolled, watched and chilled for ${hours} hours. Fun: ${Math.round(p.needs.fun)}%.`);
  },

  /* ══════════════════════════ POWER ══════════════════════════ */
  'util.units': (ctx, { amount }) => {
    const p = ctx.p; amount = Math.round(amount);
    if (amount < 500) return no('Minimum is ₦500 of units.');
    if (!spend(p, amount, 'Prepaid meter units')) return no('No money, no light. Simple.');
    const band = p.home.tier === 'mansion' || p.home.tier === 'duplex' ? 'A' : chance(0.5) ? 'A' : 'B';
    const units = amount / (band === 'A' ? MACRO.bandA_kWh : MACRO.bandB_kWh);
    p.util.units += units;
    return ok(`You are on Band ${band}. ${naira(amount)} bought ${units.toFixed(1)} units. ${band === 'A' ? '(Band A tariff is ₦209/kWh. You are being punished.)' : '(Band B. Manage it well.)'}`);
  },
  'util.fuel': (ctx, { litres }) => {
    const p = ctx.p; litres = clamp(Math.round(litres) || 10, 1, 200);
    const cost = Math.round(litres * world.macro.fuelPrice);
    const { v, match } = atType(p, ['fuel']);
    if (!match) return no('You can only buy fuel at a filling station.');
    if (!spend(p, cost, `Fuel: ${litres}L`)) return no(`${litres}L costs ${naira(cost)} at ₦${Math.round(world.macro.fuelPrice)}/litre.`);
    p.util.genFuel += litres;
    return ok(`Bought ${litres} litres for ${naira(cost)}. Your generator will remember this.`);
  },

  /* ══════════════════════════ WORK ══════════════════════════ */
  'work.list': (ctx, {}) => {
    const p = ctx.p;
    const d = DISTRICT_BY_ID[p.districtId];
    const typesHere = new Set(d.venues.map(v => v.type));
    const list = Object.values(CAREER_BY_ID).filter(c => {
      if (c.edu > p.edu.level) return false;
      if (c.venue && !c.venue.some(t => typesHere.has(t))) return false;
      if (c.needs && !hasItem(p, c.needs)) return false;
      if (c.id === 'corper' && !p.edu.nysc) return false;
      if (c.id === 'politician' && !p.politics.party) return false;
      if (c.id === 'clergy' && p.faith.devotion < 25) return false;
      return true;
    }).map(c => ({
      id: c.id, name: c.name, emoji: c.emoji, desc: c.desc,
      pay: careerPay(p, c.id, c.pay.length > 1 ? 1 : 0),
      payNow: careerPay(p, c.id, 0),
      needs: c.needs || null, skill: c.skill,
    }));
    return ok(`${list.length} jobs open in ${d.name}.`, { jobs: list, district: d.name });
  },
  'work.apply': (ctx, { careerId }) => {
    const p = ctx.p;
    const c = CAREER_BY_ID[careerId]; if (!c) return no('That job does not exist.');
    if (c.edu > p.edu.level) return no(`${c.name} needs ${['nothing','primary school','WAEC/SSCE','ND/NCE','a BSc/HND','an MSc','a PhD'][c.edu]}. You have: ${['nothing','primary','secondary','ND/NCE','BSc/HND','MSc','PhD'][p.edu.level]}.`);
    if (c.needs && !hasItem(p, c.needs)) return no(`You need to own ${c.needs === 'okada' ? 'a motorcycle' : c.needs === 'keke' ? 'a keke' : 'a danfo bus'} first. Check Oja market.`);
    if (p.job && p.job.careerId === careerId) return no('You already do this work.');
    const d = DISTRICT_BY_ID[p.districtId];
    const typesHere = new Set(d.venues.map(v => v.type));
    if (c.venue && !c.venue.some(t => typesHere.has(t))) return no(`No ${c.name.toLowerCase()} work in ${d.name}. Try another district.`);
    // interview roll
    const skill = p.skills[c.skill] || 0;
    const roll = 0.42 + skill * 0.09 + (p.edu.level - c.edu) * 0.06 + (p.stats.reputation - 50) / 400;
    if (!chance(clamp(roll, 0.15, 0.96))) {
      need(p, 'fun', -4); ff(p, 1.5);
      return no(`They said “we’ll get back to you.” They will not. (Chance was ${Math.round(clamp(roll,0,1)*100)}%.)`);
    }
    p.job = { careerId, level: 0, employer: pick(['Alhaji & Sons Ltd','Zenith Concepts','Bright Future Nigeria','Odogwu Enterprises','Nigerian Integrated Services','Mama & Co','Sunrise Group']), startedMonth: world.monthIndex, hoursThisMonth: 0, warnings: 0 };
    addSkill(p, c.skill, 0.2);
    log(p, c.emoji, `You are now a ${c.name} at ${p.job.employer}. ${naira(careerPay(p, careerId, 0))}/month if you show up.`, 'good');
    return ok(`Hired as ${c.name} at ${p.job.employer}. Work ${REQUIRED_WORK_HOURS} hours a game-month or you will be shown the way out.`);
  },
  'work.quit': (ctx, {}) => {
    const p = ctx.p;
    if (!p.job) return no('You have no job to quit. Freedom is already yours.');
    const c = CAREER_BY_ID[p.job.careerId];
    p.job = null;
    p.stats.reputation = clamp(p.stats.reputation - 3, 0, 100);
    log(p, '🚪', `You left ${c.name}. "${pick(['I need to find myself.','I cannot kill myself for ₦200k.','Oga, I resign.','God will provide.'])}"`, 'info');
    return ok(`You quit. ${pick(['E go be.','Na who get job?','Your mates are hiring.'])}`);
  },
  'work.shift': (ctx, { hours, careerId }) => {
    const p = ctx.p;
    const id = p.job ? p.job.careerId : careerId;
    const c = CAREER_BY_ID[id];
    if (!c) return no('You have no job. Open Hustle and apply.');
    hours = clamp(Math.round(hours) || 1, 1, 4);
    // informal self-employment: check the tool of trade
    if (!p.job && c.needs && !hasItem(p, c.needs)) return no('You need your own equipment first.');
    // must be somewhere plausible
    const d = DISTRICT_BY_ID[p.districtId];
    const typesHere = new Set(d.venues.map(v => v.type));
    if (c.venue && !c.venue.some(t => typesHere.has(t)) && !p.job) return no(`No ${c.name.toLowerCase()} work around ${d.name}.`);
    if (p.needs.energy < 12) return no('You are too tired to work. Sleep first.');
    if (p.needs.hunger < 10) return no('You cannot work on an empty stomach. Chop something.');
    const rate = careerPay(p, id, p.job ? p.job.level : 0) / 160;   // 160 working hours a month
    let pay = Math.round(rate * hours * (c.needs ? 1.15 : 1));
    // night & weekend premiums
    if (isNight()) pay = Math.round(pay * 1.25);
    if (clock().hour >= 6 && clock().hour < 9) pay = Math.round(pay * 1.1);
    earn(p, pay, `Shift: ${c.name}`);
    ff(p, hours);
    need(p, 'fun', -hours * 2.5);
    if (p.job) p.job.hoursThisMonth = (p.job.hoursThisMonth || 0) + hours;
    addSkill(p, c.skill, hours * 0.06);
    p.job && (p.job.lastPay = pay);
    const flavour = pick([
      'Your supervisor walked past twice. You looked busy.',
      'The generator ran all morning. Nobody knows who bought diesel.',
      '“Meeting” lasted 2 hours. Nothing was decided.',
      'You did the work of three people. Two of them are on leave.',
      'A customer shouted at you. You smiled professionally.',
      'You and your colleague split “small chops” from the meeting.',
    ]);
    return ok(`Worked ${hours}h as ${c.name}. Paid ${naira(pay)}. ${flavour}`);
  },
  'work.promote': (ctx, {}) => {
    const p = ctx.p;
    if (!p.job) return no('No job, no promotion.');
    const c = CAREER_BY_ID[p.job.careerId];
    if (p.job.level >= c.pay.length - 1) return no('You are already at the top of this ladder. Go and start something.');
    const needed = (p.job.level + 1) * 1.5;
    const skill = p.skills[c.skill] || 0;
    if (skill < needed) return no(`You need ${c.skill} skill ${needed} to move up. You are at ${skill.toFixed(1)}.`);
    if ((p.job.hoursThisMonth || 0) < REQUIRED_WORK_HOURS * 0.8) return no('Put in the hours first, then talk about promotion.');
    if (!chance(0.55 + skill * 0.05)) { need(p, 'fun', -8); return no('“Not this quarter.” The promotion went to somebody’s cousin.'); }
    p.job.level++;
    const newPay = careerPay(p, p.job.careerId, p.job.level);
    p.stats.reputation = clamp(p.stats.reputation + 4, 0, 100);
    log(p, '📈', `Promoted. You are now ${c.name} (Level ${p.job.level + 1}) on ${naira(newPay)}/month.`, 'good');
    return ok(`Promoted! New pay: ${naira(newPay)}/month.`);
  },

  /* ══════════════════════════ GIGS ══════════════════════════ */
  'gig.list': (ctx, {}) => {
    const p = ctx.p;
    const avail = GIGS.filter(g => {
      if (g.need && !hasItem(p, g.need)) return false;
      if (g.needs && !hasItem(p, g.needs)) return false;
      if (g.skill && (p.skills[g.skill] || 0) < (g.level || 1)) return false;
      if (g.capital && (p.cash + p.bank) < g.capital) return false;
      return true;
    }).map(g => ({ ...g, est: naira((g.pay[0] + g.pay[1]) / 2) }));
    return ok(`${avail.length} hustles available right now.`, { gigs: avail });
  },
  'gig.do': (ctx, { id }) => {
    const p = ctx.p;
    const g = GIGS.find(x => x.id === id); if (!g) return no('That hustle does not exist.');
    if (p.gig) return no('You are already busy. Finish that first.');
    if (g.need && !hasItem(p, g.need)) return no(`You need ${g.need} for this one.`);
    if (g.needs && !hasItem(p, g.needs)) return no(`You need ${g.needs} for this one.`);
    if (g.skill && (p.skills[g.skill] || 0) < (g.level || 1)) return no('Your skill is not up to it yet.');
    if (g.capital && (p.cash + p.bank) < g.capital) return no(`This needs ${naira(g.capital)} of working capital.`);
    if (p.needs.energy < (g.energy || 5)) return no('You are too tired for this one. Rest small.');
    const ticks = Math.max(2, Math.round(g.mins / 4));
    p.gig = { id: g.id, name: g.name, emoji: g.emoji, pay: Math.round(rand(g.pay[0], g.pay[1])), endsAt: world.tick + ticks, skill: g.skill, energy: g.energy || 4 };
    need(p, 'energy', -(g.energy || 5) * 0.5);
    return ok(`You start: ${g.name}. It will take about ${g.mins} minutes.`);
  },

  /* ══════════════════════════ MARKET ══════════════════════════ */
  'shop.catalogue': (ctx, {}) => {
    const p = ctx.p;
    const { v, match } = atType(p, ['market','mall','techhub','fuel','salon']);
    if (!v) return no('Walk into a market, mall or shop first.');
    const allows = {
      market: ['food','fashion','faith','trade','misc'],
      mall: ['tech','home','power','fashion','trade'],
      techhub: ['tech'],
      fuel: ['power'],
      salon: ['fashion'],
    }[v.type] || ['misc'];
    const cat = ITEMS.filter(i => allows.includes(i.cat) && !i.zonePrice)
      .map(i => ({ ...i, priceNow: Math.round(i.price * (i.cat === 'food' ? world.macro.foodPriceMult : 1) * (1 + world.macro.inflation * 0.4)) }));
    return ok(`${v.name} — ${cat.length} things for sale.`, { items: cat, venue: v.name });
  },
  'shop.buy': (ctx, { itemId }) => {
    const p = ctx.p;
    const def = ITEM_BY_ID[itemId]; if (!def) return no('No such thing.');
    const { v, match } = atType(p, ['market','mall','techhub','fuel','salon']);
    if (!v) return no('Walk into a shop first.');
    const price = Math.round(def.price * (def.cat === 'food' ? world.macro.foodPriceMult : 1) * (1 + world.macro.inflation * 0.4));
    if (!spend(p, price, `Bought ${def.name}`)) return no(`${def.name} is ${naira(price)}. You have ${naira(p.cash + p.bank)}.`);
    addItem(p, itemId);
    if (def.cat === 'vehicle' || def.flex) p.stats.clout = clamp(p.stats.clout + (def.flex || 1) * 0.4, 0, 100);
    return ok(`Bought ${def.emoji} ${def.name} for ${naira(price)}. ${pick(['“Na original o.”','“Last price.”','“You try for the market.”','“God bless the seller.”'])}`);
  },
  'shop.sell': (ctx, { itemId }) => {
    const p = ctx.p;
    const item = p.items.find(i => i.id === itemId); if (!item) return no('You do not have that.');
    const def = ITEM_BY_ID[itemId];
    const value = itemValue(def, item.cond);
    if (value <= 0) return no('Nobody is buying that.');
    removeItem(p, itemId);
    earn(p, value, `Sold ${def.name}`);
    return ok(`Sold ${def.emoji} ${def.name} for ${naira(value)}. ${pick(['The buyer haggled you to death.','“Oga, that is my last price.”','You took it to still make small gain.'])}`);
  },

  /* ══════════════════════════ TRANSPORT ══════════════════════════ */
  'travel.intra': (ctx, { districtId, mode }) => {
    const p = ctx.p;
    const d = DISTRICT_BY_ID[districtId]; if (!d) return no('Where?');
    if (d.cityId !== p.cityId) return no(`${d.name} is in another city. Use the motor park or airport.`);
    if (districtId === p.districtId) return no('You are already there.');
    if (p.travel) return no('You are already on the road.');
    if (mode === 'okada' && world.macro.okadaBan) return no('Okada is banned on the highways right now. Take a keke or a bus.');
    const t = travelCost(p.cityId, districtId, mode || 'danfo');
    if (mode === 'walk') {
      const km = t.km;
      if (p.needs.energy < km * 1.2) return no('Too far to walk in this state. Take transport.');
      p.travel = { toDistrict: districtId, toCity: p.cityId, toName: d.name, mode: 'walk', emoji: '🚶', endsAt: world.tick + Math.round(km * 3), energy: -km * 0.7 };
      need(p, 'energy', -km * 0.7);
      return ok(`You start walking to ${d.name}. About ${km}km.`);
    }
    if (!spend(p, t.fare, `${t.name} to ${d.name}`)) return no(`${t.name} costs ${naira(t.fare)}.`);
    p.travel = { toDistrict: districtId, toCity: p.cityId, toName: d.name, mode, emoji: t.emoji, endsAt: world.tick + Math.min(15, Math.round(t.minutes / 4) + 2), fare: t.fare };
    return ok(`${t.emoji} ${t.name} to ${d.name}. ${naira(t.fare)}, about ${t.minutes} minutes in ${CITY_BY_ID[p.cityId].name} traffic.`);
  },
  'travel.inter': (ctx, { cityId, mode }) => {
    const p = ctx.p;
    const city = CITY_BY_ID[cityId]; if (!city) return no('Where to?');
    if (cityId === p.cityId) return no('You are already here.');
    const { v, match } = atType(p, ['motorpark','airport','seaport']);
    if (mode === 'flight' && !match) return no('You need to be at an airport to fly.');
    if (mode !== 'flight' && !match) return no('Go to a motor park first.');
    if (p.travel) return no('You are already moving.');
    const trip = intercityTrip(p.cityId, cityId, mode || 'bus');
    if (!trip) return no('No route.');
    if (!spend(p, trip.fare, `${trip.name} to ${city.name}`)) return no(`${trip.name} to ${city.name} is ${naira(trip.fare)}.`);
    const district = city.districts[Math.floor(city.districts.length / 2)];
    p.travel = {
      toDistrict: `${city.id}:${district.id}`, toCity: city.id, toName: city.name,
      mode, emoji: trip.emoji, endsAt: world.tick + Math.round(trip.hours * 15) + 3, fare: trip.fare, long: true,
    };
    return ok(`${trip.emoji} ${trip.name} to ${city.name} — ${trip.km}km, ${naira(trip.fare)}. ${trip.hours}h on the road.`);
  },
  'travel.quote': (ctx, { cityId, mode, districtId }) => {
    const p = ctx.p;
    if (districtId && DISTRICT_BY_ID[districtId]?.cityId === p.cityId) {
      const t = travelCost(p.cityId, districtId, mode || 'danfo');
      return ok('Quote ready.', { quote: t });
    }
    if (cityId) {
      const trip = intercityTrip(p.cityId, cityId, mode || 'bus');
      return ok('Quote ready.', { quote: trip ? { ...trip, fare: trip.fare } : null });
    }
    return no('Pick a destination.');
  },
  'travel.toVenue': (ctx, { venueId }) => {
    const p = ctx.p;
    const v = VENUE_BY_ID[venueId]; if (!v) return no('No such place.');
    if (v.cityId !== p.cityId) return no(`${v.name} is in ${v.cityName}.`);
    p.districtId = v.districtId;
    p.x = (v.px ?? 32); p.y = (v.py ?? 30);
    p.travel = null;
    return ok(`You make your way to ${v.name}.`);
  },
};

const SLEEP_RECOVERY = 11;
