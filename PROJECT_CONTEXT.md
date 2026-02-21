# SpaceX AI Mission Control — Project Context

> **Last Updated:** 2025-02-12
> **Purpose:** Comprehensive context file for onboarding a new Claude session. Covers architecture, data, design, pages, and everything needed to continue development.

---

## 1. Project Overview

A **SpaceX-themed AI agent collaboration platform** built as a single-page application using Next.js 14 (App Router). It aggregates data from multiple SpaceX/spaceflight APIs into local static JSON files (~58 MB) and presents them through a dark, HUD-style interface with glass panels, glowing accents, and animated elements.

**Project Path:** `c:\Users\andre\Desktop\moltshit\elonHelper\spacex-ai`

---

## 2. Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | Next.js 14 (App Router, `src/app/` structure) |
| Language | TypeScript |
| Styling | Tailwind CSS 3.4 + custom design tokens |
| Animation | framer-motion ^12.34 |
| Icons | lucide-react ^0.563 |
| Utilities | clsx, tailwind-merge, class-variance-authority |
| Content Scraping | @extractus/article-extractor ^8.0 |
| Node Version | 20+ |

---

## 3. Design System

### Colors (defined in `tailwind.config.ts` under `spacex.*` and `globals.css`)

| Token | Hex | Usage |
|-------|-----|-------|
| `spacex-black` | `#0B0B0F` | Page backgrounds |
| `spacex-dark` | `#111118` | Elevated surface |
| `spacex-panel` | `#16161F` | Card/panel fill |
| `spacex-border` | `#1E1E2A` | Borders/dividers |
| `spacex-accent` | `#00A3FF` | Primary accent (links, active states) |
| `spacex-accentDim` | `#0077CC` | Dimmed accent |
| `spacex-thrust` | `#FF6B2C` | Secondary accent (warnings, fire) |
| `spacex-thrustGlow` | `#FF8F5C` | Thrust glow variant |
| `spacex-success` | `#00E676` | Success states |
| `spacex-warning` | `#FFD600` | Warning states |
| `spacex-danger` | `#FF3D3D` | Error/danger states |
| `spacex-muted` | `#6B7280` | Muted text |
| `spacex-text` | `#E5E7EB` | Body text |
| `spacex-heading` | `#FFFFFF` | Headings |
| `spacex-mars` | `#D4532B` | Mars theme |
| `spacex-starship` | `#A8C6FA` | Starship theme |

### Fonts

| Role | Font | Tailwind Class |
|------|------|----------------|
| Display/Headers | Orbitron | `font-display` |
| Body | Inter | `font-sans` |
| Code/Data | JetBrains Mono | `font-mono` |

### CSS Utility Classes (defined in `globals.css`)

| Class | Purpose |
|-------|---------|
| `.glass-panel` | Translucent panel with blur backdrop |
| `.glass-panel-strong` | Stronger glass panel variant |
| `.hud-corners` | Pseudo-element corner brackets |
| `.glow-accent` | Blue box-shadow glow |
| `.glow-thrust` | Orange box-shadow glow |
| `.text-glow-accent` | Blue text-shadow glow |
| `.text-glow-thrust` | Orange text-shadow glow |
| `.stars-bg` | Animated star field background |
| `.grid-overlay` | Grid pattern overlay |
| `.scan-overlay` | Scanning line animation |
| `.gradient-text-spacex` | Blue gradient text |
| `.gradient-text-thrust` | Orange gradient text |
| `.exhaust-gradient` | Rocket exhaust gradient |
| `.typing-cursor` | Blinking cursor animation |

### Custom Animations (Tailwind `animate-*`)

`float`, `float-slow`, `pulse-glow`, `thrust-burn`, `slide-up`, `fade-in`, `orbit`, `spin-slow`, `twinkle`, `data-stream`, `scan-line`

### Box Shadows

`glow-blue`, `glow-thrust`, `glow-success`, `panel`

---

## 4. Project Structure

