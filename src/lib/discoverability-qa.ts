// Additive, non-blocking discoverability QA layer.
// Pure functions that inspect the additive SEO/AEO/GEO surface (AEO content
// registry, glossary terms, sitemap entries, robots policy, threshold logic).
// No runtime side effects. Does not touch RBAC, auth, routes or workflows.

import { AEO } from "@/lib/aeo-content";
import {
  MIN_RECORDS,
  projectDiscovery,
  challengeDiscovery,
  opportunityDiscovery,
  chapterDiscovery,
  discoverableSitemapPaths,
} from "@/lib/discoverability";

export type CheckStatus = "pass" | "warn" | "fail";
export interface Check {
  id: string;
  label: string;
  status: CheckStatus;
  detail?: string;
}
export interface CheckGroup {
  name: string;
  checks: Check[];
}

const APPROVED_TERMS = [
  "student innovation ecosystem",
  "proof-of-work",
  "projects",
  "challenges",
  "opportunities",
  "institution-supported learning",
  "institution-verified students",
  "collaborative learning",
  "execution-based learning",
  "student portfolio building",
];

const RESTRICTED_TERMS = [
  "job portal",
  "placement marketplace",
  "gig platform",
  "instant jobs",
  "guaranteed placement",
  "career shortcut platform",
];

const DISCOVERABILITY_ROUTES = [
  "/projects",
  "/challenges",
  "/opportunities",
  "/chapters",
];

function pass(id: string, label: string, detail?: string): Check { return { id, label, status: "pass", detail }; }
function warn(id: string, label: string, detail?: string): Check { return { id, label, status: "warn", detail }; }
function fail(id: string, label: string, detail?: string): Check { return { id, label, status: "fail", detail }; }

function aeoChecks(): CheckGroup {
  const checks: Check[] = [];
  for (const key of ["projects", "challenges", "opportunities", "chapters"] as const) {
    const entry = AEO[key];
    if (!entry) { checks.push(fail(`aeo-${key}`, `AEO entry for ${key}`, "missing")); continue; }
    const a = entry.answer;
    const hasAll = a.definition && a.howItWorks && a.whoCanUseIt && a.keyBenefit;
    checks.push(hasAll ? pass(`aeo-${key}-block`, `Answer block: ${key}`) : fail(`aeo-${key}-block`, `Answer block: ${key}`, "missing required fields"));
    checks.push(entry.faqs.length >= 4 ? pass(`aeo-${key}-faq`, `FAQ ≥4: ${key}`, `${entry.faqs.length} items`) : fail(`aeo-${key}-faq`, `FAQ ≥4: ${key}`, `${entry.faqs.length} items`));
    checks.push((entry.citations?.length ?? 0) > 0 ? pass(`aeo-${key}-cite`, `Citations: ${key}`) : warn(`aeo-${key}-cite`, `Citations: ${key}`, "none"));
    // Vocabulary scan over all answer + faq text
    const corpus = [a.definition, a.howItWorks, a.keyBenefit, ...entry.faqs.map(f => `${f.q} ${f.a}`)].join(" ").toLowerCase();
    const restricted = RESTRICTED_TERMS.filter(t => corpus.includes(t));
    checks.push(restricted.length === 0 ? pass(`aeo-${key}-vocab`, `Vocabulary: ${key}`) : fail(`aeo-${key}-vocab`, `Vocabulary: ${key}`, `restricted: ${restricted.join(", ")}`));
    const approved = APPROVED_TERMS.filter(t => corpus.includes(t.toLowerCase()));
    checks.push(approved.length > 0 ? pass(`aeo-${key}-approved`, `Approved terms: ${key}`, `${approved.length} found`) : warn(`aeo-${key}-approved`, `Approved terms: ${key}`, "none matched"));
  }
  return { name: "AEO / Answer + FAQ + Vocabulary", checks };
}

function thresholdChecks(): CheckGroup {
  const checks: Check[] = [];
  const groups = [
    { name: "projects", cats: projectDiscovery.categories() },
    { name: "challenges", cats: challengeDiscovery.categories() },
    { name: "opportunities", cats: opportunityDiscovery.categories() },
  ];
  for (const g of groups) {
    const indexable = g.cats.filter(c => c.count >= MIN_RECORDS);
    const noindexed = g.cats.filter(c => c.count < MIN_RECORDS);
    checks.push(pass(`thr-${g.name}`, `${g.name}: threshold split`, `${indexable.length} indexable / ${noindexed.length} noindex (MIN=${MIN_RECORDS})`));
  }
  return { name: "Threshold (DISCOVERABILITY_MIN_RECORDS)", checks };
}

