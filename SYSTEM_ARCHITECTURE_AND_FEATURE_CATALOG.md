# Bible Rhema AI — System Architecture & Feature Catalog
**Tagline:** *"Scripture first. Always. — Where the Word comes alive."*  
**Palette:** Obsidian Night (`#0A0A0B` / `#121214`), Divine Gold (`#D4AF37` / `#F3E5AB`), Crisp Alabaster (`#F8F9FA`)  
**Deployment:** Production on Vercel (`https://bible-rhema-ai.vercel.app`)  
**Version:** Phase 3 Hardened Release  

---

## 1. System Architecture & Topology

```mermaid
flowchart TD
    Client["Next.js 14 App Router (React 18 + Tailwind + Lucide)"]
    ClerkAuth["Clerk Authentication (JWT / Webhooks)"]
    SupabaseDB["Supabase PostgreSQL (Row Level Security)"]
    GeminiAI["Google Gemini 1.5 Pro / Flash Engine"]
    LeviteAudio["Levite Procedural Audio Synthesizer (Web Audio API)"]
    ScriptureAPI["API.Bible + Canonical Scripture Resolver"]
    Paystack["Paystack Payment Engine"]

    Client -->|User Session & Auth| ClerkAuth
    ClerkAuth -->|Webhook User Sync| Client
    Client -->|Protected DB Reads & Writes| SupabaseDB
    Client -->|SpiritOS & Sermon Prompting| GeminiAI
    Client -->|Real-time Ambient Chords & Noise| LeviteAudio
    Client -->|Raw Biblical Texts & Chapters| ScriptureAPI
    Client -->|Checkout & Verification| Paystack
    Paystack -->|Tier Upgrades| SupabaseDB
```

---

## 2. Comprehensive Route & Feature Catalog

### A. Frontend Pages & User Journeys

| Route | Page Name | Core Functionality | Current State | Planned Improvements & Integrations |
| :--- | :--- | :--- | :--- | :--- |
| `/` | **Command Dashboard** | Daily Rhema devotional, user streak tracker, recent journal entries, saved studies carousel, quick launch to SpiritOS & Sanctuary. | **Active & Live.** Connected to `/api/daily-rhema` and `/api/user/stats`. Zero mock data. | Integrate Spotify/Apple Music for worship playlists, push notifications for daily devotional drop. |
| `/spirit-os` | **SpiritOS Theological Workspace** | AI Exegesis, Hermeneutic Deep-Dives, Devotional Meditations. Synchronized with the dynamic **Living Context Panel** (right sidebar). | **Active & Live.** Gemini-powered. Emits `X-Rhema-Context` headers for original Greek/Hebrew lexical analysis and cross-references. | Audio voice input (Web Speech API / Whisper), PDF export of exegesis briefs, sermon draft direct transfer. |
| `/studio` | **Sermon Architecture Studio** | Three-column pulpit preparation workstation: Outline Tree, AI Assist, Expository Editor, and PDF Export. | **Active & Live.** Gated to `MINISTER` tier with server-side enforcement. Upserts to Supabase `sermons` table. | Multi-speaker collaboration, auto-generated presentation slides (PowerPoint/Keynote format), sermon timing teleprompter. |
| `/sanctuary` | **The Sanctuary** | Contemplative prayer & spiritual resting space. Features: **Stillness Room** (breathing orb), **Scripture Soak** (peace navigator), and **Ambient Worship** (Levite Synthesizer). | **Active & Live.** 100% procedural audio (432Hz chords, 528Hz drone, pink rain, flowing waters), session countdown timer (5-20 min) with auto-pause. | Guided biblical audio meditations (recorded voices), custom prayer journal quick-capture modal. |
| `/altar` | **The Altar (Community Prayer)** | Prayer wall where believers submit petitions, intercede for others with one click ("I Prayed for This"), and track global prayer count. | **Active & Live.** Connected to Supabase `prayers` table. Real-time counter incrementing. | Anonymous prayer circles, church group filtering, real-time Supabase Realtime subscriptions. |
| `/library` | **Spiritual Library** | Repository for personal spiritual archives: Journal Notes, Saved Studies, and Sermon Manuscripts. | **Active & Live.** Filterable tabs, search bar, deletes and edits synchronized with Supabase. | Export complete spiritual history as ePub/PDF, full-text semantic vector search. |
| `/pricing` | **Covenant Membership (Billing)** | Subscription tier selection (`SEEKER`, `DISCIPLE`, `MINISTER`). Paystack checkout integration. | **Active & Live.** Supports USD and NGN via Paystack inline popups and server-side verification. | Add Stripe for international credit cards, RevenueCat for future iOS/Android app in-app purchases. |
| `/settings` | **Profile & Preferences** | Spiritual goals, Bible translation selector, preferred ministers, notification preferences, account tier display. | **Active & Live.** Tied to Clerk user info and Supabase `profiles` table. | Multi-translation side-by-side preference, dark/light/sepia Bible reader modes. |
| `/onboarding` | **Spiritual Intake Survey** | Multi-step assessment capturing goals, struggles, and preferred ministers upon first account creation. | **Active & Live.** Persists directly to user profile. | AI-personalized study plan recommendation generated immediately after onboarding completion. |

