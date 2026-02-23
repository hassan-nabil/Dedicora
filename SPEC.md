# Dedicora — Product Requirements Document

> **"Your AI Focus Partner"**
> Last updated: February 22, 2026

---

## Table of Contents

1. [Vision & Positioning](#1-vision--positioning)
2. [Decisions Summary](#2-decisions-summary)
3. [User Personas](#3-user-personas)
4. [Information Architecture](#4-information-architecture)
5. [Database Schema](#5-database-schema)
6. [API Routes](#6-api-routes)
7. [Page-by-Page Spec](#7-page-by-page-spec)
8. [Free vs Pro Tiers](#8-free-vs-pro-tiers)
9. [AI System Design](#9-ai-system-design)
10. [Phase Execution Plan](#10-phase-execution-plan)
11. [Tech Stack](#11-tech-stack)
12. [Open Questions](#12-open-questions)

---

## 1. Vision & Positioning

**Problem:** Millions of people know *what* they need to do but can't *start*. Existing tools help you plan (Todoist, Notion) or time (Forest, Pomodoro apps), but nothing walks with you through the actual work — breaking it down, keeping you company, adapting in real-time.

**Solution:** Dedicora is an AI focus partner. It helps you start, stay focused, and finish. The AI doesn't just plan your tasks — it sits with you while you work, nudges you when you're stuck, remembers your patterns, and celebrates your wins.

**Tagline:** "Your AI Focus Partner"

**Positioning:**
- NOT a to-do app (no infinite task lists)
- NOT a Pomodoro timer (although it includes one)
- It's closer to having a supportive study buddy who also happens to be an AI
- Think: "Focusmate meets ChatGPT" — presence + intelligence

**Target audience:** Anyone who procrastinates. Primary segments:
- Students (homework, study sessions, thesis writing)
- Remote workers (deep work, meetings prep)
- People with ADHD or focus difficulties
- Freelancers managing their own time

---

## 2. Decisions Summary

| Decision | Choice | Rationale |
|----------|--------|-----------|
| **Auth & Database** | Supabase (Auth + Postgres + Realtime) | All-in-one, generous free tier, realtime for future social features |
| **Auth Method** | Google OAuth only | Lowest friction for target audience |
| **Deployment** | Vercel | Native Next.js home, better DX than Amplify |
| **Payments** | Stripe | Industry standard, best docs |
| **Pricing** | $4.99/mo (annual: $49.99/yr) | Student-friendly, impulse-buy territory |
| **Free Tier** | Unlimited sessions, 30-day history | Generous enough to be genuinely useful |
| **Pro Features** | AI memory + Advanced analytics | Free product is fully functional; Pro adds depth |
| **Branding** | "Dedicora — Your AI Focus Partner" | Keep name, add tagline |
| **Phase 1 Scope** | Full foundation | Auth + DB + persistence + dashboard + quick-start |

---

## 3. User Personas

### 3.1 "Stuck Student" — Hassan, 22
- University student, struggles to start assignments
- Has ADHD, prescribed medication but still needs structure
- Uses her phone for everything, laptop for actual work  
- **Need:** Something that breaks a scary task into small steps and keeps her accountable
- **Willingness to pay:** Low individually, but would pay $49.99/year if it genuinely helps

### 3.2 "Overwhelmed Remote Worker" — Diego, 22
- Software developer working from home
- Calendar is full but deep work time is fragmented
- Procrastinates on hard tasks by doing easy ones
- **Need:** A way to block out focus time and actually use it productively
- **Willingness to pay:** $4.99/mo is nothing compared to lost productivity

### 3.3 "Chronic Procrastinator" — Rishabh, 22
- Freelance designer, sets own schedule
- Knows they're productive in bursts but can't start consistently
- Has tried Pomodoro, Forest, Focusmate — none stuck
- **Need:** An approach that understands them, not just a countdown timer
- **Willingness to pay:** Would pay if the AI actually feels personal

---

## 4. Information Architecture

### 4.1 Route Map

```
/                     → Landing page (unauthenticated) or redirect to /dashboard (authenticated)
/login                → Google OAuth sign-in
/auth/callback        → Supabase OAuth callback handler
/dashboard            → Home: active session, history, streaks, quick-start [NEW]
/task                 → Step 1: Enter your task (existing, now auth-gated)
/assign               → Step 2: AI breakdown + configure (existing, now persisted)
/timer                → Step 3: Focus timer (existing, now persisted)
/report               → Step 4: AI productivity report (existing, now uses real data)
/report/[sessionId]   → View a past session's report [NEW]
/settings             → Account, subscription, preferences [EXPANDED]
/api/auth/callback    → Supabase auth callback API route
/api/sessions         → CRUD for focus sessions
/api/sessions/[id]    → Single session operations
/api/tasks/[id]       → Update individual tasks
/api/stats            → User statistics
/api/stripe/checkout  → Create Stripe checkout session
/api/stripe/webhook   → Stripe webhook handler
/api/stripe/portal    → Stripe customer portal redirect
/api/gemini/task      → AI task breakdown (existing)
/api/gemini/report    → AI report generation (existing, enhanced)
/api/gemini/chat      → AI chat assistant (existing, enhanced with memory)
```

### 4.2 Navigation Flow

```
[Landing Page] → [Login (Google)] → [Dashboard]
                                        │
                                        ├── "New Session" → [Task] → [Assign] → [Timer] → [Report]
                                        │                                          ↑
                                        ├── "Quick Start (25 min)" ────────────────┘
                                        │
                                        ├── "Resume Session" → [Timer] (picks up where left off)
                                        │
                                        └── "View Past Session" → [Report/sessionId]
```

---

## 5. Database Schema

### 5.1 `profiles` table
Extends Supabase's built-in `auth.users`. Created automatically via trigger on signup.

```sql
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  avatar_url TEXT,
  subscription_tier TEXT NOT NULL DEFAULT 'free' CHECK (subscription_tier IN ('free', 'pro')),
  stripe_customer_id TEXT UNIQUE,
  stripe_subscription_id TEXT UNIQUE,
  subscription_expires_at TIMESTAMPTZ,
  onboarding_completed BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Row-Level Security: users can only read/update their own profile
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE USING (auth.uid() = id);
```

### 5.2 `sessions` table
A "focus session" — the core unit of work in Dedicora.

```sql
CREATE TABLE sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,                          -- main task description
  mode TEXT NOT NULL DEFAULT 'single' CHECK (mode IN ('single', 'breakdown')),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'paused', 'completed', 'abandoned')),
  
  -- Flow tracking: which step the user is on
  current_step TEXT NOT NULL DEFAULT 'task' CHECK (current_step IN ('task', 'assign', 'timer', 'report')),
  current_task_index INTEGER NOT NULL DEFAULT 0,
  
  -- Time tracking (aggregated)
  total_estimated_seconds INTEGER NOT NULL DEFAULT 0,
  total_actual_seconds INTEGER NOT NULL DEFAULT 0,
  total_overtime_seconds INTEGER NOT NULL DEFAULT 0,
  total_break_seconds INTEGER NOT NULL DEFAULT 0,
  
  -- Report data (cached from Gemini)
  report_data JSONB,

  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_sessions_user_id ON sessions(user_id);
CREATE INDEX idx_sessions_status ON sessions(status);
CREATE INDEX idx_sessions_created_at ON sessions(created_at DESC);

ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can CRUD own sessions"
  ON sessions FOR ALL USING (auth.uid() = user_id);
```

### 5.3 `tasks` table
Sub-tasks within a session.

```sql
CREATE TABLE tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  order_index INTEGER NOT NULL DEFAULT 0,
  title TEXT NOT NULL,
  description TEXT,
  
  -- Time tracking
  estimated_seconds INTEGER NOT NULL DEFAULT 0,
  actual_seconds INTEGER NOT NULL DEFAULT 0,      -- real time spent working
  overtime_seconds INTEGER NOT NULL DEFAULT 0,     -- time past estimate
  
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'completed', 'skipped')),
  
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_tasks_session_id ON tasks(session_id);

ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can CRUD tasks in own sessions"
  ON tasks FOR ALL
  USING (
    session_id IN (SELECT id FROM sessions WHERE user_id = auth.uid())
  );
```

### 5.4 `notes` table
Per-session scratchpad (replaces localStorage notes).

```sql
CREATE TABLE notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL DEFAULT '',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  UNIQUE(session_id, user_id)
);

ALTER TABLE notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can CRUD own notes"
  ON notes FOR ALL USING (auth.uid() = user_id);
```

### 5.5 `chat_messages` table
Stores AI chat history per session. Used for AI memory (Pro feature) and session replay.

```sql
CREATE TABLE chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_chat_messages_session_id ON chat_messages(session_id);
CREATE INDEX idx_chat_messages_created_at ON chat_messages(created_at);

ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can CRUD chat in own sessions"
  ON chat_messages FOR ALL
  USING (
    session_id IN (SELECT id FROM sessions WHERE user_id = auth.uid())
  );
```

### 5.6 `user_settings` table
Replaces localStorage settings. Syncs across devices.

```sql
CREATE TABLE user_settings (
  user_id UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  audio_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  theme TEXT NOT NULL DEFAULT 'dark' CHECK (theme IN ('light', 'dark', 'system')),
  color_blind_mode TEXT NOT NULL DEFAULT 'none' CHECK (color_blind_mode IN ('none', 'protanopia', 'deuteranopia', 'tritanopia')),
  default_work_minutes INTEGER NOT NULL DEFAULT 25,
  default_break_minutes INTEGER NOT NULL DEFAULT 5,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can CRUD own settings"
  ON user_settings FOR ALL USING (auth.uid() = user_id);
```

### 5.7 Computed: Daily Focus Stats (View)

```sql
CREATE VIEW daily_focus_stats AS
SELECT 
  s.user_id,
  DATE(s.completed_at) AS focus_date,
  COUNT(*) AS sessions_completed,
  SUM(s.total_actual_seconds) AS total_seconds,
  ROUND(SUM(s.total_actual_seconds) / 3600.0, 1) AS total_hours
FROM sessions s
WHERE s.status = 'completed'
  AND s.completed_at IS NOT NULL
GROUP BY s.user_id, DATE(s.completed_at);
```

### 5.8 Entity Relationship Diagram

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│   profiles   │────<│   sessions   │────<│    tasks      │
│              │     │              │     │              │
│ id (PK)      │     │ id (PK)      │     │ id (PK)      │
│ display_name │     │ user_id (FK) │     │ session_id   │
│ avatar_url   │     │ title        │     │ order_index  │
│ sub_tier     │     │ mode         │     │ title        │
│ stripe_*     │     │ status       │     │ description  │
│ created_at   │     │ current_step │     │ est_seconds  │
└──────────────┘     │ times...     │     │ actual_secs  │
       │             │ report_data  │     │ status       │
       │             └──────────────┘     └──────────────┘
       │                    │
       │                    ├────<┌──────────────┐
       │                    │     │    notes      │
       │                    │     │ content       │
       │                    │     └──────────────┘
       │                    │
       │                    └────<┌──────────────┐
       │                          │ chat_messages │
       │                          │ role, content │
       │                          └──────────────┘
       │
       └─────┌──────────────┐
              │user_settings │
              │ audio, theme │
              │ color_blind  │
              │ work/break   │
              └──────────────┘
```

---

## 6. API Routes

### 6.1 Authentication

| Method | Route | Description |
|--------|-------|-------------|
| GET | `/api/auth/callback` | Supabase OAuth callback. Exchanges code for session, creates `profiles` row if first login, redirects to `/dashboard`. |

Authentication is handled client-side by `@supabase/ssr` — the Supabase client reads the session from cookies. All other API routes check `supabase.auth.getUser()` and return 401 if unauthenticated.

### 6.2 Sessions

| Method | Route | Description |
|--------|-------|-------------|
| POST | `/api/sessions` | Create a new session. Body: `{ title, mode }`. Returns session with ID. |
| GET | `/api/sessions` | List user's sessions (paginated). Query: `?status=active&limit=20&offset=0`. Returns `{ sessions, total }`. |
| GET | `/api/sessions/[id]` | Get session with all tasks, notes, and chat messages. |
| PATCH | `/api/sessions/[id]` | Update session fields (status, current_step, current_task_index, report_data, times). |
| DELETE | `/api/sessions/[id]` | Soft-delete or hard-delete a session. |

### 6.3 Tasks

| Method | Route | Description |
|--------|-------|-------------|
| POST | `/api/sessions/[id]/tasks` | Bulk create tasks for a session. Body: `{ tasks: [{ title, description, estimated_seconds }] }`. |
| PATCH | `/api/tasks/[id]` | Update a single task (status, actual_seconds, overtime_seconds, started_at, completed_at). |

### 6.4 Notes

| Method | Route | Description |
|--------|-------|-------------|
| PUT | `/api/sessions/[id]/notes` | Upsert notes for a session. Body: `{ content }`. |

### 6.5 Stats

| Method | Route | Description |
|--------|-------|-------------|
| GET | `/api/stats` | Returns: `{ totalSessions, totalFocusHours, currentStreak, longestStreak, thisWeekHours, lastWeekHours, completionRate, dailyStats[] }` |

**Streak logic:** A streak is the number of consecutive calendar days where the user completed at least one session. "Today" counts if a session was completed today. If the user hasn't completed a session today but did yesterday, the streak is still alive (not broken until end of today).

### 6.6 Gemini AI (Enhanced)

| Method | Route | Description | Changes from current |
|--------|-------|-------------|---------------------|
| POST | `/api/gemini/task` | Break down a task into sub-tasks | No change needed |
| POST | `/api/gemini/report` | Generate productivity report | Now receives real timing data from DB |
| POST | `/api/gemini/chat` | Streaming AI chat | Now stores messages in DB; Pro users get cross-session memory |

**Chat enhancement for Pro users:**
- Before sending to Gemini, fetch summaries of the user's last 5 sessions from DB
- Inject into the system prompt: "This user has previously worked on [X, Y, Z]. Their average session is N minutes. They tend to underestimate time by ~30%."
- This makes the AI feel personal and aware

### 6.7 Stripe

| Method | Route | Description |
|--------|-------|-------------|
| POST | `/api/stripe/checkout` | Creates a Stripe Checkout session. Body: `{ priceId, successUrl, cancelUrl }`. Returns `{ url }`. |
| POST | `/api/stripe/webhook` | Handles Stripe events: `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`. Updates `profiles.subscription_tier` accordingly. |
| GET | `/api/stripe/portal` | Creates a Stripe Customer Portal session for managing subscription. Returns `{ url }`. |

---

## 7. Page-by-Page Spec

### 7.1 Landing Page — `/`

**Purpose:** Convert visitors into signups.

**Behavior:**
- If authenticated → redirect to `/dashboard`
- If not authenticated → show landing page

**Content (above the fold):**
```
[Dedicora Logo]

Your AI Focus Partner

Stop planning. Start doing. Dedicora breaks your tasks down,        
sits with you while you work, and celebrates when you finish.

[Get Started with Google →]     (Supabase OAuth)

[Screenshot/demo of the timer page with stickman]
```

**Content (below the fold):**
- "How it works" — 3 steps: Describe → Focus → Finish
- "Features" — AI breakdown, smart timer, AI chat, reports
- "Pricing" — Free vs Pro comparison table
- Footer with links

### 7.2 Dashboard — `/dashboard` (NEW)

**Purpose:** The home base. Users should see this every time they open Dedicora.

**Layout:**
```
┌─────────────────────────────────────────────────────┐
│  [TopBar: Logo | "Dashboard" | Settings ⚙️ | Avatar] │
├─────────────────────────────────────────────────────┤
│                                                     │
│  Welcome back, Hassan!              🔥 7-day streak │
│                                                     │
│  ┌─ Active Session ──────────────────────────────┐  │
│  │  "Write thesis introduction"                  │  │
│  │  3/5 tasks done · 47 min focused              │  │
│  │  [Resume Session →]                           │  │
│  └───────────────────────────────────────────────┘  │
│                                                     │
│  ┌─ Quick Actions ───────────────────────────────┐  │
│  │  [▶ Quick Focus (25 min)]  [+ New Session]    │  │
│  └───────────────────────────────────────────────┘  │
│                                                     │
│  ┌─ This Week ───────────────────────────────────┐  │
│  │  [Bar chart: Mon-Sun focus hours]             │  │
│  │  Total: 12.5 hours · Avg: 1.8 hrs/day        │  │
│  └───────────────────────────────────────────────┘  │
│                                                     │
│  ┌─ Recent Sessions ────────────────────────────┐   │
│  │  ✅ "Prepare presentation"  · 1h 23m · Today │   │
│  │  ✅ "Code review PR #42"   · 45m · Yesterday │   │
│  │  ❌ "Tax paperwork"        · 12m · Abandoned │   │
│  │  [View all →]                                │   │
│  └──────────────────────────────────────────────┘   │
│                                                     │
└─────────────────────────────────────────────────────┘
```

**Key behaviors:**
- "Resume Session" appears only if there's an active/paused session (max 1 active at a time)
- "Quick Focus" creates a session with title "Quick Focus" and a single 25-min task, then navigates directly to `/timer`
- Weekly chart reuses the existing `report-chart.tsx` Recharts component
- Recent sessions show the last 5, with status icon, title, total time, and relative date
- Clicking a completed session goes to `/report/[sessionId]`

### 7.3 Task Page — `/task` (Updated)

**Changes from current:**
- Requires authentication (middleware redirect to `/login` if not authed)
- On "Only This" or "Break It Down": creates a `sessions` row in Supabase immediately
- Session ID is stored in URL or context for all subsequent pages

### 7.4 Assign Page — `/assign` (Updated)

**Changes from current:**
- Tasks are saved to Supabase `tasks` table as they're configured
- Changes auto-save (debounced 500ms) so the user never loses work
- Session's `current_step` updates to `'assign'`

### 7.5 Timer Page — `/timer` (Updated)

**Changes from current:**
- Timer state persists to DB every 5 seconds (debounced)
- Saves: `actual_seconds` per task, `overtime_seconds`, task `status`
- Session's `current_step` = `'timer'`, `current_task_index` updates
- Chat messages saved to `chat_messages` table
- Notes saved to `notes` table (replaces localStorage)
- If user navigates away and comes back (or refreshes), timer resumes from saved state
- When all tasks complete → session status = `'completed'`, navigate to report

### 7.6 Report Page — `/report` (Updated)

**Changes from current:**
- Report is generated using real timing data from DB (actual vs estimated per task)
- Report data is cached in `sessions.report_data` so it doesn't regenerate on revisit
- `/report/[sessionId]` route allows viewing past reports from dashboard

### 7.7 Settings — `/settings` or Modal (Expanded)

**New sections:**
- **Account:** Display name, avatar (from Google), email (read-only)
- **Subscription:** Current plan, upgrade/manage button (Stripe portal)
- **Preferences:** Audio, theme, color-blind mode (existing), + default work/break duration (new)
- All settings sync to `user_settings` table in Supabase

---

## 8. Free vs Pro Tiers

### 8.1 Feature Matrix

| Feature | Free | Pro ($4.99/mo) |
|---------|------|-----------------|
| Focus sessions | ✅ Unlimited | ✅ Unlimited |
| AI task breakdown | ✅ | ✅ |
| AI chat assistant | ✅ | ✅ |
| AI productivity report | ✅ | ✅ |
| Timer + breaks | ✅ | ✅ |
| Notes | ✅ | ✅ |
| Session history | 30 days | ✅ Unlimited |
| Streaks | ✅ Basic (current + longest) | ✅ Detailed (calendar heatmap) |
| **AI companion memory** | ❌ | ✅ Remembers past sessions |
| **Advanced analytics** | ❌ | ✅ Trends, patterns, weekly/monthly reports |
| **Priority AI** | ❌ | ✅ Faster responses, longer context |
| Customization (themes, audio) | ✅ | ✅ |
| Color-blind modes | ✅ | ✅ |

### 8.2 Pricing

| Plan | Monthly | Annual |
|------|---------|--------|
| Free | $0 | $0 |
| Pro | $6.99/mo | $49.99/yr ($4.17/mo) |

**Annual discount is the primary CTA.** The monthly price exists to make annual feel like a deal.

### 8.3 Upgrade Triggers

Show upgrade prompts at natural moments, never interrupt the flow:
- On the report page: "Unlock trends & insights across all your sessions → Go Pro"
- In chat: "Pro users get an AI that remembers your work patterns → Upgrade"
- On dashboard after 30 days: "Your oldest sessions will be archived soon → Keep them with Pro"
- Never gate core functionality. The free product must be genuinely useful.

---

## 9. AI System Design

### 9.1 Task Breakdown (No changes)
Current implementation is solid — Gemini 2.5 Flash with structured JSON output and fallback.

### 9.2 Report Generation (Enhanced)

**Current:** Receives task titles and estimated durations.
**New:** Receives actual timing data:

```json
{
  "sessionTitle": "Write thesis introduction",
  "tasks": [
    {
      "title": "Research existing literature",
      "estimatedSeconds": 1800,
      "actualSeconds": 2340,
      "overtimeSeconds": 540,
      "status": "completed"
    },
    ...
  ],
  "totalEstimatedSeconds": 5400,
  "totalActualSeconds": 6120,
  "sessionDurationSeconds": 7200
}
```

This allows Gemini to give meaningful insights:
- "You underestimated research by 9 minutes — consider allocating more time for research tasks"
- "Your actual-to-estimated ratio is 1.13 — you're getting better at estimating!"

### 9.3 Chat Assistant (Enhanced for Pro)

**Free tier:** Same as current — context-aware chat within the current session.

**Pro tier — AI Memory:**

Before each chat request, fetch a summary of the user's recent sessions:

```
System prompt addition (Pro only):
"You have memory of this user's past work. Here's what you know:
- They've completed 23 sessions over the past 2 weeks
- Most common task types: coding, writing, studying
- Average session: 47 minutes, 3.2 tasks
- They tend to underestimate by ~20%
- Last session: 'Code review for PR #42' — completed 4/4 tasks in 45 min
- They often ask for help with getting started (motivation)
- Their preferred work style: short bursts with breaks"
```

This summary is generated from DB data, not stored separately. Computed on each request from:
- `sessions` table (count, avg duration, completion rate)
- `tasks` table (time estimation accuracy)
- `chat_messages` table (last few exchanges for continuity)

### 9.4 Proactive Nudges (Future — Phase 2+)

During the timer, the AI can send unprompted messages:
- "You've been on this sub-task for 10 minutes past your estimate. Want to break it down further, or mark it done and move on?"
- "Great work finishing that one! Take a 2-minute stretch before the next task."
- "You're halfway through your session — on track!"

Implementation: A client-side interval (every 60s) checks conditions and triggers a pre-defined nudge via the chat panel. No API call needed for simple nudges.

---

## 10. Phase Execution Plan

### Phase 1: Foundation (Weeks 1-3)

**Goal:** A user can sign up, create a focus session, close the browser, come back, and resume. A dashboard shows their history.

| # | Task | Files | Priority |
|---|------|-------|----------|
| 1.1 | Create Supabase project, configure env vars | `.env.local`, Supabase dashboard | P0 |
| 1.2 | Install Supabase packages (`@supabase/supabase-js`, `@supabase/ssr`) | `package.json` | P0 |
| 1.3 | Create Supabase client utilities (browser + server) | `lib/supabase/client.ts`, `lib/supabase/server.ts` | P0 |
| 1.4 | Run DB migrations (all tables from Section 5) | Supabase SQL editor or migration files | P0 |
| 1.5 | Implement auth: login page, callback route, middleware | `app/login/page.tsx`, `app/auth/callback/route.ts`, `middleware.ts` | P0 |
| 1.6 | Create `AuthProvider` context | `components/providers/auth-provider.tsx` | P0 |
| 1.7 | Build API routes: sessions CRUD | `app/api/sessions/route.ts`, `app/api/sessions/[id]/route.ts` | P0 |
| 1.8 | Build API routes: tasks CRUD | `app/api/sessions/[id]/tasks/route.ts`, `app/api/tasks/[id]/route.ts` | P0 |
| 1.9 | Build API routes: notes | `app/api/sessions/[id]/notes/route.ts` | P1 |
| 1.10 | Build API routes: stats | `app/api/stats/route.ts` | P1 |
| 1.11 | Refactor `FlowProvider` to sync with Supabase | `components/providers/flow-provider.tsx` | P0 |
| 1.12 | Build Dashboard page | `app/dashboard/page.tsx` | P0 |
| 1.13 | Update Timer page: persist state every 5s, track actual time | `app/timer/page.tsx` | P0 |
| 1.14 | Update Assign page: auto-save tasks to DB | `app/assign/page.tsx` | P0 |
| 1.15 | Update Report page: use real timing data, cache report | `app/report/page.tsx` | P1 |
| 1.16 | Quick Start button on dashboard | `app/dashboard/page.tsx` | P1 |
| 1.17 | Save chat messages to DB | `app/api/gemini/chat/route.ts`, `components/chat-panel.tsx` | P1 |
| 1.18 | Save notes to DB (replace localStorage) | `components/notes-panel.tsx` | P1 |
| 1.19 | Sync settings to DB (replace localStorage) | `components/providers/settings-provider.tsx` | P2 |
| 1.20 | Deploy to Vercel | Vercel dashboard, `vercel.json` if needed | P0 |

**Verification criteria:**
- [ ] User can sign in with Google
- [ ] User can create a session, close browser, reopen, and resume
- [ ] Dashboard shows session history and basic stats
- [ ] Timer accurately tracks actual time per task
- [ ] Quick Start creates a 25-min session and opens timer

### Phase 2: Engagement & Polish (Weeks 4-5)

**Goal:** Users return daily. The app feels alive and rewarding.

| # | Task | Priority |
|---|------|----------|
| 2.1 | Streak system (current streak, longest streak, calculations) | P0 |
| 2.2 | Weekly focus hours chart on dashboard | P0 |
| 2.3 | Smart breaks: configurable work/break cycles | P1 |
| 2.4 | Break screen with suggestions ("Stretch", "Hydrate", "Breathe") | P1 |
| 2.5 | Session pause/resume from dashboard | P0 |
| 2.6 | Past session report viewing (`/report/[sessionId]`) | P1 |
| 2.7 | Stickman evolution: react to streak milestones | P2 |
| 2.8 | Improved AI report with actual vs estimated comparison | P0 |
| 2.9 | Empty states and onboarding (first-time user experience) | P1 |
| 2.10 | Mobile responsiveness audit and fixes | P1 |

**Verification criteria:**
- [ ] Streak counter shows on dashboard, updates daily
- [ ] Weekly chart shows focus hours per day
- [ ] After a work block, a break timer starts automatically
- [ ] Users can view any past session's report

### Phase 3: Monetization (Weeks 6-7)

**Goal:** Pro tier is live, users can pay, and Pro features work.

| # | Task | Priority |
|---|------|----------|
| 3.1 | Set up Stripe account, create products/prices | P0 |
| 3.2 | Implement `/api/stripe/checkout` | P0 |
| 3.3 | Implement `/api/stripe/webhook` (subscription lifecycle) | P0 |
| 3.4 | Implement `/api/stripe/portal` | P0 |
| 3.5 | Add subscription status checks throughout the app | P0 |
| 3.6 | Build upgrade/pricing UI (on dashboard + settings) | P0 |
| 3.7 | AI companion memory (Pro): inject session history into chat prompt | P1 |
| 3.8 | Advanced analytics (Pro): trends over weeks/months, estimation accuracy | P1 |
| 3.9 | 30-day history enforcement for free tier | P1 |
| 3.10 | Upgrade prompts at natural moments (report page, chat, dashboard) | P2 |

**Verification criteria:**
- [ ] User can upgrade to Pro via Stripe Checkout
- [ ] Subscription status persists in DB and is checked across the app
- [ ] Pro users see AI memory in chat ("Last time you worked on X...")
- [ ] Pro users see advanced analytics on dashboard
- [ ] Free users see 30-day limit with graceful messaging

### Phase 4: Growth & Distribution (Weeks 8-10)

**Goal:** The app is discoverable, installable, and shareable.

| # | Task | Priority |
|---|------|----------|
| 4.1 | PWA manifest + service worker | P0 |
| 4.2 | Push notifications ("Your planned session starts in 5 min") | P1 |
| 4.3 | Landing page redesign (marketing-focused, testimonials, demo) | P0 |
| 4.4 | SEO: meta tags, OpenGraph images, structured data | P0 |
| 4.5 | Social sharing: "I focused for 2 hours today on Dedicora" cards | P1 |
| 4.6 | Referral system: "Invite a friend, get 1 month Pro free" | P2 |
| 4.7 | Body-doubling MVP: share a session link, see partner's progress | P2 |
| 4.8 | Google Calendar integration (Pro) | P2 |
| 4.9 | Analytics: PostHog or Plausible for product metrics | P1 |
| 4.10 | Error monitoring: Sentry | P1 |

---

## 11. Tech Stack (Final)

| Layer | Technology | Why |
|-------|------------|-----|
| Framework | **Next.js 16** (App Router) | Already in use, best React framework |
| Language | **TypeScript 5** | Already in use |
| Database | **Supabase (Postgres)** | Auth + DB + Realtime in one |
| Auth | **Supabase Auth (Google OAuth)** | Included with Supabase |
| ORM / Client | **Supabase JS Client** | Direct, type-safe, RLS-aware |
| AI | **Google Gemini 2.5 Flash** | Already integrated, fast, cheap |
| Styling | **Tailwind CSS v4** + shadcn/ui | Already in use |
| Charts | **Recharts** | Already in use |
| Animation | **Framer Motion** | Already in use |
| Payments | **Stripe** | Industry standard |
| Deployment | **Vercel** | Native Next.js, edge functions, analytics |
| PWA | **next-pwa** or manual service worker | Installable + offline |
| Analytics | **PostHog** (free tier) or **Plausible** | Privacy-friendly product analytics |
| Error tracking | **Sentry** | Catch production errors |

**New packages to install (Phase 1):**
```bash
npm install @supabase/supabase-js @supabase/ssr
```

**New packages (Phase 3):**
```bash
npm install stripe
```

**New packages (Phase 4):**
```bash
npm install next-pwa @sentry/nextjs posthog-js
```

---

## 12. Open Questions

These don't block Phase 1 but should be decided before Phase 3-4:

1. **Custom domain:** Do you own `dedicora.com` or similar? Should we register one?
2. **Legal:** Privacy policy and terms of service are needed before accepting payments. Use a generator like Termly or write custom?
3. **Email:** Do you want to send emails? (Welcome email, streak reminders, weekly digest). If so, Resend or Supabase's built-in email.
4. **Team/Organization tier:** Is this on the roadmap, or purely individual for now?
5. **Data export:** Should users be able to export their session history (CSV/JSON)?
6. **Account deletion:** GDPR/privacy requirement — need a "Delete my account" flow.
7. **Rate limiting:** The Gemini API routes currently have no rate limiting. Add before launch?
8. **Testing strategy:** Unit tests (Vitest), E2E tests (Playwright), or skip for now?
9. **Stickman IP:** The stickman mascot is charming. Worth investing in proper character design/branding?

---

## Appendix: Key Metrics to Track

Once analytics are in place, these are the numbers that matter:

| Metric | Definition | Target |
|--------|-----------|--------|
| **DAU** | Users who complete ≥1 session per day | Growth |
| **D7 Retention** | % of new users who return within 7 days | > 30% |
| **Session completion rate** | % of sessions that reach "completed" (not abandoned) | > 60% |
| **Avg sessions/user/week** | Engagement depth | > 3 |
| **Free → Pro conversion** | % of free users who upgrade | > 3% |
| **Monthly churn** | % of Pro users who cancel per month | < 5% |
| **Time to first session** | Seconds from signup to starting first timer | < 120s |

---

*This document is the source of truth for Dedicora's product direction. Update it as decisions are made.*
