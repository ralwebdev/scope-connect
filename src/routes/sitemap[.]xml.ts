import { createFileRoute } from "@tanstack/react-router";
import type {} from "@tanstack/react-start";
import { discoverableSitemapPaths } from "@/lib/discoverability";

const BASE_URL = "";

const STATIC_PATHS = [
  "/",
  "/about",
  "/contact",
  "/privacy",
  "/terms",
  "/cookie-policy",
  "/faqs",
  "/innovation-lab",
  "/projects",
  "/challenges",
  "/opportunities",
  "/community-guidelines",
  "/support",
];

export const Route = createFileRoute("/sitemap.xml")({
  server: {
    handlers: {
      GET: async () => {
        const all = [...STATIC_PATHS, ...discoverableSitemapPaths()];
        const urls = all
          .map((p) => `  <url><loc>${BASE_URL}${p}</loc><changefreq>weekly</changefreq></url>`)
          .join("\n");
        const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>`;
        return new Response(xml, {
          headers: { "Content-Type": "application/xml", "Cache-Control": "public, max-age=3600" },
        });
      },
    },
  },
});
