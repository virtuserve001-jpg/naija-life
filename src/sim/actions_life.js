/**
 * NAIJA LIFE — ACTIONS, PART 2: LIFE SYSTEMS
 * Education · Politics · Faith · Health · Crime · Family · Fame · Social
 */
import { VENUE_BY_ID, DISTRICT_BY_ID, CITY_BY_ID, CITIES } from '../data/cities.js';
import { ILLNESS_BY_ID, ILLNESSES, CAREER_BY_ID } from '../data/content.js';
import {
  EDU, FAITHS, TITHE_RATE, CRIME, BRIBE, BAIL_COST, HEALTH, HOUSING, LAND_PER_PLOT,
  WEDDING_COST, DATA_COST_MB, MACRO, PARTIES, OFFICES, OWAMBE,
  naira, clamp, chance, pick, rand,
} from '../config.js';
import {
  earn, spend, canAfford, need, damage, log, addSkill, addItem, removeItem, hasItem,
  recalc, careerPay, monthlyRent, annualRent, itemValue,
} from './player.js';
import { world, players, byUsername, clock, isNight, addNews } from './world.js';
import { ok, no, ff, useData } from './actions.js';

const COURSES = [
  { id:'medicine', name:'Medicine & Surgery', skill:'medical', cutoff:250, years:6, fee:EDU.federalUniSession * 1.4 },
  { id:'law',      name:'Law',                skill:'law',     cutoff:230, years:5, fee:EDU.federalUniSession * 1.15 },
  { id:'eng',      name:'Mechanical Engineering', skill:'eng', cutoff:220, years:5, fee:EDU.federalUniSession * 1.2 },
  { id:'csc',      name:'Computer Science',   skill:'tech',    cutoff:200, years:4, fee:EDU.federalUniSession },
  { id:'econ',     name:'Economics',          skill:'finance', cutoff:190, years:4, fee:EDU.federalUniSession },
  { id:'acct',     name:'Accounting',         skill:'finance', cutoff:195, years:4, fee:EDU.federalUniSession },
  { id:'masscomm', name:'Mass Communication', skill:'media',   cutoff:180, years:4, fee:EDU.federalUniSession },
  { id:'busadmin', name:'Business Admin',     skill:'admin',   cutoff:180, years:4, fee:EDU.federalUniSession },
  { id:'agric',    name:'Agriculture',        skill:'farm',    cutoff:170, years:5, fee:EDU.federalUniSession * 0.8 },
  { id:'theatre',  name:'Theatre Arts',       skill:'acting',  cutoff:170, years:4, fee:EDU.federalUniSession * 0.9 },
  { id:'educ',     name:'Education',          skill:'teaching',cutoff:160, years:4, fee:EDU.federalUniSession * 0.7 },
  { id:'poly',     name:'Polytechnic (HND)',  skill:'eng',     cutoff:150, years:4, fee:EDU.polytechnicSession },
  { id:'soc',      name:'Sociology',          skill:'admin',   cutoff:170, years:4, fee:EDU.federalUniSession * 0.85 },
  { id:'stats',    name:'Statistics',         skill:'data',    cutoff:185, years:4, fee:EDU.federalUniSession },
  { id:'nursing',  name:'Nursing Science',    skill:'medical', cutoff:210, years:5, fee:EDU.federalUniSession * 1.1 },
];
const COURSE_BY_ID = Object.fromEntries(COURSES.map(c => [c.id, c]));

const NEEDED_HOURS = { 1: 30, 2: 45, 3: 55, 4: 70, 5: 45, 6: 90 };

/* ══════════════════════════════════════════════════
   VENUES
   ══════════════════════════════════════════════════ */
export function venueActions(p, v) {
  const acts = [];
  const t = v.type;
  const add = (label, action, params = {}, emoji = '👉') => acts.push({ label, action, params, emoji });
  if (['food','club'].includes(t)) add('Chop something', 'act.eat', { openFood: true }, '🍲');
  if (t === 'club') add('Enter the club', 'act.party', { venueId: v.id }, '🪩');
  if (['beach','leisure','museum'].includes(t)) add('Enjoy yourself', 'act.relax', { venueId: v.id }, '🌴');
  if (['viewing','stadium'].includes(t)) add('Watch the match', 'act.watch', { venueId: v.id }, '⚽');
  if (t === 'cinema') add('See a film', 'act.watch', { venueId: v.id }, '🎬');
  if (t === 'gym') add('Train', 'act.gym', { venueId: v.id }, '🏋️');
  if (t === 'salon') add('Get fresh', 'act.groom', { venueId: v.id }, '💇🏾‍♀️');
  if (['market','mall','techhub','fuel'].includes(t)) add('Open market', 'shop.catalogue', {}, '🛍️');
  if (t === 'casino') add('Stake a bet', 'bet.place', { open: true }, '🎰');
  if (t === 'bank') add('Banking hall', 'bank.info', {}, '🏦');
  if (t === 'hospital') add('See a doctor', 'health.hospital', { open: true }, '🏥');
  if (t === 'pharmacy') add('Buy drugs', 'health.pharmacy', { open: true }, '💊');
  if (['church','mosque','shrine'].includes(t)) add('Join service', 'faith.attend', { venueId: v.id }, '🙏🏾');
  if (['school','uni'].includes(t)) add('School office', 'edu.info', { venueId: v.id }, '🎓');
  if (['motorpark','airport','seaport'].includes(t)) add('Book a trip', 'travel.info', {}, '🚌');
  if (t === 'estate') add('Look for a house', 'housing.info', {}, '🏠');
  if (t === 'inec') add('INEC office', 'politics.info', {}, '🗳️');
  if (t === 'nimc') add('NIN enrolment', 'politics.pvc', { nimc: true }, '🪪');
  if (t === 'police') add('Police station', 'police.info', {}, '🚓');
  if (t === 'court') add('Court registry', 'court.info', {}, '⚖️');
  if (t === 'prison') add('Visit / bail', 'prison.info', {}, '🚔');
  if (t === 'govt') add('Government office', 'gov.info', {}, '🏛️');
  if (t === 'hotel') add('Book a room', 'act.hotel', { venueId: v.id }, '🛏️');
  if (t === 'fuel') add('Buy fuel', 'util.fuel', { open: true }, '⛽');
  if (['office','techhub','factory','refinery','media','seaport','market','motorpark','bank','govt','uni','school','hospital','hotel','salon','gym','fuel'].includes(t)) {
    add('Look for work here', 'work.list', {}, '💼');
  }
  add('Who dey here?', 'venue.people', { venueId: v.id }, '👀');
  return acts;
}

