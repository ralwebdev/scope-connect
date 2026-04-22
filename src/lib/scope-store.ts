// Scope Connect — central client-side state engine.
// Persists everything in localStorage. Single source of truth for the fake-MVP.

import {
  campusPartners,
  topBuilders,
  topChapters,
  feedPosts as seedFeed,
  featuredProjects,
  upcomingEvents,
  interestTags,
} from "./mock-data";

/* ----------------------------- Types ----------------------------- */

export type ScopeUser = {
  id: string;
  name: string;
  email: string;
  campus: string;
  bio: string;
  skills: string[];
  interests: string[];
  links: { website?: string; github?: string; twitter?: string };
  availability: "Open to collab" | "Building solo" | "Hiring teammates" | "Looking for internship";
  avatarColor: string;
  joinedAt: number;
};

export type FeedPost = {
  id: string;
  authorId: string;
  author: string;
  campus: string;
  time: string;
  createdAt: number;
  type: string;
  content: string;
  likes: number;
  comments: number;
  celebrates: number;
  userLiked?: boolean;
  userCelebrated?: boolean;
  commentList?: { id: string; author: string; text: string; at: number }[];
};

export type Project = {
  id: string;
  authorId: string;
  author: string;
  campus: string;
  title: string;
  description: string;
  problem: string;
  team: string;
  category: string;
  demoUrl?: string;
  votes: number;
  cover: string;
  createdAt: number;
  userVoted?: boolean;
};

export type EventItem = {
  id: string;
  title: string;
  type: string;
  date: string;
  venue: string;
  seats: number;
  color: string;
  startsAt: number;
};

export type Opportunity = {
  id: string;
  title: string;
  by: string;
  campus: string;
  category: "Design" | "Engineering" | "Founder" | "Marketing" | "Pitch";
  description: string;
  match: number;
};

export type Notification = {
  id: string;
  text: string;
  at: number;
  read: boolean;
  icon: "trophy" | "spark" | "zap" | "users" | "heart";
};

/* --------------------------- LS helpers --------------------------- */

const KEYS = {
  loggedIn: "scope_logged_in",
  user: "scope_user_profile",
  points: "scope_points",
  streak: "scope_streak",
  streakDate: "scope_streak_date",
  joinedChapter: "scope_joined_chapter",
  notifications: "scope_notifications",
  projects: "scope_projects",
  feed: "scope_feed_posts",
  rsvps: "scope_event_rsvps",
  savedOpps: "scope_saved_opps",
  interestedOpps: "scope_interested_opps",
  lastSeen: "scope_last_seen",
  visits: "scope_visit_count",
  liked: "scope_liked_posts",
  votedProjects: "scope_voted_projects",
  applications: "scope_applications",
  savedProjects: "scope_saved_projects",
  portfolio: "scope_portfolio_items",
  ideaSubmissions: "scope_idea_submissions",
} as const;

const isBrowser = typeof window !== "undefined";

