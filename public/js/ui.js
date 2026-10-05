/* NAIJA LIFE — HUD, chat, map search, venue panel */
import { net, me, wld } from './net.js';
import { CITIES, CITY_BY_ID, DISTRICTS, DISTRICT_BY_ID, VENUES, VENUE_BY_ID, VENUE_TYPES } from '/src/data/cities.js';
import { phone, APPS, toast, naira, act, esc } from './phone.js';

export const el = (id) => document.getElementById(id);
const WEATHER = { clear:'☀️', rain:'🌧️', harmattan:'🌫️', heat:'🥵' };
const NEEDS = [
  { k:'energy', e:'⚡' }, { k:'hunger', e:'🍲' }, { k:'hygiene', e:'🧼' }, { k:'fun', e:'🎉' }, { k:'health', e:'❤️' },
];

export function openApp(id) {
  const a = APPS.find(x => x.id === id);
  if (!a) return;
  phone.curApp = id;
  phone.show();
  try { a.open(phone, me()); } catch (e) { console.error(e); }
}

/* ══════════════ HUD ══════════════ */
export function buildHud() {
  el('hudNeeds').innerHTML = NEEDS.map(n => `
    <div class="need"><span class="need-emoji">${n.e}</span>
      <div class="need-bar"><div class="need-fill" id="nd-${n.k}" style="width:80%"></div></div></div>`).join('');
}

let lastMoney = 0;
export function updateHud() {
  const p = me(), w = wld();
  if (!p || !w) return;
  const d = DISTRICT_BY_ID[p.districtId];
  el('hudPlace').innerHTML = `<span class="place-city">${esc(CITY_BY_ID[p.cityId]?.name || '')}</span>
    <span class="place-district">${esc(d?.name || '')}${p.venueId ? ' · ' + esc(VENUE_BY_ID[p.venueId]?.name || '') : ''}</span>`;
  el('hudTime').textContent = w.timeString;
  el('hudDay').textContent = `Day ${w.time.day} · Month ${w.time.month}`;
  el('hudWeather').textContent = WEATHER[w.weather] || '☀️';
  el('hudWeather').title = w.weather;

  const total = p.cash + p.bank;
  el('hudMoney').textContent = naira(total);
  if (total !== lastMoney) { el('hudMoney').classList.remove('flash'); void el('hudMoney').offsetWidth; el('hudMoney').classList.add('flash'); }
  lastMoney = total;
  el('hudCash').textContent = naira(p.cash);
  el('hudBank').textContent = naira(p.bank);

  for (const n of NEEDS) {
    const v = Math.max(0, Math.min(100, p.needs[n.k]));
    const f = el('nd-' + n.k);
    if (f) { f.style.width = v + '%'; f.className = 'need-fill ' + (v > 55 ? 'hi' : v > 25 ? 'mid' : 'lo'); }
  }
  el('chipOnline').textContent = `🟢 ${w.online} online · ${w.totalPlayers} lives`;
  el('chipNet').textContent = `${p.telco.network} · ${Math.round(p.telco.dataMB)}MB`;
  el('chipJob').textContent = p.job ? `${p.jobEmoji} ${p.jobName}` : (p.edu.nysc ? '🇳🇬 Corper' : '😐 No job');
  window.__naijaHour = w.time.hour;

  // phone status bar (live even when the phone is closed)
  const t = w.timeString || '';
  el('pTime').textContent = t.replace(/:\d\d\s/, ' ').replace(' AM','').replace(' PM','');
  el('pNet').textContent = p.telco.network;
  const mb = Math.round(p.telco.dataMB);
  el('pData').textContent = mb > 1024 ? (mb / 1024).toFixed(1) + 'GB' : mb + 'MB';
  el('pData').style.color = mb < 50 ? '#e5484d' : '';
}

/* ══════════════ CHAT ══════════════ */
let scope = 'local';
export function initChat() {
  el('chat').classList.remove('collapsed');
  setTimeout(() => el('chat').classList.add('collapsed'), 3500);
  el('chatToggle').onclick = () => el('chat').classList.toggle('collapsed');
  document.querySelectorAll('.ctab').forEach(b => b.onclick = () => {
    document.querySelectorAll('.ctab').forEach(x => x.classList.remove('active'));
    b.classList.add('active'); scope = b.dataset.scope;
    el('chatLog').innerHTML = '';
    el('chatInput').placeholder = scope === 'dm' ? 'username: message' : 'Talk your own…';
    el('dmDot').classList.add('hidden');
  });
  el('chatForm').onsubmit = (e) => {
    e.preventDefault();
    const v = el('chatInput').value.trim();
    if (!v) return;
    if (scope === 'dm') {
      const i = v.indexOf(':');
      if (i < 1) return toast('Type: username: your message', 'bad');
      net.chat('dm', v.slice(i + 1).trim(), v.slice(0, i).trim());
      pushChat({ from: 'You', text: v.slice(i + 1).trim(), me: true });
    } else {
      net.chat(scope, v);
    }
    el('chatInput').value = '';
  };
}
export function pushChat(m) {
  const log = el('chatLog');
  const d = document.createElement('div');
  d.className = 'msg' + (m.scope === 'dm' ? ' dm' : '');
  const who = m.to && !m.fromMe ? `→ @${m.to}` : '';
  d.innerHTML = m.kind === 'sys'
    ? esc(m.text)
    : `<b>${esc(m.from)}</b>${who ? ' <span class="mut">' + esc(who) + '</span>' : ''}: ${esc(m.text)}`;
  log.appendChild(d);
  while (log.children.length > 90) log.firstChild.remove();
  log.scrollTop = log.scrollHeight;
  if (scope === 'dm' && m.scope === 'dm' && !m.fromMe) el('dmDot').classList.remove('hidden');
}

