/* NAIJA LIFE — the phone. 20 apps, all of them actually work. */
import { net, me, wld } from './net.js';
import { CITIES, CITY_BY_ID, DISTRICTS, DISTRICT_BY_ID, VENUES, VENUE_BY_ID, VENUE_TYPES } from '/src/data/cities.js';
import { CAREER_BY_ID, BACKSTORIES, GIGS, ITEMS, ILLNESSES, TITLES } from '/src/data/content.js';
import { HOUSING, DATA_PLANS, NETWORKS, TRANSPORT, FOOD, FAITHS, OWAMBE, WEDDING_COST, BRIBE, CRIME, TUNING } from '/src/config.js';
import { APPS_B } from './phone_apps.js';

export const naira = (n) => '₦' + Math.round(n || 0).toLocaleString('en-NG');
const esc = (s) => String(s ?? '').replace(/[&<>"]/g, c => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;' }[c]));

/* ══════════════ the phone controller ══════════════ */
class Phone {
  constructor() {
    this.el = document.getElementById('phoneScreen');
    this.view_ = document.getElementById('phoneView');
    this.home = document.getElementById('phoneHome');
    this.open = false;
    this.stack = [];
    this.cur = null;
    this.home.addEventListener('click', () => this.goHome());
  }
  show() { this.el.classList.remove('hidden'); this.open = true; if (!this.stack.length) this.goHome(); }
  hide() { this.el.classList.add('hidden'); this.open = false; }
  toggle() { this.open ? this.hide() : this.show(); }

  goHome() { this.stack = []; this.curApp = null; this.renderHome(); }
  back() { this.stack.pop(); if (!this.stack.length) this.goHome(); else this.renderView(this.stack[this.stack.length - 1]); }

  view(title, sub, html, mount) {
    const top = this.stack[this.stack.length - 1];
    const entry = { title, sub, html, mount, appId: this.curApp };
    // an app re-rendering itself replaces its own view instead of stacking history
    if (top && top.appId && top.appId === this.curApp) this.stack[this.stack.length - 1] = entry;
    else this.stack.push(entry);
    this.renderView(entry);
  }
  renderView(v) {
    this.view_.innerHTML = `
      <div class="appview">
        <div class="app-head">
          <button class="back" id="appBack">‹</button>
          <div class="grow"><div class="app-title">${v.title}</div>${v.sub ? `<div class="app-sub">${v.sub}</div>` : ''}</div>
        </div>
        <div class="app-body" id="appBody">${v.html}</div>
      </div>`;
    this.view_.querySelector('#appBack').onclick = () => this.back();
    const body = this.view_.querySelector('#appBody');
    if (v.mount) v.mount(body);
    this.view_.scrollTop = 0;
    this.view_.parentElement.querySelector('.phone-screen').scrollTop = 0;
  }

  renderHome() {
    const p = me();
    const hour = wld()?.time?.hour ?? 8;
    const greet = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
    this.view_.innerHTML = `
      <div class="appgrid">
        ${APPS.map(a => {
          const b = a.badge ? a.badge(p) : 0;
          return `<button class="app" data-app="${a.id}">
            <span class="app-icon" style="background:${a.bg}">${a.emoji}${b ? `<span class="badge">${b}</span>` : ''}</span>
            <span class="app-label">${a.name}</span>
          </button>`;
        }).join('')}
      </div>`;
    this.view_.querySelectorAll('[data-app]').forEach(btn => {
      btn.onclick = () => {
        const app = APPS.find(a => a.id === btn.dataset.app);
        this.curApp = app.id;
        try { app.open(this, me()); } catch (e) { console.error(e); }
      };
    });
    this.home.innerHTML = `<button id="phoneClose">●</button>`;
    this.home.querySelector('#phoneClose').onclick = () => this.hide();
    void greet;
  }
}

export const phone = new Phone();

/* ══════════════ helpers used by apps ══════════════ */
export async function act(a, p = {}, opts = {}) {
  const r = await net.act(a, p);
  if (r.msg && !opts.silent) toast(r.msg, r.ok ? 'good' : 'bad');
  return r;
}
export function toast(text, kind = 'good', emoji) {
  const wrap = document.getElementById('toasts');
  const d = document.createElement('div');
  d.className = 'toast ' + kind;
  d.innerHTML = (emoji ? `<b>${emoji}</b> ` : '') + esc(text);
  wrap.appendChild(d);
  setTimeout(() => { d.classList.add('fade'); setTimeout(() => d.remove(), 400); }, 4200);
  while (wrap.children.length > 5) wrap.firstChild.remove();
}
export function moneyRow(label, value, cls = '') {
  return `<div class="row"><span class="grow">${label}</span><b class="${cls}">${value}</b></div>`;
}
export function needBar(label, v, max = 100, emoji = '') {
  const pct = Math.max(0, Math.min(100, v / max * 100));
  const cls = pct > 55 ? 'hi' : pct > 25 ? 'mid' : 'lo';
  return `<div style="flex:1"><div class="row" style="gap:4px;margin:0"><span style="font-size:11px">${emoji} ${label}</span><span class="right" style="margin-left:auto;font-size:11px" >${Math.round(v)}%</span></div><div class="bar"><i style="width:${pct}%;background:${cls==='hi'?'linear-gradient(90deg,#00c389,#3ddc97)':cls==='mid'?'linear-gradient(90deg,#f5b301,#ffd166)':'linear-gradient(90deg,#e5484d,#ff7b7f)'}"></i></div></div>`;
}

/* ══════════════════════════════════════════════════
   APPS — PART A: money, work, market, transport
   ══════════════════════════════════════════════════ */
const APPS_A = [

/* ─────────── SabiPay ─────────── */
{
  id:'sabipay', name:'SabiPay', emoji:'🏦', bg:'linear-gradient(145deg,#1e6fd9,#0d3f8a)',
  badge: (p) => (p.inbox || []).filter(m => /sent you/.test(m.text||'')).length,
  open(app) {
    const p = me();
    const render = () => {
      const p = me();
      app.view('SabiPay', `${p.telco.network} · instant transfer`, `
        <div class="card hero">
          <div class="mini">Available balance</div>
          <div class="big-num">${naira(p.bank)}</div>
          <div class="mini" style="margin-top:4px">Cash in hand: <b class="gold">${naira(p.cash)}</b> · Net worth ${naira(p.stats.netWorth)}</div>
        </div>
        <div class="seg" id="bankSeg">
          <button class="on" data-s="send">Send</button>
          <button data-s="cash">Cash</button>
          <button data-s="loan">Loan</button>
          <button data-s="hist">History</button>
        </div>
        <div id="bankPane"></div>
      `, (body) => {
        const pane = body.querySelector('#bankPane');
        const seg = body.querySelector('#bankSeg');
        const drawSend = () => {
          pane.innerHTML = `
            <div class="card">
              <input class="input" id="trTo" placeholder="Username (e.g. chidi_b)"/>
              <input class="input" id="trAmt" type="number" placeholder="Amount in ₦"/>
              <input class="input" id="trNar" placeholder="Narration (optional)"/>
              <button class="btn go" id="trGo">Send money</button>
              <div class="mini" style="margin-top:8px">Transfers are instant and final. Bank charge: free. (Enjoy it while it lasts.)</div>
            </div>
            <div class="card"><div class="row"><span class="li-em">👥</span><div class="grow"><div class="li-t">Online now</div><div class="li-s">Tap to prefill</div></div></div>
              <div id="onlineList" style="margin-top:8px"></div></div>`;
          const list = pane.querySelector('#onlineList');
          const online = net.state.nearby.filter(q => q.online);
          if (!online.length) list.innerHTML = `<div class="mini">Nobody around you right now.</div>`;
          else list.innerHTML = online.slice(0, 12).map(q => `<button class="btn sm" data-u="${esc(q.username)}" style="margin:3px 4px 0 0">@${esc(q.name)}</button>`).join('');
          list.querySelectorAll('[data-u]').forEach(b => b.onclick = () => { pane.querySelector('#trTo').value = b.dataset.u; });
          pane.querySelector('#trGo').onclick = async () => {
            const to = pane.querySelector('#trTo').value, amt = +pane.querySelector('#trAmt').value, nar = pane.querySelector('#trNar').value;
            if (!to || !amt) return toast('Enter a username and an amount.', 'bad');
            const r = await act('bank.transfer', { to, amount: amt, narration: nar });
            if (r.ok) render();
          };
        };
        const drawCash = () => {
          pane.innerHTML = `
            <div class="card"><div class="li-t">Deposit cash</div>
              <div class="mini">Put your cash somewhere agbero cannot reach it.</div>
              <input class="input" id="dAmt" type="number" placeholder="Amount"/>
              <button class="btn go" id="dGo">Deposit</button></div>
            <div class="card"><div class="li-t">Withdraw</div>
              <div class="mini">ATM charge: ₦65 (₦100 over ₦10,000). Yes, really.</div>
              <input class="input" id="wAmt" type="number" placeholder="Amount"/>
              <button class="btn" id="wGo">Withdraw</button></div>`;
          pane.querySelector('#dGo').onclick = async () => { const r = await act('bank.deposit', { amount: +pane.querySelector('#dAmt').value }); if (r.ok) render(); };
          pane.querySelector('#wGo').onclick = async () => { const r = await act('bank.withdraw', { amount: +pane.querySelector('#wAmt').value }); if (r.ok) render(); };
        };
        const drawLoan = () => {
          pane.innerHTML = `
            <div class="card ${p.debts.length ? 'danger' : ''}">
              <div class="li-t">Take a loan</div>
              <div class="mini">Rate depends on inflation (${Math.round((wld()?.macro?.inflation || .22) * 100)}%) and your name (${Math.round(p.stats.reputation)}/100). Repay in 6 months.</div>
              <input class="input" id="lAmt" type="number" placeholder="₦10,000 – ₦5,000,000"/>
              <div class="btn-row"><button class="btn sm go" data-q="50000">₦50k</button><button class="btn sm go" data-q="250000">₦250k</button><button class="btn sm go" data-q="1000000">₦1m</button></div>
              <button class="btn go" id="lGo" style="margin-top:8px">Borrow</button>
            </div>
            ${p.debts.length ? `<div class="card danger"><div class="li-t">What you owe</div>
              ${p.debts.map((d, i) => `<div class="row"><span class="grow"><b>${esc(d.to)}</b><div class="mini">${naira(d.amount)} · ${d.monthsLeft} months left</div></span>
              <button class="btn sm warn" data-repay="${i}">Clear</button></div>`).join('')}</div>` : ''}`;
          pane.querySelectorAll('[data-q]').forEach(b => b.onclick = () => pane.querySelector('#lAmt').value = b.dataset.q);
          pane.querySelector('#lGo').onclick = async () => { const r = await act('bank.loan', { amount: +pane.querySelector('#lAmt').value }); if (r.ok) render(); };
          pane.querySelectorAll('[data-repay]').forEach(b => b.onclick = async () => { const r = await act('bank.repay', { index: +b.dataset.repay }); if (r.ok) render(); });
        };
        const drawHist = () => {
          pane.innerHTML = `<div class="card">${p.ledger.length ? p.ledger.slice(0, 30).map(l =>
            `<div class="row"><span class="grow"><b style="font-size:13px">${esc(l.reason)}</b></span>
             <b class="${l.amount >= 0 ? 'green' : 'red'}">${l.amount >= 0 ? '+' : ''}${naira(l.amount)}</b></div>`).join('')
            : '<div class="mini">No transactions yet. Go and make some mistakes.</div>'}</div>`;
        };
        const pages = { send: drawSend, cash: drawCash, loan: drawLoan, hist: drawHist };
        seg.querySelectorAll('button').forEach(b => b.onclick = () => {
          seg.querySelectorAll('button').forEach(x => x.classList.remove('on'));
          b.classList.add('on'); pages[b.dataset.s]();
        });
        drawSend();
      });
    };
    render();
  }
},

/* ─────────── Hustle (jobs + gigs) ─────────── */
{
  id:'hustle', name:'Hustle', emoji:'💼', bg:'linear-gradient(145deg,#0ea5e9,#0369a1)',
  badge: (p) => p.job ? 0 : 1,
  open(app) {
    const render = async () => {
      const p = me();
      const list = await net.act('work.list', {});
      const gigs = await net.act('gig.list', {});
      const jobs = list.data?.jobs || [];
      const g = gigs.data?.gigs || [];
      app.view('Hustle', list.data?.district || '', `
        ${p.job ? `
          <div class="card hero">
            <div class="row"><span class="em">${CAREER_BY_ID[p.job.careerId]?.emoji || '💼'}</span>
              <div class="grow"><div class="row-t">${esc(CAREER_BY_ID[p.job.careerId]?.name)} · Level ${p.job.level + 1}</div>
              <div class="row-s">${esc(p.job.employer)} · started month ${p.job.startedMonth}</div></div></div>
            <div class="hr"></div>
            <div class="row"><span class="grow">Hours this month</span><b>${p.job.hoursThisMonth || 0} / ${18}</b></div>
            <div class="bar" style="margin-top:6px"><i style="width:${Math.min(100, (p.job.hoursThisMonth || 0) / 18 * 100)}%"></i></div>
            <div class="mini" style="margin-top:6px">Salary ${naira(p.monthlyIncome)}/month lands at month end if you put in the hours.</div>
            <div class="btn-row" style="margin-top:10px">
              <button class="btn sm go" data-h="1">Work 1h</button>
              <button class="btn sm go" data-h="2">Work 2h</button>
              <button class="btn sm go" data-h="4">Work 4h</button>
            </div>
            <div class="btn-row" style="margin-top:6px">
              <button class="btn sm" id="btnPromote">Ask for promotion</button>
              <button class="btn sm warn" id="btnQuit">Resign</button>
            </div>
          </div>` : `<div class="card"><div class="li-t">You are not employed.</div>
            <div class="mini">Nigeria does not owe you a job. Pick something below, or run a side hustle.</div></div>`}

        <div class="card">
          <div class="li-t">Side hustles <span class="tag">instant cash</span></div>
          <div class="mini" style="margin-bottom:8px">No CV, no interview, no “we’ll get back to you”.</div>
          ${g.slice(0, 10).map(x => `
            <div class="list-item"><span class="li-em">${x.emoji}</span>
              <div class="grow"><div class="li-t">${esc(x.name)}</div>
              <div class="li-s">${x.est} · ${x.mins} min${x.skill ? ` · needs ${x.skill} ${x.level}` : ''}${x.need ? ` · needs ${x.need}` : ''}</div></div>
              <button class="btn sm go" data-gig="${x.id}" ${me().gig ? 'disabled' : ''}>Do it</button></div>`).join('')}
          ${me().gig ? `<div class="card" style="background:rgba(0,195,137,.12);border-color:rgba(0,195,137,.3)">
            <div class="li-t">Busy: ${esc(me().gig.name)}</div><div class="mini">Finish it first.</div></div>` : ''}
        </div>

        <div class="card">
          <div class="li-t">Jobs hiring in ${esc(list.data?.district || 'this area')}</div>
          ${jobs.length ? jobs.map(j => `
            <div class="list-item"><span class="li-em">${j.emoji}</span>
              <div class="grow"><div class="li-t">${esc(j.name)}</div>
              <div class="li-s">${naira(j.payNow)}/month to start · ${naira(j.pay)} at level 2${j.needs ? ` · needs ${j.needs}` : ''}</div>
              <div class="mini" style="margin-top:3px">${esc(j.desc)}</div></div>
              <button class="btn sm" data-job="${j.id}">Apply</button></div>`).join('')
            : `<div class="mini">Nothing here matches your papers. Move districts, or go and get more papers.</div>`}
        </div>
      `, (body) => {
        body.querySelectorAll('[data-h]').forEach(b => b.onclick = async () => { const r = await act('work.shift', { hours: +b.dataset.h }); if (r.ok) render(); });
        body.querySelectorAll('[data-gig]').forEach(b => b.onclick = async () => { const r = await act('gig.do', { id: b.dataset.gig }); if (r.ok) render(); });
        body.querySelectorAll('[data-job]').forEach(b => b.onclick = async () => { const r = await act('work.apply', { careerId: b.dataset.job }); if (r.ok) render(); });
        const q = body.querySelector('#btnQuit'); if (q) q.onclick = async () => { const r = await act('work.quit'); if (r.ok) render(); };
        const pr = body.querySelector('#btnPromote'); if (pr) pr.onclick = async () => { const r = await act('work.promote'); if (r.ok) render(); };
      });
    };
    render();
  }
},

/* ─────────── Oja (market) ─────────── */
{
  id:'oja', name:'Oja', emoji:'🧺', bg:'linear-gradient(145deg,#f97316,#c2410c)',
  open(app) {
    const render = async () => {
      const p = me();
      const here = VENUE_BY_ID[p.venueId];
      const cat = await net.act('shop.catalogue', {});
      const items = cat.data?.items || [];
      app.view('Oja', here ? esc(here.name) : 'Step into a shop', `
        ${!here ? `<div class="card"><div class="mini">Walk into a market, mall, tech hub or filling station to trade. You are outside.</div></div>` : ''}
        <div class="card hero"><div class="row"><span class="em">💰</span><div class="grow"><div class="row-t">Spending power</div>
          <div class="row-s">${naira(p.cash)} cash · ${naira(p.bank)} in the bank</div></div></div></div>

        ${items.length ? `<div class="card"><div class="li-t">For sale ${here ? 'here' : ''}</div>
          ${items.map(i => `<div class="list-item"><span class="li-em">${i.emoji}</span>
            <div class="grow"><div class="li-t">${esc(i.name)}</div><div class="li-s">${esc(i.desc || i.cat)}</div></div>
            <button class="btn sm go" data-buy="${i.id}" ${p.cash + p.bank < i.priceNow ? 'disabled' : ''}>${naira(i.priceNow)}</button></div>`).join('')}
        </div>` : ''}

        <div class="card"><div class="li-t">Your things <span class="tag">${p.items.length}</span></div>
          ${p.items.length ? p.items.map(i => {
            const def = ITEMS.find(x => x.id === i.id);
            return `<div class="list-item"><span class="li-em">${def?.emoji || '📦'}</span>
              <div class="grow"><div class="li-t">${esc(def?.name || i.id)}</div><div class="li-s">${i.qty > 1 ? i.qty + ' × ' : ''}resale ~${naira(Math.round((def?.price || 0) * .72 * (i.cond ?? 1)))}</div></div>
              <button class="btn sm warn" data-sell="${i.id}">Sell</button></div>`;
          }).join('') : '<div class="mini">You own nothing but the clothes you are wearing.</div>'}
        </div>

        ${p.properties.length ? `<div class="card"><div class="li-t">Property</div>
          ${p.properties.map(pr => `<div class="row"><span class="grow"><b>${esc(pr.kind)}</b><div class="mini">${esc(DISTRICT_BY_ID[pr.districtId]?.name || '')}</div></span><b class="gold">${naira(pr.value)}</b></div>`).join('')}</div>` : ''}
      `, (body) => {
        body.querySelectorAll('[data-buy]').forEach(b => b.onclick = async () => { const r = await act('shop.buy', { itemId: b.dataset.buy }); if (r.ok) render(); });
        body.querySelectorAll('[data-sell]').forEach(b => b.onclick = async () => { const r = await act('shop.sell', { itemId: b.dataset.sell }); if (r.ok) render(); });
      });
    };
    render();
  }
},

/* ─────────── Dash (transport) ─────────── */
{
  id:'dash', name:'Dash', emoji:'🚌', bg:'linear-gradient(145deg,#f5b301,#b45309)',
  open(app) {
    const render = async () => {
      const p = me();
      const city = CITY_BY_ID[p.cityId];
      const here = VENUE_BY_ID[p.venueId];
      const atPark = here && ['motorpark','airport','seaport'].includes(here.type);
      app.view('Dash', atPark ? 'You are at a park' : 'Go to a motor park for inter-city', `
        <div class="card hero"><div class="row"><span class="em">📍</span><div class="grow">
          <div class="row-t">${esc(DISTRICT_BY_ID[p.districtId]?.name)}, ${esc(city.name)}</div>
          <div class="row-s">Fuel is ${naira(wld()?.macro?.fuelPrice || 1250)}/litre today</div></div></div></div>

        <div class="card"><div class="li-t">Move within ${esc(city.name)}</div>
          <div class="mini" style="margin-bottom:8px">Pick a district, then a ride. Traffic is included in the estimate.</div>
          <div id="distList"></div>
          <div class="seg" id="modeSeg" style="margin-top:10px">
            ${Object.entries(TRANSPORT).filter(([k]) => k !== 'walk').map(([k, v]) => `<button data-m="${k}" class="${k==='danfo'?'on':''}">${v.emoji} ${v.name.split(' ')[0]}</button>`).join('')}
          </div>
          <button class="btn sm" id="walkBtn">🚶 Waka (free, costs energy)</button>
        </div>

        <div class="card"><div class="li-t">Leave ${esc(city.name)}</div>
          ${atPark ? `<div class="mini" style="margin-bottom:8px">You are at ${esc(here.name)}. Book a seat.</div>
            <div class="seg" id="modeSeg2">
              <button class="on" data-m2="bus">🚌 Bus</button>
              <button data-m2="road">🚗 Chartered car</button>
              <button data-m2="flight">✈️ Flight</button>
            </div>
            <div id="cityList"></div>`
          : `<div class="mini">Walk into a motor park (or airport) to travel between cities. Look for the 🚐 on your map.</div>`}
        </div>

        ${wld()?.macro?.travelDanger > 0.25 ? `<div class="card danger"><div class="li-t">⚠️ Travel advisory</div>
          <div class="mini">Risk on the roads is elevated right now. Night travel especially.</div></div>` : ''}
      `, (body) => {
        let mode = 'danfo', mode2 = 'bus';
        const distList = body.querySelector('#distList');
        const drawDists = async () => {
          const rows = [];
          for (const d of city.districts) {
            if (d.id === p.districtId.split(':')[1]) continue;
            const q = await net.act('travel.quote', { districtId: `${city.id}:${d.id}`, mode });
            if (q.data?.quote) rows.push({ d, q: q.data.quote });
          }
          distList.innerHTML = rows.map(r => `
            <div class="list-item"><span class="li-em">🏘️</span>
              <div class="grow"><div class="li-t">${esc(r.d.name)}</div><div class="li-s">${r.q.km} km · ${r.q.minutes} min</div></div>
              <button class="btn sm go" data-to="${city.id}:${r.d.id}">${naira(r.q.fare)}</button></div>`).join('');
          distList.querySelectorAll('[data-to]').forEach(b => b.onclick = async () => {
            const r = await act('travel.intra', { districtId: b.dataset.to, mode });
            if (r.ok) { phone.hide(); }
          });
        };
        const cityList = body.querySelector('#cityList');
        const drawCities = async () => {
          const rows = [];
          for (const c of CITIES) {
            if (c.id === p.cityId) continue;
            const q = await net.act('travel.quote', { cityId: c.id, mode: mode2 });
            if (q.data?.quote) rows.push({ c, q: q.data.quote });
          }
          rows.sort((a, b) => a.q.km - b.q.km);
          cityList.innerHTML = rows.map(r => `
            <div class="list-item"><span class="li-em">${r.q.emoji}</span>
              <div class="grow"><div class="li-t">${esc(r.c.name)}</div><div class="li-s">${r.q.km} km · ${r.q.hours}h · ${esc(r.c.tagline)}</div></div>
              <button class="btn sm go" data-city="${r.c.id}">${naira(r.q.fare)}</button></div>`).join('');
          cityList.querySelectorAll('[data-city]').forEach(b => b.onclick = async () => {
            const r = await act('travel.inter', { cityId: b.dataset.city, mode: mode2 });
            if (r.ok) phone.hide();
          });
        };
        body.querySelectorAll('[data-m]').forEach(b => b.onclick = () => {
          body.querySelectorAll('[data-m]').forEach(x => x.classList.remove('on'));
          b.classList.add('on'); mode = b.dataset.m; drawDists();
        });
        body.querySelectorAll('[data-m2]')?.forEach(b => b.onclick = () => {
          body.querySelectorAll('[data-m2]').forEach(x => x.classList.remove('on'));
          b.classList.add('on'); mode2 = b.dataset.m2; drawCities();
        });
        body.querySelector('#walkBtn').onclick = async () => {
          const others = city.districts.filter(d => d.id !== p.districtId.split(':')[1]);
          const list = others.map(d => `<button class="btn sm" data-w="${city.id}:${d.id}">${esc(d.name)}</button>`).join(' ');
          body.querySelector('#walkRes').innerHTML = list;
          body.querySelector('#walkRes').querySelectorAll('[data-w]').forEach(b => b.onclick = async () => {
            const r = await act('travel.intra', { districtId: b.dataset.w, mode: 'walk' });
            if (r.ok) phone.hide();
          });
        };
        const walkRes = document.createElement('div'); walkRes.id = 'walkRes'; walkRes.style.marginTop = '8px';
        body.querySelector('#walkBtn').after(walkRes);
        drawDists(); if (atPark) drawCities();
      });
    };
    render();
  }
},

/* ─────────── MTL (telco) ─────────── */
{
  id:'mtl', name:'MTL Data', emoji:'📶', bg:'linear-gradient(145deg,#facc15,#a16207)',
  badge: (p) => p.telco.dataMB < 50 ? 1 : 0,
  open(app) {
    const render = () => {
      const p = me();
      app.view('MTL', `${p.telco.network} · prepaid`, `
        <div class="card hero">
          <div class="mini">Data balance</div>
          <div class="big-num">${Math.round(p.telco.dataMB)} <span style="font-size:14px" class="mut">MB</span></div>
          <div class="bar" style="margin-top:8px"><i style="width:${Math.min(100, p.telco.dataMB / 20)}%"></i></div>
          <div class="mini" style="margin-top:6px">Airtime: <b class="gold">${naira(p.telco.airtime)}</b> · calls cost ₦11/min</div>
        </div>
        <div class="card"><div class="li-t">Data bundles</div>
          ${DATA_PLANS.map(d => `<div class="list-item"><span class="li-em">📦</span>
            <div class="grow"><div class="li-t">${d.label}</div><div class="li-s">${d.mb} MB · valid ${d.days} day${d.days>1?'s':''}</div></div>
            <button class="btn sm go" data-plan="${d.id}" ${p.cash + p.bank < d.price ? 'disabled' : ''}>${naira(d.price)}</button></div>`).join('')}
        </div>
        <div class="card"><div class="li-t">Recharge airtime</div>
          <div class="btn-row">
            ${[100,200,500,1000,2000,5000].map(v => `<button class="btn sm" data-at="${v}">${naira(v)}</button>`).join('')}
          </div>
          <input class="input" id="atCustom" type="number" placeholder="Custom amount" style="margin-top:8px"/>
          <button class="btn go" id="atGo">Recharge</button>
        </div>
        <div class="card"><div class="li-t">Switch network</div>
          <div class="mini" style="margin-bottom:8px">Somebody in your family swears one of these is faster.</div>
          <div class="btn-row">${NETWORKS.map(n => `<button class="btn sm ${p.telco.network===n?'go':''}" data-net="${n}">${n}</button>`).join('')}</div>
        </div>
      `, (body) => {
        body.querySelectorAll('[data-plan]').forEach(b => b.onclick = async () => { const r = await act('telco.data', { planId: b.dataset.plan }); if (r.ok) render(); });
        body.querySelectorAll('[data-at]').forEach(b => b.onclick = async () => { const r = await act('telco.airtime', { amount: +b.dataset.at }); if (r.ok) render(); });
        body.querySelector('#atGo').onclick = async () => { const v = +body.querySelector('#atCustom').value; if (v > 0) { const r = await act('telco.airtime', { amount: v }); if (r.ok) render(); } };
        body.querySelectorAll('[data-net]').forEach(b => b.onclick = async () => { const r = await act('telco.data', { planId: 'd100', network: b.dataset.net }); if (r.ok) render(); });
      });
    };
    render();
  }
},

/* ─────────── NEPA (power) ─────────── */
{
  id:'nepa', name:'NEPA', emoji:'💡', bg:'linear-gradient(145deg,#eab308,#854d0e)',
  badge: (p) => (p.util.units < 2 ? 1 : 0),
  open(app) {
    const render = () => {
      const p = me();
      const light = !p.util.blackout;
      app.view('NEPA Prepaid', light ? 'Light is available' : 'National grid has failed', `
        <div class="card ${light ? 'hero' : 'danger'}">
          <div class="row"><span class="em">${light ? '💡' : '🕯️'}</span><div class="grow">
            <div class="row-t">${light ? 'Up NEPA!' : 'NEPA has taken the light'}</div>
            <div class="row-s">${light ? `${p.util.units.toFixed(1)} units left on the meter` : 'The whole street is in darkness'}</div></div></div>
        </div>
        <div class="card"><div class="li-t">Buy prepaid units</div>
          <div class="mini" style="margin-bottom:8px">Band A is ₦209/kWh. Band B is ₦63/kWh. You never know which one you are on until the bill.</div>
          <div class="btn-row">${[1000,2000,5000,10000,20000].map(v => `<button class="btn sm go" data-u="${v}">${naira(v)}</button>`).join('')}</div>
          <input class="input" id="uCustom" type="number" placeholder="Custom amount" style="margin-top:8px"/>
          <button class="btn go" id="uGo">Buy units</button>
        </div>
        <div class="card"><div class="li-t">Generator</div>
          <div class="row"><span class="grow">Fuel in the tank<div class="mini">Burns about 0.85L per game hour</div></span><b class="gold">${(p.util.genFuel || 0).toFixed(1)} L</b></div>
          <div class="mini" style="margin-top:8px">Go to a filling station to buy fuel at ${naira(wld()?.macro?.fuelPrice || 1250)}/litre.</div>
          ${p.util.blackout ? `<div class="card danger" style="margin-top:8px"><div class="mini">The grid is down. ${p.util.genFuel > 0.1 ? 'Your generator is running and drinking your money.' : 'No fuel. You are sitting in the heat like everybody else.'}</div></div>` : ''}
        </div>
      `, (body) => {
        const buy = async (v) => { const r = await act('util.units', { amount: v }); if (r.ok) render(); };
        body.querySelectorAll('[data-u]').forEach(b => b.onclick = () => buy(+b.dataset.u));
        body.querySelector('#uGo').onclick = () => { const v = +body.querySelector('#uCustom').value; if (v >= 500) buy(v); else toast('Minimum is ₦500.', 'bad'); };
      });
    };
    render();
  }
},

/* ─────────── NaijaMaps ─────────── */
{
  id:'maps', name:'NaijaMaps', emoji:'🗺️', bg:'linear-gradient(145deg,#22c55e,#15803d)',
  open(app) {
    const render = () => {
      const p = me();
      app.view('NaijaMaps', 'Search all 12 cities', `
        <div class="card"><input class="input" id="mapQ" placeholder="amala, Quilox, Kurmi market, beach…"/>
          <div id="mapRes"></div></div>
        <div class="card"><div class="li-t">Where you are</div>
          <div class="row"><span class="grow"><b>${esc(DISTRICT_BY_ID[p.districtId]?.name)}</b><div class="mini">${esc(CITY_BY_ID[p.cityId]?.name)}</div></span>
            <span class="tag g">${esc(DISTRICT_BY_ID[p.districtId]?.zone || '')}</span></div>
        </div>
        <div class="card"><div class="li-t">Places near you</div>
          <div id="nearList"></div></div>
      `, (body) => {
        const res = body.querySelector('#mapRes');
        const draw = (q = '') => {
          const term = q.toLowerCase().trim();
          const list = VENUES.filter(v => !term
            ? v.cityId === p.cityId
            : (v.name.toLowerCase().includes(term) || v.cityName.toLowerCase().includes(term) || v.districtName.toLowerCase().includes(term) || (VENUE_TYPES[v.type]?.label || '').toLowerCase().includes(term))
          ).slice(0, 40);
          res.innerHTML = list.length ? list.map(v => `
            <div class="list-item"><span class="li-em">${v.emoji}</span>
              <div class="grow"><div class="li-t">${esc(v.name)}</div>
              <div class="li-s">${esc(VENUE_TYPES[v.type]?.label || v.type)} · ${esc(v.districtName)}, ${esc(v.cityName)}</div></div>
              ${v.cityId === p.cityId ? `<button class="btn sm go" data-go="${v.id}">Go</button>` : `<span class="tag">${v.cityName}</span>`}</div>`).join('')
            : `<div class="mini">Nothing called that. Try “market”, “beach”, “church”, or a city name.</div>`;
          res.querySelectorAll('[data-go]').forEach(b => b.onclick = async () => {
            const r = await act('travel.toVenue', { venueId: b.dataset.go });
            if (r.ok) { phone.hide(); }
          });
        };
        body.querySelector('#mapQ').oninput = (e) => draw(e.target.value);
        body.querySelector('#nearList').innerHTML = (DISTRICT_BY_ID[p.districtId]?.venues || []).map(v => `
          <div class="list-item"><span class="li-em">${v.emoji}</span>
            <div class="grow"><div class="li-t">${esc(v.name)}</div><div class="li-s">${esc(VENUE_TYPES[v.type]?.label || '')}</div></div></div>`).join('');
        draw();
      });
    };
    render();
  }
},

/* ─────────── Chop (food) ─────────── */
{
  id:'chop', name:'Chop', emoji:'🍲', bg:'linear-gradient(145deg,#ef4444,#991b1b)',
  badge: (p) => p.needs.hunger < 25 ? 1 : 0,
  open(app) {
    const render = () => {
      const p = me();
      app.view('Chop', `Hunger ${Math.round(p.needs.hunger)}%`, `
        <div class="card hero"><div class="row"><span class="em">🍲</span><div class="grow">
          <div class="row-t">Feed yourself</div><div class="row-s">Fill ${Math.max(0, 100 - Math.round(p.needs.hunger))}% of hunger</div></div></div></div>
        ${FOOD.map(f => {
          const price = Math.round(f.price * (wld()?.macro?.foodPriceMult || 1));
          return `<div class="list-item"><span class="li-em">${f.emoji}</span>
            <div class="grow"><div class="li-t">${esc(f.name)}</div><div class="li-s">+${f.hunger} hunger${f.health ? ` · health ${f.health>0?'+':''}${f.health}` : ''}${f.fun ? ` · +${f.fun} fun` : ''}</div></div>
            <button class="btn sm go" data-f="${f.id}" ${p.cash + p.bank < price ? 'disabled' : ''}>${naira(price)}</button></div>`;
        }).join('')}
        <div class="mini" style="padding:0 4px">Food price index: ${Math.round((wld()?.macro?.foodPriceMult || 1) * 100)}% of normal. Blame the exchange rate.</div>
      `, (body) => {
        body.querySelectorAll('[data-f]').forEach(b => b.onclick = async () => { const r = await act('act.eat', { foodId: b.dataset.f }); if (r.ok) render(); });
      });
    };
    render();
  }
},

/* ─────────── Rest (home) ─────────── */
{
  id:'home', name:'House', emoji:'🏠', bg:'linear-gradient(145deg,#64748b,#334155)',
  open(app) {
    const render = () => {
      const p = me();
      const d = DISTRICT_BY_ID[p.home.districtId];
      app.view('Your house', `${d?.name || 'somewhere'}`, `
        <div class="card hero"><div class="row"><span class="em">${HOUSING[p.home.tier]?.emoji || '🛏️'}</span>
          <div class="grow"><div class="row-t">${esc(HOUSING[p.home.tier]?.name || 'A room somewhere')}</div>
          <div class="row-s">${p.home.type === 'owned' ? 'You own this one' : p.home.type === 'parents' ? 'Your parents’ house' : 'Renting from ' + esc(p.home.landlord || 'a landlord')}</div>
          <div class="row-s">${esc(d?.name || '')}, ${esc(CITY_BY_ID[d?.cityId]?.name || '')}</div></div>
          <b class="gold">${p.home.rentMonthly ? naira(p.home.rentMonthly) + '/mo' : 'FREE'}</b></div></div>
        <div class="card"><div class="li-t">Look after yourself</div>
          <button class="btn go" id="bSleep">😴 Sleep (restores energy)</button>
          <button class="btn" id="bSleep4" style="margin-top:8px">😴 Sleep 4 hours</button>
          <button class="btn" id="bSleep8" style="margin-top:8px">😴 Sleep 8 hours</button>
          <button class="btn" id="bBath" style="margin-top:8px">🚿 Bathe (hygiene)</button>
          <button class="btn" id="bRest" style="margin-top:8px">📺 Rest & scroll (fun, uses data)</button>
        </div>
        <div class="card"><div class="li-t">Your condition</div>
          <div style="display:flex;gap:12px;flex-wrap:wrap">
            ${needBar('Energy', p.needs.energy, 100, '⚡')}
            ${needBar('Hunger', p.needs.hunger, 100, '🍲')}
            ${needBar('Hygiene', p.needs.hygiene, 100, '🧼')}
            ${needBar('Fun', p.needs.fun, 100, '🎉')}
            ${needBar('Health', p.needs.health, 100, '❤️')}
          </div>
        </div>
      `, (body) => {
        body.querySelector('#bSleep').onclick = async () => { const r = await act('act.sleep', { hours: 6 }); if (r.ok) render(); };
        body.querySelector('#bSleep4').onclick = async () => { const r = await act('act.sleep', { hours: 4 }); if (r.ok) render(); };
        body.querySelector('#bSleep8').onclick = async () => { const r = await act('act.sleep', { hours: 8 }); if (r.ok) render(); };
        body.querySelector('#bBath').onclick = async () => { const r = await act('act.bath', {}); if (r.ok) render(); };
        body.querySelector('#bRest').onclick = async () => { const r = await act('act.rest', { hours: 2 }); if (r.ok) render(); };
      });
    };
    render();
  }
},

];

/* merge with part B and order the home screen */
export const APPS = [...APPS_A, ...APPS_B].sort((a, b) => a.name.localeCompare(b.name));
export { esc };
