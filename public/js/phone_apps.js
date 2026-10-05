/* NAIJA LIFE — phone apps, part B: the life systems */
import { net, me, wld } from './net.js';
import { CITIES, CITY_BY_ID, DISTRICT_BY_ID, VENUE_BY_ID, VENUE_TYPES } from '/src/data/cities.js';
import { CAREER_BY_ID, TITLES, ILLNESSES, BACKSTORIES } from '/src/data/content.js';
import { EDU, FAITHS, OWAMBE, WEDDING_COST, BRIBE, CRIME, PARTIES, OFFICES } from '/src/config.js';
import { act, toast, naira, esc, needBar } from './phone.js';

export const APPS_B = [

/* ═══════════ NaijaChat ═══════════ */
{
  id:'chat', name:'NaijaChat', emoji:'💬', bg:'linear-gradient(145deg,#22c55e,#0f7a3d)',
  badge: (p) => (p.inbox || []).filter(m => m.kind === 'dm').length,
  open(app) {
    const render = () => {
      const p = me();
      const inbox = p.inbox || [];
      const online = net.state.nearby.filter(q => q.online);
      const others = [...playersAll()].filter(q => q.id !== p.id);
      app.view('NaijaChat', `${online.length} nearby · ${others.length} in the world`, `
        <div class="card"><div class="li-t">Send a DM</div>
          <input class="input" id="dmTo" placeholder="username"/>
          <input class="input" id="dmText" placeholder="How far?"/>
          <button class="btn go" id="dmGo">Send</button>
          <div class="mini" style="margin-top:8px">Tap a name to prefill:</div>
          <div style="margin-top:6px">${others.slice(0, 30).map(q => `<button class="btn sm" data-u="${esc(q.username)}" style="margin:2px">@${esc(q.name)}</button>`).join('') || '<span class="mini">Nobody else online. Tell your friends.</span>'}</div>
        </div>
        <div class="card"><div class="li-t">Messages</div>
          ${inbox.length ? inbox.slice(0, 25).map(m => `
            <div class="list-item"><span class="li-em">${m.emoji || '💬'}</span>
              <div class="grow"><div class="li-t">${esc(m.from || m.username || 'Someone')}</div>
              <div class="li-s">${esc(m.text || '')}</div></div></div>`).join('')
            : '<div class="mini">No messages. Nigerians will find you eventually.</div>'}
        </div>
      `, (body) => {
        body.querySelectorAll('[data-u]').forEach(b => b.onclick = () => body.querySelector('#dmTo').value = b.dataset.u);
        body.querySelector('#dmGo').onclick = async () => {
          const to = body.querySelector('#dmTo').value.trim(), text = body.querySelector('#dmText').value.trim();
          if (!to || !text) return toast('Who, and what?', 'bad');
          net.chat('dm', text, to);
          toast(`Sent to @${to}`, 'good', '📨');
          body.querySelector('#dmText').value = '';
        };
      });
    };
    render();
  }
},

/* ═══════════ Squawk ═══════════ */
{
  id:'squawk', name:'Squawk', emoji:'🐦', bg:'linear-gradient(145deg,#0ea5e9,#0369a1)',
  open(app) {
    const render = async () => {
      const p = me();
      const feed = await net.act('social.feed', {});
      const posts = feed.data?.posts || [];
      app.view('Squawk', `${p.social.followers.toLocaleString('en-NG')} followers`, `
        <div class="card">
          <textarea class="input" id="sqText" rows="3" placeholder="What’s happening? (280 chars)"></textarea>
          <div class="row"><span class="mini grow">Mentions of naira, fuel, NEPA, ASUU, JAMB, owambe or japa do numbers.</span>
            <button class="btn sm go" id="sqPost">Post</button></div>
        </div>
        ${posts.length ? posts.map(x => `
          <div class="card"><div class="row"><span class="em">${'🧑🏾'}</span>
            <div class="grow"><b>@${esc(x.username)}</b><div class="mini">clout ${x.clout}</div></div>
            <button class="btn sm" data-like="${x.id}">❤️ ${x.likes}</button></div>
            <div style="margin-top:8px;font-size:14px;line-height:1.5">${esc(x.text)}</div></div>`).join('')
        : `<div class="empty"><span class="big">🐦</span>Nobody has said anything yet.<br/>Be the first vessel of nonsense.</div>`}
      `, (body) => {
        body.querySelector('#sqPost').onclick = async () => {
          const t = body.querySelector('#sqText').value.trim();
          if (!t) return toast('Say something first.', 'bad');
          const r = await act('social.post', { text: t });
          if (r.ok) render();
        };
        body.querySelectorAll('[data-like]').forEach(b => b.onclick = async () => { await act('social.like', { postId: b.dataset.like }, { silent: true }); render(); });
      });
    };
    render();
  }
},

/* ═══════════ Skitter ═══════════ */
{
  id:'skitter', name:'Skitter', emoji:'🎬', bg:'linear-gradient(145deg,#e11d48,#9f1239)',
  open(app) {
    const render = () => {
      const p = me();
      app.view('Skitter', `${p.social.followers.toLocaleString('en-NG')} followers`, `
        <div class="card hero"><div class="row"><span class="em">🎬</span><div class="grow">
          <div class="row-t">Post a video</div><div class="row-s">Costs 12MB of data. Views depend on your clout and acting skill.</div></div></div></div>
        <div class="card"><input class="input" id="skCap" placeholder="Caption (optional)"/>
          <button class="btn go" id="skGo">Record & post</button></div>
        <div class="card"><div class="li-t">Your clout</div>
          ${needBar('Clout', p.stats.clout, 100, '⭐')}
          <div class="mini" style="margin-top:8px">Clout opens doors: megachurches, political parties, brand deals, and rooms you have no business being in.</div></div>
      `, (body) => {
        body.querySelector('#skGo').onclick = async () => {
          const r = await act('social.video', { caption: body.querySelector('#skCap').value });
          if (r.ok) render();
        };
      });
    };
    render();
  }
},

/* ═══════════ School (JAMB/WAEC) ═══════════ */
{
  id:'edu', name:'School', emoji:'🎓', bg:'linear-gradient(145deg,#16a34a,#14532d)',
  open(app) {
    const render = async () => {
      const p = me();
      const info = await net.act('edu.info', {});
      const d = info.data || {};
      const at = VENUE_BY_ID[p.venueId];
      const atSchool = at && ['school','uni','techhub'].includes(at.type);
      app.view('School', d.levelName || '', `
        <div class="card hero"><div class="row"><span class="em">🎓</span><div class="grow">
          <div class="row-t">${esc(d.levelName)}</div>
          <div class="row-s">${d.enrolled ? esc(d.institution || '') + (d.course ? ' · ' + esc(d.course) : '') : 'Not currently a student'}</div>
          ${d.feesDue > 0 ? `<div class="row-s red" style="margin-top:4px">Fees owed: ${naira(d.feesDue)}</div>` : ''}</div>
          ${d.nysc ? '<span class="tag g">NYSC done</span>' : ''}</div></div>

        ${d.enrolled ? `<div class="card">
          <div class="row"><span class="grow"><b>Attendance</b></span><b>${d.progress} / ${d.needed} hours</b></div>
          <div class="bar" style="margin-top:6px"><i style="width:${Math.min(100, d.progress / d.needed * 100)}%"></i></div>
          <div class="btn-row" style="margin-top:10px">
            <button class="btn sm go" data-at="2">Attend 2h</button>
            <button class="btn sm go" data-at="4">Attend 4h</button>
            <button class="btn sm go" data-at="6">Attend 6h</button>
          </div>
          ${d.feesDue > 0 ? `<button class="btn warn" id="payFees" style="margin-top:8px">Pay ${naira(d.feesDue)} fees</button>` : ''}
        </div>` : ''}

        ${!atSchool ? `<div class="card"><div class="mini">Walk into a school, university or tech hub to enrol, attend class or apply.</div>
          <button class="btn sm" id="findSchool" style="margin-top:8px">Find the nearest school on my map</button></div>` : `
        <div class="card"><div class="li-t">${esc(at.name)}</div>
          ${at.type === 'uni' ? `
            <div class="mini" style="margin-bottom:8px">Admission list. You need JAMB. ${d.jamb ? 'Your score: ' + d.jamb : 'You have not written JAMB.'}</div>
            <select class="input" id="courseSel">
              <option value="">Choose a course…</option>
              ${(d.courses || []).map(c => `<option value="${c.id}">${esc(c.name)} — cutoff ${c.cutoff} · ${naira(Math.round(c.fee))}/session</option>`).join('')}
            </select>
            <button class="btn go" id="applyBtn">Apply for admission</button>
            <button class="btn" id="writeJamb" style="margin-top:8px">Write JAMB (${naira(EDU.jamb)})</button>
            <button class="btn" id="finals" style="margin-top:8px">Sit final exams</button>`
          : `
            <button class="btn go" id="enrollBtn">Enrol for ${['Primary','Secondary','ND/NCE','BSc/HND','MSc','PhD'][d.level] || 'the next level'}</button>
            <button class="btn" id="writeWaec" style="margin-top:8px">Write WAEC (${naira(EDU.waec)})</button>`}
          ${at.type === 'techhub' ? `<button class="btn" id="bootcamp" style="margin-top:8px">Join 6-month tech bootcamp (${naira(EDU.bootcamp)})</button>` : ''}
        </div>`}

        ${d.level >= 4 && !d.nysc ? `<div class="card hero"><div class="li-t">Serve your fatherland</div>
          <div class="mini">NYSC: one year, ₦77,000/month, and a posting you did not choose.</div>
          <button class="btn go" id="nyscBtn" style="margin-top:8px">Go to camp</button></div>` : ''}

        <div class="card"><div class="li-t">Why bother?</div>
          <div class="mini">Education gates the money. Most careers will not look at you without WAEC, and the serious ones want a degree or HND. Skills can substitute — but only in tech, craft and the streets.</div></div>
      `, (body) => {
        body.querySelectorAll('[data-at]')?.forEach(b => b.onclick = async () => { const r = await act('edu.attend', { hours: +b.dataset.at }); if (r.ok) render(); });
        const pf = body.querySelector('#payFees'); if (pf) pf.onclick = async () => { const r = await act('edu.payFees'); if (r.ok) render(); };
        const en = body.querySelector('#enrollBtn'); if (en) en.onclick = async () => { const r = await act('edu.enroll', { level: (info.data?.level || 0) + 1 }); if (r.ok) render(); };
        const wc = body.querySelector('#writeWaec'); if (wc) wc.onclick = async () => { const r = await act('edu.exam', { type: 'waec' }); if (r.ok) render(); };
        const jb = body.querySelector('#writeJamb'); if (jb) jb.onclick = async () => { const r = await act('edu.exam', { type: 'jamb' }); if (r.ok) render(); };
        const ap = body.querySelector('#applyBtn'); if (ap) ap.onclick = async () => {
          const c = body.querySelector('#courseSel').value;
          if (!c) return toast('Choose a course first.', 'bad');
          const r = await act('edu.apply', { courseId: c }); if (r.ok) render();
        };
        const fin = body.querySelector('#finals'); if (fin) fin.onclick = async () => { const r = await act('edu.exam', { type: 'finals' }); if (r.ok) render(); };
        const ny = body.querySelector('#nyscBtn'); if (ny) ny.onclick = async () => { const r = await act('edu.nysc'); if (r.ok) { phone_refresh(); render(); } };
        const bc = body.querySelector('#bootcamp'); if (bc) bc.onclick = async () => { const r = await act('edu.bootcamp'); if (r.ok) render(); };
        const fs = body.querySelector('#findSchool'); if (fs) fs.onclick = () => { window.dispatchEvent(new CustomEvent('naija:findType', { detail: 'school' })); };
      });
    };
    render();
  }
},

/* ═══════════ INEC / Politics ═══════════ */
{
  id:'inec', name:'Politics', emoji:'🏛️', bg:'linear-gradient(145deg,#15803d,#052e16)',
  open(app) {
    const render = async () => {
      const p = me();
      const info = await net.act('politics.info', {});
      const d = info.data || {};
      const el = d.election;
      app.view('Politics', d.pvc ? 'Registered voter' : 'Not registered', `
        ${el ? `<div class="card hero"><div class="row"><span class="em">🗳️</span><div class="grow">
          <div class="row-t">${esc(el.type)} election</div><div class="row-s">Month ${el.month} — you are in month ${d.month}</div></div></div></div>` : ''}
        <div class="card"><div class="li-t">Voter card</div>
          ${d.pvc ? `<div class="row"><span class="grow">PVC collected ✅<div class="mini">You may now be disappointed in high definition.</div></span></div>`
            : `<div class="mini" style="margin-bottom:8px">Free. Go to an INEC or NIMC office. Ignore the man outside who says it costs ₦2,000.</div>
               <button class="btn go" id="getPvc">Register for PVC</button>`}
        </div>
        <div class="card"><div class="li-t">Party</div>
          <div class="mini" style="margin-bottom:8px">${d.party ? `You are ${(PARTIES.find(x => x.id === d.party) || {}).emoji} ${esc((PARTIES.find(x => x.id === d.party) || {}).name)}` : 'No party yet. Nobody will put you on a list until you pick one.'}</div>
          <div class="btn-row">${PARTIES.map(x => `<button class="btn sm ${d.party === x.id ? 'go' : ''}" data-party="${x.id}">${x.emoji} ${esc(x.name.split(' ')[0])}</button>`).join('')}</div>
        </div>
        ${d.party ? `<div class="card"><div class="li-t">Campaign</div>
          <div class="mini" style="margin-bottom:8px">Votes banked: <b>${d.votes}</b> · You have campaigned ${d.campaigning} times.</div>
          <button class="btn" data-camp="door2door">🚪 Door-to-door — ${naira(60000)}</button>
          <button class="btn" data-camp="socials" style="margin-top:6px">🐦 Online campaign — ${naira(45000)}</button>
          <button class="btn" data-camp="church" style="margin-top:6px">⛪ Megachurch visit — ${naira(90000)}</button>
          <button class="btn" data-camp="rally" style="margin-top:6px">📣 Rally — ${naira(250000)}</button>
          <button class="btn warn" data-camp="thugs" style="margin-top:6px">💪🏾 Mobilise “logistics boys” — ${naira(180000)}</button>
        </div>
        <div class="card"><div class="li-t">Contest for office</div>
          ${OFFICES.map(o => `<div class="list-item"><span class="li-em">🏛️</span><div class="grow"><div class="li-t">${esc(o.name)}</div>
            <div class="li-s">${naira(o.cost)} in “logistics” · ${naira(o.income)}/month if you win · ${o.votesNeeded.toLocaleString('en-NG')} votes</div></div>
            <button class="btn sm go" data-office="${o.id}">Run</button></div>`).join('')}
        </div>` : ''}
        ${p.politics.office ? `<div class="card danger"><div class="li-t">In office: ${esc((OFFICES.find(o => o.id === p.politics.office) || {}).name)}</div>
          <div class="mini">Nobody enters public service to become poor.</div>
          <button class="btn warn" id="steal" style="margin-top:8px">💼 Divert constituency funds</button></div>` : ''}
        <div class="card"><div class="mini">Elections happen every few months. Campaign, then win — or lose and claim the process was rigged. Both are valid Nigerian experiences.</div></div>
      `, (body) => {
        const g = body.querySelector('#getPvc'); if (g) g.onclick = async () => { const r = await act('politics.pvc'); if (r.ok) render(); };
        body.querySelectorAll('[data-party]').forEach(b => b.onclick = async () => { const r = await act('politics.join', { partyId: b.dataset.party }); if (r.ok) render(); });
        body.querySelectorAll('[data-camp]').forEach(b => b.onclick = async () => { const r = await act('politics.campaign', { type: b.dataset.camp }); if (r.ok) render(); });
        body.querySelectorAll('[data-office]').forEach(b => b.onclick = async () => { const r = await act('politics.run', { officeId: b.dataset.office }); if (r.ok) render(); });
        const st = body.querySelector('#steal'); if (st) st.onclick = async () => { const r = await act('politics.steal'); if (r.ok) render(); };
      });
    };
    render();
  }
},

/* ═══════════ Faith ═══════════ */
{
  id:'faith', name:'Faith', emoji:'🙏🏾', bg:'linear-gradient(145deg,#8b5cf6,#4c1d95)',
  open(app) {
    const render = () => {
      const p = me();
      const f = FAITHS[p.faith.faith] || FAITHS.none;
      const here = VENUE_BY_ID[p.venueId];
      app.view('Faith', `${f.name} · devotion ${Math.round(p.faith.devotion)}%`, `
        <div class="card hero"><div class="row"><span class="em">${f.emoji}</span><div class="grow">
          <div class="row-t">${esc(f.name)}</div>
          <div class="row-s">${f.place ? `Gather at the ${f.place} · ${esc(f.service || '')}` : 'You have opted out. Your mother prays for you anyway.'}</div></div>
          <b>${Math.round(p.faith.devotion)}%</b></div>
          ${needBar('Devotion', p.faith.devotion, 100, '🙏🏾')}
        </div>
        <div class="card"><div class="li-t">Change faith</div>
          <div class="btn-row">${Object.entries(FAITHS).map(([k, v]) => `<button class="btn sm ${p.faith.faith === k ? 'go' : ''}" data-f="${k}">${v.emoji} ${esc(v.name)}</button>`).join('')}</div></div>
        ${f.place ? `
        <div class="card"><div class="li-t">Attend service</div>
          <div class="mini" style="margin-bottom:8px">${here && here.type === f.place ? `You are at ${esc(here.name)}. Go in.` : 'Walk into a ' + f.place + ' first.'}</div>
          <button class="btn go" id="attend">${f.emoji} Join the service</button></div>
        <div class="card"><div class="li-t">${esc(f.givingName)}</div>
          <div class="mini" style="margin-bottom:8px">10% is the prescribed rate. Giving is the only investment with a testimonial attached.</div>
          <div class="btn-row">${[1000, 5000, 20000, 100000].map(v => `<button class="btn sm go" data-t="${v}">${naira(v)}</button>`).join('')}</div>
          <input class="input" id="tCustom" type="number" placeholder="Custom amount" style="margin-top:8px"/>
          <button class="btn go" id="tGo">Give</button></div>
        <div class="card"><div class="li-t">Prayer & miracle</div>
          <button class="btn" id="pray">🙏🏾 Pray (free)</button>
          <button class="btn" id="miracle" style="margin-top:8px">✨ Claim a miracle ${p.faith.devotion < 55 ? '(needs devotion 55+)' : ''}</button></div>` : ''}
        <div class="card"><div class="mini">Devotion raises your reputation, unlocks the Clergy career, and occasionally pays out. It decays if you never show up.</div></div>
      `, (body) => {
        body.querySelectorAll('[data-f]').forEach(b => b.onclick = async () => { const r = await act('faith.join', { faith: b.dataset.f }); if (r.ok) render(); });
        const at = body.querySelector('#attend'); if (at) at.onclick = async () => { const r = await act('faith.attend', { venueId: here?.id }); if (r.ok) render(); };
        body.querySelectorAll('[data-t]')?.forEach(b => b.onclick = async () => { const r = await act('faith.tithe', { amount: +b.dataset.t }); if (r.ok) render(); });
        const tg = body.querySelector('#tGo'); if (tg) tg.onclick = async () => { const v = +body.querySelector('#tCustom').value; if (v > 0) { const r = await act('faith.tithe', { amount: v }); if (r.ok) render(); } };
        const pr = body.querySelector('#pray'); if (pr) pr.onclick = async () => { const r = await act('faith.pray'); if (r.ok) render(); };
        const mi = body.querySelector('#miracle'); if (mi) mi.onclick = async () => { const r = await act('faith.miracle'); if (r.ok) render(); };
      });
    };
    render();
  }
},

/* ═══════════ Health ═══════════ */
{
  id:'health', name:'Health', emoji:'🏥', bg:'linear-gradient(145deg,#ef4444,#7f1d1d)',
  badge: (p) => p.health.illnesses.length,
  open(app) {
    const render = async () => {
      const p = me();
      const info = await net.act('health.info', {});
      const d = info.data || {};
      const here = VENUE_BY_ID[p.venueId];
      const atHosp = here?.type === 'hospital', atPharm = here?.type === 'pharmacy';
      app.view('Health', `Condition ${Math.round(p.needs.health)}%`, `
        <div class="card ${d.illnesses.length ? 'danger' : 'hero'}">
          <div class="row"><span class="em">${d.illnesses.length ? (d.illnesses[0].emoji || '🤒') : '❤️'}</span>
          <div class="grow"><div class="row-t">${d.illnesses.length ? esc(d.illnesses[0].name) : 'You are well'}</div>
          <div class="row-s">${d.illnesses.length ? `${esc(d.illnesses[0].cure)} · ~${d.illnesses[0].left}h left untreated` : 'Eat, sleep, bathe and stop stressing.'}</div></div></div>
          ${needBar('Health', p.needs.health, 100, '❤️')}
        </div>
        ${d.illnesses.length > 1 ? `<div class="card">${d.illnesses.slice(1).map(i => `<div class="row"><span class="grow">${i.emoji} <b>${esc(i.name)}</b></span><span class="mini">${i.left}h</span></div>`).join('')}</div>` : ''}
        <div class="card"><div class="li-t">Quick options</div>
          <button class="btn" id="selfMed">💊 Self-medicate at the chemist — ${naira(3500)}</button>
          <div class="mini" style="margin:6px 0 10px">Nigeria's national sport. It works about two-thirds of the time.</div>
          <button class="btn" id="pharm" ${atPharm ? '' : 'disabled'}>🏪 Pharmacy — ${naira(9000)} ${atPharm ? '' : '(find a pharmacy)'}</button>
        </div>
        <div class="card"><div class="li-t">Hospital ${atHosp ? '' : '(walk into one)'}</div>
          <button class="btn go" id="consult" ${atHosp ? '' : 'disabled'}>🩺 Consultation — ${naira(5000)}</button>
          <button class="btn" id="treat" ${atHosp ? '' : 'disabled'} style="margin-top:6px">💉 Full treatment</button>
          <button class="btn" id="admit" ${atHosp ? '' : 'disabled'} style="margin-top:6px">🛏️ Admission — ${naira(60000)}</button>
          <button class="btn" id="hmo" style="margin-top:6px">📋 HMO plan — ${naira(14000)}/month ${d.hmo ? '(active)' : ''}</button>
        </div>
        <div class="card"><div class="li-t">How you got here</div>
          <div class="mini">Malaria comes from the mosquitoes you cannot see. Typhoid from the water you trusted. Ulcer from skipping food to save ₦1,500. Burnout from doing all of this at once.</div></div>
      `, (body) => {
        body.querySelector('#selfMed').onclick = async () => { const r = await act('health.selfMedicate'); if (r.ok) render(); };
        const ph = body.querySelector('#pharm'); if (ph) ph.onclick = async () => { const r = await act('health.pharmacy'); if (r.ok) render(); };
        const c = body.querySelector('#consult'); if (c) c.onclick = async () => { const r = await act('health.hospital', { service: 'consult' }); if (r.ok) render(); };
        const t = body.querySelector('#treat'); if (t) t.onclick = async () => { const r = await act('health.hospital', { service: 'treat' }); if (r.ok) render(); };
        const a = body.querySelector('#admit'); if (a) a.onclick = async () => { const r = await act('health.hospital', { service: 'admit' }); if (r.ok) render(); };
        const h = body.querySelector('#hmo'); if (h) h.onclick = async () => { const r = await act('health.hospital', { service: 'hmo' }); if (r.ok) render(); };
      });
    };
    render();
  }
},

/* ═══════════ Family ═══════════ */
{
  id:'family', name:'Family', emoji:'👨🏾‍👩🏾‍👧🏾', bg:'linear-gradient(145deg,#ec4899,#9d174d)',
  open(app) {
    const render = async () => {
      const p = me();
      const info = await net.act('family.info', {});
      const d = info.data || p.family;
      app.view('Family', `Approval ${Math.round(d.approval)}% · pressure ${Math.round(d.pressure)}%`, `
        <div class="card hero"><div class="row"><span class="em">🏡</span><div class="grow">
          <div class="row-t">${d.spouse ? 'Married to ' + esc(d.spouse.name) : d.parentsAlive ? 'Your parents are alive and asking questions' : 'On your own'}</div>
          <div class="row-s">${d.kids ? d.kids + ' child' + (d.kids > 1 ? 'ren' : '') : 'No children'}</div></div>
          ${d.pressure > 55 ? '<span class="tag r">pressuring you</span>' : ''}</div>
          ${needBar('Family approval', d.approval, 100, '👨🏾‍👩🏾‍👧🏾')}
          <div style="height:8px"></div>
          ${needBar('Pressure to settle down', d.pressure, 100, '😮‍💨')}
        </div>
        <div class="card"><div class="li-t">Keep in touch</div>
          <button class="btn go" id="call">📞 Call home (₦200 airtime)</button>
          <input class="input" id="sendAmt" type="number" placeholder="Amount to send" style="margin-top:8px"/>
          <div class="btn-row">${[5000, 20000, 50000, 200000].map(v => `<button class="btn sm" data-s="${v}">${naira(v)}</button>`).join('')}</div>
          <button class="btn go" id="sendGo" style="margin-top:8px">Send money home</button>
        </div>
        <div class="card"><div class="li-t">Owambe & obligations</div>
          <div class="mini" style="margin-bottom:8px">You cannot be a Nigerian and not show up. It is not optional.</div>
          ${Object.entries(OWAMBE).map(([k, o]) => `<div class="list-item"><span class="li-em">${o.emoji}</span>
            <div class="grow"><div class="li-t">${esc(o.name)}</div><div class="li-s">${naira(o.min)} – ${naira(o.max)}</div></div>
            <button class="btn sm go" data-ow="${k}" data-sc="1">Go</button>
            <button class="btn sm" data-ow="${k}" data-sc="2.2">Big</button></div>`).join('')}
        </div>
        <div class="card"><div class="li-t">Settle down</div>
          ${d.spouse ? `<div class="mini">You are married. Behave.</div>` : `
          <input class="input" id="marryTo" placeholder="Their username"/>
          <select class="input" id="marryStyle">
            ${Object.entries(WEDDING_COST).map(([k, v]) => `<option value="${k}">${k} — ${naira(v)}</option>`).join('')}
          </select>
          <button class="btn go" id="marryGo">💍 Marry</button>
          <div class="mini" style="margin-top:6px">Befriend them first, or be famous enough that they say yes anyway.</div>`}
          <button class="btn" id="kidBtn" style="margin-top:8px">🍼 Have a child (${naira(120000)})</button>
        </div>
      `, (body) => {
        body.querySelector('#call').onclick = async () => { const r = await act('family.call'); if (r.ok) render(); };
        body.querySelectorAll('[data-s]').forEach(b => b.onclick = () => body.querySelector('#sendAmt').value = b.dataset.s);
        body.querySelector('#sendGo').onclick = async () => {
          const v = +body.querySelector('#sendAmt').value;
          if (v > 0) { const r = await act('family.send', { amount: v }); if (r.ok) render(); }
        };
        body.querySelectorAll('[data-ow]').forEach(b => b.onclick = async () => {
          const r = await act('family.owambe', { type: b.dataset.ow, scale: b.dataset.sc === '2.2' ? 'big' : b.dataset.sc === '0.5' ? 'small' : 'mid' });
          if (r.ok) render();
        });
        const mg = body.querySelector('#marryGo'); if (mg) mg.onclick = async () => {
          const to = body.querySelector('#marryTo').value.trim();
          if (!to) return toast('Who?', 'bad');
          const r = await act('social.marry', { username: to, style: body.querySelector('#marryStyle').value });
          if (r.ok) render();
        };
        const kb = body.querySelector('#kidBtn'); if (kb) kb.onclick = () => toast('Children arrive when the time is right — and when you have ₦120k.', 'bad');
      });
    };
    render();
  }
},

/* ═══════════ BoomNaija (music) ═══════════ */
{
  id:'boom', name:'BoomNaija', emoji:'🎤', bg:'linear-gradient(145deg,#a855f7,#581c87)',
  open(app) {
    const render = () => {
      const p = me();
      const here = VENUE_BY_ID[p.venueId];
      app.view('BoomNaija', `${p.music.fans.toLocaleString('en-NG')} fans`, `
        <div class="card hero"><div class="row"><span class="em">🎤</span><div class="grow">
          <div class="row-t">${p.music.streams.toLocaleString('en-NG')} uncollected streams</div>
          <div class="row-s">${naira(p.music.streams * 0.42)} waiting for you at ₦0.42/stream</div></div>
          <button class="btn sm go" id="roys">Collect</button></div></div>
        <div class="card"><div class="li-t">Studio</div>
          <input class="input" id="songTitle" placeholder="Song title"/>
          <button class="btn go" id="rec">🎚️ Record a single</button>
          <div class="mini" style="margin-top:6px">Studio time scales with your fame. Quality depends on your music skill and luck.</div></div>
        <div class="card"><div class="li-t">Your catalogue</div>
          ${p.music.singles.length ? p.music.singles.map((s, i) => `<div class="list-item"><span class="li-em">${s.released ? '🎵' : '💾'}</span>
            <div class="grow"><div class="li-t">${esc(s.title)}</div><div class="li-s">quality ${s.q}/20${s.released ? ' · ' + s.streams.toLocaleString('en-NG') + ' streams' : ' · unreleased'}</div></div>
            ${s.released ? '' : `<button class="btn sm go" data-rel="${i}">Release</button>`}</div>`).join('')
          : '<div class="mini">No songs yet. One hit changes everything. Most people do not get the hit.</div>'}
        </div>
        <div class="card"><div class="li-t">Shows</div>
          <div class="mini" style="margin-bottom:8px">${here && ['club','stadium','hotel','leisure'].includes(here.type) ? `You are at ${esc(here.name)}. Perform.` : 'Walk into a club, stadium, hotel or event centre.'}</div>
          <button class="btn go" id="show">🎸 Perform a show</button></div>
      `, (body) => {
        body.querySelector('#rec').onclick = async () => { const r = await act('music.record', { title: body.querySelector('#songTitle').value }); if (r.ok) render(); };
        body.querySelectorAll('[data-rel]').forEach(b => b.onclick = async () => { const r = await act('music.release', { index: +b.dataset.rel }); if (r.ok) render(); });
        body.querySelector('#roys').onclick = async () => { const r = await act('music.royalties'); if (r.ok) render(); };
        body.querySelector('#show').onclick = async () => { const r = await act('music.show'); if (r.ok) render(); };
      });
    };
    render();
  }
},

/* ═══════════ SureOdds ═══════════ */
{
  id:'bet', name:'SureOdds', emoji:'🎰', bg:'linear-gradient(145deg,#ca8a04,#713f12)',
  open(app) {
    const render = () => {
      const p = me();
      const here = VENUE_BY_ID[p.venueId];
      app.view('SureOdds', here?.type === 'casino' ? esc(here.name) : 'Find a betting shop', `
        <div class="card ${here?.type === 'casino' ? '' : 'danger'}"><div class="li-t">${here?.type === 'casino' ? 'Stake' : 'Closed'}</div>
          ${here?.type === 'casino' ? `
            <div class="mini" style="margin-bottom:8px">Pick your odds. Higher odds pay more and hit less.</div>
            <div class="btn-row">${[1.5, 2.5, 5, 10, 25].map(o => `<button class="btn sm" data-o="${o}">${o}x</button>`).join('')}</div>
            <input class="input" id="stake" type="number" placeholder="Stake in ₦" style="margin-top:8px"/>
            <div class="btn-row">${[500, 2000, 10000, 50000].map(v => `<button class="btn sm" data-s="${v}">${naira(v)}</button>`).join('')}</div>
            <button class="btn go" id="betGo" style="margin-top:8px">Place bet</button>`
          : '<div class="mini">Walk into a betting shop (🎰 on your map).</div>'}
        </div>
        <div class="card"><div class="mini">Statistically, the house always wins. Nigeria bets ₦ billions daily. Somebody has to be the exception. It is probably not you, but good luck.</div></div>
      `, (body) => {
        let odds = 2.5;
        body.querySelectorAll('[data-o]')?.forEach(b => b.onclick = () => { odds = +b.dataset.o; toast('Odds set to ' + odds + 'x', 'good'); });
        body.querySelectorAll('[data-s]')?.forEach(b => b.onclick = () => body.querySelector('#stake').value = b.dataset.s);
        const g = body.querySelector('#betGo'); if (g) g.onclick = async () => {
          const v = +body.querySelector('#stake').value;
          if (v >= 200) { const r = await act('bet.place', { amount: v, odds }); if (r.ok) render(); }
          else toast('Minimum stake is ₦200.', 'bad');
        };
      });
    };
    render();
  }
},

/* ═══════════ NaijaWire (news) ═══════════ */
{
  id:'news', name:'NaijaWire', emoji:'📰', bg:'linear-gradient(145deg,#475569,#1e293b)',
  badge: (p) => 0,
  open(app) {
    const render = () => {
      const w = wld();
      const news = w?.news || [];
      app.view('NaijaWire', 'This country never rests', `
        <div class="card hero"><div class="row"><span class="em">📊</span><div class="grow">
          <div class="row-t">The economy, live</div></div></div>
          <div class="grid2" style="margin-top:10px">
            <div class="stat"><div class="stat-l">Fuel</div><div class="stat-v">${naira(w?.macro?.fuelPrice || 0)}<span style="font-size:11px" class="mut">/L</span></div></div>
            <div class="stat"><div class="stat-l">Naira</div><div class="stat-v">₦${Math.round(w?.macro?.usdNaira || 0)}<span style="font-size:11px" class="mut">/$</span></div></div>
            <div class="stat"><div class="stat-l">Inflation</div><div class="stat-v">${Math.round((w?.macro?.inflation || 0) * 100)}%</div></div>
            <div class="stat"><div class="stat-l">Food index</div><div class="stat-v">${Math.round((w?.macro?.foodPriceMult || 1) * 100)}%</div></div>
          </div>
        </div>
        ${news.map(n => `<div class="card"><div class="row"><span class="em">${n.emoji}</span>
          <div class="grow"><div style="font-size:14px;line-height:1.5">${esc(n.text)}</div>
          <div class="mini" style="margin-top:4px">${esc(n.tag)}</div></div></div></div>`).join('')
        || '<div class="empty">No news. Enjoy the silence while it lasts.</div>'}
      `, () => {});
    };
    render();
  }
},

/* ═══════════ Police / Street ═══════════ */
{
  id:'street', name:'Street', emoji:'🥷', bg:'linear-gradient(145deg,#334155,#0f172a)',
  open(app) {
    const render = async () => {
      const p = me();
      const info = await net.act('police.info', {});
      const d = info.data || {};
      const here = VENUE_BY_ID[p.venueId];
      app.view('Street', `Heat ${Math.round(p.stats.heat)}%`, `
        <div class="card ${p.stats.heat > 50 ? 'danger' : ''}">
          <div class="row"><span class="em">🚓</span><div class="grow"><div class="row-t">Police interest: ${Math.round(p.stats.heat)}%</div>
          <div class="row-s">${p.stats.heat > 60 ? 'They are looking for you by name.' : p.stats.heat > 30 ? 'Somebody mentioned your name in a statement.' : p.stats.heat > 10 ? 'A file exists. It is thin.' : 'You are nobody. Beautiful.'}</div></div></div>
          ${needBar('Heat', p.stats.heat, 100, '🚓')}
        </div>
        ${p.crime.cellMonths > 0 ? `<div class="card danger"><div class="li-t">You are in a cell ⛓️</div>
          <div class="mini" style="margin-bottom:8px">${p.crime.cellMonths} month(s) left — or buy your way out.</div>
          <button class="btn warn" id="bail">Post bail — ${naira(80000 * p.crime.cellMonths)}</button>
          <button class="btn" id="serve" style="margin-top:8px">Serve the time</button></div>`
        : `<div class="card"><div class="li-t">Ways to eat</div>
          ${Object.entries(CRIME).map(([k, c]) => `<div class="list-item"><span class="li-em">${c.emoji}</span>
            <div class="grow"><div class="li-t">${esc(c.name)}</div>
            <div class="li-s">${naira(c.min)} – ${naira(c.max)} · ${c.time} min · heat +${c.heat}${c.requiresOffice ? ' · needs office' : ''}</div></div>
            <button class="btn sm warn" data-c="${k}" ${c.requiresOffice && !p.politics.office ? 'disabled' : ''}>Do it</button></div>`).join('')}
        </div>`}
        <div class="card"><div class="li-t">Settle</div>
          <div class="mini" style="margin-bottom:8px">“Officer, anything for the boys?” A proud and terrible tradition.</div>
          <div class="btn-row">${[1000, 5000, 50000].map(v => `<button class="btn sm" data-b="${v}">${naira(v)}</button>`).join('')}</div>
        </div>
        ${here?.type === 'court' ? `<div class="card"><div class="li-t">Court</div>
          <input class="input" id="sueWho" placeholder="Username to sue"/>
          <input class="input" id="sueAmt" type="number" placeholder="Claim amount"/>
          <button class="btn go" id="sueGo">Sue them (${naira(50000)} filing)</button></div>` : ''}
        <div class="card"><div class="mini">Crime pays faster than any job in this game and takes more than it gives. Heat decays slowly. Your record does not.</div></div>
      `, (body) => {
        body.querySelectorAll('[data-c]')?.forEach(b => b.onclick = async () => { const r = await act('crime.do', { type: b.dataset.c }); if (r.ok) render(); });
        body.querySelectorAll('[data-b]')?.forEach(b => b.onclick = async () => { const r = await act('police.bribe', { amount: +b.dataset.b }); if (r.ok) render(); });
        const bail = body.querySelector('#bail'); if (bail) bail.onclick = async () => { const r = await act('prison.bail'); if (r.ok) render(); };
        const sv = body.querySelector('#serve'); if (sv) sv.onclick = async () => { const r = await act('prison.serve'); if (r.ok) render(); };
        const sg = body.querySelector('#sueGo'); if (sg) sg.onclick = async () => {
          const who = body.querySelector('#sueWho').value.trim(), amt = +body.querySelector('#sueAmt').value;
          if (!who) return toast('Sue who?', 'bad');
          const r = await act('court.sue', { username: who, amount: amt || 200000 }); if (r.ok) render();
        };
      });
    };
    render();
  }
},

/* ═══════════ Me (profile) ═══════════ */
{
  id:'me', name:'Me', emoji:'🧍🏾', bg:'linear-gradient(145deg,#0ea5e9,#0c4a6e)',
  open(app) {
    const render = () => {
      const p = me();
      const skills = Object.entries(p.skills).filter(([, v]) => v > 0).sort((a, b) => b[1] - a[1]);
      const titles = TITLES.filter(t => p.titles.includes(t.id));
      app.view(p.name, `${p.levelName} · ${CITY_BY_ID[p.cityId]?.name}`, `
        <div class="card hero"><div class="row"><span class="em">${p.emoji}</span><div class="grow">
          <div class="row-t">@${esc(p.username)}</div>
          <div class="row-s">${esc(BACKSTORIES.find(b => b.id === p.backstory)?.name || 'Naija person')} · ${esc(p.jobName || 'No job')} · ${esc(p.levelName)}</div>
          <div class="row-s">Net worth <b class="gold">${naira(p.stats.netWorth)}</b> · peak ${naira(p.stats.peakNetWorth)}</div>
          <div class="row-s">${p.stats.monthsSurvived} month(s) survived · ${p.social.followers.toLocaleString('en-NG')} followers</div></div></div>
          ${titles.length ? `<div style="margin-top:10px" class="btn-row">${titles.map(t => `<span class="tag g">${t.emoji} ${esc(t.name)}</span>`).join('')}</div>` : ''}
        </div>
        <div class="grid2">
          <div class="stat"><div class="stat-l">Clout</div><div class="stat-v">${Math.round(p.stats.clout)}</div></div>
          <div class="stat"><div class="stat-l">Reputation</div><div class="stat-v">${Math.round(p.stats.reputation)}</div></div>
          <div class="stat"><div class="stat-l">Heat</div><div class="stat-v">${Math.round(p.stats.heat)}</div></div>
          <div class="stat"><div class="stat-l">Devotion</div><div class="stat-v">${Math.round(p.faith.devotion)}</div></div>
        </div>
        <div class="card" style="margin-top:10px"><div class="li-t">Skills</div>
          ${skills.length ? skills.map(([k, v]) => `<div class="row"><span class="grow" style="width:80px">${esc(k)}</span>
            <div style="flex:1"><div class="bar"><i style="width:${v * 10}%"></i></div></div><b style="width:28px;text-align:right">${v.toFixed(1)}</b></div>`).join('')
          : '<div class="mini">You have no skills. That is fixable.</div>'}
        </div>
        <div class="card"><div class="li-t">Your story so far</div>
          ${(p.feed || []).slice(0, 22).map(f => `<div class="row"><span class="em" style="font-size:15px">${f.emoji}</span>
            <div class="grow"><div class="li-s">${esc(f.text)}</div></div></div>`).join('') || '<div class="mini">Nothing has happened yet.</div>'}
        </div>
      `, () => {});
    };
    render();
  }
},

/* ═══════════ Settings ═══════════ */
{
  id:'settings', name:'Settings', emoji:'⚙️', bg:'linear-gradient(145deg,#64748b,#1e293b)',
  open(app) {
    app.view('Settings', 'Naija Life v1', `
      <div class="card"><div class="li-t">How to play</div>
        <div class="mini" style="line-height:1.7">
          <b>Walk:</b> WASD or arrow keys. Click anywhere to walk there.<br/>
          <b>Enter a place:</b> stand at a building and press <b>E</b>.<br/>
          <b>Talk:</b> bottom-left chat box. Tabs: Area / City / whole of Naija / DMs.<br/>
          <b>Phone:</b> P or the 📱 button. Everything lives in there — bank, transport, school, church, hospital, Squawk.<br/>
          <b>Map:</b> M, then search any city, market or buka in Nigeria.<br/>
          <b>Time:</b> 1 real second = 4 game minutes. A full game-day is 6 minutes. A month (salary + rent + bills) is 15 minutes.
        </div>
      </div>
      <div class="card"><div class="li-t">The economy is real</div>
      <div class="mini">Minimum wage ₦70,000. Fuel ~₦1,250/litre. A 2-bed in Lekki is millions a year. Rent, water, waste, data and school fees land every month whether you earned or not. That pressure is the game.</div></div>
      <div class="card"><div class="li-t">Data & privacy</div>
        <div class="mini">Stored: your username, hashed password, and your game state. Chats go only to the person you sent them. No ad trackers. No IP stored.</div>
        <button class="btn warn" id="delAcct" style="margin-top:10px">Delete my account & data</button>
      </div>
      <div class="card"><div class="mini">Built as a love letter and a roast of Nigeria. Every price is tunable in <code>src/config.js</code>.</div></div>
    `, (body) => {
      body.querySelector('#delAcct').onclick = () => {
        if (confirm('Delete your account and everything in it? This cannot be undone.')) {
          net.send({ t: 'delete' });
          location.reload();
        }
      };
    });
  }
},

];

/* helper: all known players (nearby + anyone we have met) */
function playersAll() {
  const set = new Map();
  for (const q of net.state.nearby) if (q.online) set.set(q.id, q);
  const p = me();
  for (const f of (p?.social?.friends || [])) set.set(f, { id: f, username: f, name: f, online: false });
  for (const m of (p?.inbox || [])) if (m.username) set.set(m.username, { id: m.username, username: m.username, name: m.from || m.username, online: false });
  return [...set.values()];
}

function phone_refresh() { /* re-sync after a big state change */ net.send({ t: 'sync' }); }