/* ══════════════ MAP ══════════════ */
export function initMap(view) {
  el('btnMap').onclick = () => openMap(view);
  el('mapClose').onclick = closeMap;
  el('mapSearch').oninput = () => drawMapResults(view);
  el('mapCities').innerHTML = CITIES.map(c =>
    `<button class="map-city" data-city="${c.id}">${esc(c.name)}<small>${esc(c.state)}</small></button>`).join('');
  el('mapCities').querySelectorAll('[data-city]').forEach(b => b.onclick = () => {
    el('mapCities').querySelectorAll('.map-city').forEach(x => x.classList.remove('on'));
    b.classList.add('on');
    el('mapSearch').value = '';
    drawMapResults(view, b.dataset.city);
  });
}
export function openMap(view, preset) {
  el('mapScreen').classList.remove('hidden');
  if (preset) el('mapSearch').value = preset;
  drawMapResults(view, null, preset);
}
export function closeMap() { el('mapScreen').classList.add('hidden'); }

function drawMapResults(view, cityId, preset) {
  const p = me();
  const term = (preset ?? el('mapSearch').value).toLowerCase().trim();
  let list = VENUES;
  if (cityId) list = list.filter(v => v.cityId === cityId);
  if (term) list = list.filter(v =>
    v.name.toLowerCase().includes(term) || v.cityName.toLowerCase().includes(term) ||
    v.districtName.toLowerCase().includes(term) || (VENUE_TYPES[v.type]?.label || '').toLowerCase().includes(term) ||
    v.state?.toLowerCase().includes(term));
  else if (!cityId) list = list.filter(v => v.cityId === p.cityId);
  el('mapResults').innerHTML = list.slice(0, 60).map(v => {
    const sameCity = v.cityId === p.cityId;
    return `<div class="res"><span style="font-size:20px">${v.emoji}</span>
      <div class="grow"><div class="res-name">${esc(v.name)}</div>
      <div class="res-meta">${esc(VENUE_TYPES[v.type]?.label || v.type)}</div>
      <div class="res-where">${esc(v.districtName)}, ${esc(v.cityName)}</div></div>
      ${sameCity ? `<button class="btn sm go" data-go="${v.id}">Go</button>` : `<button class="btn sm" data-far="${v.cityId}">${esc(v.cityName)}</button>`}</div>`;
  }).join('') || `<div class="empty"><span class="big">🗺️</span>Nothing matched. Try “market”, “beach”, “shrine”, “uni” or a city.</div>`;
  el('mapResults').querySelectorAll('[data-go]').forEach(b => b.onclick = async () => {
    const r = await act('travel.toVenue', { venueId: b.dataset.go });
    if (r.ok) { closeMap(); view.target = null; }
  });
  el('mapResults').querySelectorAll('[data-far]').forEach(b => b.onclick = () => {
    closeMap(); openApp('dash');
  });
}

/* ══════════════ VENUE PANEL ══════════════ */
const OPEN_APP_FOR = {
  'act.eat':'chop', 'shop.catalogue':'oja', 'travel.info':'dash', 'bet.place':'bet',
  'health.hospital':'health', 'health.pharmacy':'health', 'edu.info':'edu', 'politics.info':'inec',
  'politics.pvc':'inec', 'housing.info':'oja', 'bank.info':'sabipay', 'police.info':'street',
  'court.info':'street', 'prison.info':'street', 'gov.info':'maps', 'util.fuel':'nepa',
};

export async function openVenue(venueId, prefetched) {
  const r = prefetched ? { data: prefetched } : await net.act('venue.info', { venueId });
  const v = r.data?.venue || VENUE_BY_ID[venueId]; if (!v) return;
  el('venuePanel').classList.remove('hidden');
  el('vpEmoji').textContent = v.emoji;
  el('vpName').textContent = v.name;
  el('vpSub').textContent = `${VENUE_TYPES[v.type]?.label || v.type} · ${v.districtName}, ${v.cityName}`;
  el('vpLeave').onclick = async () => { await act('venue.leave'); el('venuePanel').classList.add('hidden'); };
  renderVenueActs(v, r.data?.acts || []);
  const ppl = await net.act('venue.people', { venueId });
  const d = ppl.data || {};
  const players = d.people || [], npcs = d.npcs || [];
  el('vpChat').innerHTML =
    (players.length ? players.map(q => `<div class="msg"><b>${esc(q.name)}</b> <span class="mut">${esc(q.job || 'around')}</span></div>`).join('') : '') +
    (npcs.length ? `<div class="mini" style="margin-top:8px">Also here: ${npcs.slice(0, 6).map(n => `${n.emoji} ${esc(n.name)}`).join(' · ')}</div>` : '') +
    (!players.length && !npcs.length ? `<div class="mini">Nobody else here. Early bird.</div>` : '');
}

