/**
 * NAIJA LIFE — CONTENT
 * Careers, side-hustles, market goods, illnesses, national events, NPC voices.
 * All money is 2026 naira. All of it is written to be recognised instantly.
 */

/* ─────────────────── CAREERS (monthly, 2026 ₦) ─────────────────── */
// edu: 0 none · 1 primary · 2 WAEC · 3 ND/NCE · 4 BSc/HND · 5 MSc · 6 PhD
export const CAREERS = [
  { id:'guard',    name:'Security Guard',        emoji:'🛡️', edu:1, skill:'street', venue:['office','mall','bank','estate'], pay:[70_000,95_000,130_000], desc:'Night watchman. “Who goes there?” is your whole personality.' },
  { id:'cleaner',  name:'Cleaner',               emoji:'🧹', edu:0, skill:'street', venue:['office','mall','hospital','hotel'], pay:[70_000,90_000,120_000], desc:'Minimum wage, maximum dignity.' },
  { id:'cashier',  name:'Shop Cashier',          emoji:'🧾', edu:2, skill:'street', venue:['mall','market','fuel'], pay:[85_000,120_000,170_000], desc:'“No change o. Bring POS.”' },
  { id:'okada',    name:'Okada Rider',           emoji:'🏍️', edu:1, skill:'street', venue:['motorpark'], pay:[150_000,240_000,320_000], needs:'okada', desc:'₦8k a day if the road is kind. LASTMA is not kind.' },
  { id:'keke',     name:'Keke Rider',            emoji:'🛺', edu:1, skill:'street', venue:['motorpark'], pay:[130_000,190_000,250_000], needs:'keke', desc:'The real engine of the Nigerian economy.' },
  { id:'danfo',    name:'Danfo Driver',          emoji:'🚐', edu:1, skill:'street', venue:['motorpark'], pay:[180_000,280_000,400_000], needs:'danfo', desc:'You must settle agbero, settle police, settle LASTMA, settle your conscience.' },
  { id:'trader',   name:'Market Trader',         emoji:'🧺', edu:1, skill:'trade', venue:['market','mall'], pay:[120_000,300_000,700_000], desc:'Buy ₦2,000, sell ₦3,500. Repeat until your shop has a name.' },
  { id:'artisan',  name:'Artisan (tailor / mech / barber)', emoji:'🔧', edu:2, skill:'craft', venue:['market','salon'], pay:[110_000,220_000,450_000], desc:'Handwork no spoil. Na only back dey pain.' },
  { id:'farmer',   name:'Farmer',                emoji:'🌾', edu:0, skill:'farm', venue:['market','misc'], pay:[90_000,180_000,400_000], desc:'Cassava waits for no one, and the middleman waits for everybody.' },
  { id:'teacher',  name:'Secondary School Teacher',emoji:'📚', edu:4, skill:'teaching', venue:['school'], pay:[120_000,180_000,260_000], desc:'Public school. Board not included. Chalk is free, patience is not.' },
  { id:'civilserv',name:'Civil Servant',         emoji:'🏛️', edu:4, skill:'admin', venue:['govt'], pay:[140_000,230_000,380_000], desc:'File moves from table to table until Jesus comes.' },
  { id:'nurse',    name:'Nurse',                 emoji:'🩺', edu:3, skill:'medical', venue:['hospital'], pay:[180_000,260_000,380_000], desc:'Night shift. Day shift. Same tiredness.' },
  { id:'corper',   name:'NYSC Corper',           emoji:'🇳🇬', edu:4, skill:'admin', venue:['school','govt'], pay:[77_000,77_000,77_000], desc:'₦77k and a khaki. Serve the nation, dodge the village PPA.' },
  { id:'banker',   name:'Banker',                emoji:'🏦', edu:4, skill:'finance', venue:['bank'], pay:[250_000,450_000,900_000], desc:'Targets. Every day. Targets.' },
  { id:'accountant',name:'Accountant',           emoji:'🧮', edu:4, skill:'finance', venue:['office','bank'], pay:[280_000,500_000,950_000], desc:'Somebody has to explain where the money went.' },
  { id:'lawyer',   name:'Lawyer',                emoji:'⚖️', edu:4, skill:'law', venue:['court','office'], pay:[300_000,700_000,2_200_000], desc:'“My lord, I most respectfully—”' },
  { id:'doctor',   name:'Medical Doctor',        emoji:'👨🏾‍⚕️', edu:4, skill:'medical', venue:['hospital'], pay:[420_000,800_000,2_000_000], desc:'House officer life: 36 hours awake and a stethoscope.' },
  { id:'engineer', name:'Engineer (Oil & Gas)',  emoji:'🛢️', edu:4, skill:'eng', venue:['refinery','factory','seaport'], pay:[700_000,1_400_000,3_500_000], desc:'Offshore two weeks on, two weeks off, salary lands like thunder.' },
  { id:'dev',      name:'Software Developer',    emoji:'💻', edu:3, skill:'tech', venue:['techhub','office'], pay:[450_000,900_000,2_400_000], desc:'“I dey work remotely.” Gen Z remote, or Yaba remote.' },
  { id:'designer', name:'Product Designer',      emoji:'🎨', edu:3, skill:'design', venue:['techhub','office'], pay:[400_000,850_000,2_000_000], desc:'Figma, feedback, and one more revision.' },
  { id:'data',     name:'Data Analyst',          emoji:'📊', edu:4, skill:'data', venue:['techhub','office','bank'], pay:[380_000,750_000,1_800_000], desc:'Excel, SQL, and explaining the dashboard nobody reads.' },
  { id:'journalist',name:'Journalist',           emoji:'🎙️', edu:4, skill:'media', venue:['media'], pay:[180_000,350_000,700_000], desc:'Brown envelope journalism is a choice. So is rent.' },
  { id:'lecturer', name:'University Lecturer',   emoji:'🎓', edu:5, skill:'teaching', venue:['uni'], pay:[330_000,520_000,900_000], desc:'ASUU strike is your most reliable benefit.' },
  { id:'actor',    name:'Nollywood Actor',       emoji:'🎬', edu:2, skill:'acting', venue:['cinema','media'], pay:[250_000,900_000,5_000_000], desc:'“Cut! Where is the light?”' },
  { id:'musician', name:'Musician',              emoji:'🎤', edu:2, skill:'music', venue:['club','media'], pay:[200_000,1_200_000,8_000_000], desc:'One hit changes everything. Most people don’t get the hit.' },
  { id:'clergy',   name:'Clergy',                emoji:'⛪', edu:4, skill:'faith', venue:['church','mosque'], pay:[150_000,600_000,4_000_000], desc:'Feed my sheep. And my CR-V.' },
  { id:'politician',name:'Politician',           emoji:'🏛️', edu:4, skill:'clout', venue:['govt'], pay:[600_000,4_000_000,40_000_000], desc:'Allowances are not salary. Ask anybody.' },
  { id:'pilot',    name:'Airline Pilot',         emoji:'✈️', edu:4, skill:'aviation', venue:['airport'], pay:[1_400_000,2_600_000,5_000_000], desc:'Lagos–Abuja, four times a day, forever.' },
  { id:'estate',   name:'Real Estate Agent',     emoji:'🏡', edu:3, skill:'trade', venue:['estate','office'], pay:[200_000,700_000,3_000_000], desc:'“This property will not last, sir.” It has lasted 4 years.' },
  { id:'dispatch', name:'Dispatch Rider',        emoji:'📦', edu:2, skill:'street', venue:['office','market'], pay:[110_000,180_000,260_000], needs:'okada', desc:'Traffic is your enemy, fuel is your landlord.' },
];

