// Scope Connect — frontend-only analytics + soft-launch validation engine.
// Aggregate counters in localStorage. No PII, no remote sends.
// Surfaced in /admin and /ops (Soft Launch tab).

export type AnalyticsEvent =
  | "signup_completed"
  | "signup_started"
  | "campus_selected"
  | "profile_completed"
  | "login_success"
  | "project_view"
  | "project_apply"
  | "portfolio_item_added"
  | "event_rsvp"
  | "feed_post_created"
  | "notification_opened"
  | "session_start"
  | "route_visit"
  | "homepage_visit"
  | "landing_visit"
  | "cta_click_primary"
  | "cta_click_secondary"
  | "first_action_completed"
  | "waitlist_joined"
  | "dashboard_returned"
  | "session_repeat_visit"
  | "rage_click_detected"
  | "feedback_submitted"
  | "nps_submitted";

type Counters = Record<string, number>;
type DayMap = Record<string, number>; // YYYY-MM-DD -> count
type RouteMap = Record<string, number>;

const KEY = "scope_analytics_v1";
const TESTER_KEY = "scope_tester_id";
const TESTER_SOURCE_KEY = "scope_tester_source";
const NPS_KEY = "scope_nps_v1";

type Store = {
  events: Counters;
  dailySignups: DayMap;
  dailyActive: DayMap;       // distinct days with session_start
  routes: RouteMap;
  sessions: number;
  lastSessionAt: number;
  lastActiveDay: string;
  firstSeenAt: number;       // ms — when this device first opened the app
  rageClicks: number;
};

type NPSEntry = { score: number; reason: string; at: number };

const empty = (): Store => ({
  events: {},
  dailySignups: {},
  dailyActive: {},
  routes: {},
  sessions: 0,
  lastSessionAt: 0,
  lastActiveDay: "",
  firstSeenAt: 0,
  rageClicks: 0,
});

function read(): Store {
  if (typeof window === "undefined") return empty();
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return empty();
    return { ...empty(), ...(JSON.parse(raw) as Partial<Store>) };
  } catch {
    return empty();
  }
}

function write(s: Store) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(KEY, JSON.stringify(s));
  } catch {
    /* noop */
  }
}

const today = () => new Date().toISOString().slice(0, 10);

/* ---------------- Tester identity (anonymous) ---------------- */

function ensureTesterId(): string {
  if (typeof window === "undefined") return "";
  try {
    let id = localStorage.getItem(TESTER_KEY);
    if (!id) {
      id = `t_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`;
      localStorage.setItem(TESTER_KEY, id);
    }
    return id;
  } catch {
    return "";
  }
}

function captureTesterSource() {
  if (typeof window === "undefined") return;
  try {
    if (localStorage.getItem(TESTER_SOURCE_KEY)) return;
    const params = new URLSearchParams(window.location.search);
    const src = params.get("t") || params.get("ref") || params.get("utm_source") || document.referrer || "direct";
    localStorage.setItem(TESTER_SOURCE_KEY, src.slice(0, 80));
  } catch { /* noop */ }
}

