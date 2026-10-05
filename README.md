# 🇳🇬 Naija Life

[![CI](https://github.com/virtuserve001-jpg/naija-life/actions/workflows/ci.yml/badge.svg)](https://github.com/virtuserve001-jpg/naija-life/actions/workflows/ci.yml)

**A real-time, multiplayer life-sim of Nigeria — 12 cities, a working phone, real naira, and every hustle.**

A GTA-weight answer to *Lagos Life*, widened to the whole country. Walk the streets, take a danfo across town,
fly to Kano for the Durbar, write JAMB, dodge NEPA, tithe, run for governor, drop a single, get arrested,
go to an owambe you cannot afford.

```bash
npm start          # http://localhost:3000
```

No build step. No external services. Everything is Node + vanilla JS + WebSockets.

---

## What's in it

### The world
- **12 cities, 45 districts, 451 real venues** — Lagos Island to Kurmi Market, Lekki to Nsukka, Jos to Maiduguri
- Procedurally generated **street maps** (seeded, so everyone sees the same city): roads with potholes,
  buildings with DStv dishes and generators, palms, danfo buses in traffic, okadas, boreholes
- **Day/night cycle** with lit windows and street lamps, **rain, harmattan and heat**
- Inter-city travel with **real distances** (haversine on actual coordinates) — Lagos→Kano is far, and priced like it

### The phone (23 apps, all of them work)
| | | | |
|---|---|---|---|
| 🏦 **SabiPay** — transfers, loans, ledger | 💼 **Hustle** — 30 careers + 20 side hustles | 🧺 **Oja** — 40-item market | 🚌 **Dash** — keke/okada/danfo/BRT/flights |
| 📶 **MTL Data** — bundles, airtime | 💡 **NEPA** — prepaid meter, generator | 🗺️ **NaijaMaps** — search everywhere | 🍲 **Chop** — 21 foods |
| 🏠 **House** — sleep, bathe, rest | 🐦 **Squawk** — microblog, clout engine | 🎬 **Skitter** — videos | 💬 **NaijaChat** — DMs |
| 🎓 **School** — primary→WAEC→JAMB→uni→NYSC | 🏛️ **Politics** — PVC, 5 parties, 5 offices | 🙏🏾 **Faith** — church/mosque/shrine | 🏥 **Health** — 11 illnesses, HMO |
| 👨🏾‍👩🏾‍👧🏾 **Family** — approval, pressure, owambe, marriage | 🎤 **BoomNaija** — record, release, shows | 🎰 **SureOdds** — betting | 🥷 **Street** — crime, heat, police, bail |
| 📰 **NaijaWire** — live economy + news | 🧍🏾 **Me** — skills, titles, life story | ⚙️ **Settings** | |

### The systems
- **Education gates money.** No WAEC, no bank job. No degree, no NYSC. ASUU can strike and shut the universities.
- **Politics is a real ladder.** Register for your PVC, join a party, campaign, contest for office, win an
  election every few months — then decide what to do with the constituency funds. EFCC heat is watching.
- **Faith is a stat.** Attend service, pay tithe/zakat, gain devotion. Devotion opens the Clergy career and
  occasionally pays out. Skip too long and it decays.
- **Crime pays more than work and costs more than it pays.** Heat decays slowly. Your record does not.
- **Family pressure** builds every month you're educated, unmarried and still sleeping in your parents' house.
- **A living economy.** Fuel price, naira rate, inflation and food prices drift with 26 possible news events
  (grid collapse, Dangote price cuts, ASUU strike, bandit roadblocks, Super Eagles results, Detty December…).

### The economy is real (October 2026 figures)
| | |
|---|---|
| Minimum wage | ₦70,000/month (Lagos ₦85,000) |
| Petrol | ~₦1,250/litre, drifts with events |
| 2-bed flat, Lekki | ₦4M–₦14M/year |
| Single room, Mushin | ~₦150,000/year |
| Electricity | Band A ₦209/kWh · Band B ₦63/kWh |
| Data | 1GB ₦500 daily · 10GB ₦3,500 monthly |
| Bag of rice | ₦88,000 |
| NYSC allawee | ₦77,000/month |
| Amala & ewedu | ₦1,500 |

A security guard genuinely earns ~₦350/hour. Rent, water, waste, data and school fees land every month
whether you earned or not. **That pressure is the game.** Every number lives in one file: `src/config.js`.

### Multiplayer
Real players, real presence. You see them walk, you talk to them in area/city/Naija-wide chat, you DM them,
you send them money, you marry them, you start a beef with them. ~15 NPC residents per district keep the
streets alive when it's quiet: agbero at the park, Iya Oloja at the market, okada men, area boys, pastors,
corpers, policemen with their hand out.

---

## Controls
| | |
|---|---|
| **Move** | `WASD` / arrow keys, or click anywhere to walk there |
| **Enter / talk** | `E` |
| **Phone** | `P` |
| **Map** | `M` |
| **Bag** | `B` |
| **Profile** | `C` |
| **Menu** | `Esc` |

On a phone: virtual joystick bottom-left, `E` button next to it.

---

## Architecture

```
server.js              HTTP + WebSocket server, auth (scrypt), tick loop, persistence
src/config.js          ⭐ every tunable number in the game
src/data/cities.js     12 cities · 45 districts · 451 venues
src/data/content.js    careers, gigs, items, illnesses, news events, NPC voices, backstories
src/data/layout.js     seeded procedural street generator (shared server + client)
src/sim/player.js      player state, money, needs, skills, housing maths
src/sim/world.js       clock, weather, macro economy, NPCs, elections, save/load
src/sim/actions.js     part 1: bank, work, market, transport
src/sim/actions_life.js part 2: education, politics, faith, health, crime, family, fame
public/js/render.js    canvas renderer — streets, traffic, avatars, weather, day/night
public/js/phone.js     phone shell + money/transport/market apps
public/js/phone_apps.js the life-system apps
public/js/ui.js        HUD, chat, map search, venue panels
data/world.json        autosaved world (every 20 ticks and on exit)
```

Time: **1 real second = 4 game minutes.** A game-day is 6 real minutes; a game-month (salary, rent, bills)
is 15 real minutes.

Server is authoritative for everything that matters. Clients render and send intent.

## Privacy
Username + scrypt-hashed password + your game state. That's it. Chats go only to the person you sent them.
No email required, no ad trackers, no IP stored. Delete your account and everything in it from
**Settings → Delete my account**.

## 📱 Mobile / touch play

**Yes — it is fully playable on a phone browser, no app install.** Open the game in Safari/Chrome on your phone and it auto-switches to touch mode (detected via `pointer: coarse`):

| Control | How |
|---|---|
| Walk | Drag the **virtual joystick** (bottom-left), *or* just **tap** any spot on the map to walk there |
| Enter / interact | The round **E** button next to the joystick |
| Phone, map, chat, inventory | The icon **dock** along the bottom |
| Everything inside apps | Normal taps and scrolls |

Layout was tuned and verified against iPhone SE (375×667), iPhone 14 (390×844), Pixel 7 (412×915), iPad (820×1180) and **landscape** (844×390):

- HUD compresses from 235px → **115px** (14% of screen) on phones
- Joystick and E button never overlap chat, the venue panel, the prompt or the dock
- The phone panel fits every tested screen; landscape moves chat + venue panel to a right-hand rail
- `#touch` is `pointer-events:none` so taps on the map still land on the world, not the control overlay

Screenshots: `docs/mobile-world.png`, `docs/mobile-phone.png`, `docs/mobile-app.png`.

> On desktop nothing changes — the touch overlay stays hidden and you use WASD/arrows + click.

---

## 🚀 Deploying

### ⚠️ Read this first: why plain Vercel won't work

Naija Life is a **real-time multiplayer game**. Every move, chat message and paycheck
travels over a **WebSocket** held open by a single long-running Node process that also
ticks the world once a second and writes `world.json` to disk.

**Vercel is serverless**: functions are spun up per request, killed after the response,
and cannot hold a WebSocket open. There is no way to run the game server on Vercel —
not on any plan. Pick one of the two shapes below.

| | Shape | Best for |
|---|---|---|
| **A** | One Node process serving everything (static + WebSocket) | Simplest. **Recommended.** |
| **B** | Vercel hosts the browser client, a separate host runs the WebSocket backend | You specifically want it on Vercel |

---

### A. One-process deploy (recommended)

Pick any host that runs a long-lived Node process. All four options below are
pre-configured in this repo — pick one and it just works.

**Render** *(one click — `render.yaml` is committed)*
1. Push the repo to GitHub.
2. render.com → **New → Blueprint** → select the repo → **Apply**.
3. Open the `https://…onrender.com` URL it gives you. Done.

**Fly.io** *(best free allowance, London region = low latency to Nigeria)*
```bash
fly auth login
fly apps create naija-life          # choose your own name
fly volumes create naija_world --region lhr --size 1
fly deploy                          # uses fly.toml
```
`fly.toml` already sets `auto_stop_machines = false` — **don't turn that on**, or the
world sleeps when idle and every socket drops.

**Railway**
```bash
railway init && railway up          # uses railway.json
```
Then add a Volume mounted at `/data` and set `NAIJA_DATA_DIR=/data`.

**Any Docker host / VPS** *(Hetzner, DigitalOcean, Oracle free tier…)*
```bash
docker build -t naija-life .
docker run -d -p 80:8080 -v naija_data:/app/data --restart unless-stopped naija-life
```

**Heroku / Dokku / Koyeb** — the repo ships a `Procfile` (`web: npm start`).

> **Free-tier gotcha:** Render's free web services and Railway without a volume have an
> **ephemeral filesystem** — `world.json` is wiped on every redeploy or restart. Add the
> disk/volume (a few dollars a month) if you want citizens to persist. Fly's 1GB volume
> is inside the free allowance.

---

### A2. Koyeb — free and always-on

Koyeb's free tier runs one **always-on** service (512MB RAM, 0.1 vCPU, 2GB disk,
100GB bandwidth) and deploys straight from GitHub — the best free option for a
game, because unlike Render's free tier it never sleeps.

1. **koyeb.com** → sign up with **GitHub**
2. **Create Web Service** → **GitHub** → pick `naija-life`
3. Builder: **Dockerfile** (detected automatically)
4. Region: **Frankfurt** (closest to West Africa)
5. Leave the port as Koyeb's default — the app reads `PORT` from the environment
6. Health check path: `/healthz`
7. **Deploy**

You get `https://naija-life-xxxx.koyeb.app`. The first build takes ~2 minutes.

> **Heads-up on the disk:** Koyeb containers are **stateless by design**. The world
> persists while the container is running, but a redeploy or restart resets it to
> month 1. That's fine while you're playing around; if you want a world that
> survives redeploys for free, ask me to add Cloudflare R2 persistence (10GB free)
> so `world.json` lives outside the container. Sessions still survive either way —
> players resume automatically when the container comes back.

### B. Vercel + separate backend

1. Deploy the backend first, using **any** option from A (Fly.io's free tier is the
   cheapest backend for this). Note its URL, e.g. `naija-life.fly.dev`.
2. In Vercel: **Add New → Project →** import this repo, then set one env var:
   ```
   NAIJA_WS_URL = wss://naija-life.fly.dev
   ```
3. Deploy. `vercel.json` runs `node scripts/build-static.mjs`, which produces `dist/`
   (client + the shared `/src/data` modules) with your backend URL baked into the page.

You can also point any deployed client at a different backend at runtime, which is
handy for debugging:
```
https://your-app.vercel.app/?ws=ws://localhost:3000
```

**Architecture note for shape B:** the browser imports `/src/data/cities.js`,
`content.js`, `layout.js` and `/src/config.js` directly (shared with the server so the
map generator stays byte-identical). `build-static.mjs` copies those into `dist/src/`,
so nothing is missing on the static host.

---

### Environment variables

All optional — the game runs with zero config. See `.env.example`.

| Var | Default | Purpose |
|---|---|---|
| `PORT` | `3000` | Set automatically by Render / Fly / Railway / Heroku |
| `HOST` | `0.0.0.0` | Keep as-is so the platform's proxy can reach you |
| `NAIJA_DATA_DIR` | `./data` | Point at a mounted volume so players survive redeploys |
| `NAIJA_WS_URL` | — | Only for `npm run build:static`; the `wss://` backend URL |

### 🔄 Sessions survive upgrades (nobody gets signed out on deploy)

Shipping a new version does **not** log players out. Verified automatically by
`npm test`.

- At sign-in the server issues a **token and stores it on the player record**, so it
  is written into `world.json` and outlives the process.
- The browser keeps that token in `localStorage` and replays it on every reconnect —
  **the password is never stored in the browser**.
- On `SIGTERM` the server saves the world **first**, then broadcasts `restarting` to
  everyone, then drains the sockets. The new process boots while the old one is still
  draining, so it loads the file that was just written.
- The client reconnects with exponential backoff (0.8s → 12s) behind a
  *"🔄 Server updating — your progress is saved"* overlay. No error screen, no re-login,
  and it doubles as protection against flaky mobile networks.
- Resuming with a **forged token is rejected** (covered by the test).

Result: a deploy costs players a few seconds of "reconnecting", and they resume in the
same district with the same money, job and phone. Closing the tab and coming back later
works the same way.

> True *zero*-downtime (no gap at all) would need two instances behind a load balancer
> sharing state — overkill here. This keeps the gap invisible instead.

There is a `/healthz` endpoint (`{"ok":true,"players":7,"month":3,…}`) for uptime
monitors and platform health checks. `SIGTERM` saves the world before exiting, so a
rolling redeploy doesn't lose anyone.

---

## 🧪 Testing

### Automated
```bash
npm test
```
Boots the real server on a free port against a temp data dir and drives two WebSocket
clients through the full loop — 13 assertions, exit code 0 on success:

```
✓ server boots on :33213 and answers /healthz
✓ register returns an auth token
✓ server sends full player state          ₦260,000 cash
✓ server sends world snapshot             fuel ₦1250/L · 1 headlines
✓ players see each other in the same district
✓ walking position syncs to other players
✓ area chat reaches nearby players
✓ private DM is delivered
✓ actions execute and reply               work.list ok
✓ economy action mutates state            Deposited ₦100. Account balance: ₦100.
✓ account survives reconnect              bank ₦100
✓ health endpoint reports live players    2 players · month 1
✓ SIGTERM saves the world and exits cleanly
```

### In this sandbox
The server is already running — the **live preview on port 3000** is the actual game.
To restart it after edits:
```bash
npm start          # or: npm run dev   (auto-restarts on file changes)
```

Handy test hooks in the browser console:
```js
window.__net.state.me          // your player object
window.__net.state.nearby      // players around you
window.__view.px, window.__view.py
window.__phone.show()          // open the phone
window.__net.act('work.list', {})
```

### Multiplayer, on your own machine
Multiplayer needs **two independent sessions**. Open the server URL in two different
browsers (Chrome + Safari/Firefox), or one normal window + one incognito window —
two tabs of the *same* browser profile share localStorage and will fight over the
session. Create two accounts, walk into each other, and talk.

On a phone: find your machine's LAN IP (`ipconfig` / `ip a`) and open
`http://192.168.x.x:3000` on the phone, on the same Wi-Fi. Touch controls activate
automatically.

### Before you ship
```bash
npm test                       # 13 smoke assertions + 10 session-persistence assertions
npm run build:static           # confirm the static bundle builds
```
Then load the deployed URL on a real phone and check: joystick walks, tap-to-move
works, the E button enters buildings, and a second device can see you.