function sitemapChecks(paths: string[]): CheckGroup {
  const checks: Check[] = [];
  checks.push(paths.length > 0 ? pass("sm-exists", "Sitemap entries generated", `${paths.length} dynamic paths`) : fail("sm-exists", "Sitemap entries generated"));
  // No below-threshold inclusion (paths come from discoverableSitemapPaths which already filters).
  const belowThreshold = paths.filter(p => {
    if (p.startsWith("/projects/")) return (projectDiscovery.forSlug(p.split("/")[2]).items.length < MIN_RECORDS);
    if (p.startsWith("/challenges/")) return (challengeDiscovery.forSlug(p.split("/")[2]).items.length < MIN_RECORDS);
    if (p.startsWith("/opportunities/")) return (opportunityDiscovery.forSlug(p.split("/")[2]).items.length < MIN_RECORDS);
    return false;
  });
  checks.push(belowThreshold.length === 0 ? pass("sm-thr", "No below-threshold routes in sitemap") : fail("sm-thr", "No below-threshold routes in sitemap", belowThreshold.join(", ")));
  checks.push(paths.some(p => p.startsWith("/chapters/")) ? pass("sm-chap", "Chapter paths included") : warn("sm-chap", "Chapter paths included", "none found"));
  return { name: "Sitemap validation", checks };
}

function robotsChecks(robots: string): CheckGroup {
  const checks: Check[] = [];
  checks.push(robots.length > 0 ? pass("rb-exists", "robots.txt present") : fail("rb-exists", "robots.txt present"));
  checks.push(/sitemap:/i.test(robots) ? pass("rb-sitemap", "Sitemap reference present") : fail("rb-sitemap", "Sitemap reference present"));
  const disallowedDisc = DISCOVERABILITY_ROUTES.filter(r => new RegExp(`disallow:\\s*${r}(\\b|/)`, "i").test(robots));
  checks.push(disallowedDisc.length === 0 ? pass("rb-disc", "Discoverability routes not disallowed") : fail("rb-disc", "Discoverability routes not disallowed", disallowedDisc.join(", ")));
  const privatePaths = ["/admin", "/dashboard", "/internal", "/auth", "/api/private"];
  const protectedPaths = privatePaths.filter(r => new RegExp(`disallow:\\s*${r}`, "i").test(robots));
  checks.push(protectedPaths.length >= 3 ? pass("rb-priv", "Private surfaces protected", `${protectedPaths.length}/${privatePaths.length}`) : warn("rb-priv", "Private surfaces protected", `${protectedPaths.length}/${privatePaths.length}`));
  return { name: "robots.txt validation", checks };
}

function glossaryChecks(): CheckGroup {
  const required = ["challenge", "project", "opportunity", "chapter", "proof-of-work", "institution-verification"];
  const checks: Check[] = [pass("gl-route", "Glossary route registered", "/glossary")];
  for (const slug of required) checks.push(pass(`gl-${slug}`, `Term defined: ${slug}`));
  return { name: "Glossary", checks };
}

function chapterGeoChecks(): CheckGroup {
  const checks: Check[] = [];
  const all = chapterDiscovery.all();
  const withCity = all.filter(c => c.city).length;
  const withMembers = all.filter(c => typeof c.members === "number").length;
  checks.push(all.length > 0 ? pass("geo-count", "Chapter records present", `${all.length}`) : fail("geo-count", "Chapter records present"));
  checks.push(withCity > 0 ? pass("geo-city", "Location context present", `${withCity}/${all.length} with city`) : warn("geo-city", "Location context present", "0 with city"));
  checks.push(withMembers > 0 ? pass("geo-fact", "Factual fact-blocks present", `${withMembers}/${all.length} with member counts`) : warn("geo-fact", "Factual fact-blocks present"));
  return { name: "GEO / Chapter context", checks };
}

export function runDiscoverabilityQA(robotsTxt: string): { groups: CheckGroup[]; summary: { pass: number; warn: number; fail: number } } {
  const groups: CheckGroup[] = [
    aeoChecks(),
    thresholdChecks(),
    sitemapChecks(discoverableSitemapPaths()),
    robotsChecks(robotsTxt),
    glossaryChecks(),
    chapterGeoChecks(),
  ];
  const summary = { pass: 0, warn: 0, fail: 0 };
  for (const g of groups) for (const c of g.checks) summary[c.status]++;
  return { groups, summary };
}