---

### B. Backend API Endpoints

| Route | HTTP Methods | Purpose | Security & Tiers |
| :--- | :--- | :--- | :--- |
| `/api/bible` | `GET` | Fetches raw Scripture text via API.Bible / bible-api / canonical cache. | Authenticated or Public. |
| `/api/spirit-os` | `POST` | Processes SpiritOS queries with Google Gemini, streams responses, extracts structured study context. | Clerk Authenticated. Free tier quota checked. |
| `/api/studio/generate` | `POST` | Generates structured 3-point expository sermon outlines. | Clerk Authenticated + `MINISTER` Tier only. |
| `/api/studio/assist` | `POST` | Contextual AI writing partner in the sermon editor (illustrations, Greek word studies, applications). | Clerk Authenticated + `MINISTER` Tier only. |
| `/api/sermons` | `GET`, `POST`, `DELETE` | CRUD storage for sermon drafts and outlines. | Clerk Authenticated. User-isolated via RLS. |
| `/api/journal` | `GET`, `POST`, `DELETE` | CRUD storage for spiritual journal reflections. | Clerk Authenticated. User-isolated via RLS. |
| `/api/studies` | `GET`, `POST`, `DELETE` | CRUD storage for saved exegesis studies and notes. | Clerk Authenticated. User-isolated via RLS. |
| `/api/prayers` | `GET`, `POST` | Fetches community prayer requests and submits new requests. | Clerk Authenticated. |
| `/api/prayers/intercede` | `POST` | Increments intercession counter when a user prays for someone. | Clerk Authenticated. |
| `/api/daily-rhema` | `GET` | Delivers the daily devotional passage, meditation, and confession. | Clerk Authenticated. Persisted per user per day. |
| `/api/user/profile` | `GET`, `PATCH` | Manages spiritual profile, goals, struggles, and preferences. | Clerk Authenticated. Strict field allowlist. |
| `/api/user/stats` | `GET` | Calculates authentic user streak, study count, prayer count, and sermons. | Clerk Authenticated. Zero mock data. |
| `/api/billing/paystack/initialize` | `POST` | Creates a verified transaction session with Paystack. | Clerk Authenticated. Prevents arbitrary amount manipulation. |
| `/api/billing/paystack/verify` | `POST` | Validates transaction with Paystack server, upgrades user tier in Supabase. | Clerk Authenticated. Strict reference binding. |
| `/api/webhooks/clerk` | `POST` | Receives Clerk user creation/update events and synchronizes profiles. | Webhook Signature Verified (Svix). Preserves paid tiers. |
| `/api/webhooks/paystack` | `POST` | Asynchronous webhook for successful charge notifications. | Paystack HMAC SHA512 Signature Verified. |

---

## 3. The Dynamic Living Context Panel

Located on the right side of the screen across desktop viewports, the **Living Context Panel** updates dynamically:

1. **Active Theological Context (`activeStudyContext`)**:
   - **Passage Focus**: Highlights the primary scripture reference, book, chapter, and testament.
   - **Original Language Lexicon**: Greek and Hebrew word studies with transliteration, Strong's Concordance numbers, and semantic depth.
   - **Cross-References**: Scriptural connections linked directly to biblical themes.
   - **Inquiry Exploration**: Suggested follow-up questions allowing rapid hermeneutical exploration.
2. **Dynamic Scripture Reader**:
   - Allows users to look up any biblical passage without leaving their active chat or study.
   - Powered by `/api/bible` with instant rendering.
