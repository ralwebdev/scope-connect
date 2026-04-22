// Scope Connect — frontend-only analytics. Aggregate counters in localStorage.
// No PII, no remote sends. Surfaced in /admin and /ops.

export type AnalyticsEvent =
  | "signup_completed"
  | "login_success"
  | "project_view"
  | "project_apply"
  | "portfolio_item_added"
  | "event_rsvp"
  | "feed_post_created"
  | "notification_opened"
  | "session_start"
  | "route_visit";

type Counters = Record<string, number>;
type DayMap = Record<string, number>; // YYYY-MM-DD -> count
type RouteMap = Record<string, number>;

const KEY = "scope_analytics_v1";

type Store = {
  events: Counters;
  dailySignups: DayMap;
  dailyActive: DayMap; // distinct days with session_start
  routes: RouteMap;
  sessions: number;
  lastSessionAt: number;
  lastActiveDay: string;
};

const empty = (): Store => ({
  events: {},
  dailySignups: {},
  dailyActive: {},
  routes: {},
  sessions: 0,
  lastSessionAt: 0,
  lastActiveDay: "",
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

export const analytics = {
  track(event: AnalyticsEvent, meta?: { route?: string }) {
    if (typeof window === "undefined") return;
    const s = read();
    s.events[event] = (s.events[event] || 0) + 1;

    if (event === "signup_completed") {
      const d = today();
      s.dailySignups[d] = (s.dailySignups[d] || 0) + 1;
    }
    if (event === "session_start") {
      s.sessions += 1;
      s.lastSessionAt = Date.now();
      const d = today();
      if (s.lastActiveDay !== d) {
        s.dailyActive[d] = (s.dailyActive[d] || 0) + 1;
        s.lastActiveDay = d;
      }
    }
    if (event === "route_visit" && meta?.route) {
      s.routes[meta.route] = (s.routes[meta.route] || 0) + 1;
    }
    write(s);
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

  reset() {
    if (typeof window === "undefined") return;
    try {
      localStorage.removeItem(KEY);
    } catch {
      /* noop */
    }
  },
};