export const CAREER_BY_ID = Object.fromEntries(CAREERS.map(c => [c.id, c]));
export const SKILLS = ['street','trade','craft','farm','teaching','admin','medical','finance','law','eng','tech','design','data','media','acting','music','faith','clout','aviation'];

/* ─────────────────── SIDE HUSTLES (instant-ish cash) ─────────────────── */
export const GIGS = [
  { id:'carry',   name:'Carry market bags',        emoji:'🛍️', pay:[800,2_500],    mins:20, need:null,     energy:6 },
  { id:'queue',   name:'Help someone jump queue',  emoji:'🧍', pay:[1_500,4_000],   mins:25, need:null,     energy:4 },
  { id:'purewater',name:'Sell pure water in traffic',emoji:'💦', pay:[2_500,7_000], mins:60, need:null,     energy:14 },
  { id:'dispatch',name:'Dispatch run (2 drops)',   emoji:'📦', pay:[4_000,11_000],  mins:70, need:'okada',  energy:12 },
  { id:'tutor',   name:'Tutor JAMB maths',         emoji:'📐', pay:[8_000,20_000],  mins:60, skill:'teaching',level:2, energy:7 },
  { id:'braid',   name:'Braid someone’s hair',     emoji:'💇🏾‍♀️',pay:[9_000,25_000], mins:90, skill:'craft', level:2, energy:12 },
  { id:'laptop',  name:'Fix someone’s laptop',     emoji:'🖥️', pay:[12_000,40_000], mins:55, skill:'tech', level:2, energy:6 },
  { id:'logo',    name:'Design a logo',            emoji:'🎨', pay:[20_000,90_000], mins:60, skill:'design',level:2, energy:5 },
  { id:'website', name:'Build a landing page',     emoji:'💻', pay:[60_000,350_000],mins:120,skill:'tech', level:3, energy:8 },
  { id:'mc',      name:'MC at an owambe',          emoji:'🎤', pay:[40_000,250_000],mins:90, skill:'clout', level:2, energy:10 },
  { id:'dj',      name:'DJ a house party',         emoji:'🎧', pay:[50_000,300_000],mins:120,skill:'music', level:2, energy:12 },
  { id:'photog',  name:'Shoot a wedding',          emoji:'📷', pay:[60_000,400_000],mins:150,skill:'design',level:2, energy:14, needs:'camera' },
  { id:'carpentry',name:'Carpentry job',           emoji:'🪚', pay:[25_000,90_000],  mins:120,skill:'craft', level:2, energy:16 },
  { id:'spray',   name:'Get paid to spray at a party',emoji:'💸',pay:[20_000,120_000],mins:40,skill:'clout', level:1, energy:5 },
  { id:'pos',     name:'Run a POS stand',          emoji:'💳', pay:[6_000,19_000],   mins:90, need:null, energy:8, capital:30_000 },
  { id:'bet',     name:'Agent for a betting shop', emoji:'🎰', pay:[5_000,16_000],   mins:80, need:null, energy:7 },
  { id:'farmwork',name:'Work a farm plot',         emoji:'🌾', pay:[5_000,14_000],   mins:150,skill:'farm', level:1, energy:22 },
  { id:'voiceover',name:'Voice-over for an ad',    emoji:'🎙️', pay:[35_000,200_000], mins:45, skill:'media', level:2, energy:4 },
  { id:'extra',   name:'Be an extra in a Nollywood film', emoji:'🎬', pay:[8_000,30_000], mins:180, need:null, energy:15 },
  { id:'survey',  name:'Fill an international survey',emoji:'📝', pay:[3_000,9_000],  mins:30, need:null, energy:2 },
];

