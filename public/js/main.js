/* NAIJA LIFE — boot, auth, game loop */
import { net, me, wld } from './net.js';
import { WorldView } from './render.js';
import { phone, APPS, toast, naira, esc, act } from './phone.js';
import { CITIES, CITY_BY_ID, DISTRICT_BY_ID, VENUE_BY_ID } from '/src/data/cities.js';
import { BACKSTORIES, NPC_TYPES } from '/src/data/content.js';
import { buildHud, updateHud, initChat, pushChat, initMap, openMap, closeMap, openVenue, syncVenuePanel, updateTravelling, checkBanner, showPrompt, openApp, el } from './ui.js';

const view = new WorldView(document.getElementById('world'));
let started = false;

/* ══════════════ boot ══════════════ */
let authBuilt = false;
let serverRestarting = false;      // true when the server warned us it is going down

async function boot() {
  const st = document.getElementById('bootStatus');
  st.textContent = 'connecting to the server…';

  net.on('open', onSocketOpen);
  net.on('auth', onAuth);
  net.on('reconnecting', (m) => {
    // a planned restart gets a reassuring message; a random drop does not
    if (serverRestarting) showNetOverlay('🔄 Server updating', `Back in ${m.in || 1}s…`);
    else showNetOverlay('Connection lost', `Reconnecting in ${m.in || 1}s…`);
  });
  net.on('restarting', (m) => {
    serverRestarting = true;
    // the server told us it is going down — wait out the restart before retrying
    net.reconnectDelay = Math.max(net.reconnectDelay, (m.in || 5) * 1000);
    showNetOverlay('🔄 Server updating', 'Your progress is saved — you will be right back.');
  });
  net.on('closed', () => {
    const el = document.getElementById('netOverlay');
    if (started && el && el.classList.contains('hidden')) {
      showNetOverlay(serverRestarting ? '🔄 Server updating' : 'Connection lost', 'Reconnecting…');
    }
  });

  try {
    await net.connect();          // resolves on open; resume is sent automatically
  } catch (e) {
    st.innerHTML = 'Could not reach the server.<br/><span style="font-size:12px">Retrying automatically…</span>';
    console.error(e);
  }
}

/* Fires on every (re)connect. With a saved session we say nothing — the
   server's 'auth' reply brings the player straight back into the world. */
function onSocketOpen() {
  if (net.session && net.session.token) return;
  showAuthScreen('');
}

function showAuthScreen(message) {
  if (!authBuilt) { authBuilt = true; buildAuth(); }
  document.getElementById('boot').classList.add('hidden');
  document.getElementById('auth').classList.remove('hidden');
  const last = (net.session && net.session.username) || localStorage.getItem('naija_last') || '';
  if (last) document.getElementById('logUser').value = last;
  if (message) err(message);
}

function showNetOverlay(title, sub) {
  const el = document.getElementById('netOverlay');
  if (!el) return;
  document.getElementById('netTitle').textContent = title;
  document.getElementById('netSub').textContent = sub || '';
  el.classList.remove('hidden');
}
function hideNetOverlay() {
  const el = document.getElementById('netOverlay');
  if (el) el.classList.add('hidden');
}

/* ══════════════ auth UI ══════════════ */
let chosenStory = BACKSTORIES[0].id;
let chosenCity = null;