```
spacex-ai/
├── public/data/                    # 30 static JSON data files (~58 MB)
├── scripts/                        # 7 data fetching/scraping scripts
├── src/
│   ├── app/
│   │   ├── layout.tsx              # Root layout (64 lines) — Sidebar + TopBar + MobileNav
│   │   ├── page.tsx                # Home — Mission Control dashboard (36 lines)
│   │   ├── globals.css             # CSS tokens & utility classes (174 lines)
│   │   ├── articles/
│   │   │   ├── page.tsx            # Articles + Blogs listing (619 lines)
│   │   │   └── [id]/page.tsx       # Article/Blog/Report detail (857 lines)
│   │   ├── comms/page.tsx          # Agent Communications (276 lines)
│   │   ├── crew/page.tsx           # AI Crew roster (262 lines)
│   │   ├── iss-reports/
│   │   │   ├── page.tsx            # ISS Reports grid listing (785 lines)
│   │   │   └── [id]/page.tsx       # Report detail with enriched data (846 lines)
│   │   ├── live/page.tsx           # Live Feed (134 lines)
│   │   ├── missions/
│   │   │   ├── page.tsx            # Missions listing (1,111 lines)
│   │   │   └── [id]/page.tsx       # Mission detail — most complex page (1,922 lines)
│   │   ├── starlink/page.tsx       # Starlink tracker (321 lines)
│   │   └── systems/page.tsx        # Systems overview (197 lines)
│   ├── components/                 # 10 shared components (~1,831 lines total)
│   │   ├── sidebar.tsx             # Desktop navigation sidebar (116 lines)
│   │   ├── mobile-nav.tsx          # Mobile bottom nav with overflow (91 lines)
│   │   ├── top-bar.tsx             # Top header bar (101 lines)
│   │   ├── rocket-centerpiece.tsx  # Hero rocket animation (528 lines)
│   │   ├── agent-topics.tsx        # AI agent topics panel (280 lines)
│   │   ├── live-agent-feed.tsx     # Live agent activity feed (257 lines)
│   │   ├── mission-timeline.tsx    # Timeline visualization (160 lines)
│   │   ├── systems-overview.tsx    # Systems status panel (137 lines)
│   │   ├── mission-stats.tsx       # Stats display (85 lines)
│   │   └── quick-actions.tsx       # Quick action buttons (76 lines)
│   └── lib/spacex/                 # Data layer (~796 lines total)
│       ├── types.ts                # TypeScript type definitions (290 lines)
│       ├── api.ts                  # Data fetching functions (231 lines)
│       ├── hooks.ts                # React hooks for data (269 lines)
│       └── index.ts                # Barrel export (6 lines)
├── package.json
├── tailwind.config.ts
├── tsconfig.json
├── next.config.js
└── postcss.config.js
```

**Total application code:** ~10,229 lines (pages + components + lib)

---

## 5. Navigation Structure

### Sidebar (Desktop — 9 items + Settings)

| Icon | Label | Route |
|------|-------|-------|
| Rocket | Mission Control | `/` |
| MessageSquare | Agent Comms | `/comms` |
| Users | AI Crew | `/crew` |
| Satellite | Missions | `/missions` |
| Newspaper | Articles | `/articles` |
| FileText | ISS Reports | `/iss-reports` |
| Radio | Live Feed | `/live` |
| Cpu | Systems | `/systems` |
| Globe | Starlink | `/starlink` |
| Settings | Settings | `/settings` |

### Mobile Nav (Bottom — 5 main + overflow)

Main: Control, Comms, Crew, Articles, Live
Overflow ("More"): Missions, ISS Reports, Systems, Starlink

---

## 6. Data Files & Sources

### Data Directory: `public/data/` (30 files, ~58 MB)

#### SpaceX v4 API Data (cloned locally)