/* ─────────────────── ITEMS / OJA MARKET (₦) ─────────────────── */
export const ITEMS = [
  // phones & tech
  { id:'tecnophone', name:'Tecno Spark 20',       emoji:'📱', price:185_000, cat:'tech',    cond:1, desc:'The people’s smartphone.' },
  { id:'infinix',    name:'Infinix Hot 40',       emoji:'📱', price:230_000, cat:'tech',    cond:1 },
  { id:'iphone',     name:'iPhone 16 Pro',        emoji:'📱', price:1_950_000,cat:'tech',   cond:1, flex:12 },
  { id:'samsung',    name:'Samsung S24 Ultra',    emoji:'📱', price:1_650_000,cat:'tech',   cond:1, flex:10 },
  { id:'laptop_used',name:'UK-used laptop',       emoji:'💻', price:420_000, cat:'tech',    cond:0.65 },
  { id:'laptop_new', name:'Brand new laptop',     emoji:'💻', price:1_350_000,cat:'tech',   cond:1, flex:6 },
  { id:'iphone_cable',name:'“Original” charger',  emoji:'🔌', price:4_500,   cat:'tech',    cond:0.4 },
  { id:'powerbank',  name:'Power bank 20,000mAh', emoji:'🔋', price:28_000,  cat:'tech',    cond:1 },
  { id:'camera',     name:'Used Canon DSLR',      emoji:'📷', price:680_000, cat:'tech',    cond:0.7, flex:4 },
  { id:'headphones', name:'Wireless earbuds',     emoji:'🎧', price:35_000,  cat:'tech',    cond:1 },
  // power
  { id:'gen_small',  name:'I-pass-my-neighbour gen',emoji:'🔌',price:185_000, cat:'power',  cond:1 },
  { id:'gen_big',    name:'Big generator (5.5kVA)',emoji:'🔌', price:780_000, cat:'power',  cond:1 },
  { id:'inverter',   name:'Inverter + 2 batteries',emoji:'🔋',price:1_150_000,cat:'power',  cond:1, flex:5 },
  { id:'solar',      name:'Solar panel + battery', emoji:'☀️', price:1_800_000,cat:'power', cond:1, flex:8 },
  { id:'fan',        name:'Standing fan',         emoji:'🌀', price:32_000,  cat:'power',   cond:1 },
  { id:'ac',         name:'Air conditioner',      emoji:'❄️', price:420_000, cat:'power',   cond:1 },
  { id:'fridge',     name:'Fridge (fairly used)', emoji:'🧊', price:280_000, cat:'power',   cond:0.7 },
  { id:'tv',         name:'55" Smart TV',         emoji:'📺', price:540_000, cat:'power',   cond:1 },
  // vehicles
  { id:'okada',      name:'Bajaj Boxer motorcycle',emoji:'🏍️',price:980_000, cat:'vehicle', cond:1, flex:9 },
  { id:'keke',       name:'Keke NAPEP',           emoji:'🛺', price:2_450_000,cat:'vehicle',cond:1, flex:14 },
  { id:'danfo',      name:'Danfo (14-seater bus)',emoji:'🚐', price:5_200_000,cat:'vehicle',cond:0.6, flex:26 },
  { id:'corolla',    name:'2008 Toyota Corolla',  emoji:'🚗', price:7_400_000,cat:'vehicle',cond:0.55, flex:30 },
  { id:'camry',      name:'2012 Camry (Big Daddy)',emoji:'🚗',price:14_500_000,cat:'vehicle',cond:0.6, flex:42 },
  { id:'lexus',      name:'Lexus RX350',          emoji:'🚙', price:38_000_000,cat:'vehicle',cond:0.7, flex:110 },
  { id:'gwagen',     name:'G-Wagon (tokunbo)',    emoji:'🚙', price:180_000_000,cat:'vehicle',cond:0.6, flex:480 },
  // home & living
  { id:'mattress',   name:'Mattress',             emoji:'🛏️', price:95_000,  cat:'home',   cond:1 },
  { id:'ricebag',    name:'Bag of rice (50kg)',   emoji:'🍚', price:88_000,  cat:'food',    cond:1 },
  { id:'garri',      name:'Paint-bucket of garri',emoji:'🥣', price:12_000,  cat:'food',    cond:1, consumable:true, hunger:22 },
  { id:'palmoil',    name:'25L palm oil',         emoji:'🫗', price:38_000,  cat:'food',    cond:1 },
  { id:'purewaterbag',name:'Bag of pure water',   emoji:'💦', price:900,     cat:'food',    cond:1, consumable:true, hunger:5 },
  { id:'sewing',     name:'Industrial sewing machine',emoji:'🧵',price:120_000,cat:'trade', cond:1, incomeBoost:{'artisan':0.35} },
  { id:'barbkit',    name:'Barbing kit',          emoji:'💈', price:65_000,  cat:'trade',   cond:1, incomeBoost:{'artisan':0.2} },
  { id:'posmachine', name:'POS machine',          emoji:'💳', price:78_000,  cat:'trade',   cond:1, incomeBoost:{'trader':0.25} },
  { id:'speaker',    name:'Small sound system',   emoji:'🔊', price:145_000, cat:'trade',   cond:1 },
  { id:'freezer',    name:'Deep freezer (cold room for the shop)',emoji:'🧊',price:310_000,cat:'trade',cond:1, incomeBoost:{'trader':0.3} },
  // fashion & culture
  { id:'agbada',     name:'Agbada (3-piece)',     emoji:'🥻', price:185_000, cat:'fashion', cond:1, flex:2 },
  { id:'asoebi',     name:'Aso-ebi set',          emoji:'👗', price:75_000,  cat:'fashion', cond:1, flex:1 },
  { id:'gele',       name:'Gele (ready-made)',    emoji:'👘', price:28_000,  cat:'fashion', cond:1 },
  { id:'wig',        name:'Human-hair wig',       emoji:'💇🏾‍♀️',price:135_000, cat:'fashion',cond:1, flex:1 },
  { id:'sneakers',   name:'Clean sneakers',       emoji:'👟', price:95_000,  cat:'fashion', cond:1, flex:1 },
  { id:'abaya',      name:'Abaya / kaftan',       emoji:'🧥', price:62_000,  cat:'fashion', cond:1 },
  { id:'hijab',      name:'Designer hijab',       emoji:'🧕', price:24_000,  cat:'fashion', cond:1 },
  { id:'coral',      name:'Coral beads & cap',    emoji:'📿', price:110_000, cat:'fashion', cond:1, flex:1 },
  // faith & spirit
  { id:'bible',      name:'Big Bible',            emoji:'📖', price:18_000,  cat:'faith',   cond:1 },
  { id:'quran',      name:'Decorated Quran',      emoji:'📕', price:22_000,  cat:'faith',   cond:1 },
  { id:'rosary',     name:'Rosary & holy water',  emoji:'📿', price:6_500,   cat:'faith',   cond:1 },
  { id:'charm',      name:'Juju charm (from Babalawo)',emoji:'🗿',price:45_000,cat:'faith',  cond:1 },
  { id:'pilgrim',    name:'Pilgrimage slot deposit',emoji:'🕋',price:850_000,cat:'faith',   cond:1 },
  // property & papers
  { id:'plot_land',  name:'Plot of land (100×50ft)',emoji:'🏞️',price:0,      cat:'property',cond:1, zonePrice:true },
  { id:'form',       name:'“Important” government form',emoji:'📄',price:3_500,cat:'misc',  cond:1 },
  { id:'pvc',        name:'Nothing (PVC is free)',emoji:'🗳️', price:0,        cat:'misc',    cond:1 },
];
export const ITEM_BY_ID = Object.fromEntries(ITEMS.map(i => [i.id, i]));

