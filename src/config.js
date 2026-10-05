/**
 * NAIJA LIFE — MASTER CONFIG
 * Every number in the game lives here. Tuned to real Nigeria, October 2026.
 * Sources: National Minimum Wage Act (₦70,000 federal, ₦85,000 Lagos),
 * pump price surveys (₦1,200–1,400/L), Nigeria Property Centre rentals,
 * telco 2026 data tariff sheets. Change anything — the game reads this live.
 */

/* ─────────────────────────── TIME ─────────────────────────── */
export const TIME = {
  tickMs: 1000,            // one server tick
  minPerTick: 4,           // 1 real second = 4 game minutes
  hoursPerMonth: 60,       // a "month" = 2.5 game days = 15 real minutes
  get minPerHour() { return 60; },
  get ticksPerGameDay() { return (24 * 60) / this.minPerTick; },   // 360 ticks = 6 real min
  get ticksPerMonth() { return (this.hoursPerMonth * 60) / this.minPerTick; }, // 900 ticks
};

/* ─────────────────────────── NEEDS ─────────────────────────── */
// Drain per game hour at 0..100 scale. 100 energy ≈ 62 game hours awake.
export const NEEDS = {
  energy:   { max: 100, start: 85, drainPerHour: 1.6,  low: 15 },
  hunger:   { max: 100, start: 70, drainPerHour: 4.2,  low: 15 },
  hygiene:  { max: 100, start: 80, drainPerHour: 2.8,  low: 15 },
  fun:      { max: 100, start: 60, drainPerHour: 3.2,  low: 15 },
  health:   { max: 100, start: 92, drainPerHour: 0.0,  low: 20 },
};
export const SLEEP_RECOVERY_PER_HOUR = 11;

// Health damage when a need is starved (per game hour)
export const STARVE_DAMAGE = { hunger: 1.6, energy: 0.9, hygiene: 0.4, fun: 0.3 };

/* ─────────────────────── MONEY / MACRO ─────────────────────── */
export const MACRO = {
  minWage: 70_000,              // federal monthly minimum wage (2026)
  minWageLagos: 85_000,
  avgSalary: 300_000,           // national average monthly salary
  fuelPrice: 1_250,             // ₦ / litre PMS — drifts with news events
  fuelVolatility: 0.06,
  usdNaira: 1_480,              // parallel-market-ish rate
  inflation: 0.22,              // annual, drives annual rent review
  bandA_kWh: 209,               // Band A tariff ₦/kWh
  bandB_kWh: 63,
};

/* ───────────────────────── FOOD (₦) ───────────────────────── */
export const FOOD = [
  { id:'amala',    name:'Amala & ewedu',        emoji:'🍲', price:1_500, hunger:38, health:1,  where:['food'] },
  { id:'eba',      name:'Eba & egusi',          emoji:'🍛', price:1_800, hunger:42, health:1,  where:['food'] },
  { id:'jollof',   name:'Jollof rice',          emoji:'🍚', price:2_500, hunger:40, health:0,  where:['food'] },
  { id:'rice',     name:'White rice & stew',    emoji:'🍚', price:1_800, hunger:40, health:0,  where:['food'] },
  { id:'indomie',  name:'Indomie (2 packs)',    emoji:'🍜', price:900,   hunger:26, health:-1, where:['food','home'] },
  { id:'akara',    name:'Akara & pap',          emoji:'🥣', price:800,   hunger:24, health:1,  where:['food'] },
  { id:'bole',     name:'Bole & fish',          emoji:'🍠', price:2_200, hunger:34, health:1,  where:['food'] },
  { id:'suya',     name:'Suya (big one)',       emoji:'🍢', price:2_500, hunger:32, health:-1, where:['food','club'] },
  { id:'shawarma', name:'Shawarma',             emoji:'🌯', price:3_000, hunger:30, health:0,  where:['food'] },
  { id:'corn',     name:'Roasted corn',         emoji:'🌽', price:600,   hunger:14, health:1,  where:['market'] },
  { id:'okpa',     name:'Okpa',                 emoji:'🥟', price:500,   hunger:16, health:1,  where:['market'] },
  { id:'kilishi',  name:'Kilishi',              emoji:'🥩', price:1_200, hunger:20, health:0,  where:['market'] },
  { id:'water',    name:'Bottled water',        emoji:'💧', price:300,   hunger:4,  health:1,  where:['food','market','mall'] },
  { id:'purewater',name:'Pure water (bag)',     emoji:'💦', price:250,   hunger:3,  health:1,  where:['market'] },
  { id:'malt',     name:'Malt',                 emoji:'🥤', price:900,   hunger:6,  fun:4,     where:['food','club','mall'] },
  { id:'beer',     name:'Star lager',           emoji:'🍺', price:1_400, hunger:5,  fun:9, health:-1, where:['club','food'] },
  { id:'chapman',  name:'Chapman',              emoji:'🍹', price:1_800, hunger:6,  fun:7,     where:['club','food'] },
  { id:'pepper',   name:'Pepper soup',          emoji:'🍜', price:3_200, hunger:30, health:3,  where:['food','club'] },
  { id:'nkwobi',   name:'Nkwobi',               emoji:'🍖', price:4_500, hunger:34, fun:5,     where:['club','food'] },
  { id:'gala',     name:'Gala & La Casera',     emoji:'🥐', price:800,   hunger:15, health:-1, where:['market','motorpark'] },
  { id:'agbo',     name:'Agbo (herbal mix)',    emoji:'🧪', price:600,   hunger:0,  health:6,  where:['market'] },
];