function read<T>(key: string, fallback: T): T {
  if (!isBrowser) return fallback;
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function write<T>(key: string, value: T) {
  if (!isBrowser) return;
  try {
    localStorage.setItem(key, JSON.stringify(value));
    window.dispatchEvent(new CustomEvent("scope:store-change", { detail: { key } }));
  } catch {
    // ignore quota errors
  }
}

/* --------------------------- Auth flow --------------------------- */

const AVATAR_COLORS = ["#E63946", "#00D1FF", "#FB923C", "#A78BFA", "#34D399", "#F472B6"];

function newUserFromSignup(input: {
  name: string;
  email: string;
  campus: string;
  interests: string[];
}): ScopeUser {
  return {
    id: `u_${Date.now().toString(36)}`,
    name: input.name || input.email.split("@")[0] || "Builder",
    email: input.email,
    campus: input.campus || "IIT Bombay",
    bio: "",
    skills: [],
    interests: input.interests,
    links: {},
    availability: "Open to collab",
    avatarColor: AVATAR_COLORS[Math.floor(Math.random() * AVATAR_COLORS.length)],
    joinedAt: Date.now(),
  };
}

export const auth = {
  isLoggedIn(): boolean {
    return read<boolean>(KEYS.loggedIn, false);
  },
  getUser(): ScopeUser | null {
    return read<ScopeUser | null>(KEYS.user, null);
  },
  signup(input: { name: string; email: string; campus: string; interests: string[] }) {
    const user = newUserFromSignup(input);
    write(KEYS.user, user);
    write(KEYS.loggedIn, true);
    write(KEYS.points, 120); // welcome bonus
    write(KEYS.streak, 1);
    write(KEYS.streakDate, todayStamp());
    write(KEYS.visits, 1);
    notifications.push({ icon: "spark", text: "Welcome to Scope Connect! +120 XP signup bonus." });
    notifications.push({ icon: "trophy", text: "You're ranked #142 nationally. Climb today." });
    return user;
  },
  login(email: string) {
    const existing = auth.getUser();
    if (existing) {
      write(KEYS.loggedIn, true);
      streak.tick();
      return existing;
    }
    // Auto-create a profile for any login attempt (fake auth).
    return auth.signup({
      name: email.split("@")[0].replace(/[._-]/g, " "),
      email,
      campus: "IIT Bombay",
      interests: ["AI", "Startup"],
    });
  },
  logout() {
    write(KEYS.loggedIn, false);
  },
  updateProfile(patch: Partial<ScopeUser>) {
    const u = auth.getUser();
    if (!u) return null;
    const next = { ...u, ...patch };
    write(KEYS.user, next);
    return next;
  },
};

/* --------------------------- XP / Streak --------------------------- */

function todayStamp() {
  const d = new Date();
  return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
}

export const xp = {
  get(): number {
    return read<number>(KEYS.points, 0);
  },
  add(amount: number, reason?: string) {
    const next = xp.get() + amount;
    write(KEYS.points, next);
    if (reason) notifications.push({ icon: "zap", text: `${reason} · +${amount} XP` });
    return next;
  },
  level(): { name: string; min: number; max: number; next: string } {
    const p = xp.get();
    if (p < 500) return { name: "Explorer", min: 0, max: 500, next: "Builder" };
    if (p < 1500) return { name: "Builder", min: 500, max: 1500, next: "Innovator" };
    if (p < 3500) return { name: "Innovator", min: 1500, max: 3500, next: "Leader" };
    if (p < 6500) return { name: "Leader", min: 3500, max: 6500, next: "Ambassador" };
    return { name: "Ambassador", min: 6500, max: 10000, next: "Legend" };
  },
  levelProgress(): number {
    const { min, max } = xp.level();
    const p = xp.get();
    return Math.min(100, Math.round(((p - min) / (max - min)) * 100));
  },
};

export const streak = {
  count(): number {
    return read<number>(KEYS.streak, 0);
  },
  tick() {
    const today = todayStamp();
    const last = read<string>(KEYS.streakDate, "");
    if (last === today) return streak.count();
    const c = streak.count();
    const yesterday = new Date(Date.now() - 86400000);
    const ystamp = `${yesterday.getFullYear()}-${yesterday.getMonth() + 1}-${yesterday.getDate()}`;
    const next = last === ystamp ? c + 1 : 1;
    write(KEYS.streak, next);
    write(KEYS.streakDate, today);
    if (next > 1) {
      xp.add(50, `Day ${next} login streak`);
    }
    return next;
  },
};

/* --------------------------- Notifications --------------------------- */

const SEED_NOTIFICATIONS: Omit<Notification, "id" | "at" | "read">[] = [
  { icon: "users", text: "Diya Sharma viewed your profile." },
  { icon: "trophy", text: "You climbed to #14 in your campus ranking." },
  { icon: "heart", text: "Your last post earned 12 reactions." },
  { icon: "spark", text: "AI Builders Mumbai posted a new opportunity." },
];

export const notifications = {
  all(): Notification[] {
    return read<Notification[]>(KEYS.notifications, []);
  },
  ensureSeeded() {
    if (!isBrowser) return;
    const list = read<Notification[]>(KEYS.notifications, []);
    if (list.length === 0 && auth.isLoggedIn()) {
      const seeded = SEED_NOTIFICATIONS.map((n, i) => ({
        ...n,
        id: `seed_${i}`,
        at: Date.now() - (i + 1) * 1000 * 60 * 17,
        read: false,
      }));
      write(KEYS.notifications, seeded);
    }
  },
  unread(): number {
    return notifications.all().filter((n) => !n.read).length;
  },
  push(n: Omit<Notification, "id" | "at" | "read">) {
    const list = notifications.all();
    const next: Notification = { ...n, id: `n_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`, at: Date.now(), read: false };
    write(KEYS.notifications, [next, ...list].slice(0, 30));
  },
  markAllRead() {
    const list = notifications.all().map((n) => ({ ...n, read: true }));
    write(KEYS.notifications, list);
  },
};

/* --------------------------- Feed --------------------------- */

// Stable seed — built once at module load, never mutates.
const SEED_FEED: FeedPost[] = seedFeed.map((p, i) => ({
  id: p.id,
  authorId: `seed_${p.id}`,
  author: p.author,
  campus: p.campus,
  time: p.time,
  createdAt: 1700000000000 - i * 1000 * 60 * 30,
  type: p.type,
  content: p.content,
  likes: p.likes,
  comments: p.comments,
  celebrates: p.celebrates,
  commentList: [],
}));

export const feed = {
  all(): FeedPost[] {
    const stored = read<FeedPost[]>(KEYS.feed, []);
    return stored.length > 0 ? stored : SEED_FEED;
  },
  create(content: string, type = "Update") {
    const u = auth.getUser();
    if (!u) return;
    const post: FeedPost = {
      id: `p_${Date.now()}`,
      authorId: u.id,
      author: u.name,
      campus: u.campus,
      time: "now",
      createdAt: Date.now(),
      type,
      content,
      likes: 0,
      comments: 0,
      celebrates: 0,
      commentList: [],
    };
    write(KEYS.feed, [post, ...feed.all()]);
    xp.add(25, "Posted to feed");
    return post;
  },
  toggleLike(id: string) {
    const list = feed.all().map((p) => {
      if (p.id !== id) return p;
      const liked = !p.userLiked;
      return { ...p, userLiked: liked, likes: p.likes + (liked ? 1 : -1) };
    });
    write(KEYS.feed, list);
  },
  toggleCelebrate(id: string) {
    const list = feed.all().map((p) => {
      if (p.id !== id) return p;
      const c = !p.userCelebrated;
      return { ...p, userCelebrated: c, celebrates: p.celebrates + (c ? 1 : -1) };
    });
    write(KEYS.feed, list);
  },
  comment(id: string, text: string) {
    const u = auth.getUser();
    const list = feed.all().map((p) => {
      if (p.id !== id) return p;
      const cm = { id: `c_${Date.now()}`, author: u?.name ?? "You", text, at: Date.now() };
      return { ...p, comments: p.comments + 1, commentList: [...(p.commentList ?? []), cm] };
    });
    write(KEYS.feed, list);
  },
};

/* --------------------------- Projects --------------------------- */

const SEED_PROJECTS: Project[] = featuredProjects.map((p, i) => ({
  id: `seed_p_${i}`,
  authorId: `seed_${i}`,
  author: p.team,
  campus: p.team,
  title: p.title,
  description: p.description,
  problem: "Solving a real campus / industry pain.",
  team: p.team,
  category: p.category,
  votes: p.votes,
  cover: p.cover,
  createdAt: 1700000000000 - (i + 1) * 86400000,
}));

export const projects = {
  all(): Project[] {
    const stored = read<Project[]>(KEYS.projects, []);
    return stored.length > 0 ? stored : SEED_PROJECTS;
  },
  create(input: Omit<Project, "id" | "authorId" | "author" | "campus" | "votes" | "createdAt" | "cover"> & { cover?: string }) {
    const u = auth.getUser();
    if (!u) return;
    const p: Project = {
      ...input,
      id: `p_${Date.now()}`,
      authorId: u.id,
      author: u.name,
      campus: u.campus,
      votes: 1,
      cover: input.cover || "🚀",
      createdAt: Date.now(),
      userVoted: true,
    };
    write(KEYS.projects, [p, ...projects.all()]);
    xp.add(50, "Project launched");
    notifications.push({ icon: "spark", text: `Builders are viewing "${p.title}".` });
    return p;
  },
  vote(id: string) {
    const list = projects.all().map((p) => {
      if (p.id !== id) return p;
      const v = !p.userVoted;
      return { ...p, userVoted: v, votes: p.votes + (v ? 1 : -1) };
    });
    write(KEYS.projects, list);
  },
};

/* --------------------------- Events --------------------------- */

const SEED_EVENTS: EventItem[] = upcomingEvents.map((e, i) => ({
  id: `evt_${i}`,
  title: e.title,
  type: e.type,
  date: e.date,
  venue: e.venue,
  seats: e.seats,
  color: e.color,
  startsAt: Date.now() + (i + 1) * 86400000 * (3 + i * 2),
}));

export const events = {
  all(): EventItem[] {
    return SEED_EVENTS;
  },
  rsvps(): string[] {
    return read<string[]>(KEYS.rsvps, []);
  },
  toggleRsvp(id: string) {
    const cur = events.rsvps();
    const has = cur.includes(id);
    const next = has ? cur.filter((x) => x !== id) : [...cur, id];
    write(KEYS.rsvps, next);
    if (!has) {
      xp.add(30, "Event RSVP confirmed");
      notifications.push({ icon: "trophy", text: "Seat reserved. You're on the builders list." });
    }
    return next;
  },
};

/* --------------------------- Opportunities --------------------------- */

const SEED_OPPS: Opportunity[] = [
  { id: "o_1", title: "Need UI Designer for HealthTech MVP", by: "MediMatch AI", campus: "IIT Bombay", category: "Design", description: "Design 8 mobile screens. 2-week sprint. Equity available.", match: 92 },
  { id: "o_2", title: "React Developer — Campus Marketplace", by: "CampusDAO", campus: "BITS Pilani", category: "Engineering", description: "Build storefront + cart with Tailwind & Supabase.", match: 88 },
  { id: "o_3", title: "Co-founder wanted — EdTech for Tier-3", by: "Diya Sharma", campus: "BITS Pilani", category: "Founder", description: "Looking for a technical co-founder, 50/50 equity.", match: 81 },
  { id: "o_4", title: "Pitch Deck Expert — YC application", by: "Layerly", campus: "Recruiter", category: "Pitch", description: "Polish a 10-slide deck for YC W26 application.", match: 76 },
  { id: "o_5", title: "Marketing Lead for hackathon launch", by: "Sprintly", campus: "ContentCo Hyderabad", category: "Marketing", description: "Drive registrations for Scope Hack '26.", match: 71 },
  { id: "o_6", title: "Python ML engineer for swarm sim", by: "RoboTrichy", campus: "NIT Trichy", category: "Engineering", description: "Help train swarm RL models on a 2-week timeline.", match: 68 },
];

export const opportunities = {
  all(): Opportunity[] {
    return SEED_OPPS;
  },
  saved(): string[] {
    return read<string[]>(KEYS.savedOpps, []);
  },
  interested(): string[] {
    return read<string[]>(KEYS.interestedOpps, []);
  },
  toggleSave(id: string) {
    const cur = opportunities.saved();
    const next = cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id];
    write(KEYS.savedOpps, next);
    return next;
  },
  markInterested(id: string) {
    const cur = opportunities.interested();
    if (cur.includes(id)) return cur;
    const next = [...cur, id];
    write(KEYS.interestedOpps, next);
    xp.add(15, "Interest sent");
    notifications.push({ icon: "users", text: "Request sent. Strong match detected." });
    return next;
  },
};

