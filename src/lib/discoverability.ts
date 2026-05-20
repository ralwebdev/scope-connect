// Phase 2 discoverability helpers.
// Pure read-only utilities over existing seed/store data. No new entities,
// no schema changes. Safe to call from SSR (falls back to seed when
// localStorage is absent).

import { projects, opportunities, curated } from "@/lib/scope-store";
import { topChapters, campusPartners, featuredProjects } from "@/lib/mock-data";

/** Minimum records required for a discoverability page to render content. */
export const MIN_RECORDS = 5;

export function slugify(input: string): string {
  return String(input)
    .toLowerCase()
    .trim()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/** Generic category filter on a list with a `category` field. */
function byCategorySlug<T extends { category?: string }>(list: T[], slug: string): T[] {
  return list.filter((x) => x.category && slugify(x.category) === slug);
}

/** Unique category slugs (with labels) on a list. */
function uniqueCategories<T extends { category?: string }>(list: T[]): { slug: string; label: string; count: number }[] {
  const map = new Map<string, { slug: string; label: string; count: number }>();
  for (const item of list) {
    if (!item.category) continue;
    const slug = slugify(item.category);
    const existing = map.get(slug);
    if (existing) existing.count += 1;
    else map.set(slug, { slug, label: item.category, count: 1 });
  }
  return [...map.values()].sort((a, b) => b.count - a.count);
}

/* --------------------------- Projects --------------------------- */

export const projectDiscovery = {
  categories: () => uniqueCategories(projects.all()),
  forSlug: (slug: string) => {
    const items = byCategorySlug(projects.all(), slug);
    const cat = projectDiscovery.categories().find((c) => c.slug === slug);
    return { label: cat?.label ?? slug, items };
  },
};

/* --------------------------- Challenges --------------------------- */

export const challengeDiscovery = {
  categories: () => uniqueCategories(curated.all()),
  forSlug: (slug: string) => {
    const items = byCategorySlug(curated.all(), slug);
    const cat = challengeDiscovery.categories().find((c) => c.slug === slug);
    return { label: cat?.label ?? slug, items };
  },
};

/* --------------------------- Opportunities --------------------------- */

export const opportunityDiscovery = {
  categories: () => uniqueCategories(opportunities.all()),
  forSlug: (slug: string) => {
    const items = byCategorySlug(opportunities.all(), slug);
    const cat = opportunityDiscovery.categories().find((c) => c.slug === slug);
    return { label: cat?.label ?? slug, items };
  },
};

/* --------------------------- Chapters --------------------------- */

export type ChapterRecord = {
  slug: string;
  name: string;
  city?: string;
  members?: number;
  chapterName?: string;
  rank?: number;
};

export const chapterDiscovery = {
  all(): ChapterRecord[] {
    // Merge campus partners + named chapters → unique by institution slug.
    const map = new Map<string, ChapterRecord>();
    for (const c of campusPartners) {
      const slug = slugify(c.name);
      map.set(slug, { slug, name: c.name, city: c.city, members: c.members });
    }
    for (const ch of topChapters) {
      const slug = slugify(ch.campus);
      const existing = map.get(slug);
      if (existing) existing.chapterName = ch.name;
      else map.set(slug, { slug, name: ch.campus, chapterName: ch.name, members: ch.members, rank: ch.rank });
    }
    return [...map.values()];
  },
  bySlug(slug: string): ChapterRecord | undefined {
    return chapterDiscovery.all().find((c) => c.slug === slug);
  },
  activityFor(slug: string) {
    const record = chapterDiscovery.bySlug(slug);
    if (!record) return { projects: [], challenges: [], opportunities: [], stats: { projectCount: 0, challengeCount: 0, students: 0 } };
    // Heuristic match: existing data uses campus/team strings. Match by name substring.
    const name = record.name;
    const matchedProjects = projects.all().filter((p) => (p.campus || "").includes(name) || (p.team || "").includes(name));
    const matchedChallenges = curated.all().filter((c) => (c.campus || "").includes(name));
    const matchedOpps = opportunities.all().filter((o) => (o.campus || "").includes(name));
    return {
      projects: matchedProjects,
      challenges: matchedChallenges,
      opportunities: matchedOpps,
      stats: {
        projectCount: matchedProjects.length,
        challengeCount: matchedChallenges.length,
        students: record.members ?? 0,
      },
    };
  },
};

/* --------------------------- Sitemap helpers --------------------------- */

/** Static-time enumeration of discoverable slugs that meet the threshold.
 * Uses SEED data only (no localStorage), safe for server route execution. */
export function discoverableSitemapPaths(): string[] {
  const paths: string[] = [];
  // Projects (seed-derived)
  for (const c of uniqueCategories(featuredProjects.map((p) => ({ category: p.category })))) {
    if (c.count >= MIN_RECORDS) paths.push(`/projects/${c.slug}`);
  }
  for (const c of challengeDiscovery.categories()) {
    if (c.count >= MIN_RECORDS) paths.push(`/challenges/${c.slug}`);
  }
  for (const c of opportunityDiscovery.categories()) {
    if (c.count >= MIN_RECORDS) paths.push(`/opportunities/${c.slug}`);
  }
  for (const ch of chapterDiscovery.all()) {
    paths.push(`/chapters/${ch.slug}`);
  }
  return paths;
}