export const analytics = {
  track(event: AnalyticsEvent, meta?: { route?: string }) {
    if (typeof window === "undefined") return;
    const s = read();
    s.events[event] = (s.events[event] || 0) + 1;

    if (!s.firstSeenAt) s.firstSeenAt = Date.now();

    if (event === "signup_completed") {
      const d = today();
      s.dailySignups[d] = (s.dailySignups[d] || 0) + 1;
    }
    if (event === "session_start") {
      s.sessions += 1;
      const previousSessionAt = s.lastSessionAt;
      s.lastSessionAt = Date.now();
      const d = today();
      if (s.lastActiveDay !== d) {
        s.dailyActive[d] = (s.dailyActive[d] || 0) + 1;
        s.lastActiveDay = d;
      }
      // Repeat visit signal — back within 30 days but not same session.
      if (previousSessionAt && Date.now() - previousSessionAt > 30 * 60 * 1000) {
        s.events["session_repeat_visit"] = (s.events["session_repeat_visit"] || 0) + 1;
      }
    }
    if (event === "route_visit" && meta?.route) {
      s.routes[meta.route] = (s.routes[meta.route] || 0) + 1;
      if (meta.route === "/dashboard" && s.events["dashboard_returned"] !== undefined) {
        s.events["dashboard_returned"] = (s.events["dashboard_returned"] || 0) + 1;
      } else if (meta.route === "/dashboard") {
        s.events["dashboard_returned"] = 1;
      }
      if (meta.route === "/") {
        s.events["landing_visit"] = (s.events["landing_visit"] || 0) + 1;
      }
    }
    if (event === "rage_click_detected") {
      s.rageClicks += 1;
    }
    write(s);
  },

  init() {
    if (typeof window === "undefined") return;
    ensureTesterId();
    captureTesterSource();
  },

  testerId(): string {
    return ensureTesterId();
  },

  testerSource(): string {
    if (typeof window === "undefined") return "";
    try { return localStorage.getItem(TESTER_SOURCE_KEY) || "direct"; } catch { return "direct"; }
  },

  snapshot() {
    return read();
  },

  topRoutes(limit = 5): { route: string; count: number }[] {
    const s = read();
    return Object.entries(s.routes)
      .map(([route, count]) => ({ route, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, limit);
  },

  signupsLast7(): { day: string; count: number }[] {
    const s = read();
    const out: { day: string; count: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = d.toISOString().slice(0, 10);
      out.push({ day: key.slice(5), count: s.dailySignups[key] || 0 });
    }
    return out;
  },

  activeLast7(): number {
    const s = read();
    let total = 0;
    for (let i = 0; i < 7; i++) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      total += s.dailyActive[d.toISOString().slice(0, 10)] || 0;
    }
    return total;
  },

  activeToday(): number {
    return read().dailyActive[today()] || 0;
  },

  /* ---------------- Soft launch validation ---------------- */

  funnel() {
    const s = read();
    const visits = s.events["landing_visit"] || s.events["homepage_visit"] || 0;
    const started = s.events["signup_started"] || 0;
    const completed = s.events["signup_completed"] || 0;
    const firstAction = s.events["first_action_completed"] || 0;
    const dashReturns = Math.max(0, (s.events["dashboard_returned"] || 0) - 1);
    const pct = (n: number, d: number) => (d > 0 ? Math.round((n / d) * 100) : 0);
    return {
      visits,
      started,
      completed,
      firstAction,
      dashReturns,
      visitToSignup: pct(completed, visits),
      signupCompletion: pct(completed, started),
      activation: pct(firstAction, completed),
      d1Return: pct(dashReturns, completed),
    };
  },

  recordNPS(score: number, reason: string) {
    if (typeof window === "undefined") return;
    try {
      const list: NPSEntry[] = JSON.parse(localStorage.getItem(NPS_KEY) || "[]");
      list.unshift({ score: Math.max(0, Math.min(10, Math.round(score))), reason: reason.slice(0, 280), at: Date.now() });
      localStorage.setItem(NPS_KEY, JSON.stringify(list.slice(0, 200)));
    } catch { /* noop */ }
    this.track("nps_submitted");
  },

  npsSummary() {
    if (typeof window === "undefined") return { count: 0, score: 0, promoters: 0, passives: 0, detractors: 0, recent: [] as NPSEntry[] };
    let list: NPSEntry[] = [];
    try { list = JSON.parse(localStorage.getItem(NPS_KEY) || "[]"); } catch { /* noop */ }
    const count = list.length;
    const promoters = list.filter((n) => n.score >= 9).length;
    const passives = list.filter((n) => n.score >= 7 && n.score <= 8).length;
    const detractors = list.filter((n) => n.score <= 6).length;
    const score = count > 0 ? Math.round(((promoters - detractors) / count) * 100) : 0;
    return { count, score, promoters, passives, detractors, recent: list.slice(0, 8) };
  },

  rageClickCount(): number { return read().rageClicks; },

  reset() {
    if (typeof window === "undefined") return;
    try {
      localStorage.removeItem(KEY);
      localStorage.removeItem(NPS_KEY);
    } catch {
      /* noop */
    }
  },
};