/* ─────────────────── ILLNESSES ─────────────────── */
export const ILLNESSES = [
  { id:'malaria',  name:'Malaria',                 emoji:'🦟', severity:2, cost:[8_000,25_000], cure:'Coartem + rest', healthDrain:2.2, days:[3,9] },
  { id:'typhoid',  name:'Typhoid fever',           emoji:'🤒', severity:3, cost:[25_000,70_000],cure:'IV antibiotics', healthDrain:3.4, days:[6,14] },
  { id:'ulcer',    name:'Ulcer (from skipping food)',emoji:'🫃',severity:2, cost:[15_000,45_000],cure:'Dietary discipline', healthDrain:1.4, days:[10,30] },
  { id:'hypertension',name:'Hypertension',         emoji:'🩸', severity:2, cost:[20_000,60_000], cure:'Lifelong meds', healthDrain:1.1, days:[30,200] },
  { id:'cholera',  name:'Cholera (bad water)',     emoji:'🚰', severity:4, cost:[40_000,120_000],cure:'Rehydration', healthDrain:5.0, days:[4,10] },
  { id:'lassa',    name:'Lassa fever',             emoji:'🐀', severity:5, cost:[200_000,900_000],cure:'Isolation + Ribavirin', healthDrain:7.0, days:[8,21] },
  { id:'stress',   name:'Burnout / depression',    emoji:'😮‍💨',severity:2, cost:[30_000,150_000],cure:'Rest + therapy (if you can afford it)', healthDrain:1.0, days:[14,60] },
  { id:'injury',   name:'Injury (accident / fight)',emoji:'🩹',severity:3, cost:[30_000,300_000],cure:'Stitches & prayer', healthDrain:2.6, days:[5,20] },
  { id:'gunshot',  name:'Gunshot wound',           emoji:'🩸', severity:6, cost:[350_000,2_500_000],cure:'Surgery', healthDrain:9.0, days:[14,60] },
  { id:'addiction',name:'Betting addiction',       emoji:'🎰', severity:2, cost:[0,0],           cure:'Self-control & airtime block', healthDrain:0.6, days:[30,300] },
  { id:'spiritual',name:'Spiritual attack',        emoji:'👻', severity:2, cost:[0,120_000],     cure:'Deliverance service', healthDrain:0.8, days:[2,7] },
];
export const ILLNESS_BY_ID = Object.fromEntries(ILLNESSES.map(i => [i.id, i]));