export const ACTIONS_LIFE = {

  'venue.enter': (ctx, { venueId }) => {
    const p = ctx.p;
    const v = VENUE_BY_ID[venueId]; if (!v) return no('No such place.');
    if (v.cityId !== p.cityId) return no(`${v.name} is in ${v.cityName}. Book a trip first.`);
    if (world.macro.closings.includes(v.type)) return no('This place is shut right now. (Strike / protest.)');
    const type = v.type;
    const entry = (requireEntry(v));
    if (entry > 0) {
      if (!spend(p, entry, `Entry: ${v.name}`)) return no(`Entry to ${v.name} is ${naira(entry)}.`);
    }
    p.districtId = v.districtId; p.venueId = venueId;
    p.x = v.px ?? 32; p.y = v.py ?? 30;
    return ok(`You enter ${v.emoji} ${v.name}.`, { venue: v, acts: venueActions(p, v) });
  },
  'venue.leave': (ctx, {}) => {
    const p = ctx.p;
    if (!p.venueId) return no('You are already outside.');
    const v = VENUE_BY_ID[p.venueId];
    p.venueId = null;
    return ok(`You step back out into ${DISTRICT_BY_ID[p.districtId]?.name}.`);
  },
  'venue.people': (ctx, { venueId }) => {
    const p = ctx.p;
    const v = VENUE_BY_ID[venueId || p.venueId]; if (!v) return no('No such place.');
    const here = [...players.values()].filter(q => q.venueId === v.id && q.online && q.id !== p.id);
    const npcs = (world.npcsByDistrict[v.districtId] || []).slice(0, 8).map(n => ({ name: n.name, kind: n.kindName, emoji: n.emoji }));
    return ok(`${here.length + npcs.length} people here.`, { people: here.map(q => ({ name: q.name, username: q.username, job: q.job ? CAREER_BY_ID[q.job.careerId].name : null, clout: Math.round(q.stats.clout) })), npcs });
  },
  'venue.info': (ctx, { venueId }) => {
    const p = ctx.p;
    const v = VENUE_BY_ID[venueId || p.venueId]; if (!v) return no('No such place.');
    return ok(v.name, { venue: v, acts: venueActions(p, v) });
  },

  /* ══════════════════════════ PLEASURE ══════════════════════════ */
  'act.party': (ctx, { venueId }) => {
    const p = ctx.p;
    const v = VENUE_BY_ID[venueId || p.venueId];
    if (!v || v.type !== 'club') return no('Find a club first.');
    if (p.needs.energy < 20) return no('You are too tired to party. Sleep first.');
    ff(p, 3.5);
    need(p, 'fun', 34); need(p, 'hunger', -12); need(p, 'hygiene', -10); need(p, 'energy', -18);
    const cost = rand(4_000, 22_000);
    if (spend(p, cost, 'Drinks at the club', { allowDebt: true })) { /* it happens */ }
    const outcomes = [
      'You danced until your shirt was not your shirt.',
      'The DJ played that song and the whole place lost its mind.',
      'You sprayed ₦500 notes. Somebody’s uncle collected most of it.',
      'A bottle arrived at your table. It was not from you. It is now.',
      'You met somebody. You will not remember their name.',
      'You argued about who is the greatest Afrobeat artist. It got heated.',
    ];
    let extra = '';
    if (chance(0.18)) { p.stats.clout = clamp(p.stats.clout + 2, 0, 100); extra = ' Somebody filmed you. The clip is doing numbers.'; }
    if (chance(0.06)) { damage(p, 'health', 6); extra = ' You drank something that was not what it said on the label.'; }
    return ok(`${pick(outcomes)}${extra} Fun: ${Math.round(p.needs.fun)}%.`);
  },
  'act.relax': (ctx, { venueId }) => {
    const p = ctx.p;
    const v = VENUE_BY_ID[venueId || p.venueId];
    if (!v || !['beach','leisure','museum','leisure'].includes(v.type)) return no('Find somewhere to relax.');
    ff(p, 2);
    need(p, 'fun', 26); need(p, 'energy', 6); need(p, 'health', 1);
    return ok(`${pick(['The breeze is doing something to your blood pressure.','You forgot about your problems for 40 minutes.','You watched the water and remembered you are alive.','Somebody is selling coconut. You bought one.'])} Fun: ${Math.round(p.needs.fun)}%.`);
  },
  'act.watch': (ctx, { venueId }) => {
    const p = ctx.p;
    const v = VENUE_BY_ID[venueId || p.venueId];
    if (!v || !['viewing','stadium','cinema'].includes(v.type)) return no('Nothing to watch here.');
    ff(p, 2.5);
    need(p, 'fun', 24); need(p, 'energy', -4);
    const endings = ['Your team scored in the 94th minute. The place exploded.','Pain. Just pain. You are supporting this club till you die.','The film was too long but the sound design carried it.','Somebody’s generator died at the crucial moment. Pandemonium.'];
    return ok(pick(endings));
  },
  'act.gym': (ctx, { venueId }) => {
    const p = ctx.p;
    const v = VENUE_BY_ID[venueId || p.venueId];
    if (!v || v.type !== 'gym') return no('Find a gym.');
    if (!spend(p, 8_000, 'Gym day pass')) return no('Day pass is ₦8,000.');
    ff(p, 1.5);
    need(p, 'health', 4); need(p, 'energy', -12); need(p, 'hygiene', -14); need(p, 'fun', 5);
    addSkill(p, 'street', 0.05);
    return ok('You trained. Tomorrow you will not be able to stand, but today you are a warrior.');
  },
  'act.groom': (ctx, { venueId }) => {
    const p = ctx.p;
    const v = VENUE_BY_ID[venueId || p.venueId];
    if (!v || v.type !== 'salon') return no('Find a salon or barber.');
    if (!spend(p, 4_500, 'Fresh cut / hair')) return no('It is ₦4,500.');
    ff(p, 1);
    need(p, 'hygiene', 45); p.stats.clout = clamp(p.stats.clout + 1.2, 0, 100);
    return ok('You stepped out sharper than you stepped in. Clout +.');
  },
  'act.hotel': (ctx, { venueId }) => {
    const p = ctx.p;
    const v = VENUE_BY_ID[venueId || p.venueId];
    if (!v || v.type !== 'hotel') return no('Find a hotel.');
    if (!spend(p, 18_000, 'Hotel room')) return no('A night here is ₦18,000.');
    ff(p, 8);
    need(p, 'energy', 85); need(p, 'hygiene', 60); need(p, 'fun', 15); need(p, 'health', 3);
    return ok('You slept in actual air conditioning with no generator noise. You woke up a new person.');
  },

  /* ══════════════════════════ EDUCATION ══════════════════════════ */
  'edu.info': (ctx, {}) => {
    const p = ctx.p;
    return ok('School office.', {
      level: p.edu.level, levelName: ['No formal schooling','Primary School','Secondary (WAEC)','ND / NCE','BSc / HND','MSc','PhD'][p.edu.level],
      enrolled: p.edu.enrolled, institution: p.edu.institution, course: p.edu.course,
      progress: p.edu.attended || 0, needed: NEEDED_HOURS[p.edu.level + 1] || 40,
      feesDue: p.edu.feesDue, jamb: p.edu.jamb, waec: p.edu.waec, nysc: p.edu.nysc,
      courses: COURSES, jambFee: EDU.jamb, waecFee: EDU.waec,
    });
  },
  'edu.enroll': (ctx, { level }) => {
    const p = ctx.p;
    const v = VENUE_BY_ID[p.venueId];
    if (!v || !['school','uni'].includes(v.type)) return no('You need to be at a school or university.');
    if (level !== p.edu.level + 1) return no('You cannot skip a level. Life does not work like that.');
    let fee = 0;
    if (level === 1) fee = EDU.primaryTerm;
    else if (level === 2) fee = chance(0.3) ? EDU.privateSecondaryTerm : EDU.secondaryTerm;
    else fee = 0;   // tertiary requires admission first
    p.edu.enrolled = true; p.edu.institution = v.name; p.edu.feesDue = fee; p.edu.attended = p.edu.attended || 0;
    log(p, '🎓', `Enrolled at ${v.name}. Fees: ${naira(fee)}.`, 'info');
    return ok(`You have been registered at ${v.name}. Fees: ${naira(fee)}. Attend classes, then write the exam.`);
  },
  'edu.attend': (ctx, { hours }) => {
    const p = ctx.p;
    if (!p.edu.enrolled) return no('You are not enrolled anywhere.');
    const v = VENUE_BY_ID[p.venueId];
    if (!v || !['school','uni','techhub'].includes(v.type)) return no('Go to your school.');
    if (p.edu.feesDue > 0) return no('You have been sent home for school fees. Pay first.');
    if (world.macro.closings.includes('uni') && v.type === 'uni') return no('The university is on strike. ASUU has spoken.');
    hours = clamp(Math.round(hours) || 2, 1, 6);
    if (p.needs.energy < 10) return no('You will sleep in class. Rest first.');
    ff(p, hours);
    p.edu.attended = (p.edu.attended || 0) + hours;
    const course = COURSE_BY_ID[p.edu.course];
    if (course) addSkill(p, course.skill, hours * 0.02);
    else addSkill(p, 'admin', hours * 0.012);
    need(p, 'fun', -hours * 1.5);
    const needed = NEEDED_HOURS[p.edu.level + 1] || 40;
    return ok(`You attended ${hours} hours. Progress: ${p.edu.attended}/${needed}. ${pick(['The lecturer did not show. You copied notes anyway.','Somebody’s phone rang in class. We all suffered.','You understood something today. Rare.','The generator came on and the whole class cheered.'])}`);
  },
  'edu.payFees': (ctx, {}) => {
    const p = ctx.p;
    if (p.edu.feesDue <= 0) return no('You owe nothing. Unbelievable.');
    if (!spend(p, p.edu.feesDue, 'School fees')) return no(`Fees are ${naira(p.edu.feesDue)}.`);
    p.edu.feesDue = 0; p.edu.excluded = false;
    return ok(`School fees of ${naira(p.edu.feesDue || 0)} paid. You may return to class.`);
  },
  'edu.exam': (ctx, { type }) => {
    const p = ctx.p;
    if (type === 'jamb') {
      if ((p.edu.level || 0) < 2) return no('You need at least secondary school before JAMB.');
      if (!spend(p, EDU.jamb, 'JAMB registration')) return no(`JAMB form is ${naira(EDU.jamb)}.`);
      const score = Math.round(clamp(140 + rand(0, 120) + (p.skills.admin || 0) * 4 + (p.edu.attended || 0) * 0.3 + rand(-20, 20), 90, 360));
      p.edu.jamb = score;
      log(p, '📝', `JAMB result: ${score}.`, score >= 180 ? 'good' : 'bad');
      return ok(`You scored ${score} in JAMB. ${score >= 250 ? 'Medicine and Law are open to you.' : score >= 200 ? 'You are in the running for most courses.' : score >= 180 ? 'You have cleared the bar. Just.' : 'Below 180. Retake, or consider a polytechnic.'}`);
    }
    if (type === 'waec') {
      const needed = NEEDED_HOURS[2] || 45;
      if (!p.edu.enrolled) return no('Enrol in a secondary school first.');
      if ((p.edu.attended || 0) < needed) return no(`You need ${needed} hours of classes. You have ${p.edu.attended || 0}.`);
      if (!spend(p, EDU.waec, 'WAEC registration')) return no(`WAEC is ${naira(EDU.waec)}.`);
      const credits = Math.round(clamp(4 + rand(0, 5) + (p.edu.attended / needed) * 3, 1, 9));
      p.edu.waec = { credits, passed: credits >= 5 };
      if (credits >= 5) { p.edu.level = 2; log(p, '🎓', `WAEC: ${credits} credits including Maths and English. You are done with secondary school.`, 'good'); }
      else { log(p, '🎓', `WAEC: ${credits} credits. You did not make five. GCE is calling.`, 'bad'); need(p, 'fun', -12); }
      return ok(`WAEC: ${credits} credits. ${credits >= 5 ? 'Including English and Maths. You are a Secondary School Leaver.' : 'Not enough. Nobody saw anything.'}`);
    }
    if (type === 'finals') {
      const needed = NEEDED_HOURS[p.edu.level + 1] || 60;
      if (!p.edu.enrolled) return no('You are not a student.');
      if ((p.edu.attended || 0) < needed) return no(`You need ${needed} hours before finals. You have ${p.edu.attended || 0}.`);
      if (p.edu.feesDue > 0) return no('No fees, no exam. This is Nigeria.');
      const course = COURSE_BY_ID[p.edu.course] || COURSES[3];
      const grade = ['Pass','Third Class','Second Class Lower','Second Class Upper','First Class'][Math.round(clamp(rand(0, 4) + (p.edu.attended / needed) * 0.7, 0, 4))];
      p.edu.level = p.edu.course === 'poly' ? 3 : 4;
      p.edu.enrolled = false; p.edu.attended = 0;
      log(p, '🎓', `You graduated with a ${grade} in ${course.name}.`, 'good');
      p.stats.clout = clamp(p.stats.clout + 5, 0, 100);
      return ok(`${grade} in ${course.name}. Congratulations — now the real problem begins. Do NYSC or get a job.`);
    }
    return no('Which exam?');
  },
  'edu.apply': (ctx, { courseId }) => {
    const p = ctx.p;
    const c = COURSE_BY_ID[courseId]; if (!c) return no('Pick a course.');
    const v = VENUE_BY_ID[p.venueId];
    if (!v || v.type !== 'uni') return no('Go to a university.');
    if ((p.edu.level || 0) < 2) return no('You need WAEC first.');
    if (!p.edu.jamb) return no('No JAMB result. Write JAMB first.');
    if (p.edu.jamb < c.cutoff) return no(`${c.name} needs ${c.cutoff} in JAMB. You have ${p.edu.jamb}.`);
    const fee = Math.round(c.fee * (1 + world.macro.inflation * 0.5));
    p.edu.enrolled = true; p.edu.institution = v.name; p.edu.course = courseId;
    p.edu.feesDue = fee; p.edu.attended = 0; p.edu.year = 1;
    log(p, '🎓', `Admitted into ${c.name} at ${v.name}. School fees: ${naira(fee)}.`, 'good');
    return ok(`Admitted to study ${c.name} at ${v.name}. Fees: ${naira(fee)} per session. ${c.years} years, if ASUU allows.`);
  },
  'edu.nysc': (ctx, {}) => {
    const p = ctx.p;
    if ((p.edu.level || 0) < 4) return no('You need a degree or HND before NYSC.');
    if (p.edu.nysc) return no('You have already served. Once is enough.');
    const city = pick(CITIES.filter(c => c.id !== p.cityId));
    const district = pick(city.districts);
    p.edu.nysc = true;
    p.cityId = city.id; p.districtId = `${city.id}:${district.id}`; p.venueId = null;
    p.home.type = 'lodge'; p.home.rentMonthly = 8_000;
    log(p, '🇳🇬', `You have been posted to ${city.name} for NYSC. Lodge rent: ₦8,000/month. Allawee: ₦77,000.`, 'good');
    return ok(`POSTED TO ${city.name.toUpperCase()}. Report to camp. Khaki awaits.`);
  },
  'edu.bootcamp': (ctx, {}) => {
    const p = ctx.p;
    const v = VENUE_BY_ID[p.venueId];
    if (!v || v.type !== 'techhub') return no('Go to a tech hub (CcHub, Andela, Yaba…).');
    if (!spend(p, EDU.bootcamp, 'Tech bootcamp')) return no(`The bootcamp is ${naira(EDU.bootcamp)}.`);
    addSkill(p, 'tech', 2.2); addSkill(p, 'design', 0.6);
    ff(p, 40);
    log(p, '💻', 'You survived a 6-month tech bootcamp. Tech skill up.', 'good');
    return ok('Six months of tutorials, tears and Stack Overflow. Tech skill +2. Remote jobs are now within reach.');
  },

  /* ══════════════════════════ POLITICS ══════════════════════════ */
  'politics.info': (ctx, {}) => {
    const p = ctx.p;
    return ok('INEC.', {
      pvc: p.politics.pvc, party: p.politics.party, campaigning: p.politics.campaigning,
      parties: PARTIES, offices: OFFICES, election: world.macro.election, month: world.monthIndex, votes: p.politics.votes,
    });
  },
  'politics.pvc': (ctx, {}) => {
    const p = ctx.p;
    if (p.politics.pvc) return no('You already have a PVC. Use it.');
    const v = VENUE_BY_ID[p.venueId];
    if (!v || !['inec','nimc','govt'].includes(v.type)) return no('Go to an INEC or NIMC office. (It is free. Ignore the man outside.)');
    ff(p, 2);
    p.politics.pvc = true;
    log(p, '🗳️', 'You are now a registered voter. Your PVC will be ready in 3 working years.', 'good');
    return ok('Registered. PVC collected. You may now be disappointed in high definition.');
  },
  'politics.join': (ctx, { partyId }) => {
    const p = ctx.p;
    const party = PARTIES.find(x => x.id === partyId); if (!party) return no('Which party?');
    if (p.politics.party === partyId) return no('You are already a member. Defecting costs extra.');
    if (p.politics.party) { p.stats.reputation = clamp(p.stats.reputation - 5, 0, 100); }
    p.politics.party = partyId;
    addSkill(p, 'clout', 0.3);
    log(p, party.emoji, `You joined ${party.name}.`, 'info');
    return ok(`You are now ${party.emoji} ${party.name}. ${pick(['“On your mandate we shall stand.”','“Power to the people.”','“We move.”'])}`);
  },
  'politics.campaign': (ctx, { type }) => {
    const p = ctx.p;
    if (!p.politics.party) return no('Join a party first.');
    const defs = {
      rally:     { cost: 250_000, votes: 180, clout: 3, heat: 0, name: 'Rally with buses and T-shirts' },
      door2door: { cost: 60_000,  votes: 70,  clout: 1, heat: 0, name: 'Door-to-door canvassing' },
      socials:   { cost: 45_000,  votes: 110, clout: 2.5, heat: 0, name: 'Online campaign (Squawk war)' },
      thugs:     { cost: 180_000, votes: 260, clout: 0, heat: 18, name: 'Mobilise “logistics boys”' },
      church:    { cost: 90_000,  votes: 120, clout: 1.5, heat: 0, name: 'Courteous visit to a megachurch' },
    };
    const d = defs[type]; if (!d) return no('What kind of campaign?');
    if (!spend(p, d.cost, `Campaign: ${d.name}`)) return no(`${d.name} costs ${naira(d.cost)}.`);
    if (type === 'socials' && !useData(p, 20)) return no('No data. Your campaign died in the draft.');
    const mult = 1 + (p.skills.clout || 0) * 0.12 + (p.stats.clout / 100);
    p.politics.campaigning = (p.politics.campaigning || 0) + Math.round(d.votes * mult / 10);
    p.politics.votes = (p.politics.votes || 0) + Math.round(d.votes * mult);
    p.stats.clout = clamp(p.stats.clout + d.clout, 0, 100);
    p.stats.heat = clamp(p.stats.heat + d.heat, 0, 100);
    if (d.heat) log(p, '🚨', 'The DSS has a file. It has your picture on it.', 'bad');
    ff(p, 3);
    return ok(`${d.name} done. +${Math.round(d.votes * mult)} votes banked.`);
  },
  'politics.run': (ctx, { officeId, partyId }) => {
    const p = ctx.p;
    const off = OFFICES.find(o => o.id === officeId); if (!off) return no('Which office?');
    if (!p.politics.pvc) return no('You need a PVC to run. Law is law.');
    if (!partyId && !p.politics.party) return no('You need a party structure behind you.');
    if (!spend(p, off.cost, `Campaign funds: ${off.name}`)) return no(`${off.name} needs ${naira(off.cost)} in “logistics”.`);
    p.politics.office = officeId;
    if (partyId) p.politics.party = partyId;
    p.politics.campaigning = (p.politics.campaigning || 0) + 2;
    addNews('🏛️', `${p.name} has declared for ${off.name}. “I am not a politician, I am a servant.”`, 'politics');
    log(p, '🏛️', `You are now contesting for ${off.name}.`, 'good');
    return ok(`You are officially contesting for ${off.name}. Campaign hard — the election is coming.`);
  },
  'politics.steal': (ctx, {}) => {
    const p = ctx.p;
    if (!p.politics.office) return no('You are not in office. Nothing to divert.');
    const off = OFFICES.find(o => o.id === p.politics.office);
    const take = Math.round(off.income * rand(0.4, 2.2));
    p.bank += take; p.stats.heat = clamp(p.stats.heat + rand(12, 30), 0, 100);
    p.stats.reputation = clamp(p.stats.reputation - rand(5, 18), 0, 100);
    recalc(p);
    log(p, '💼', `You “awarded a contract” to a company you own. ${naira(take)}.`, 'bad');
    return ok(`₦${take.toLocaleString('en-NG')} has been “released for constituency projects”. The EFCC has a 40% chance of reading about it.`);
  },

  /* ══════════════════════════ FAITH ══════════════════════════ */
  'faith.join': (ctx, { faith }) => {
    const p = ctx.p;
    if (!FAITHS[faith]) return no('Which faith?');
    p.faith.faith = faith; p.faith.devotion = clamp(p.faith.devotion, 5, 100);
    if (faith === 'none') return ok('You have decided to keep your Sundays to yourself. Somewhere, your mother feels a chill.');
    log(p, FAITHS[faith].emoji, `You joined ${FAITHS[faith].name}.`, 'info');
    return ok(`You are now ${FAITHS[faith].name}. ${FAITHS[faith].leader ? `${FAITHS[faith].leader} will be in touch.` : ''}`);
  },
  'faith.attend': (ctx, { venueId }) => {
    const p = ctx.p;
    const v = VENUE_BY_ID[venueId || p.venueId];
    if (!v) return no('Go to a place of worship.');
    const f = FAITHS[p.faith.faith];
    if (!f || f.place !== v.type) return no(`This is a ${v.type}. Your faith gathers at a ${f ? f.place : 'place of worship'}.`);
    ff(p, 2.5);
    need(p, 'fun', 16); p.faith.devotion = clamp(p.faith.devotion + 9, 0, 100);
    p.faith.streak++;
    p.stats.reputation = clamp(p.stats.reputation + 1.2, 0, 100);
    if (p.faith.streak % 6 === 0) { p.social.friends = p.social.friends || []; log(p, f.emoji, 'Six services in a row. The ushers have started saving you a seat.', 'good'); }
    return ok(`${pick(['The choir carried the roof off.','You shouted the loudest Amen and meant it.','The sermon was 90 minutes and you did not check your phone once.','You left lighter than you came.','Somebody prophesied over you. It was vaguely specific.'])} Devotion: ${Math.round(p.faith.devotion)}%.`);
  },
  'faith.tithe': (ctx, { amount }) => {
    const p = ctx.p;
    const f = FAITHS[p.faith.faith];
    if (!f || f.place === null) return no('You have no place of worship.');
    amount = Math.round(amount);
    if (amount <= 0) return no('Even the widow’s mite was something.');
    if (!spend(p, amount, `${f.givingName}`)) return no('You cannot give what you do not have.');
    const blessing = clamp(amount / 25_000, 0.4, 14);
    p.faith.devotion = clamp(p.faith.devotion + blessing, 0, 100);
    p.stats.reputation = clamp(p.stats.reputation + 1.5, 0, 100);
    // blessings are real, occasionally
    if (chance(0.22)) {
      const windfall = Math.round(amount * rand(1.5, 5));
      earn(p, windfall, 'Sudden blessing');
      log(p, '✨', `You gave ${naira(amount)}. Three days later, ${naira(windfall)} found you from nowhere. Testimony!`, 'good');
      return ok(`You gave ${naira(amount)}. Something opens. Days later: ${naira(windfall)}. Somebody say “it is well”.`);
    }
    return ok(`${f.givingName} of ${naira(amount)} given. Devotion: ${Math.round(p.faith.devotion)}%. ${pick(['“The Lord bless you.”','“As you sow…”','“God is not a debtor to any man.”'])}`);
  },
  'faith.pray': (ctx, { intention }) => {
    const p = ctx.p;
    ff(p, 0.5);
    p.faith.devotion = clamp(p.faith.devotion + 2, 0, 100);
    need(p, 'fun', 5);
    const result = chance(0.3) ? pick([
      'You feel a strange peace about the matter.',
      'Nothing happens immediately, but you feel lighter.',
      'You remembered somebody you need to forgive. Not now though.',
    ]) : 'You prayed. You still have to do the work.';
    return ok(result);
  },
  'faith.miracle': (ctx, {}) => {
    const p = ctx.p;
    const f = FAITHS[p.faith.faith];
    if (!f || f.place === null) return no('You need faith first.');
    if (p.faith.devotion < 55) return no('Your faith is not at that level yet. (Devotion 55+ needed.)');
    if (chance(0.35)) {
      const heal = pick(p.health.illnesses);
      if (heal) { p.health.illnesses = p.health.illnesses.filter(i => i.id !== heal.id); need(p, 'health', 30); return ok(`Deliverance. The ${ILLNESS_BY_ID[heal.id].name.toLowerCase()} has left your body. Somebody is shouting.`); }
      const money = Math.round(rand(30_000, 400_000));
      earn(p, money, 'Breakthrough');
      return ok(`Breakthrough! ${naira(money)} arrived through a channel you cannot explain.`);
    }
    if (chance(0.3)) {
      p.stats.reputation = clamp(p.stats.reputation - 8, 0, 100);
      p.faith.devotion = clamp(p.faith.devotion - 10, 0, 100);
      need(p, 'fun', -10);
      return ok(`The “miracle” did not happen and the video is online. People are laughing. Devotion damaged.`);
    }
    return ok('Nothing happened, but you did not come for nothing. Come again on Sunday.');
  },

  /* ══════════════════════════ HEALTH ══════════════════════════ */
  'health.info': (ctx, {}) => {
    const p = ctx.p;
    return ok('Health.', {
      illnesses: p.health.illnesses.map(i => ({ ...ILLNESS_BY_ID[i.id], left: Math.round(i.left) })),
      health: Math.round(p.needs.health), hmo: p.health.hmo,
      prices: { consult: HEALTH.consult, drugs: HEALTH.drugs, admit: HEALTH.admission, hmoMonthly: HEALTH.hmoMonthly },
    });
  },
  'health.selfMedicate': (ctx, {}) => {
    const p = ctx.p;
    if (!p.health.illnesses.length) return no('You are not sick. Take the win.');
    if (!spend(p, 3_500, 'Chemist run')) return no('Even self-medication costs ₦3,500.');
    const ill = p.health.illnesses[0];
    if (chance(HEALTH.selfMedicateFailChance)) {
      damage(p, 'health', 8);
      ill.left += 30;
      log(p, '💊', 'You took “something for malaria”. It was not malaria. You feel worse.', 'bad');
      return ok('The chemist gave you ampiclox and something for typhoid. You are now worse and also broke.');
    }
    p.health.illnesses.shift(); need(p, 'health', 12);
    return ok('It worked. Probably. (Nigerians have been doing this for decades. Sometimes it ends well.)');
  },
  'health.pharmacy': (ctx, {}) => {
    const p = ctx.p;
    const v = VENUE_BY_ID[p.venueId];
    if (!v || v.type !== 'pharmacy') return no('Find a pharmacy.');
    const cost = Math.round(HEALTH.drugs * (p.health.illnesses.length ? 1 : 0.5));
    if (!spend(p, cost, 'Pharmacy')) return no(`That is ${naira(cost)}.`);
    if (p.health.illnesses.length) { p.health.illnesses.shift(); need(p, 'health', 22); return ok(`You bought the real drugs. ${naira(cost)}. You will live.`); }
    need(p, 'health', 5);
    return ok(`You bought supplements and paracetamol you did not need. ${naira(cost)}.`);
  },
  'health.hospital': (ctx, { service }) => {
    const p = ctx.p;
    const v = VENUE_BY_ID[p.venueId];
    if (!v || v.type !== 'hospital') return no('Go to a hospital.');
    if (service === 'consult') {
      if (!spend(p, HEALTH.consult, 'Consultation')) return no(`Consultation is ${naira(HEALTH.consult)}. ${pick(['Health is wealth.','You should have been eating.'])}`);
      ff(p, 2);
      if (!p.health.illnesses.length) { need(p, 'health', 4); return ok('Doctor says you are fine. “Just rest and drink water.” ₦5,000.'); }
      const ill = p.health.illnesses[0];
      const correct = !chance(HEALTH.diagnosisFailChance);
      if (correct) return ok(`Diagnosed: ${ILLNESS_BY_ID[ill.id].name}. Recommended: ${ILLNESS_BY_ID[ill.id].cure}.`, { diagnosis: ill.id });
      return ok(`They diagnosed you with “${pick(['ulcer','malaria','stress','typhoid'])}” and gave you drugs. It is not what you have.`, { diagnosis: null });
    }
    if (service === 'treat') {
      if (!p.health.illnesses.length) return no('Nothing to treat.');
      const ill = p.health.illnesses[0];
      const def = ILLNESS_BY_ID[ill.id];
      const cost = Math.round(rand(def.cost[0], def.cost[1]) * (p.health.hmo ? 0.35 : 1));
      if (!spend(p, cost, `Treatment: ${def.name}`)) return no(`Treatment is ${naira(cost)}. ${p.health.hmo ? 'Even with HMO.' : 'No HMO, no discount.'}`);
      p.health.illnesses.shift(); need(p, 'health', 30); ff(p, 4);
      return ok(`Treated for ${def.name}. ${naira(cost)}. ${pick(['Rest well.','Drink plenty of water.','Come back if it persists.'])}`);
    }
    if (service === 'admit') {
      const cost = HEALTH.admission * (p.health.hmo ? 0.4 : 1);
      if (!spend(p, cost, 'Admission')) return no(`Admission is ${naira(cost)}.`);
      p.health.illnesses = []; need(p, 'health', 70); ff(p, 20);
      return ok(`Admitted for three days. ${naira(cost)}. You watched a lot of Africa Magic.`);
    }
    if (service === 'hmo') {
      if (p.health.hmo) return no('You already have an HMO plan.');
      if (!spend(p, HEALTH.hmoMonthly, 'HMO subscription')) return no(`HMO is ${naira(HEALTH.hmoMonthly)} a month.`);
      p.health.hmo = true;
      return ok('HMO active. Treatment is 60% cheaper and your health drains slower.');
    }
    return no('Which service?');
  },

  /* ══════════════════════════ CRIME & POLICE ══════════════════════════ */
  'crime.do': (ctx, { type }) => {
    const p = ctx.p;
    const c = CRIME[type]; if (!c) return no('Do what?');
    if (c.requiresOffice && !p.politics.office) return no('You need to hold public office to pull that off.');
    if (p.crime.cellMonths > 0) return no('You are in a cell. Sit down.');
    if (p.needs.energy < 18) return no('Not in this condition. Rest first.');
    const skill = p.skills[c.skill] || 0;
    ff(p, c.time / 60);
    need(p, 'fun', -4);
    // success chance scales with skill; failure means you get nothing and gain heat
    const successChance = clamp(0.45 + skill * 0.07, 0.25, 0.9);
    if (!chance(successChance)) {
      p.stats.heat = clamp(p.stats.heat + c.heat * 0.6, 0, 100);
      need(p, 'health', -4);
      return ok(`It did not work out. You came away with nothing and a bad feeling. ${pick(['The police drove past twice.','The guy you were meeting did not show.','The network hung at 99%.','Somebody you know saw you.'])}`);
    }
    const take = Math.round(rand(c.min, c.max) * (1 + skill * 0.15));
    earn(p, take, c.name);
    p.stats.heat = clamp(p.stats.heat + c.heat, 0, 100);
    addSkill(p, c.skill, 0.3);
    // arrest?
    const arrestChance = clamp((c.heat / 100) * (p.stats.heat / 100) * 0.9 + world.macro.travelDanger * 0.05, 0, 0.6);
    if (chance(arrestChance)) {
      p.crime.cellMonths = 1;
      p.crime.record.push({ what: c.name, month: world.monthIndex });
      log(p, '🚓', `ARRESTED. They traced it back to you. You are in the cell at the station.`, 'bad');
      return ok(`${naira(take)} — and then headlights, boots, and a voice saying “hands where we can see them.” You are UNDER ARREST.`, { arrested: true });
    }
    return ok(`${c.emoji} ${c.name}: ${naira(take)}. ${pick(['Nobody saw anything.','Your phone has never been cleaner.','You slept badly that night.','Money entered and you felt nothing.'])} Heat: ${Math.round(p.stats.heat)}%`);
  },
  'police.info': (ctx, {}) => {
    const p = ctx.p;
    return ok('Police station.', { heat: Math.round(p.stats.heat), cell: p.crime.cellMonths, record: p.crime.record, bribes: BRIBE, bail: BAIL_COST });
  },
  'police.bribe': (ctx, { amount }) => {
    const p = ctx.p;
    if (p.stats.heat <= 5) return no('Nobody is looking for you. Save your money.');
    amount = Math.round(amount) || BRIBE.standard;
    if (!spend(p, amount, '“Settled” the police')) return no('You cannot even afford to bribe. That is a bad combination.');
    const cleared = clamp(amount / 2_000, 5, 60);
    p.stats.heat = clamp(p.stats.heat - cleared, 0, 100);
    p.stats.reputation = clamp(p.stats.reputation - 2, 0, 100);
    return ok(`You "settled" them. ${naira(amount)} changed hands under the table. Heat is now ${Math.round(p.stats.heat)}%.`);
  },
  'police.surrender': (ctx, {}) => {
    const p = ctx.p;
    if (p.stats.heat < 40) return no('Nobody is hunting you. Why volunteer?');
    p.crime.cellMonths = 2; p.stats.heat = clamp(p.stats.heat - 40, 0, 100);
    log(p, '🚓', 'You turned yourself in. Your lawyer says it will go easier. Maybe.', 'info');
    return ok('You walked into the station yourself. Two months, or bail.');
  },
  'prison.info': (ctx, {}) => {
    const p = ctx.p;
    return ok('Correctional centre.', { cell: p.crime.cellMonths, bail: BAIL_COST, record: p.crime.record });
  },
  'prison.bail': (ctx, {}) => {
    const p = ctx.p;
    if (p.crime.cellMonths <= 0) return no('You are a free person. Act like it.');
    const cost = BAIL_COST.station * p.crime.cellMonths;
    if (!spend(p, cost, 'Bail')) return no(`Bail is ${naira(cost)}.`);
    p.crime.cellMonths = 0;
    need(p, 'fun', -25); need(p, 'hygiene', -40); p.stats.reputation = clamp(p.stats.reputation - 10, 0, 100);
    log(p, '⚖️', `Bail posted: ${naira(cost)}. You are out. You smell of the cell.`, 'info');
    return ok('You are out. Do not leave the state. Do not leave the country. Just go home and bathe.');
  },
  'prison.serve': (ctx, {}) => {
    const p = ctx.p;
    if (p.crime.cellMonths <= 0) return no('Nothing to serve.');
    p.crime.cellMonths--;
    ff(p, 24 * 30);
    need(p, 'fun', -30); need(p, 'hygiene', -50); p.stats.reputation = clamp(p.stats.reputation - 14, 0, 100);
    addSkill(p, 'street', 0.6);
    return ok(`You served your time. ${pick(['You learned things in there you cannot unlearn.','You met somebody who says he knows somebody.','You are now qualified for a job as a politician.'])}`);
  },
  'court.info': (ctx, {}) => {
    const p = ctx.p;
    return ok('High Court.', { record: p.crime.record, bail: BAIL_COST.court, reputation: Math.round(p.stats.reputation) });
  },
  'court.sue': (ctx, { username, amount }) => {
    const p = ctx.p;
    const target = byUsername.get(String(username || '').toLowerCase().replace(/^@/, ''));
    if (!target) return no('No such person.');
    if (!spend(p, 50_000, 'Court filing fees')) return no('Filing fees are ₦50,000. Justice is not free.');
    const win = chance(0.35 + (p.skills.law || 0) * 0.08 + (p.stats.reputation - 50) / 300);
    ff(p, 6);
    if (win) {
      const award = Math.round(rand(amount || 200_000, (amount || 200_000) * 2));
      if (spend(target, award, `Court judgment to @${p.name}`, { allowDebt: true }) !== false) {
        earn(p, award, 'Court judgment');
      } else { p.bank += 0; log(p, '⚖️', `You won ${naira(award)} — but @${target.name} has nothing to seize.`, 'bad'); }
      return ok(`Judgment in your favour: ${naira(award)}. Somebody shout “my lord!”`);
    }
    need(p, 'fun', -10);
    return no('Case struck out. “My lord, we shall appeal.” You appealed. It failed.');
  },
  'gov.info': (ctx, {}) => {
    const p = ctx.p;
    return ok('Government office.', { services: [
      { id:'form', name:'Collect “important” form', emoji:'📄', price:3_500 },
      { id:'cert', name:'Certificate of Origin / indigene letter', emoji:'📜', price:12_000 },
      { id:'permit', name:'Business permit', emoji:'📋', price:45_000 },
      { id:'passport', name:'Nigerian passport', emoji:'🛂', price:35_000 },
      { id:'c-of-o', name:'Certificate of Occupancy (C of O)', emoji:'🏞️', price:250_000 },
    ]});
  },
  'gov.service': (ctx, { id }) => {
    const p = ctx.p;
    const v = VENUE_BY_ID[p.venueId];
    if (!v || !['govt','inec','nimc'].includes(v.type)) return no('Go to a government office.');
    const svc = { form:{ price:3_500, name:'form', mins:60 }, cert:{ price:12_000, name:'indigene letter', mins:180 }, permit:{ price:45_000, name:'business permit', mins:300 }, passport:{ price:35_000, name:'passport', mins:420 }, 'c-of-o':{ price:250_000, name:'C of O', mins:900 } }[id];
    if (!svc) return no('No such service.');
    if (!spend(p, svc.price, `Gov: ${svc.name}`)) return no(`That is ${naira(svc.price)}.`);
    ff(p, svc.mins / 60);
    need(p, 'fun', -8);
    const bribe = chance(0.5);
    if (bribe) {
      const extra = Math.round(svc.price * 0.15);
      if (spend(p, extra, '“ facilitation”', { allowDebt: true })) {
        return ok(`You got your ${svc.name} in ${Math.round(svc.mins / 60)} hours because you “facilitated” ${naira(extra)}. The file moved from table to table.`);
      }
    }
    return ok(`You collected your ${svc.name} after ${Math.round(svc.mins / 60)} hours. ${pick(['Two officers asked if you have a file jacket.','The printer was not working. It started working after lunch.','You were asked to “come tomorrow”. You came tomorrow.'])}`);
  },

  /* ══════════════════════════ HOUSING ══════════════════════════ */
  'housing.info': (ctx, {}) => {
    const p = ctx.p;
    const d = DISTRICT_BY_ID[p.districtId];
    const tiers = Object.entries(HOUSING).filter(([k, v]) => v[d.zone] > 0).map(([k, v]) => ({
      id: k, name: v.name, emoji: v.emoji, annual: annualRent(p, p.districtId, k, world.macro.inflation), monthly: monthlyRent(p, p.districtId) && Math.round(annualRent(p, p.districtId, k, world.macro.inflation) / 12),
    }));
    return ok(`Housing in ${d.name} (${d.zone}).`, { tiers, current: p.home, land: LAND_PER_PLOT[d.zone], zone: d.zone });
  },
  'housing.rent': (ctx, { tier }) => {
    const p = ctx.p;
    const d = DISTRICT_BY_ID[p.districtId];
    const v = VENUE_BY_ID[p.venueId];
    if (!v || !['estate','home','misc'].includes(v.type)) {
      // allow from anywhere in the district for playability, but require an estate for the good ones
      if (!['single','selfcon'].includes(tier)) return no('Walk into an estate to rent at that level.');
    }
    if (!HOUSING[tier] || !HOUSING[tier][d.zone]) return no('Not available in this area.');
    const annual = annualRent(p, p.districtId, tier, world.macro.inflation);
    const upfront = Math.round(annual * (1 + 0.10 + 0.10 + 0.10));  // rent + agency + legal + caution
    if (!spend(p, upfront, `Rent: ${HOUSING[tier].name} in ${d.name}`)) return no(`You need ${naira(upfront)} upfront — that is a year’s rent plus agency (10%), legal (10%) and caution (10%).`);
    p.home = { districtId: p.districtId, type: 'rent', tier, rentMonthly: Math.round(annual / 12), landlord: pick(['Pa Johnson','Alhaji Bello','Mama Ngozi','Chief Adewale','Mr. Eze']), paidMonths: 0, annual };
    p.stats.clout = clamp(p.stats.clout + (tier === 'duplex' || tier === 'mansion' ? 6 : tier === 'miniflat' ? 3 : 1), 0, 100);
    log(p, '🔑', `You rented a ${HOUSING[tier].name.toLowerCase()} in ${d.name}. ${naira(upfront)} upfront.`, 'good');
    return ok(`You have a ${HOUSING[tier].name.toLowerCase()} in ${d.name}. ${naira(Math.round(annual / 12))} a month. Your landlord is ${p.home.landlord}. May they be merciful.`);
  },
  'housing.buy': (ctx, { tier }) => {
    const p = ctx.p;
    const d = DISTRICT_BY_ID[p.districtId];
    const v = VENUE_BY_ID[p.venueId];
    if (!v || v.type !== 'estate') return no('Walk into an estate to buy.');
    const price = Math.round(annualRent(p, p.districtId, tier, world.macro.inflation) * 11);   // ~11 years of rent
    if (!spend(p, price, `Bought ${HOUSING[tier].name} in ${d.name}`)) return no(`${HOUSING[tier].name} in ${d.name} is ${naira(price)}.`);
    p.home = { districtId: p.districtId, type: 'owned', tier, rentMonthly: 0, landlord: 'Yourself', paidMonths: 0 };
    p.properties.push({ districtId: p.districtId, tier, value: price, kind: 'home' });
    p.stats.clout = clamp(p.stats.clout + 8, 0, 100);
    recalc(p);
    log(p, '🏡', `You bought a ${HOUSING[tier].name.toLowerCase()} in ${d.name} for ${naira(price)}. You are now a landlord.`, 'good');
    return ok(`${naira(price)}. Deed signed, survey plan questionable. You own property in ${d.name}.`);
  },
  'housing.land': (ctx, {}) => {
    const p = ctx.p;
    const d = DISTRICT_BY_ID[p.districtId];
    const price = Math.round(LAND_PER_PLOT[d.zone] * (1 + world.macro.inflation * 0.6));
    if (!spend(p, price, `Plot of land in ${d.name}`)) return no(`A plot here is ${naira(price)}.`);
    p.properties.push({ districtId: p.districtId, kind: 'land', value: price });
    p.stats.clout = clamp(p.stats.clout + 5, 0, 100);
    recalc(p);
    // Omo-onile risk
    if (chance(0.3)) {
      log(p, '🧱', 'Omo-onile has arrived. They say the land belongs to their grandfather.', 'bad');
      return ok(`You bought land in ${d.name}. Two days later, “Omo Onile” arrives with a machete and a receipt book. God protect your foundation.`);
    }
    return ok(`You now own a plot in ${d.name}. ${naira(price)}. Fence it before somebody else sells it again.`);
  },

  /* ══════════════════════════ FAMILY & SOCIAL ══════════════════════════ */
  'family.info': (ctx, {}) => {
    const p = ctx.p;
    return ok('Family.', { ...p.family, owambe: OWAMBE, wedding: WEDDING_COST });
  },
  'family.call': (ctx, {}) => {
    const p = ctx.p;
    if (p.telco.airtime < 200) return no('No airtime. Your mother is calling and your line is dead.');
    p.telco.airtime -= 200;
    ff(p, 0.4);
    p.family.approval = clamp(p.family.approval + 4, 0, 100);
    p.family.pressure = clamp(p.family.pressure - 8, 0, 100);
    const lines = [
      '“Ah, my child! Have you eaten? You are losing weight.”',
      '“Your mates are married with two children. When?”',
      '“Your father was asking after you. Send something small for the house.”',
      '“We are praying for you. Don’t forget to pray too.”',
      '“That your cousin just bought a plot. In Lekki.”',
    ];
    return ok(`${pick(lines)} Family approval: ${Math.round(p.family.approval)}%.`);
  },
  'family.send': (ctx, { amount }) => {
    const p = ctx.p; amount = Math.round(amount);
    if (amount <= 0) return no('Send something real.');
    if (!spend(p, amount, 'Sent money home')) return no('You are trying to send what you do not have.');
    p.family.approval = clamp(p.family.approval + clamp(amount / 8_000, 1, 22), 0, 100);
    p.family.pressure = clamp(p.family.pressure - clamp(amount / 6_000, 1, 20), 0, 100);
    p.stats.reputation = clamp(p.stats.reputation + 0.6, 0, 100);
    return ok(`You sent ${naira(amount)} home. ${pick(['“God bless you, my child.”','“It is well.”','“Your siblings are not like this.”','“Ah! Thank you. Send small for fuel too.”'])} Approval: ${Math.round(p.family.approval)}%.`);
  },
  'family.owambe': (ctx, { type, scale }) => {
    const p = ctx.p;
    const o = OWAMBE[type]; if (!o) return no('Which event?');
    const mult = scale === 'small' ? 0.5 : scale === 'big' ? 2.2 : 1;
    const cost = Math.round(rand(o.min, o.max) * mult);
    if (!spend(p, cost, `Owambe: ${o.name}`, { allowDebt: true })) return no(`${o.name} will cost you ${naira(cost)}.`);
    ff(p, 5);
    need(p, 'fun', 30); need(p, 'hunger', 25); p.stats.clout = clamp(p.stats.clout + 2.5, 0, 100);
    p.family.approval = clamp(p.family.approval + 3, 0, 100);
    return ok(`${o.emoji} You showed up properly. ${naira(cost)}. ${pick(['The jollof was爭 contested.','You danced until your agbada gave up.','Somebody asked when your own is coming.','You ate small rice and one meat. One.','The MC called your name out and you sprayed money you did not budget.'])}`);
  },
  'social.marry': (ctx, { username, style }) => {
    const p = ctx.p;
    const target = byUsername.get(String(username || '').toLowerCase().replace(/^@/, ''));
    if (!target) return no('No such person.');
    if (p.family.spouse) return no('You are already married. Calm down.');
    if (target.family.spouse) return no(`${target.name} is already taken.`);
    const styleCost = WEDDING_COST[style] || WEDDING_COST.traditional;
    if (p.social.friends.includes(target.username) === false && (p.skills.clout || 0) < 2 && chance(0.7)) {
      return no(`${target.name} says: “We just met. Let’s not rush.” (Befriend them first, or be famous.)`);
    }
    if (!spend(p, styleCost, `Wedding (${style})`)) return no(`A ${style} wedding is ${naira(styleCost)}. Love is free. Owambe is not.`);
    p.family.spouse = { name: target.name, username: target.username };
    target.family.spouse = { name: p.name, username: p.username };
    p.family.approval = clamp(p.family.approval + 25, 0, 100);
    p.family.pressure = 0;
    ff(p, 8);
    need(p, 'fun', 40);
    addNews('💍', `${p.name} and ${target.name} are married. The reception has three live bands.`, 'culture');
    return ok(`You married @${target.name}. The aso-ebi alone was a mortgage. Congratulations!`);
  },
  'social.befriend': (ctx, { username }) => {
    const p = ctx.p;
    const target = byUsername.get(String(username || '').toLowerCase().replace(/^@/, ''));
    if (!target) return no('No such person.');
    if (target.id === p.id) return no('You are your own friend already. Hopefully.');
    p.social.friends = p.social.friends || [];
    if (p.social.friends.includes(target.username)) return no('Already friends.');
    p.social.friends.push(target.username);
    p.social.followers += 1;
    need(p, 'fun', 6);
    return ok(`You and @${target.name} are now connected. ${pick(['“How far na?”','“Guy, long time.”','“Let’s link up for small chops.”'])}`);
  },
  'social.beef': (ctx, { username }) => {
    const p = ctx.p;
    const target = byUsername.get(String(username || '').toLowerCase().replace(/^@/, ''));
    if (!target) return no('No such person.');
    if (!useData(p, 6)) return no('No data. Your beef must wait.');
    p.social.beefs = p.social.beefs || [];
    if (p.social.beefs.includes(target.username)) return no('This beef is already cold. Move on.');
    p.social.beefs.push(target.username);
    p.stats.clout = clamp(p.stats.clout + rand(-4, 7), 0, 100);
    addNews('🔥', `${p.name} and ${target.name} are going at it on Squawk. Twitter is having a feast.`, 'culture');
    return ok(`You started a beef with @${target.name}. ${pick(['The timeline has chosen violence today.','Screenshots are already circulating.','This will be a 3-part voice note.','Nobody remembers who started it. Only who won.'])}`);
  },

  /* ══════════════════════════ FAME ══════════════════════════ */
  'social.post': (ctx, { text }) => {
    const p = ctx.p;
    if (!text || text.length < 3) return no('Say something worth posting.');
    if (text.length > 280) return no('Even Squawk has limits — 280 characters.');
    if (!useData(p, DATA_COST_MB.post)) return no('No data. Your hot take died in the draft.');
    const quality = clamp(
      (text.length > 40 ? 1.5 : 0.5) +
      (p.skills.clout || 0) * 0.6 +
      (p.stats.clout / 22) +
      rand(-1, 3) +
      (/(naira|₦|naija|lagos|abuja|fuel|nepa|ASUU|JAMB|Eagles|owambe|detty|sapa|japa|shayo|soft|cruise|gobe|gbese)/i.test(text) ? 2 : 0),
      0, 14
    );
    const post = { id: 'p' + Date.now().toString(36), by: p.name, username: p.username, text, likes: Math.round(quality * 3), t: Date.now(), clout: Math.round(p.stats.clout) };
    world.posts.unshift(post);
    if (world.posts.length > 60) world.posts.length = 60;
    p.stats.clout = clamp(p.stats.clout + quality * 0.35, 0, 100);
    p.social.followers += Math.round(quality * 2);
    addSkill(p, 'clout', 0.1);
    return ok(`Posted. ${post.likes} likes in the first minute. ${quality > 7 ? 'It is TRENDING. Your phone will not stop.' : quality > 3 ? 'Solid engagement. Your aunties liked it.' : 'Two likes. One is your own second account.'}`);
  },
  'social.feed': (ctx, {}) => {
    return ok('Timeline.', { posts: world.posts.slice(0, 30) });
  },
  'social.like': (ctx, { postId }) => {
    const p = ctx.p;
    const post = world.posts.find(x => x.id === postId);
    if (!post) return no('Post no longer exists.');
    if (!useData(p, 0.5)) return no('No data.');
    post.likes++;
    return ok('Liked.');
  },
  'social.video': (ctx, { caption }) => {
    const p = ctx.p;
    if (!useData(p, DATA_COST_MB.video)) return no('A video needs data. You have none.');
    if (p.needs.energy < 15) return no('You cannot fake energy on camera. Rest first.');
    ff(p, 1.5);
    const quality = clamp((p.skills.acting || 0) + (p.skills.music || 0) + (p.stats.clout / 20) + rand(0, 5), 0, 14);
    const views = Math.round(clamp(quality * 900 * (1 + p.social.followers / 1000), 30, 4_000_000));
    p.social.followers += Math.round(views / 900);
    p.stats.clout = clamp(p.stats.clout + quality * 0.55, 0, 100);
    addSkill(p, 'clout', 0.25);
    const money = views > 50_000 ? Math.round(views / 18) : 0;
    if (money) earn(p, money, 'Brand deal from video');
    return ok(`Skitter video posted: ${views.toLocaleString('en-NG')} views. ${money ? `A skincare brand has DM’d you ${naira(money)}.` : 'No brand deals yet. Keep going.'}`);
  },
  'music.record': (ctx, { title }) => {
    const p = ctx.p;
    const studio = Math.round(rand(35_000, 190_000) * (1 + p.stats.clout / 90));
    if (!spend(p, studio, 'Studio session')) return no(`Studio time is ${naira(studio)}. Even a laptop and a cracked DAW cost somebody's rent.`);
    ff(p, 4);
    const q = clamp((p.skills.music || 0) * 1.4 + rand(0, 6) + p.stats.clout / 25, 1, 20);
    const single = { title: title || pick(['Sapa No Dey Finish','Lagos Nights','Odogwu Anthem','Area Vibes','Japa or Jaga','Blessings Pt. 2']), q: Math.round(q), streams: 0, released: false };
    p.music.singles.push(single);
    addSkill(p, 'music', 0.5);
    return ok(`“${single.title}” recorded. Quality ${Math.round(q)}/20. Release it and watch the numbers.`);
  },
  'music.release': (ctx, { index }) => {
    const p = ctx.p;
    const s = p.music.singles[index ?? p.music.singles.length - 1];
    if (!s) return no('You have no song to release.');
    if (s.released) return no('Already out.');
    if (!useData(p, 25)) return no('Distribution needs data.');
    s.released = true;
    const streams = Math.round(clamp(s.q * 4_000 * (1 + p.social.followers / 800) * (1 + p.stats.clout / 40), 500, 9_000_000));
    s.streams = streams;
    p.music.streams += streams;
    p.music.fans += Math.round(streams / 1500);
    p.stats.clout = clamp(p.stats.clout + clamp(s.q * 0.6, 0, 12), 0, 100);
    addSkill(p, 'music', 0.4);
    addNews('🎵', `${p.name} drops “${s.title}” — ${streams.toLocaleString('en-NG')} streams in 24 hours.`, 'culture');
    return ok(`“${s.title}” is out. ${streams.toLocaleString('en-NG')} streams. ${streams > 500_000 ? 'BoomNaija has it on the front page.' : streams > 50_000 ? 'Solid. The blogs are picking it up.' : 'Your mother reposted it. That is your core audience.'}`);
  },
  'music.show': (ctx, {}) => {
    const p = ctx.p;
    const v = VENUE_BY_ID[p.venueId];
    if (!v || !['club','stadium','hotel','leisure'].includes(v.type)) return no('You need a venue: club, stadium, hotel or event centre.');
    if (!p.music.singles.length) return no('You need at least one song.');
    const fee = Math.round(clamp(p.music.fans * 1_400 + p.stats.clout * 4_000 + rand(20_000, 180_000), 30_000, 12_000_000));
    earn(p, fee, 'Show');
    ff(p, 4);
    need(p, 'fun', 20); need(p, 'energy', -14);
    p.stats.clout = clamp(p.stats.clout + 3, 0, 100);
    addSkill(p, 'music', 0.3);
    return ok(`You performed at ${v.name} for ${naira(fee)}. ${pick(['The crowd sang your chorus back to you.','The sound system fought you the whole set.','Somebody threw money. You did not see who.','You closed with your biggest song and left the stage.'])}`);
  },
  'music.royalties': (ctx, {}) => {
    const p = ctx.p;
    const due = Math.round(p.music.streams * 0.42);
    if (due <= 0) return no('No streams, no royalties. The industry is honest about this one thing.');
    p.music.streams = 0;
    earn(p, due, 'Streaming royalties');
    return ok(`Royalties: ${naira(due)}. (About ₦0.42 per stream. This is why shows matter.)`);
  },

  /* ══════════════════════════ BETTING ══════════════════════════ */
  'bet.place': (ctx, { amount, odds }) => {
    const p = ctx.p;
    const v = VENUE_BY_ID[p.venueId];
    if (!v || v.type !== 'casino') return no('Find a betting shop.');
    amount = Math.round(amount);
    if (amount < 200) return no('Minimum stake is ₦200.');
    if (amount > 500_000) return no('Maximum stake is ₦500,000. Even SureOdds has limits.');
    const o = clamp(odds || rand(1.4, 9), 1.1, 25);
    if (!spend(p, amount, 'Bet staked')) return no('You cannot stake what you do not have.');
    ff(p, 0.5);
    if (chance(1 / o)) {
      const win = Math.round(amount * o);
      earn(p, win, 'Bet won');
      // addiction risk
      if (chance(0.12) && !p.health.illnesses.some(i => i.id === 'addiction')) {
        p.health.illnesses.push({ id: 'addiction', left: 24 * 60 });
      }
      return ok(`YOU WON ${naira(win)} at ${o.toFixed(2)} odds. ${pick(['The shop owner is not happy.','You will remember this day.','You are now a betting expert. You are not.'])}`);
    }
    need(p, 'fun', -6);
    return ok(`You lost ${naira(amount)}. ${pick(['One leg cut your ticket. One.','The 94th minute goal. Of course.','You are one game away. Forever.','“Calculated risk,” you tell yourself.'])}`);
  },
};

function requireEntry(v) {
  const t = v.type;
  const map = { club: 3_000, beach: 2_000, cinema: 4_500, museum: 1_500, leisure: 1_000, stadium: 1_500, viewing: 500, hotel: 0, gym: 0 };
  return map[t] || 0;
}