/* --------------------------- Chapter --------------------------- */

export const chapter = {
  joined(): string | null {
    return read<string | null>(KEYS.joinedChapter, null);
  },
  join(name: string) {
    write(KEYS.joinedChapter, name);
    xp.add(40, `Joined ${name}`);
    notifications.push({ icon: "users", text: `Welcome to ${name}. Say hi to your chapter.` });
  },
};

/* --------------------------- Profile strength --------------------------- */

export function profileStrength(u: ScopeUser | null): number {
  if (!u) return 0;
  let score = 20; // base for account
  if (u.bio.length > 20) score += 15;
  if (u.skills.length >= 3) score += 15;
  if (u.interests.length >= 3) score += 10;
  if (u.links.website || u.links.github) score += 15;
  if (u.availability) score += 10;
  if (projects.all().some((p) => p.authorId === u.id)) score += 15;
  return Math.min(100, score);
}

/* --------------------------- Leaderboard --------------------------- */

export type LeaderRow = { id: string; name: string; sub: string; value: number; isMe?: boolean };

export function memberLeaderboard(): LeaderRow[] {
  const seeded: LeaderRow[] = topBuilders.map((b) => ({
    id: b.name,
    name: b.name,
    sub: `${b.campus} · ${b.level}`,
    value: b.points,
  }));
  const u = auth.getUser();
  if (u) {
    seeded.push({
      id: u.id,
      name: u.name,
      sub: `${u.campus} · ${xp.level().name}`,
      value: xp.get(),
      isMe: true,
    });
  }
  return seeded.sort((a, b) => b.value - a.value);
}