function renderVenueActs(v, acts) {
  el('vpActs').innerHTML = acts.map(a => `<button class="vp-act" data-a="${a.action}" data-p="${esc(JSON.stringify(a.params))}">${a.emoji} ${esc(a.label)}</button>`).join('');
  el('vpActs').querySelectorAll('[data-a]').forEach(b => b.onclick = async () => {
    const action = b.dataset.a, params = JSON.parse(b.dataset.p || '{}');
    const appId = OPEN_APP_FOR[action];
    if (appId && (params.openFood || params.open)) { openApp(appId); return; }
    if (appId) { openApp(appId); return; }
    const r = await act(action, params);
    if (r.ok) {
      if (r.data?.acts) renderVenueActs(v, r.data.acts);
    }
  });
}

export function syncVenuePanel() {
  const p = me();
  if (!p) return;
  if (p.venueId) {
    if (el('venuePanel').classList.contains('hidden')) openVenue(p.venueId);
  } else {
    el('venuePanel').classList.add('hidden');
  }
}

/* ══════════════ TRAVELLING ══════════════ */
const TRAV_LINES = [
  'The conductor is hanging off the door shouting the destination.',
  'A hawker taps the window: “Gala! Pure water! Mineral!”',
  'Traffic has not moved in twenty minutes. Nobody is surprised.',
  'Somebody’s phone is playing Afrobeats at full volume.',
  'You pass a broken-down trailer. Three men are under it.',
  'A goat crosses the road without looking.',
  'The driver is praying in tongues and overtaking at the same time.',
  'You hit a pothole that should be on the news.',
  'An okada weaves past you with a fridge on the back.',
  'Rain starts. The wipers do not work.',
  'Police checkpoint ahead. Everybody starts arranging their face.',
  'A sign says “GO SLOW”. It has said that since 2009.',
];
export function updateTravelling() {
  const p = me();
  const t = p?.travel;
  const box = el('travelling');
  if (!t) { box.classList.add('hidden'); return; }
  if (box.classList.contains('hidden')) {
    box.classList.remove('hidden');
    el('travEmoji').textContent = t.emoji || '🚐';
    el('travTitle').textContent = t.long ? `Heading to ${t.toName}` : `On the way to ${t.toName}`;
    el('travSub').textContent = t.long ? 'This will take a while. Sleep, or look out the window.' : 'Hold your bag.';
    let i = 0;
    const tick = () => {
      if (el('travelling').classList.contains('hidden')) return;
      const line = document.createElement('div');
      line.textContent = TRAV_LINES[Math.floor(Math.random() * TRAV_LINES.length)];
      el('travLines').appendChild(line);
      while (el('travLines').children.length > 3) el('travLines').firstChild.remove();
      if (++i < 20) setTimeout(tick, 1400 + Math.random() * 1200);
    };
    tick();
  }
  const tick = (wld()?.tick) || 0;
  if (t.startTick == null) t.startTick = Math.max(0, t.endsAt - 40);
  const total = Math.max(1, t.endsAt - t.startTick);
  const done = Math.max(0, Math.min(1, 1 - (t.endsAt - tick) / total));
  el('travFill').style.width = (done * 100) + '%';
}

/* ══════════════ event banner ══════════════ */
let lastNews = '';
export function checkBanner() {
  const w = wld(); if (!w) return;
  const n = w.news[0];
  if (!n || n.text === lastNews) return;
  if (!lastNews) { lastNews = n.text; return; }
  lastNews = n.text;
  const b = el('eventBanner');
  b.innerHTML = `<span class="be">${n.emoji}</span><span>${esc(n.text)}</span>`;
  b.classList.remove('hidden');
  clearTimeout(window.__bannerT);
  window.__bannerT = setTimeout(() => b.classList.add('hidden'), 8000);
}

/* ══════════════ prompt ══════════════ */
export function showPrompt(p) {
  const box = el('prompt');
  if (!p) { box.classList.add('hidden'); return; }
  box.classList.remove('hidden');
  if (p.kind === 'venue') {
    el('promptKey').textContent = 'E';
    el('promptText').textContent = `Enter ${p.venue.name}`;
  } else {
    el('promptKey').textContent = 'E';
    el('promptText').textContent = `Talk to ${p.npc.name} (${p.npc.kindName})`;
  }
}