function buildAuth() {
  document.querySelectorAll('#authTabs .tab').forEach(t => t.onclick = () => {
    document.querySelectorAll('#authTabs .tab').forEach(x => x.classList.remove('active'));
    t.classList.add('active');
    document.getElementById('pane-new').classList.toggle('hidden', t.dataset.tab !== 'new');
    document.getElementById('pane-return').classList.toggle('hidden', t.dataset.tab !== 'return');
  });

  document.getElementById('backstories').innerHTML = BACKSTORIES.map(b => `
    <button class="bs-card ${b.id === chosenStory ? 'sel' : ''}" data-bs="${b.id}">
      <div class="bs-top"><span class="bs-emoji">${b.emoji}</span>
        <span class="bs-name">${esc(b.name)}</span>
        <span class="bs-cash">${naira(b.cash)}</span></div>
      <div class="bs-blurb">${esc(b.blurb)}</div>
    </button>`).join('');
  document.querySelectorAll('[data-bs]').forEach(b => b.onclick = () => {
    chosenStory = b.dataset.bs;
    document.querySelectorAll('[data-bs]').forEach(x => x.classList.toggle('sel', x.dataset.bs === chosenStory));
    if (!chosenCity) {
      const c = BACKSTORIES.find(s => s.id === chosenStory).city;
      document.querySelectorAll('[data-city]').forEach(x => x.classList.toggle('sel', x.dataset.city === c));
    }
  });

  document.getElementById('cityPicker').innerHTML = CITIES.map(c =>
    `<button class="city-chip" data-city="${c.id}">${esc(c.name)}</button>`).join('');
  document.querySelectorAll('[data-city]').forEach(b => b.onclick = () => {
    chosenCity = b.dataset.city;
    document.querySelectorAll('[data-city]').forEach(x => x.classList.toggle('sel', x.dataset.city === chosenCity));
  });
  const c0 = BACKSTORIES[0].city;
  document.querySelectorAll('[data-city]').forEach(x => x.classList.toggle('sel', x.dataset.city === c0));

  document.getElementById('btnRegister').onclick = doRegister;
  document.getElementById('btnLogin').onclick = doLogin;
  for (const id of ['regName','regUser','regPass','logUser','logPass']) {
    document.getElementById(id).addEventListener('keydown', (e) => {
      if (e.key === 'Enter') { id.startsWith('log') ? doLogin() : doRegister(); }
    });
  }
  document.getElementById('showHelp').onclick = (e) => { e.preventDefault(); showHelp(); };

  // returning player?
  const saved = localStorage.getItem('naija_last');
  if (saved) { document.getElementById('logUser').value = saved; }
}

function doRegister() {
  const name = document.getElementById('regName').value.trim();
  const username = document.getElementById('regUser').value.trim();
  const password = document.getElementById('regPass').value;
  if (name.length < 2) return err('Give yourself a name.');
  if (username.length < 3) return err('Username needs 3+ characters.');
  if (password.length < 4) return err('Password needs 4+ characters.');
  err('');
  net.register({ username, password, name, backstory: chosenStory, city: chosenCity, skin: Math.floor(Math.random() * 10) + 1 });
  localStorage.setItem('naija_last', username.toLowerCase());
}
function doLogin() {
  const u = document.getElementById('logUser').value.trim();
  const p = document.getElementById('logPass').value;
  if (!u || !p) return err('Both fields, please.');
  err('');
  net.login(u, p);
  localStorage.setItem('naija_last', u.toLowerCase());
}
function err(m) { document.getElementById('authError').textContent = m; }

function showHelp() {
  document.getElementById('boot').classList.add('hidden');
  alert(`NAIJA LIFE

A real-time multiplayer life-sim of Nigeria.

• 12 cities, 45 districts, ~250 real places. Walk the streets with WASD or click to move.
• A working phone: bank, ride-hailing, market, data bundles, prepaid meter, school, INEC, hospital, Squawk, betting and more.
• Real economy: ₦70,000 minimum wage, ₦1,250/litre fuel, Lekki rent in the millions. Rent, data, light and school fees land every month.
• Systems: education → NYSC → career · politics & elections · church, mosque & shrine · police, crime & EFCC heat · family pressure & owambe · fame & music.
• Other players are real. Walk up to them and talk.

1 real second = 4 game minutes. A game-day is 6 minutes, a month is 15.`);
}

function onAuth(msg) {
  if (!msg.ok) {
    // mid-game this means the saved token was rejected — ask for the password once
    if (started) {
      net.wantReconnect = false;
      net.clearSession();
      showAuthScreen(msg.msg || 'Session expired — please sign in again.');
    } else {
      err(msg.msg || 'Could not sign in.');
    }
    return;
  }

  serverRestarting = false;         // we're back
  // remember the session so a redeploy / dropped socket resumes silently
  if (msg.token) net.saveSession(msg.token, (msg.player && msg.player.username) || (net.session && net.session.username));
  if (msg.player) net.state.me = msg.player;   // seed state before the first 'you' frame lands
  err('');
  hideNetOverlay();
  document.getElementById('auth').classList.add('hidden');
  document.getElementById('game').classList.remove('hidden');

  if (!started) { startGame(); return; }

  // ── resumed an existing session: pick up exactly where we left off ──
  const p = me();
  if (p && p.districtId && view.districtId !== p.districtId) view.setDistrict(p.districtId, p.x, p.y);
  updateHud();
  syncVenuePanel();
  toast(msg.resumed ? 'Back online.' : 'Signed in.', 'good', msg.resumed ? '🔌' : '✅');
}