/* ─────────────────── NATIONAL EVENTS (live news) ─────────────────── */
// effects: fuelΔ, travelDangerΔ, moodΔ, inflationΔ, blackoutΔ, closes:[venueTypes], note
export const EVENTS = [
  { id:'fuel_up',   headline:'Petrol climbs to ₦{fuel} per litre as depot price adjusts', emoji:'⛽', weight:3, effects:{ fuel:0.11, mood:-6 }, tag:'economy' },
  { id:'fuel_down', headline:'Dangote Refinery cuts gantry price — pump price may follow', emoji:'📉', weight:2, effects:{ fuel:-0.07, mood:5 }, tag:'economy' },
  { id:'grid',      headline:'National grid collapses again — 18 states in darkness', emoji:'💡', weight:4, effects:{ blackout:0.55, mood:-7 }, tag:'power' },
  { id:'asuu',      headline:'ASUU declares indefinite strike over unpaid allowances', emoji:'🎓', weight:2, effects:{ closes:['uni'], mood:-5 }, tag:'education' },
  { id:'asuu_end',  headline:'ASUU suspends strike after 6 months. Students return', emoji:'🎓', weight:2, effects:{ mood:8 }, tag:'education' },
  { id:'naira_down',headline:'Naira slides to ₦{usd}/$ at the parallel market', emoji:'💱', weight:3, effects:{ inflation:0.06, mood:-6 }, tag:'economy' },
  { id:'naira_up',  headline:'Naira firms to ₦{usd}/$ after CBN intervention', emoji:'💹', weight:2, effects:{ inflation:-0.02, mood:5 }, tag:'economy' },
  { id:'inec_date', headline:'INEC announces governorship elections in ₦ — PVC collection begins', emoji:'🗳️', weight:2, effects:{ electionSoon:true, mood:3 }, tag:'politics' },
  { id:'bandits',   headline:'Bandits block Kaduna–Abuja highway, motorists advised to avoid', emoji:'🚧', weight:3, effects:{ travelDanger:0.3, mood:-9 }, tag:'security' },
  { id:'lastma',    headline:'Lagos bans okada on Third Mainland Bridge — riders protest', emoji:'🏍️', weight:2, effects:{ okadaBan:true, mood:-4 }, tag:'transport' },
  { id:'eagles',    headline:'SUPER EAGLES WIN! The whole country is outside right now', emoji:'🦅', weight:2, effects:{ mood:16 }, tag:'sport' },
  { id:'eagles_out',headline:'Super Eagles crash out. Twitter has entered the group chat', emoji:'😭', weight:2, effects:{ mood:-12 }, tag:'sport' },
  { id:'detty',     headline:'Detty December is here — flights to Lagos triple in price', emoji:'🎉', weight:2, effects:{ mood:12, fuel:0.03 }, tag:'culture' },
  { id:'harmattan', headline:'Harmattan haze blankets the North — flights delayed', emoji:'🌫️', weight:2, effects:{ weather:'harmattan', mood:-2 }, tag:'weather' },
  { id:'rain',      headline:'Heavy rain floods Lekki–Epe expressway, gridlock for hours', emoji:'🌧️', weight:3, effects:{ weather:'rain', travelDanger:0.12, mood:-5 }, tag:'weather' },
  { id:'fuel_queue',headline:'Fuel scarcity: kilometre-long queues return to Abuja stations', emoji:'⛽', weight:2, effects:{ fuel:0.05, mood:-8 }, tag:'economy' },
  { id:'efcc',      headline:'EFCC arrests another “big fish” over ₦4.2bn fraud', emoji:'🚨', weight:2, effects:{ heatAudit:true, mood:2 }, tag:'crime' },
  { id:'mpr',       headline:'CBN raises interest rate to 27.5% — loans get more expensive', emoji:'🏦', weight:2, effects:{ loanRate:0.04, mood:-4 }, tag:'economy' },
  { id:'wage',      headline:'Labour unions demand new minimum wage review', emoji:'✊', weight:2, effects:{ mood:4 }, tag:'economy' },
  { id:'burna',     headline:'Stadium show announced — 60,000 tickets gone in 40 minutes', emoji:'🎤', weight:2, effects:{ mood:9 }, tag:'culture' },
  { id:'durbar',    headline:'Kano Durbar draws thousands as Sallah celebrations begin', emoji:'🐎', weight:2, effects:{ mood:10 }, tag:'culture' },
  { id:'osun',      headline:'Osun-Osogbo festival: the sacred grove fills with pilgrims', emoji:'🗿', weight:1, effects:{ mood:8 }, tag:'culture' },
  { id:'nollywood', headline:'Nollywood film breaks box office record, earns ₦1.1bn', emoji:'🎬', weight:1, effects:{ mood:6 }, tag:'culture' },
  { id:'protest',   headline:'#EndBadGovernance protesters march in Abuja and Lagos', emoji:'📣', weight:2, effects:{ mood:-6, travelDanger:0.15 }, tag:'politics' },
  { id:'police_raid',headline:'Police raid computer village, seize 400 laptops', emoji:'🚓', weight:2, effects:{ heatAudit:true, mood:-3 }, tag:'crime' },
  { id:'rice_price',headline:'Bag of rice hits ₦{rice} as import duty bites', emoji:'🍚', weight:3, effects:{ foodPrice:0.12, mood:-7 }, tag:'economy' },
];