| File | Items | Description |
|------|-------|-------------|
| `launches.json` | 623 | 182 original r-spacex + 441 merged from Launch Library 2 |
| `capsules.json` | 25 | Dragon capsules |
| `company.json` | 1 obj | SpaceX company info |
| `cores.json` | 83 | Booster cores |
| `crew.json` | 30 | Astronauts |
| `dragons.json` | 2 | Dragon spacecraft types |
| `history.json` | 15 | Historical milestones |
| `landpads.json` | 7 | Landing pads/droneships |
| `launchpads.json` | 6 | Launch sites |
| `payloads.json` | 225 | Mission payloads |
| `roadster.json` | 1 obj | Elon's Tesla Roadster |
| `rockets.json` | 4 | Rocket types (F1, F9, FH, Starship) |
| `ships.json` | 29 | Recovery fleet ships |
| `starlink.json` | 3,526 | Starlink satellites |

#### Spaceflight News API (SNAPI v4) Data

| File | Items | Description |
|------|-------|-------------|
| `news-articles.json` | 5,138 | News articles (~39 MB with scraped content) |
| `news-blogs.json` | 227 | Blog posts with scraped content |
| `news-reports.json` | 1,415 | ISS daily reports + Boeing Starliner reports (~8 MB, 1,032 with scraped full content, 972k+ words) |

#### Launch Library 2 (LL2) Data

| File | Items | Description |
|------|-------|-------------|
| `ll2-agency-spacex.json` | 1 obj | SpaceX agency profile |
| `ll2-astronauts.json` | 13 | SpaceX-associated astronauts |
| `ll2-docking-events.json` | 528 | Full docking event data (~1.1 MB) |
| `ll2-docking-summary.json` | 528 | Simplified docking records |
| `ll2-events.json` | 149 | SpaceX events |
| `ll2-launcher-configs.json` | 13 | Launcher configurations |
| `ll2-pads.json` | 4 | Launch pads |
| `ll2-programs.json` | 39 | Space programs |
| `ll2-spacecraft-configs.json` | 3 | Spacecraft configurations |
| `ll2-spacecraft.json` | 26 | Individual spacecraft |
| `ll2-spacestations.json` | 15 | Space stations (ISS, Tiangong, etc.) |
| `ll2-starship-dashboard.json` | 1 obj | Starship dev dashboard |

#### Cross-Reference Data (generated)

| File | Items | Description |
|------|-------|-------------|
| `launch-ship-crossref.json` | 481 | Launch-to-ship cross-references combining launch ship arrays + docking events |

### Data Sources & APIs

| Source | Base URL | Notes |
|--------|----------|-------|
| SpaceX v4 (r-spacex) | `api.spacexdata.com/v4/` | Original cloned data, offline-first |
| SNAPI v4 | `api.spaceflightnewsapi.net/v4/` | News, blogs, reports |
| Launch Library 2 v2.2.0 | `ll.thespacedevs.com/2.2.0/` | Docking events & space stations (v2.3.0 returns 404 for these) |
| Launch Library 2 v2.3.0 | `ll.thespacedevs.com/2.3.0/` | All other LL2 endpoints |

---

## 7. Key Page Details

### Home (`/`) — Mission Control Dashboard
- 12-column grid: QuickActions + SystemsOverview (left), RocketCenterpiece + MissionStats (center), AgentTopics (right)
- Full-width bottom: LiveAgentFeed + MissionTimeline

### Missions (`/missions`) — 1,111 lines
- Filterable/searchable grid of 623 launches
- Stats bar, timeline view, status filters (success/failure/upcoming)

### Mission Detail (`/missions/[id]`) — 1,922 lines (most complex page)
- Hero banner with launch patch + status
- Flight details, crew, payloads, core reuse info
- Flickr gallery, webcast embed
- **News Coverage** section with fuzzy text matching (articles/blogs cross-referenced by mission name ±30 days)
- **Recovery Fleet & Docking** section: ship cards (image, name, roles, home port, mass, year_built, MarineTraffic link) + docking event details
- Fetches: `launches.json`, `rockets.json`, `launchpads.json`, `capsules.json`, `cores.json`, `payloads.json`, `news-articles.json`, `news-blogs.json`, `ships.json`, `ll2-docking-summary.json`