/* ─────────────────────── TRANSPORT (₦) ─────────────────────── */
export const TRANSPORT = {
  walk:      { name:'Waka (walk)',   emoji:'🚶',  base:0,    kmRate:0,   energyPerKm:6,  speedKmh:5  },
  keke:      { name:'Keke NAPEP',    emoji:'🛺',  base:300,  kmRate:120, speedKmh:18 },
  okada:     { name:'Okada',         emoji:'🏍️',  base:500,  kmRate:180, speedKmh:28, danger:0.05 },
  danfo:     { name:'Danfo',         emoji:'🚐',  base:700,  kmRate:90,  speedKmh:14 },
  brt:       { name:'BRT bus',       emoji:'🚌',  base:1_000,kmRate:70,  speedKmh:22 },
  ride:      { name:'Dash (ride-hail)', emoji:'🚗', base:2_000, kmRate:420, speedKmh:26 },
  taxi:      { name:'Airport taxi',  emoji:'🚕',  base:5_000, kmRate:500, speedKmh:24 },
};
// Inter-city fares are computed from distance (see cities.js) × this rate
export const INTERCITY_RATE_PER_KM = 42;   // ₦/km — Lagos→Ibadan (130km) ≈ ₦5,500
export const INTERCITY_SPEED_KMH = 62;     // average door-to-door, traffic included

/* ───────────────────────── UTILITIES ───────────────────────── */
export const UTIL = {
  waterRatePerMonth: 4_000,
  wasteRatePerMonth: 2_500,
  serviceChargePerMonth: (zone) => zone === 'rich' ? 120_000 : zone === 'mid' ? 35_000 : 6_000,
  generatorLitresPerGameHour: 0.85,   // a small gen burns ~0.9L/hour
  homeUnitsPerGameHour: 0.9,          // light + fan + phone + TV
  acUnitsPerGameHour: 2.4,
};

/* ───────────────────────── DATA / AIRTIME ───────────────────────── */
export const NETWORKS = ['MTL','Glo','Airtouch','NineStar'];
export const DATA_PLANS = [
  { id:'d100',  mb:100,   price:100,   days:1,  label:'100MB · 1 day' },
  { id:'d1g',   mb:1024,  price:500,   days:1,  label:'1GB · daily' },
  { id:'d2g',   mb:2048,  price:1_200, days:30, label:'2GB · 30 days' },
  { id:'d5g',   mb:5120,  price:2_000, days:30, label:'5GB · 30 days' },
  { id:'d10g',  mb:10240, price:3_500, days:30, label:'10GB · 30 days' },
  { id:'d20g',  mb:20480, price:5_000, days:30, label:'20GB · 30 days' },
  { id:'d75g',  mb:76800, price:20_000,days:30, label:'75GB · 30 days' },
];
export const AIRTIME_RATE = 11; // ₦11 per minute of calls
// MB burned by phone actions (forces you to actually buy data)
export const DATA_COST_MB = { chat:0.4, post:1.5, video:12, stream:25, bank:2, maps:1.2, default:0.6 };
export const AIRTIME_PER_CALL_MIN = 11;