/* ─────────────────── NPC ARCHETYPES ─────────────────── */
export const NPC_TYPES = [
  { id:'agbero',    name:'Agbero (park tout)',      emoji:'🧢', lines:['Oga where you dey go? Enter!','Pay park fee now now. ₦200.','No be today I start this work.','Abeg enter, we dey move!','You wan charter? ₦15k. Final.'] },
  { id:'iyaoloja',  name:'Iya Oloja (market woman)',emoji:'👵🏾',lines:['Aunty! Come and buy!','This one na original, no be China.','₦3,500 last price. I no dey add meat?','You no wan buy today? God go provide.','My daughter dey UNILAG. Na this market train am.'] },
  { id:'okadaman',  name:'Okada rider',             emoji:'🏍️',lines:['Oga where to?','Helmet? E dey back seat, wear am small.','₦700. No be robbery.','This road no good for night o.','I don ride since 5am.'] },
  { id:'corper',    name:'Corper',                  emoji:'🇳🇬',lines:['Posting? I dey serve for this LGA.','Allawee no reach anything sha.','NYSC lodge dey share 8 of us for one room.','I dey job hunt on the side.','PPA say make I go farm. Which farm?'] },
  { id:'techbro',   name:'Tech bro',                emoji:'💻',lines:['I dey work remotely for a startup.','Yaba is basically Y Combinator, you know?','Our runway is 8 months.','Have you tried the new AI thing?','Bro, do you have a referral?'] },
  { id:'areaBoy',   name:'Area boy',                emoji:'🧱',lines:['You get something for the boys?','This na our area. You know?','Omo onile no dey beg.','₦2,000. No stress me.','Fine boy, bring your phone.'] },
  { id:'police',    name:'Policeman',               emoji:'🚓',lines:['Officer needs something for fuel.','Your papers! Where is your particulars?','Park well! Park well!','You dey find trouble? ₦1,000 settle am.','Na for your own safety we dey here.'] },
  { id:'pastor',    name:'Pastor',                  emoji:'⛪',lines:['God is not done with you!','Sow a seed of ₦10,000 and watch God move.','The devil is a liar!','Come for Tuesday deliverance.','Somebody shout Amen!'] },
  { id:'imam',      name:'Mallam / Imam',           emoji:'🕌',lines:['Alhamdulillah. Peace be upon you.','Zakat purifies the wealth.','Come for Jumat, the khutbah is early.','Allah sees your struggle.','This Qur’an school is free — bring your son.'] },
  { id:'babalawo',  name:'Babalawo',                emoji:'🗿',lines:['The oracle has spoken. You must appease Èṣù.','Bring kolanut, bring palm oil.','Your problem is not ordinary.','Three white hens. Before Friday.','The ancestors are restless.'] },
  { id:'banker',    name:'Bank staff',              emoji:'🏦',lines:['Next! Which one is deposit?','The network is down. Come back tomorrow.','You need BVN, NIN, and your first child’s name.','ATM no dispense? Try the one outside.','Sir, bank charges are ₦52. It is automatic.'] },
  { id:'nurse',     name:'Nurse',                   emoji:'🩺',lines:['Have you eaten anything since morning?','Your BP is 160/100. You’re stressing.','Take this card. Pay at the cash point.','The doctor is on a break.','Buy the drugs outside, the pharmacy here is finished.'] },
  { id:'biker',     name:'Dispatch rider',          emoji:'📦',lines:['Delivery! Oga, where is the gate?','I dey come. 5 minutes. Traffic is mad.','The customer no dey pick call.','Google Maps say 12 minutes. I say 40.'] },
  { id:'bigman',    name:'Big man',                 emoji:'🕴️',lines:['Nobody born well. We all started somewhere.','My guy, get money first. Explanations later.','Call my PA.','I came here in a bus too, in 2004.','Do you know who I am?'] },
  { id:'student',   name:'Student',                 emoji:'🎒',lines:['Lecture starts 8am and I’m on my third all-nighter.','ASUU don strike again? Wow.','Handout is ₦1,500. Photocopy it.','Are you going to the departmental party?','Landlord is disturbing me for rent.'] },
  { id:'almajiri',  name:'Almajiri boy',            emoji:'🧒🏾',lines:['Sai an ba ni abinci… please small food.','I dey learn Qur’an since morning.','Mallam say make I beg.'] },
  { id:'conductor', name:'Danfo conductor',         emoji:'🚌',lines:['Oshodi! Oshodi! Enter with your change!','Oga shift, make person sit down.','My money! You give me ₦1,000 for ₦700?','Drive! Drive! Agbero don collect.','Conductor no dey carry shame, o!'] },
  { id:'politician',name:'Politician',              emoji:'🏛️',lines:['My people! My people!','Vote for us. We have performed.','The opposition is confused. Look at them.','Empowerment programme next week. Bring your form.','I built this road with my own money.'] },
  { id:'thug',      name:'Political thug',          emoji:'💪🏾',lines:['Oga say make I follow you.','You wan vote? Which party?','This rally must scatter. Na instruction.','We dey collect “logistics”.'] },
  { id:'ojuelegba', name:'Street hustler',          emoji:'👜',lines:['Gala! Pure water! Mineral!','Boss, buy Gala for ₦800.','Na daily hustle. No be crime.','Since 6am for this junction.'] },
];