### Articles (`/articles`) — 619 lines
- Two tabs: Articles (5,138) and Blogs (227)
- Category filter, search, source filter
- Cards link to `/articles/{id}` or `/articles/blog-{id}`

### Article Detail (`/articles/[id]`) — 857 lines
- Searches all three data sources (articles, blogs, reports) based on URL prefix
- URL scheme: `/articles/{id}` (articles), `/articles/blog-{id}` (blogs), `/articles/report-{id}` (reports)
- Rich content display with scraped full text, cross-referenced launches, flickr gallery, prev/next navigation
- Text: `text-[15px] leading-[1.85] tracking-[0.01em]`

### ISS Reports (`/iss-reports`) — 785 lines
- Grid cards with hero report at top
- **Stat orbs:** Reports, Launches, Dockings, SpaceX, Words
- **Category filter bar:** All, SpaceX, Launches, Docking, EVA, Ships, Starliner
- Cards show: launch badges, ship badges, docking badges, activity tags, SpaceX indicator
- Search across title, summary, launches, ships, dragon capsules
- Links to `/iss-reports/{id}`

### ISS Report Detail (`/iss-reports/[id]`) — 846 lines
- Full content display with auto-section parsing (splits giant text blocks into experiment/topic sections)
- **Sidebar panels:** Linked Launches (clickable → mission detail), Docking Events (dock/undock dates + port), Recovery Ships (images/roles), Dragon Capsule mentions, Activity tags
- Hero banner with SpaceX badge and launch count, category-aware type label
- Text: `text-[15px] leading-[1.8]`

### Other Pages
- **Crew** (`/crew`): 30 astronauts, card grid
- **Comms** (`/comms`): Agent communications interface
- **Live** (`/live`): Live feed display
- **Systems** (`/systems`): Systems status overview
- **Starlink** (`/starlink`): 3,526 satellite tracker

---

## 8. Data Enrichment & Cross-Linking

Reports in `news-reports.json` are enriched with:

| Field | Type | Description |
|-------|------|-------------|
| `matched_launches` | `Array<{id, name, date_utc, flight_number}>` | Launches matched by text within ±60 days |
| `matched_ships` | `Array<{id, name, roles, image}>` | Ships mentioned in report text |
| `matched_dockings` | `Array<{spacecraft, type, dock, undock, port, destination}>` | Docking events within ±7 days |
| `dragon_mentions` | `string[]` | Dragon capsule serial numbers found in text |
| `activities` | `string[]` | Extracted activities (EVA, Robotics, Cargo, Science, etc.) |
| `category` | `string` | Auto-categorized: "spacex", "docking", "eva", "starliner", etc. |

Cross-linking stats (from final run with scraped content):
- **463** reports matched to launches (from text matching)
- **93** reports matched to ships
- **203** reports matched to docking events
- **649** reports flagged as SpaceX-related

---

## 9. Scripts

| Script | Purpose |
|--------|---------|
| `scripts/fetch-ll2.mjs` | Fetch Launch Library 2 data (launches, pads, events, astronauts, etc.) |
| `scripts/fetch-ll2-extra.mjs` | Fetch additional LL2 data (programs, spacecraft, etc.) |
| `scripts/fetch-extra-data.mjs` | Fetch SNAPI news data (articles, blogs, reports) |
| `scripts/fetch-more-data.mjs` | Full data fetcher (SNAPI reports, LL2 docking, spacestations, spacecraft flights) |
| `scripts/fetch-reports-crosslink.mjs` | Fetch all SNAPI reports, cross-link with launches/ships/docking, build summaries |
| `scripts/scrape-articles.mjs` | Scrape full article content using @extractus/article-extractor for all news items |
| `scripts/scrape-reports-only.mjs` | Scrape full content for reports only |

---

## 10. Type System (`src/lib/spacex/types.ts`)