export function chapterLeaderboard(): LeaderRow[] {
  return topChapters
    .map((c) => ({ id: c.name, name: c.name, sub: c.campus, value: c.members }))
    .sort((a, b) => b.value - a.value);
}

export function campusLeaderboard(): LeaderRow[] {
  return campusPartners
    .map((c) => ({ id: c.name, name: c.name, sub: c.city, value: c.members }))
    .sort((a, b) => b.value - a.value);
}

/* --------------------------- Misc --------------------------- */

export const meta = {
  bumpVisit() {
    if (!isBrowser) return;
    const v = read<number>(KEYS.visits, 0) + 1;
    write(KEYS.visits, v);
    write(KEYS.lastSeen, Date.now());
  },
  visits() {
    return read<number>(KEYS.visits, 0);
  },
  resetAll() {
    if (!isBrowser) return;
    Object.values(KEYS).forEach((k) => localStorage.removeItem(k));
    window.dispatchEvent(new CustomEvent("scope:store-change", { detail: { key: "*" } }));
  },
};

export const seedInterests = interestTags;

/* --------------------------- React subscription --------------------------- */

export function subscribe(cb: () => void): () => void {
  if (!isBrowser) return () => {};
  const handler = () => cb();
  window.addEventListener("scope:store-change", handler);
  window.addEventListener("storage", handler);
  return () => {
    window.removeEventListener("scope:store-change", handler);
    window.removeEventListener("storage", handler);
  };
}