/* ─────────────────── NAMES ─────────────────── */
export const NAMES = {
  yoruba:['Ade','Tunde','Bola','Segun','Femi','Fola','Tayo','Kunle','Bayo','Dapo','Sola','Yemi','Gbenga','Bunmi','Yewande','Folake','Titi','Bisi','Simi','Teniola','Ayodeji','Olamide','Ire','Temi','Damilola'],
  igbo:['Chidi','Emeka','Obinna','Ifeanyi','Nnamdi','Uche','Ikechukwu','Chinedu','Okey','Eze','Ngozi','Chiamaka','Adaeze','Nkechi','Amaka','Ada','Chidinma','Ijeoma','Ugochi','Chinelo','Ekene','Ifeoma'],
  hausa:['Musa','Ibrahim','Abdullahi','Yusuf','Suleiman','Bashir','Kabiru','Tunde','Aisha','Zainab','Hauwa','Fatima','Amina','Halima','Maryam','Bilkisu','Hassan','Umar','Idris','Nura'],
  others:['Ekaette','Etim','Okoro','Effiong','Bassey','Asuquo','Tamuno','Ebiere','Tamara','Oritse','Efe','Osas','Preye','Tari'],
  surnames:['Adeyemi','Okonkwo','Bello','Ogunleye','Eze','Musa','Balogun','Nwankwo','Olawale','Danladi','Adebayo','Chukwu','Ibrahim','Ojo','Okafor','Abubakar','Oyelaran','Nwachukwu','Sanusi','Adewale','Ifeanyichukwu','Ekong','Uduak','Alabi','Onyeka','Bakare','Salami','Igwe','Yakubu','Etim'],
};
export const ALL_FIRST = [...NAMES.yoruba, ...NAMES.igbo, ...NAMES.hausa, ...NAMES.others];

/* ─────────────────── AMBIENT / FLAVOUR ─────────────────── */
export const AMBIENT = {
  lagos:['“Oshodi! Oshodi!! One more person!”','Generator hums somewhere behind you.','A danfo blasts Burna Boy. Its conductor hangs off the door.','Somewhere, someone is shouting about ₦200 change.','Agbada swishes past you — that man is late for a wedding.','Pure water seller balances a bowl on her head.','“Oga, park well! Park well!!”'],
  abuja:['A convoy of black SUVs glides past, tinted.','The roads here have no potholes. Nigerians find this suspicious.','A civil servant steps out in full regalia.','“The contract has been awarded.”','Sirens. Somebody important is coming.','Beautiful buildings, empty offices.'],
  kano:['The call to prayer rolls over the city.','A horse snorts. Durbar season is close.','Kilishi smoke drifts from a roadside grill.','Hausa, Arabic and Kanuri braid together in the air.','Dust coats everything, gently.'],
  ph:['Bole roasting on an open fire. The smell is criminal.','A barge crawls down the creek.','“Where you dey? I dey come now now.”','Rain threatens, as it does 200 days a year.'],
  ibadan:['Somebody is pounding yam somewhere. You can hear it.','Amala steam and laughter from a buka.','The hills of Ibadan hold up the sky.','“Ẹ káàbọ̀. Come and chop.”'],
  enugu:['Coal dust memory in the walls. Igbo trading spirit in the shops.','A generator salesman has found you. He will not let go.','“Oga, buy something na.”'],
  default:['Naija is happening all around you.','Somebody greets you: “How far?”','A goat crosses the road with confidence.'],
};

export const RADIO_LINES = [
  '“You’re locked to Naija FM, the rhythm of the streets!”',
  '“Traffic on Third Mainland is bumper to bumper, take the alternative.”',
  '“This one is for all my people grinding. God bless your hustle.”',
  '“Oga DJ, play am again!”',
  '“The naira is dancing. We are all dancing with it.”',
  '“Chai. This country.”',
];