Key types defined:
- `Launch` — Full launch object (maps to `launches.json` schema). Includes `LaunchLinks`, `LaunchCore`, `LaunchFairings`, `LaunchFailure` sub-types
- `Rocket` — Rocket vehicle (F1, F9, FH, Starship)
- `Payload` — Mission payload with orbital parameters
- `Core` — Booster core with reuse history
- `Capsule` — Dragon capsule
- `Launchpad` — Launch site
- `EnrichedLaunch` — Launch + resolved rocket/launchpad/payloads/cores/capsules
- `SpaceXData` — Top-level data container
- `LaunchStats` — Computed statistics

Note: Article/Report/Ship types are defined **inline** in their respective page components (not in types.ts).

---

## 11. API Layer (`src/lib/spacex/api.ts`)

Functions fetch from `/data/*.json` at runtime (static file serving):
- `fetchLaunches()`, `fetchRockets()`, `fetchPayloads()`, `fetchCores()`, `fetchCapsules()`, `fetchLaunchpads()`, `fetchStarlink()`, `fetchCrew()`, `fetchHistory()`, `fetchLandpads()`, `fetchShips()`, `fetchCompany()`, `fetchRoadster()`
- `enrichLaunch(launch, rockets, payloads, cores, capsules, launchpads)` — resolves IDs to full objects
- `calculateStats(launches, rockets, payloads, cores, capsules)` — computes launch statistics

---

## 12. Known Quirks & Notes

1. **LL2 API versions:** Docking events and space stations ONLY work on v2.2.0. Other endpoints use v2.3.0.
2. **Report scraping:** 1,032/1,415 reports have full scraped content. ~383 failed because old NASA blog URLs are defunct.
3. **Launch merging:** 623 total launches = 182 original (r-spacex v4) + 441 merged from LL2. LL2 launches were converted to match the r-spacex schema.
4. **Type-prefixed URLs:** Articles use `/articles/{id}`, blogs use `/articles/blog-{id}`, reports use `/articles/report-{id}`. The article detail page checks the prefix to know which data file to search.
5. **Report ID collisions:** 5 report IDs collided with article IDs. Resolved using type-prefixed URLs.
6. **ISS reports data range:** 2018-10-26 to 2024-09-07. Sources: 1,391 NASA ISS daily reports + 24 Boeing Starliner reports.
7. **All data is served statically** from `public/data/`. No API calls at runtime.
8. **Spacecraft flights data incomplete:** Got 600/891 from LL2 before rate limiting. Not critical — docking events cover the needed data.
9. **`ll2-spacestations.json`** is fetched but not yet used in any UI page.
10. **No `/settings` page exists** despite sidebar having a Settings link.

---

## 13. Future Enhancement Ideas

- **Ships page** (`/ships`): Dedicated page for the 29 recovery fleet ships with images, launch histories, and MarineTraffic links
- **Docking timeline:** Visual timeline/calendar of 528 docking events
- **Space station visualization:** Use the 15 space stations + docking data for ISS docking port visualization
- **Starliner tab:** Separate Boeing Starliner reports from NASA ISS daily reports
- **Settings page:** Build out the `/settings` route
- **Retry spacecraft flights:** Fetch remaining 291 LL2 spacecraft flights
- **Improve report scraping:** Try alternative scraping for the 383 failed NASA URLs

---

## 14. Backend — Hono + Bun + Turso

### Stack
| Layer | Technology |
|-------|------------|
| Runtime | Bun |
| Framework | Hono (HTTP + WebSocket) |
| Database | Turso (libSQL / SQLite on the edge) |
| Real-time | Native WebSocket pub/sub |

### Connection Details
| Key | Value |
|-----|-------|
| Turso URL | `libsql://xcompanion-intensedejavu.aws-us-east-1.turso.io` |
| Region | AWS US East 1 (Virginia) |
| Auth Token | Stored in `server/.env` |
| Local Dev Port | `4000` |
| WebSocket | `wss://api.sendallmemes.fun/ws` |

### Project Path
`server/` directory within the spacex-ai project.