/* ───────────────────────── HEALTH (₦) ───────────────────────── */
export const HEALTH = {
  consult: 5_000, malariaTest: 3_000, drugs: 9_000, admission: 60_000,
  surgery: 450_000, hmoMonthly: 14_000, pharmacyMarkup: 1.35,
  selfMedicateFailChance: 0.34,   // buying "whatever the chemist gives you"
  diagnosisFailChance: 0.28,      // misdiagnosis at a bad hospital
};

/* ───────────────────────── EDUCATION (₦) ───────────────────────── */
export const EDU = {
  primaryTerm: 6_000,          // public-ish, levies & uniform
  secondaryTerm: 85_000,
  privateSecondaryTerm: 750_000,
  polytechnicSession: 180_000,
  federalUniSession: 260_000,  // UNILAG/UI/UNN school fees 2026
  stateUniSession: 190_000,
  privateUniSession: 2_400_000,
  jamb: 8_000, waec: 32_000, neco: 28_000, postUtme: 5_000,
  masters: 1_500_000,
  nyscAllawee: 77_000,         // monthly corper allawee 2026
  lessonPerHour: 6_000,        // extra lessons / tutorial centre
  bootcamp: 450_000,           // 6-month tech bootcamp
  termsPerSession: 2,
};

/* ───────────────────────── HOUSING ───────────────────────── */
// Annual rent base by zone, before city multiplier. Real listings 2026.
export const HOUSING = {
  single:   { name:'Single room (face-me-I-face-you)', emoji:'🛏️',  poor:150_000,  mid:280_000,  rich:900_000 },
  selfcon:  { name:'Self-contained',                   emoji:'🏠',   poor:350_000,  mid:750_000,  rich:2_200_000 },
  miniflat: { name:'Mini flat (1 bed)',                emoji:'🏘️',  poor:650_000,  mid:1_400_000,rich:3_500_000 },
  twobed:   { name:'2-bedroom flat',                   emoji:'🏢',   poor:1_100_000,mid:2_600_000,rich:6_000_000 },
  duplex:   { name:'4-bedroom duplex',                 emoji:'🏡',   poor:2_200_000,mid:5_000_000,rich:14_000_000 },
  mansion:  { name:'Banana Island mansion',            emoji:'🏰',   poor:0,        mid:0,        rich:60_000_000 },
};
export const AGENCY_FEE = 0.10;   // agent 10%
export const LEGAL_FEE  = 0.10;   // legal 10%
export const CAUTION_FEE= 0.10;   // caution deposit (refundable)
export const LAND_PER_PLOT = { poor:1_800_000, mid:9_000_000, rich:65_000_000 };

/* ───────────────────────── FAITH ───────────────────────── */
export const FAITHS = {
  christian: { name:'Christianity', emoji:'⛪', place:'church',  leader:'Pastor',  givingName:'Tithe / Offering', service:'Sunday' },
  muslim:    { name:'Islam',        emoji:'🕌', place:'mosque',  leader:'Imam',    givingName:'Zakat / Sadaqah', service:'Friday' },
  traditional:{name:'Traditional',  emoji:'🗿', place:'shrine',  leader:'Babalawo',givingName:'Sacrifice',       service:'Market day' },
  none:      { name:'No religion',  emoji:'🕊️', place:null,      leader:null,      givingName:'None',            service:null },
};
export const TITHE_RATE = 0.10;   // 10% of income, as prescribed