/* ===================================================================== */
/* CURATED OPPORTUNITY MODEL — Phase 2                                    */
/* ===================================================================== */

export type OpportunityScope = "scope" | "campus" | "open";
export type OpportunityStatus = "live" | "closing-soon" | "closed";
export type Difficulty = "Beginner" | "Intermediate" | "Advanced";

export type CuratedProject = {
  id: string;
  scope: OpportunityScope;
  title: string;
  category: string;
  difficulty: Difficulty;
  seatsTotal: number;
  seatsFilled: number;
  timeline: string;
  skills: string[];
  description: string;
  rewards: string;
  status: OpportunityStatus;
  campus?: string;
  cover: string;
  postedBy: string;
  postedAt: number;
};

export type Application = {
  id: string;
  projectId: string;
  userId: string;
  fit: string;
  topSkill: string;
  availability: string;
  status: "Under Review" | "Shortlisted" | "Accepted" | "Waitlisted" | "Closed";
  at: number;
};

export type PortfolioItem = {
  id: string;
  userId: string;
  type: "Project" | "Design" | "Research" | "Startup Idea" | "Campaign" | "Certificate";
  title: string;
  description: string;
  skills: string[];
  link?: string;
  cover: string;
  createdAt: number;
};

export type IdeaSubmission = {
  id: string;
  userId: string | null;
  title: string;
  problem: string;
  why: string;
  teamSkills: string;
  campusRelevance: string;
  anonymous: boolean;
  at: number;
};

const SEED_CURATED: CuratedProject[] = [
  {
    id: "sc_1", scope: "scope", title: "Build the AI Student Assistant",
    category: "AI", difficulty: "Advanced", seatsTotal: 8, seatsFilled: 5,
    timeline: "6 weeks", skills: ["React", "LLM APIs", "Product Design"],
    description: "Ship a Gen-Z campus assistant that answers academic, career and event queries. Selected builders get featured nationally.",
    rewards: "₹25k stipend · Scope Spotlight · Letter of Recommendation",
    status: "live", cover: "🤖", postedBy: "Scope Official", postedAt: Date.now() - 86400000 * 2,
  },
  {
    id: "sc_2", scope: "scope", title: "Launch the Chapter Growth Campaign",
    category: "Marketing", difficulty: "Intermediate", seatsTotal: 12, seatsFilled: 9,
    timeline: "4 weeks", skills: ["Content", "Community", "Design"],
    description: "Drive 10,000 new builder signups across 50 campuses. Real campaign, real metrics, real impact.",
    rewards: "₹15k stipend · Campus Leader badge · 500 XP",
    status: "live", cover: "📣", postedBy: "Scope Official", postedAt: Date.now() - 86400000 * 4,
  },
  {
    id: "sc_3", scope: "scope", title: "Create the National Innovation Magazine",
    category: "Editorial", difficulty: "Intermediate", seatsTotal: 10, seatsFilled: 3,
    timeline: "8 weeks", skills: ["Writing", "Editorial", "Design"],
    description: "Curate India's first student-led innovation publication. Print + digital, distributed to 100+ campuses.",
    rewards: "Published byline · ₹10k honorarium · Editorial badge",
    status: "live", cover: "📰", postedBy: "Scope Official", postedAt: Date.now() - 86400000,
  },
  {
    id: "sc_4", scope: "scope", title: "Design the Scope Connect Mobile App",
    category: "Design", difficulty: "Advanced", seatsTotal: 5, seatsFilled: 4,
    timeline: "5 weeks", skills: ["Figma", "Mobile UX", "Prototyping"],
    description: "Lead the visual system for Scope Connect's iOS + Android app. Your work ships to 50,000+ builders.",
    rewards: "Portfolio feature · ₹20k · Founding Designer credit",
    status: "closing-soon", cover: "🎨", postedBy: "Scope Official", postedAt: Date.now() - 86400000 * 6,
  },
];