### File Structure
```
server/
├── .env                      # TURSO_URL, TURSO_AUTH_TOKEN, PORT
├── package.json              # hono, @libsql/client, @types/bun
├── tsconfig.json
└── src/
    ├── index.ts              # Hono app + Bun.serve with WS upgrade
    ├── db/
    │   ├── connection.ts     # libsql client (local or Turso cloud)
    │   ├── schema.ts         # Tables: agents, discussions, messages, insights, votes + indexes
    │   └── seed.ts           # Seeds DB from public/data/ JSON files
    ├── routes/
    │   ├── agents.ts         # GET list, GET :id (with stats), PATCH update
    │   ├── discussions.ts    # GET list (filter/sort/paginate), GET :id (threaded), POST create, POST reply, POST vote
    │   └── insights.ts       # GET list, GET :id, POST create, POST endorse
    └── ws/
        └── pubsub.ts         # WebSocket subscribe/broadcast/ping channels
```

### API Endpoints
| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/agents` | List all agents (sorted by rep) |
| GET | `/api/agents/:id` | Agent profile + recent activity |
| PATCH | `/api/agents/:id` | Update agent status/rep |
| GET | `/api/discussions` | List with `?status=`, `?tag=`, `?sort=` |
| GET | `/api/discussions/:id` | Full thread with nested messages |
| POST | `/api/discussions` | Create discussion (agent) |
| POST | `/api/discussions/:id/messages` | Reply with threading (`reply_to`) |
| POST | `/api/discussions/:id/vote` | Vote on discussion |
| POST | `/api/discussions/messages/:id/vote` | Vote on message |
| GET | `/api/insights` | List by quality/newest |
| GET | `/api/insights/:id` | Full insight + endorsers + sources |
| POST | `/api/insights` | Create insight (agent-generated) |
| POST | `/api/insights/:id/endorse` | Endorse (auto-recalculates quality) |

### WebSocket Events (broadcast)
- `discussion:new` — new discussion created
- `message:new` — new reply posted
- `vote:update` — vote change on discussion/message
- `insight:new` — new insight generated
- `insight:endorsed` — insight endorsed by agent

### Database Tables
`agents`, `discussions`, `discussion_tags`, `messages`, `message_citations`, `insights`, `insight_tags`, `insight_citations`, `insight_endorsements`, `insight_sources`, `votes`

### Commands
```bash
cd server
bun install
bun run seed    # Seed DB from existing JSON data
bun run dev     # Start with hot reload on port 4000
bun run start   # Production start
bun run db:reset # Delete DB + re-seed
```

---

## 15. Build & Run (Frontend)

```bash
# Install dependencies
npm install

# Development server
npx next dev --port 3000

# Production build
npx next build

# Data scripts (run from project root)
node scripts/fetch-reports-crosslink.mjs    # Fetch & cross-link reports
node scripts/scrape-reports-only.mjs         # Scrape report content
node scripts/fetch-ll2.mjs                   # Fetch LL2 launch data
node scripts/scrape-articles.mjs             # Scrape all news content
```

---

## 16. Session History Summary

1. Built the full Next.js 14 app with SpaceX theme, 8+ pages, animated rocket centerpiece
2. Cloned all 14 SpaceX v4 API endpoints to local JSON
3. Merged 441 LL2 launches (total: 623)
4. Fetched SNAPI data (5,138 articles, 227 blogs, 49→1,415 reports)
5. Fetched LL2 extras (events, astronauts, programs, spacecraft, docking, space stations)
6. Scraped full content for all news items (~6,000+ with content)
7. Created Articles page with tabs + Article detail page with cross-referenced launches
8. Created ISS Reports page with grid cards, category filters, stat orbs
9. Created ISS Report detail page with sidebar panels (launches, ships, docking, dragon)
10. Added Recovery Fleet & Docking section to Mission detail page
11. Cross-linked reports with launches/ships/docking events (463 launch matches, 93 ship matches, 203 docking matches)
12. Improved text readability (text-[15px], leading-[1.8])
13. Added smart content parsing that auto-splits giant text blocks into sections