/* ───────────────────────── POLITICS ───────────────────────── */
export const PARTIES = [
  { id:'apc',   name:'All Progressives Congress',  emoji:'🟢', colour:'#16a34a', grip:0.34 },
  { id:'pdp',   name:'Peoples Democratic Party',   emoji:'🔴', colour:'#dc2626', grip:0.22 },
  { id:'lp',    name:'Labour Party',               emoji:'⚪', colour:'#0ea5e9', grip:0.24 },
  { id:'nnpp',  name:'New Nigeria Peoples Party',  emoji:'🟡', colour:'#eab308', grip:0.12 },
  { id:'adc',   name:'African Democratic Congress',emoji:'🟣', colour:'#a855f7', grip:0.08 },
];
export const OFFICES = [
  { id:'councillor', name:'Councillor',            cost:1_500_000,  income:400_000,  votesNeeded:400 },
  { id:'chairman',   name:'LGA Chairman',          cost:25_000_000, income:3_500_000, votesNeeded:9_000 },
  { id:'rep',        name:'House of Reps member',  cost:120_000_000,income:12_000_000,votesNeeded:45_000 },
  { id:'governor',   name:'Governor',              cost:900_000_000,income:45_000_000,votesNeeded:600_000 },
  { id:'president',  name:'President',             cost:9_000_000_000,income:120_000_000,votesNeeded:9_000_000 },
];
export const ELECTION_CYCLE_MONTHS = 6;   // an election every 6 game-months (90 real min)

/* ───────────────────────── CRIME & POLICE ───────────────────────── */
export const CRIME = {
  pickpocket:   { name:'Pickpocket at the park', emoji:'🥷', heat:6,  min:2_000,  max:22_000,  time:30, skill:'street' },
  yahoo:        { name:'Yahoo-plus (wire fraud)',emoji:'💻', heat:22, min:40_000, max:1_900_000, time:180, skill:'tech' },
  drugrun:      { name:'Run a drug errand',      emoji:'📦', heat:14, min:15_000, max:90_000,  time:60, skill:'street' },
  extort:       { name:'Omo-onile land levy',    emoji:'🧱', heat:9,  min:8_000,  max:150_000, time:45, skill:'street' },
  pipeline:     { name:'Kpo-fire (bunkering)',   emoji:'🛢️', heat:26, min:60_000, max:2_400_000, time:240, skill:'street' },
  politician:   { name:'Divert constituency funds', emoji:'💼', heat:18, min:500_000, max:40_000_000, time:120, skill:'clout', requiresOffice:true },
};
export const ARREST_BASE_CHANCE = 0.30;           // scaled by heat/100 and skill
export const BRIBE = { small:1_000, standard:5_000, heavy:50_000, efcc:2_000_000 };
export const BAIL_COST = { station:80_000, court:400_000, efcc:5_000_000 };

/* ───────────────────────── SOCIAL ───────────────────────── */
export const OWAMBE = {
  asoEbi:       { name:'Aso-ebi (fabric + sewing)', emoji:'👗', min:35_000, max:180_000 },
  spray:        { name:'Spray the couple ₦',        emoji:'💸', min:20_000, max:500_000 },
  contribution: { name:'Family contribution',       emoji:'🤝', min:10_000, max:250_000 },
  burial:       { name:'Burial levy',               emoji:'⚰️', min:25_000, max:400_000 },
  naming:       { name:'Naming ceremony',           emoji:'🍼', min:20_000, max:200_000 },
};
export const WEDDING_COST = { court:120_000, traditional:900_000, white:6_500_000, destination:28_000_000 };

/* ───────────────────────── CLASH / EVENTS ───────────────────────── */
export const EVENT_WEIGHTS = { mundane:0.55, good:0.22, bad:0.23 };

/* ───────────────────────── GAMEPLAY TUNING ───────────────────────── */
export const TUNING = {
  startCashRange: [5_000, 40_000],
  chatCooldownMs: 900,
  actionCooldownMs: 80,
  saveEveryTicks: 20,
  npcChatEveryTicks: [8, 26],
  maxPlayersPerDistrictBroadcast: 60,
  offlinePresence: true,      // offline players still show at home
  startingNetwork: 'MTL',
  startingDataMB: 900,
  startingAirtime: 500,
};

export const naira = (n) => '₦' + Math.round(n).toLocaleString('en-NG');
export const clamp = (v, a = 0, b = 100) => Math.max(a, Math.min(b, v));
export const pick = (arr, r = Math.random) => arr[Math.floor(r() * arr.length)];
export const rand = (a, b, r = Math.random) => a + r() * (b - a);
export const chance = (p, r = Math.random) => r() < p;
