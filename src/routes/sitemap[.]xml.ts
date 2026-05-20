import { createFileRoute } from "@tanstack/react-router";
import type {} from "@tanstack/react-start";
import { discoverableSitemapPaths } from "@/lib/discoverability";

// TODO: replace with your project URL once a custom domain is set.
const BASE_URL = "";

type Entry = { path: string; priority: string; changefreq: string };

const STATIC_ENTRIES: Entry[] = [
  { path: "/", priority: "1.0", changefreq: "daily" },
  { path: "/about", priority: "0.6", changefreq: "monthly" },
  { path: "/contact", priority: "0.6", changefreq: "monthly" },
  { path: "/privacy", priority: "0.6", changefreq: "monthly" },
  { path: "/terms", priority: "0.6", changefreq: "monthly" },
  { path: "/cookie-policy", priority: "0.6", changefreq: "monthly" },
  { path: "/faqs", priority: "0.6", changefreq: "monthly" },
  { path: "/innovation-lab", priority: "0.7", changefreq: "weekly" },
  { path: "/projects", priority: "0.7", changefreq: "weekly" },
  { path: "/challenges", priority: "0.7", changefreq: "weekly" },
  { path: "/opportunities", priority: "0.7", changefreq: "weekly" },
  { path: "/community-guidelines", priority: "0.6", changefreq: "monthly" },
  { path: "/support", priority: "0.6", changefreq: "monthly" },
  { path: "/glossary", priority: "0.6", changefreq: "monthly" },
];

function classify(path: string): Entry {
  if (path.startsWith("/chapters/")) return { path, priority: "0.8", changefreq: "weekly" };
  return { path, priority: "0.7", changefreq: "weekly" };
}

export const Route = createFileRoute("/sitemap.xml")({
  server: {
    handlers: {
      GET: async () => {
        const dynamic = discoverableSitemapPaths().map(classify);
        const all = [...STATIC_ENTRIES, ...dynamic];
        const urls = all
          .map(
            (e) =>
              `  <url>\n    <loc>${BASE_URL}${e.path}</loc>\n    <changefreq>${e.changefreq}</changefreq>\n    <priority>${e.priority}</priority>\n  </url>`,
          )
          .join("\n");
        const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>`;
        return new Response(xml, {
          headers: { "Content-Type": "application/xml", "Cache-Control": "public, max-age=3600" },
        });
      },
    },
  },
});