const SEED_CAMPUS: CuratedProject[] = [
  {
    id: "cp_1", scope: "campus", title: "IIT Bombay Hackathon Ops Team",
    category: "Operations", difficulty: "Beginner", seatsTotal: 15, seatsFilled: 8,
    timeline: "3 weeks", skills: ["Coordination", "Logistics"],
    description: "Run the campus-wide hackathon. Manage logistics, sponsors, and judging panels.",
    rewards: "Chapter Priority badge · 300 XP · Certificate",
    status: "live", campus: "IIT Bombay", cover: "🏫", postedBy: "Scope · IIT Bombay Chapter", postedAt: Date.now() - 86400000 * 3,
  },
  {
    id: "cp_2", scope: "campus", title: "BITS Pilani Startup Cell — Founding Member",
    category: "Startup", difficulty: "Intermediate", seatsTotal: 6, seatsFilled: 2,
    timeline: "Ongoing", skills: ["Strategy", "Outreach"],
    description: "Help build the BITS Pilani founding startup cell from scratch with Scope's playbook.",
    rewards: "Founding Member title · Mentor access · 400 XP",
    status: "live", campus: "BITS Pilani", cover: "🚀", postedBy: "Scope · BITS Pilani Chapter", postedAt: Date.now() - 86400000 * 2,
  },
  {
    id: "cp_3", scope: "campus", title: "NIT Trichy Robotics Sprint",
    category: "Robotics", difficulty: "Advanced", seatsTotal: 8, seatsFilled: 6,
    timeline: "4 weeks", skills: ["ROS", "Python", "Hardware"],
    description: "Build a swarm of 5 autonomous bots for the national Robotics Showcase.",
    rewards: "Hardware kit provided · ₹12k team prize · Showcase feature",
    status: "live", campus: "NIT Trichy", cover: "🤖", postedBy: "Scope · NIT Trichy Chapter", postedAt: Date.now() - 86400000 * 5,
  },
];

const SEED_OPEN: CuratedProject[] = [
  {
    id: "op_1", scope: "open", title: "Open Research: Mental Health on Indian Campuses",
    category: "Research", difficulty: "Intermediate", seatsTotal: 20, seatsFilled: 11,
    timeline: "6 weeks", skills: ["Research", "Survey Design", "Writing"],
    description: "Co-author India's largest student mental health report. Open to any verified builder.",
    rewards: "Research credit · 350 XP · Published report",
    status: "live", cover: "🧠", postedBy: "Scope Official", postedAt: Date.now() - 86400000 * 7,
  },
  {
    id: "op_2", scope: "open", title: "Open Build: Climate Action Dashboard",
    category: "Engineering", difficulty: "Intermediate", seatsTotal: 10, seatsFilled: 4,
    timeline: "5 weeks", skills: ["Next.js", "Data Viz", "APIs"],
    description: "Build an open-source dashboard tracking campus climate initiatives across India.",
    rewards: "Open-source credit · 400 XP · GitHub spotlight",
    status: "live", cover: "🌍", postedBy: "Scope Official", postedAt: Date.now() - 86400000 * 4,
  },
  {
    id: "op_3", scope: "open", title: "Open Pitch: Scope Founder Track 2026",
    category: "Founder", difficulty: "Advanced", seatsTotal: 25, seatsFilled: 18,
    timeline: "12 weeks", skills: ["Vision", "Execution"],
    description: "Pitch your startup idea. Top 5 get incubation support, mentor access and demo day.",
    rewards: "₹2L incubation pool · Mentor network · Demo Day",
    status: "closing-soon", cover: "💡", postedBy: "Scope Official", postedAt: Date.now() - 86400000 * 10,
  },
];