/* ══════════════ game ══════════════ */
function startGame() {
  started = true;
  buildHud();
  initChat();
  initMap(view);
  updateHud();

  const p = me();
  view.setDistrict(p.districtId, p.x, p.y);
  view.onPrompt = showPrompt;

  // dock
  document.getElementById('btnPhone').onclick = () => phone.toggle();
  document.getElementById('btnMap').onclick = () => openMap(view);
  document.getElementById('btnBag').onclick = () => openApp('oja');
  document.getElementById('btnMe').onclick = () => openApp('me');
  document.getElementById('btnMenu').onclick = () => openApp('settings');

  // chat from server
  net.on('chat', (m) => pushChat({ ...m, fromMe: m.fromMe }));
  net.on('toast', (m) => toast(m.text, m.kind === 'bad' ? 'bad' : m.kind === 'money' ? 'money' : 'good', m.emoji));
  net.on('you', () => { updateHud(); syncVenuePanel(); });
  net.on('world', () => { updateHud(); checkBanner(); });
  net.on('nearby', () => { syncVenuePanel(); });

  // keys
  addEventListener('keydown', (e) => {
    if (document.activeElement && /INPUT|TEXTAREA/.test(document.activeElement.tagName)) return;
    const k = e.key.toLowerCase();
    if (k === 'e') {
      e.preventDefault();
      const pr = view.nearNpc ? { kind: 'npc', npc: view.nearNpc } : view.nearest ? { kind: 'venue', venue: view.nearest } : null;
      if (!pr) return;
      if (pr.kind === 'venue') {
        enterVenue(pr.venue.id);
      } else {
        talkToNpc(pr.npc);
      }
    }
    if (k === 'p') { e.preventDefault(); phone.toggle(); }
    if (k === 'm') { e.preventDefault(); el('mapScreen').classList.contains('hidden') ? openMap(view) : closeMap(); }
    if (k === 'b') { e.preventDefault(); openApp('oja'); }
    if (k === 'c') { e.preventDefault(); openApp('me'); }
    if (k === 'escape') {
      if (!el('mapScreen').classList.contains('hidden')) closeMap();
      else if (phone.open) phone.hide();
      else if (!el('modal').classList.contains('hidden')) el('modal').classList.add('hidden');
      else openApp('settings');
    }
  });

  window.addEventListener('naija:findType', (e) => {
    const type = e.detail;
    const d = DISTRICT_BY_ID[me().districtId];
    const v = d?.venues.find(x => x.type === type) || d?.venues[0];
    if (v) { closeMap(); openMap(view, v.name.split(' ')[0]); }
  });

  // first-run welcome
  setTimeout(() => {
    toast('WASD or arrow keys to move. Click anywhere to walk there. Press E at a building to go in.', 'good', '🕹️');
  }, 900);
  setTimeout(() => toast('Press P for your phone. Everything — bank, transport, school, hospital, Squawk — lives in there.', 'good', '📱'), 7000);

  requestAnimationFrame(loop);
}

async function enterVenue(venueId) {
  const r = await act('venue.enter', { venueId });
  if (!r.ok) return;                       // act() already toasts the reason (entry fee, closed…)
  await openVenue(venueId, r.data);
}

function talkToNpc(npc) {
  const line = npc.say || pickLine(npc.type);
  pushChat({ from: npc.name, text: line, kind: 'npc' });
  need('fun', 0);
}
function pickLine(type) {
  const t = NPC_TYPES.find(x => x.id === type);
  return t ? t.lines[Math.floor(Math.random() * t.lines.length)] : 'How far?';
}
function need() {}

/* ══════════════ loop ══════════════ */
let last = performance.now();
let acc = 0;
function loop(now) {
  const dt = Math.min(120, now - last); last = now;
  const st = { me: me(), world: wld(), nearby: net.state.nearby, npcs: net.state.npcs };

  // did we change district? (travel, teleport)
  if (st.me && st.me.districtId !== view.districtId) {
    view.setDistrict(st.me.districtId, st.me.x, st.me.y);
  }
  view.locked = phone.open || !el('mapScreen').classList.contains('hidden') || !!st.me?.travel;
  view.update(dt, st);
  view.draw(st);

  acc += dt;
  if (acc > 220) {
    acc = 0;
    updateHud();
    updateTravelling();
    syncVenuePanel();
    if (st.me && st.me.x !== undefined) {
      // keep server x/y roughly in sync even when idle
      if (!view.moving) { net.move(view.px, view.py, view.dir, false, st.me.districtId); }
    }
  }
  requestAnimationFrame(loop);
}

window.__view = view;
window.__net = net;
window.__phone = phone;

boot();