3. **Quick Reflection Note**:
   - One-click note taking that saves directly to `/api/journal`.

---

## 4. The Sanctuary & Levite Soundscape Engine

Built around three distinct rooms:
- **Stillness Room**: Animated breathing orb (breathe in 4s, hold 7s, exhale 8s) for nervous-system calming and meditation on Psalm 46:10.
- **Scripture Soak Room**: Continuous meditative scrolling of curated peace passages (Philippians 4:6-7, Psalm 23, Isaiah 26:3, Matthew 11:28-30).
- **Ambient Worship & Rest Room**: Procedural Levite Synthesizer (Zero bandwidth, pure browser audio):
  - *Rainfall*: Pink-noise generator with low-pass resonance filter.
  - *432Hz Peace Chords*: Natural harmonic tuning triangle/sine synthesis.
  - *528Hz Transformation Drone*: Deep contemplative resonant drone.
  - *Flowing Waters*: Modulated white-noise synthesis.
- **Session Timer**: 5, 10, 15, or 20-minute countdown that automatically turns off audio when the timer finishes.

---

## 5. Security & Verification Status

- [x] **Zero Mock Data**: Hardcoded streaks and placeholder cards replaced with authentic Supabase queries.
- [x] **Database Fresh State**: All tables verified for fresh user sign-in testing.
- [x] **Privilege Escalation Closed**: Deprecated unverified routes (HTTP 410) and restricted RPCs to `service_role`.
- [x] **Server-Side Tier Gating**: Sermon Studio generation and PDF exports restricted to `MINISTER` tier via server-side session checks.
- [x] **Clerk Webhook Tier Preservation**: User update events preserve existing paid membership tiers.
- [x] **Row-Level Security Hardened**: PostgreSQL row-level security and RPC execution guards enforce author privacy and prevent unauthorized mutations.
- [x] **Crisis Intervention Safeguard**: Pastoral safety detection for despair or self-harm triggers compassionate care with verified Nigerian hotlines (112, MANI 0809 111 6264, Lagos State 0800 800 2000).

---

## 6. The 17-Screen Design Canvas Catalog

The application UI implements the 17 core screens adhering to the Obsidian Night (`#0A0A0B` / `#121214`), Divine Gold (`#D4AF37`), and crisp contrast design system:

| Screen # | Screen Title | Route / Component | Primary User Capabilities |
| :--- | :--- | :--- | :--- |
| **Screen 1** | **Today / Rhema Dashboard** | `app/page.tsx` | Daily Rhema devotional, streak tracker, recent journal entries, saved studies carousel, quick-launch pads. |
| **Screen 2** | **SpiritOS Theological Studio** | `app/spirit-os/page.tsx` | Hermeneutic AI exegesis, interactive prompt suggestions, dynamic Living Context Panel with original Greek/Hebrew lexicons. |
| **Screen 3** | **Sanctuary & Levite Mixer** | `app/sanctuary/page.tsx` | 3-Fader audio engine: procedural synthesizer (432Hz), Web Speech Scripture narration with live ducking, and external worship stream embed. |
| **Screen 4** | **The Altar: My Petitions** | `app/altar/page.tsx` (Tab 1) | Secret Place prayer journal, 7-day prayer rhythm tracker, Scripture promise anchors, answered prayer testimonies. |
| **Screen 5** | **The Altar: Community Wall** | `app/altar/page.tsx` (Tab 2) | Intercessory prayer wall, anonymous/masked author badges, one-click intercession ("I prayed for this"), community reporting, author unpublish controls. |
| **Screen 6** | **The Altar: New Petition Sheet** | `app/altar/page.tsx` (Dialog) | Petition composer with explicit opt-in checkbox and legal consent confirmation before public wall placement. |
| **Screen 7** | **Library & Spiritual Archives** | `app/library/page.tsx` | Unified repository for personal spiritual artifacts: journal reflections, saved studies, sermon manuscripts, and text search. |
| **Screen 8** | **Covenant Membership & Plans** | `app/pricing/page.tsx` | Tier matrix (Seeker ₦0, Disciple ₦5,000/mo, Minister ₦15,000/mo) with monthly/yearly toggle (17% savings) and Paystack billing. |
| **Screen 9** | **Checkout States 1 & 2** | `app/pricing/page.tsx` (Modals) | Verifying payment with Paystack loader; Payment Success celebration with immediate tier unlocking and direct navigation. |
| **Screen 10** | **Checkout States 3 & 4** | `app/pricing/page.tsx` (Modals) | Payment Failed with retry button and verified support contact (`support@biblerhema.ai`); Already Subscribed status screen. |
| **Screen 11** | **Sermon Studio: Workspace** | `components/studio/studio-workspace.tsx` | 3-column workstation: Scripture anchor, live word count, speaking time calculator (130 wpm), dynamic faithfulness check badge, expository editor. |
| **Screen 12** | **Sermon Studio: Sermons Home** | `app/studio/page.tsx` | Sermon archive, Sunday delivery countdown, new sermon creation form, and manuscript management. |
| **Screen 13** | **Sermon Studio: Seeker Preview** | `components/studio/upgrade-dialog.tsx` | Graceful feature lock screen for free users showcasing Minister tier capabilities. |
| **Screen 14** | **Sermon Studio: Preach Mode** | `components/studio/preach-mode-modal.tsx` | Fullscreen teleprompter for the pulpit: auto-scroll with adjustable speed, live elapsed timer, high-contrast dark room mode. |
| **Screen 15** | **Onboarding Assessment** | `app/onboarding/page.tsx` | Spiritual intake survey capturing goals, translation preference, and personal spiritual focus. |
| **Screen 16** | **Profile & Preferences** | `app/settings/page.tsx` | Account management, preferred Bible translation, prayer notification preferences, and active tier credentials. |
| **Screen 17** | **System Board & Modal Suite** | `components/system/*` | Loading skeletons, empty states, error boundary, offline indicators, delete confirmation dialogs, daily limit modal, and Care Moment crisis modal. |