/* ─────────────────── BACKSTORIES (character creation) ─────────────────── */
export const BACKSTORIES = [
  { id:'corper',  name:'NYSC Corper', emoji:'🇳🇬', cash:18_000, edu:4, city:'abuja',
    skills:{ admin:2, teaching:1 }, items:['tecnophone'],
    blurb:'Khaki, boots, ₦77k allawee and a posting you did not choose. Your PPA is a primary school with no chairs.',
    perk:'₦77,000 monthly allawee arrives whether you like it or not. Bonus: nationwide free movement.' },
  { id:'graduate',name:'Fresh Graduate (no job)', emoji:'🎓', cash:9_500, edu:4, city:'ibadan',
    skills:{ admin:1 }, items:['tecnophone'],
    blurb:'First Class. Two years at home. “We’ll get back to you” is your national anthem now.',
    perk:'Free accommodation at your parents’ house (for now). Family pressure builds daily.' },
  { id:'trader',  name:'Market Trader', emoji:'🧺', cash:34_000, edu:2, city:'onitsha',
    skills:{ trade:3 }, items:['tecnophone','garri'],
    blurb:'You have a stall, a shade umbrella and customers who will still beg you for discount.',
    perk:'Starts with a market stall and trade skill 3. Cash flow from day one.' },
  { id:'techbro', name:'Yaba Tech Bro', emoji:'💻', cash:78_000, edu:4, city:'lagos',
    skills:{ tech:3, design:1 }, items:['laptop_used','tecnophone'],
    blurb:'You say “let’s circle back” unironically. Your laptop is your entire net worth.',
    perk:'Starts with a laptop. Remote gigs pay in naira, gigs pay instantly.' },
  { id:'ijgb',    name:'IJGB Returnee', emoji:'✈️', cash:260_000, edu:5, city:'lagos',
    skills:{ tech:2, clout:2 }, items:['iphone','laptop_new'],
    blurb:'“I just got back.” Six years in Manchester. You call it “Naija” and everyone knows.',
    perk:'Starts with a foreign degree, an accent that earns clout, and ₦260k. No local network though.' },
  { id:'areaboy', name:'Area Boy / Omo-Onile', emoji:'🧱', cash:7_500, edu:1, city:'lagos',
    skills:{ street:4, clout:1 }, items:['tecnophone'],
    blurb:'You know every street, every shortcut and every policeman’s price. The streets are your CV.',
    perk:'Street skill 4. Extortion and street gigs pay far above minimum wage.' },
  { id:'rider',   name:'Okada Rider', emoji:'🏍️', cash:22_000, edu:1, city:'ibadan',
    skills:{ street:3 }, items:['okada','tecnophone'],
    blurb:'The bike is not yours — it’s on daily hire. ₦3,000 every morning before you’ve earned a naira.',
    perk:'Starts on a hired bike. Clear ₦6k–₦12k a day after fuel and hire.' },
  { id:'musician',name:'Aspiring Artist', emoji:'🎤', cash:14_000, edu:2, city:'ph',
    skills:{ music:3, clout:1 }, items:['tecnophone','headphones'],
    blurb:'One song away. Everyone says so. The studio session costs ₦40k.',
    perk:'Music skill 3. Clout converts to streams, streams convert to shows, shows convert to money.' },
];

export const STARTER_FREEBIES = { tecnophone:1 };

/* ─────────────────── TITLES / ACHIEVEMENTS ─────────────────── */
export const TITLES = [
  { id:'firstmillion', name:'First Million', emoji:'💰', test:(p)=>p.stats.peakNetWorth>=1_000_000 },
  { id:'graduate',     name:'Certified Graduate', emoji:'🎓', test:(p)=>p.edu.level>=4 },
  { id:'landlord',     name:'Landlord', emoji:'🔑', test:(p)=>(p.properties||[]).length>=1 },
  { id:'pvc',          name:'Registered Voter', emoji:'🗳️', test:(p)=>p.politics.pvc },
  { id:'bornagain',    name:'Born Again', emoji:'🙌🏾', test:(p)=>p.faith.devotion>=60 },
  { id:'alhaji',       name:'Alhaji / Alhaja', emoji:'🕋', test:(p)=>p.faith.faith==='muslim'&&p.faith.devotion>=70 },
  { id:'wanted',       name:'Person of Interest', emoji:'🚨', test:(p)=>p.stats.heat>=70 },
  { id:'areaowner',    name:'Owner of the Streets', emoji:'🧱', test:(p)=>p.skills.street>=6 },
  { id:'techlord',     name:'Tech Lord', emoji:'💻', test:(p)=>p.skills.tech>=6 },
  { id:'star',         name:'Naija Star', emoji:'⭐', test:(p)=>p.stats.clout>=80 },
  { id:'corper',       name:'Corper', emoji:'🇳🇬', test:(p)=>p.edu.nysc },
  { id:'married',      name:'Settled Down', emoji:'💍', test:(p)=>!!p.family.spouse },
  { id:'parent',       name:'Parent', emoji:'🍼', test:(p)=>p.family.kids>=1 },
  { id:'chopped',      name:'Well Fed', emoji:'🍲', test:(p)=>p.needs.hunger>=95 },
];