const ALL_CURATED = [...SEED_CURATED, ...SEED_CAMPUS, ...SEED_OPEN];

export const curated = {
  scopeChallenges(): CuratedProject[] { return SEED_CURATED; },
  campusFor(campus: string | null): CuratedProject[] {
    if (!campus) return SEED_CAMPUS;
    return SEED_CAMPUS.filter((p) => p.campus === campus);
  },
  openProjects(): CuratedProject[] { return SEED_OPEN; },
  byId(id: string): CuratedProject | undefined { return ALL_CURATED.find((p) => p.id === id); },
  all(): CuratedProject[] { return ALL_CURATED; },
};

export const applications = {
  all(): Application[] { return read<Application[]>(KEYS.applications, []); },
  forUser(userId: string): Application[] { return applications.all().filter((a) => a.userId === userId); },
  hasApplied(projectId: string, userId: string): boolean {
    return applications.all().some((a) => a.projectId === projectId && a.userId === userId);
  },
  apply(input: { projectId: string; fit: string; topSkill: string; availability: string }) {
    const u = auth.getUser();
    if (!u) return null;
    if (applications.hasApplied(input.projectId, u.id)) return null;
    const project = curated.byId(input.projectId);
    const app: Application = {
      id: `app_${Date.now()}`, projectId: input.projectId, userId: u.id,
      fit: input.fit, topSkill: input.topSkill, availability: input.availability,
      status: "Under Review", at: Date.now(),
    };
    write(KEYS.applications, [app, ...applications.all()]);
    xp.add(20, "Application sent");
    notifications.push({ icon: "spark", text: `Application received for "${project?.title ?? "project"}". Review within 48h.` });
    return app;
  },
};

export const savedProjects = {
  all(): string[] { return read<string[]>(KEYS.savedProjects, []); },
  toggle(id: string) {
    const cur = savedProjects.all();
    const next = cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id];
    write(KEYS.savedProjects, next);
    return next;
  },
};

export const portfolio = {
  all(): PortfolioItem[] { return read<PortfolioItem[]>(KEYS.portfolio, []); },
  forUser(userId: string): PortfolioItem[] { return portfolio.all().filter((p) => p.userId === userId); },
  create(input: Omit<PortfolioItem, "id" | "userId" | "createdAt">) {
    const u = auth.getUser();
    if (!u) return null;
    const item: PortfolioItem = { ...input, id: `pf_${Date.now()}`, userId: u.id, createdAt: Date.now() };
    write(KEYS.portfolio, [item, ...portfolio.all()]);
    xp.add(30, "Portfolio item added");
    notifications.push({ icon: "trophy", text: `"${item.title}" added to your portfolio.` });
    return item;
  },
  update(id: string, patch: Partial<Omit<PortfolioItem, "id" | "userId" | "createdAt">>) {
    write(KEYS.portfolio, portfolio.all().map((p) => (p.id === id ? { ...p, ...patch } : p)));
  },
  remove(id: string) {
    write(KEYS.portfolio, portfolio.all().filter((p) => p.id !== id));
  },
  strength(userId: string): number {
    const count = portfolio.forUser(userId).length;
    if (count === 0) return 0;
    if (count >= 6) return 100;
    return Math.min(100, 25 + count * 15);
  },
};

export const ideaSubmissions = {
  all(): IdeaSubmission[] { return read<IdeaSubmission[]>(KEYS.ideaSubmissions, []); },
  submit(input: Omit<IdeaSubmission, "id" | "userId" | "at">) {
    const u = auth.getUser();
    const item: IdeaSubmission = {
      ...input, id: `idea_${Date.now()}`,
      userId: input.anonymous ? null : (u?.id ?? null), at: Date.now(),
    };
    write(KEYS.ideaSubmissions, [item, ...ideaSubmissions.all()]);
    xp.add(15, "Idea submitted to Scope");
    notifications.push({ icon: "spark", text: "Your idea reached the Scope team. We review every submission." });
    return item;
  },
};