---

## 7. Technical Integrations & Integrity Roadmap

### 1. Scripture First Resolution & Faithfulness Engine
- **Current State**: Real-time reference extraction from manuscripts and titles using canonical book regex. Each extracted passage is resolved live via `/api/bible`, cross-checked against API.Bible (American Bible Society) and the offline canonical index. Results display the exact biblical text, verified translation attribution, and dynamic workspace badge (`X/Y verified`).
- **Roadmap**: Add automated semantic cross-referencing and verse drift alerts when sermon points deviate from the cited text's context.

### 2. Levite Audio Engine & Voice Narration
- **Current State**: 
  - Fader 1: Procedural Web Audio API soundscapes (Soaking Pad, Rainfall pink-noise, Still Waters modulated noise) with 432Hz harmonic key selection.
  - Fader 2: Real client-side Web Speech API Scripture narration (Psalms 23, 46, 91, John 15, Romans 8) with volume control and procedural ducking (lowering pad to 35% during speech).
  - Fader 3: External playlist embed (Spotify / YouTube) with clear labeling of browser sandbox volume isolation and saved mix presets.
- **Roadmap**: Integrate Bible Brain API (Faith Comes By Hearing) for high-fidelity dramatized multi-voice audio with background caching.

### 3. Community Prayer Privacy & Moderation Guardrails
- **Current State**: 
  - All `/api/prayers` endpoints require Clerk authentication (blocking anonymous web scraping).
  - New petitions default strictly to private Secret Place (`is_community: false`). Public wall publication requires explicit affirmative consent.
  - Community feed masks `user_id` to prevent user tracking while providing `is_author` boolean flag.
  - Authors can unpublish their petition at any time back to private storage.
  - Any community member can report inappropriate content (`action: report`), triggering immediate unpublishing for moderation review.
  - Verified crisis numbers: Nigeria National Emergency (`112`), Mentally Aware Nigeria Initiative (`0809 111 6264`), Lagos State Lifeline (`0800 800 2000`).

### 4. Billing, Quotas & RLS Privilege Isolation
- **Current State**:
  - Payment transactions are fulfilled exclusively through verified Paystack webhooks or verified server-side callbacks with exact amount and currency checking.
  - Sensitive RPC functions (`fulfill_subscription_payment`, `increment_prayer_intercession`, `reserve_query_quota`) are restricted to `service_role` execution.
  - SpiritOS daily study quota uses row-locked atomic reservations (`reserve_query_quota`) that fail closed on any database disruption.
  - Edge Functions enforce RS256 public key verification against pinned Clerk issuer domains and strict CORS origin allowlists.
  - Sermon generation and manuscript PDF export are strictly gated to the `MINISTER` subscription tier.

