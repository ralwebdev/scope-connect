import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Handshake, Building2, Briefcase, Sparkles, HeartHandshake, GraduationCap, Megaphone, Users, BookOpen } from "lucide-react";
import { AppShell } from "@/components/site/AppShell";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { FAQSection, type FAQItem } from "@/components/site/FAQSection";
import { AnswerBlock } from "@/components/seo/AnswerBlock";
import { toast } from "sonner";

const PARTNER_TYPES = [
  "Institution Partner",
  "Recruitment Partner",
  "Industry Partner",
  "Innovation Partner",
  "CSR Partner",
  "Assessment Partner",
  "Media Partner",
  "Training Partner",
  "Community Partner",
] as const;

type PartnerType = (typeof PARTNER_TYPES)[number];

const FAQS: FAQItem[] = [
  { q: "Who can partner with Scope Connect?", a: "Institutions, recruiters, industry partners, CSR sponsors, training providers, assessment platforms, media houses and community organizations working with student talent." },
  { q: "How do institutions collaborate?", a: "Institutions onboard as verified partners — get a chapter, faculty coordinator access, moderation tools and chapter analytics for projects, internships and innovation programs." },
  { q: "Can recruiters partner for hiring?", a: "Yes. Recruitment partners get curated access to verified student builders by domain, trust score and proof-of-work portfolio, with optional campus hiring drives." },
  { q: "How do industry partnerships work?", a: "Industry partners sponsor challenges, mentor projects, run innovation tracks or fund CSR-backed student programs scoped to specific outcomes." },
];

const CATEGORIES: { type: PartnerType; icon: React.ComponentType<{ className?: string }>; desc: string }[] = [
  { type: "Institution Partner", icon: GraduationCap, desc: "Colleges, universities, schools running chapters and verified programs." },
  { type: "Recruitment Partner", icon: Briefcase, desc: "Hiring teams sourcing verified student builders and interns." },
  { type: "Industry Partner", icon: Building2, desc: "Companies sponsoring challenges, mentorship and innovation tracks." },
  { type: "Innovation Partner", icon: Sparkles, desc: "Labs and incubators co-running build programs with student teams." },
  { type: "CSR Partner", icon: HeartHandshake, desc: "CSR sponsors funding outcome-led student innovation programs." },
  { type: "Assessment Partner", icon: BookOpen, desc: "Assessment and skilling platforms integrated into verification." },
  { type: "Media Partner", icon: Megaphone, desc: "Press, publishers and creators amplifying student stories." },
  { type: "Training Partner", icon: BookOpen, desc: "Training providers running domain-specific upskilling tracks." },
  { type: "Community Partner", icon: Users, desc: "Communities and ecosystem partners co-building programs." },
];

export const Route = createFileRoute("/partnerships")({
  head: () => ({
    meta: [
      { title: "Partner With Scope Connect | Institutions, Recruiters & Innovation Partners" },
      { name: "description", content: "Partner with Scope Connect for institution collaborations, campus hiring, student innovation, internships, industry partnerships and ecosystem growth." },
      { property: "og:title", content: "Partner With Scope Connect" },
      { property: "og:description", content: "Institution, recruiter, industry, CSR and innovation partnerships for verified student talent." },
      { property: "og:url", content: "/partnerships" },
      { property: "og:type", content: "website" },
    ],
    links: [{ rel: "canonical", href: "/partnerships" }],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: FAQS.map((f) => ({
            "@type": "Question",
            name: f.q,
            acceptedAnswer: { "@type": "Answer", text: f.a },
          })),
        }),
      },
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          itemListElement: [
            { "@type": "ListItem", position: 1, name: "Home", item: "/" },
            { "@type": "ListItem", position: 2, name: "Partnerships", item: "/partnerships" },
          ],
        }),
      },
    ],
  }),
  component: PartnershipsPage,
});

function PartnershipsPage() {
  const [partnerType, setPartnerType] = useState<PartnerType>("Institution Partner");
  const [org, setOrg] = useState("");
  const [person, setPerson] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [website, setWebsite] = useState("");
  const [city, setCity] = useState("");
  const [country, setCountry] = useState("India");
  const [extra, setExtra] = useState<Record<string, string>>({});

  const dynamicFields = useMemo(() => dynamicFor(partnerType), [partnerType]);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!org.trim() || !person.trim() || !email.includes("@") || phone.trim().length < 6) {
      toast.error("Add organization, contact person, valid email and phone.");
      return;
    }
    toast.success("Partnership request received. The Scope team will respond within 48 hours.");
    setOrg(""); setPerson(""); setEmail(""); setPhone(""); setWebsite(""); setCity(""); setExtra({});
  };

  return (
    <AppShell>
      <section className="border-b border-border/40 bg-gradient-hero py-12 text-primary-foreground">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <Badge className="bg-cyan/15 text-cyan hover:bg-cyan/20"><Handshake className="mr-1 h-3 w-3" /> Partnerships</Badge>
          <h1 className="mt-3 text-4xl font-bold tracking-tight sm:text-5xl">Partner with Scope Connect.</h1>
          <p className="mt-2 max-w-2xl text-primary-foreground/70">
            Institutions, recruiters, industry partners and CSR sponsors collaborating with India's verified student innovation network.
          </p>
        </div>
      </section>

      <AnswerBlock
        block={{
          heading: "What is Scope Connect Partnership?",
          definition: "Scope Connect partnerships help institutions, recruiters and organizations collaborate for student growth, hiring, innovation and project-based learning.",
          howItWorks: "Submit a partnership request, get matched with the right Scope team, and onboard with a tailored collaboration model.",
          whoCanUseIt: "Institutions, recruiters, companies, CSR partners, training institutes and ecosystem collaborators.",
          keyBenefit: "Scalable collaboration and verified student talent engagement.",
        }}
      />

      <section className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
        <h2 className="text-2xl font-bold text-foreground sm:text-3xl">Partner categories</h2>
        <p className="mt-2 text-sm text-muted-foreground">Pick the lane that fits — every partnership is scoped and outcome-driven.</p>
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {CATEGORIES.map(({ type, icon: Icon, desc }) => (
            <Card key={type} className="p-5">
              <Icon className="h-5 w-5 text-brand" />
              <div className="mt-3 text-sm font-semibold text-foreground">{type}</div>
              <div className="mt-1 text-sm text-muted-foreground">{desc}</div>
            </Card>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-4xl px-4 pb-12 sm:px-6 lg:px-8">
        <Card className="p-6">
          <h2 className="text-2xl font-bold text-foreground">Start a partnership</h2>
          <p className="mt-1 text-sm text-muted-foreground">Tell us about your organization. Scope responds within 48 hours, weekdays.</p>
          <form onSubmit={submit} className="mt-6 space-y-4">
            <div>
              <Label htmlFor="pt">Partnership type</Label>
              <select id="pt" value={partnerType} onChange={(e) => { setPartnerType(e.target.value as PartnerType); setExtra({}); }} className="mt-1.5 h-9 w-full rounded-md border border-input bg-background px-3 text-sm">
                {PARTNER_TYPES.map((p) => <option key={p}>{p}</option>)}
              </select>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <FieldText id="org" label="Organization name" value={org} onChange={setOrg} max={150} />
              <FieldText id="pn" label="Contact person" value={person} onChange={setPerson} max={100} />
              <FieldText id="em" label="Email" type="email" value={email} onChange={setEmail} max={255} />
              <FieldText id="ph" label="Phone" value={phone} onChange={setPhone} max={20} />
              <FieldText id="wb" label="Website (optional)" value={website} onChange={setWebsite} max={200} />
              <FieldText id="ct" label="City" value={city} onChange={setCity} max={80} />
              <FieldText id="co" label="Country" value={country} onChange={setCountry} max={80} />
            </div>

            {dynamicFields.length > 0 && (
              <div className="rounded-lg border border-border/60 bg-muted/30 p-4">
                <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Tell us more</div>
                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  {dynamicFields.map((f) => (
                    <div key={f.key} className={f.long ? "sm:col-span-2" : ""}>
                      <Label htmlFor={f.key}>{f.label}</Label>
                      {f.long ? (
                        <Textarea id={f.key} value={extra[f.key] ?? ""} onChange={(e) => setExtra((p) => ({ ...p, [f.key]: e.target.value }))} rows={3} className="mt-1.5" maxLength={1000} />
                      ) : (
                        <Input id={f.key} value={extra[f.key] ?? ""} onChange={(e) => setExtra((p) => ({ ...p, [f.key]: e.target.value }))} className="mt-1.5" maxLength={200} />
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <Button type="submit" size="lg" className="bg-gradient-brand text-brand-foreground shadow-brand">
              Submit partnership request
            </Button>
            <p className="text-xs text-muted-foreground">By submitting you agree to be contacted by the Scope partnerships team.</p>
          </form>
        </Card>
      </section>

      <FAQSection
        title="Partnership FAQs"
        subtitle="What partners ask before starting a collaboration."
        items={FAQS}
      />
    </AppShell>
  );
}

function FieldText({ id, label, value, onChange, type = "text", max }: { id: string; label: string; value: string; onChange: (v: string) => void; type?: string; max?: number }) {
  return (
    <div>
      <Label htmlFor={id}>{label}</Label>
      <Input id={id} type={type} value={value} onChange={(e) => onChange(e.target.value)} className="mt-1.5" maxLength={max} />
    </div>
  );
}

type DynField = { key: string; label: string; long?: boolean };

function dynamicFor(type: PartnerType): DynField[] {
  switch (type) {
    case "Institution Partner":
      return [
        { key: "institutionType", label: "Institution type (university, college, school)" },
        { key: "studentStrength", label: "Student strength" },
        { key: "coursesOffered", label: "Courses offered" },
        { key: "placementChallenges", label: "Placement challenges", long: true },
        { key: "interestArea", label: "Partnership interest area", long: true },
      ];
    case "Recruitment Partner":
      return [
        { key: "roles", label: "Roles hiring for" },
        { key: "hiringVolume", label: "Expected hiring volume" },
        { key: "campusHiring", label: "Campus hiring interest" },
        { key: "internshipInterest", label: "Internship interest" },
      ];
    case "CSR Partner":
      return [
        { key: "budgetRange", label: "Budget range (optional)" },
        { key: "focusArea", label: "Focus area" },
        { key: "outcomes", label: "Expected student outcomes", long: true },
      ];
    case "Training Partner":
      return [
        { key: "domains", label: "Training domains" },
        { key: "segments", label: "Target student segments" },
        { key: "model", label: "Collaboration model", long: true },
      ];
    default:
      return [{ key: "notes", label: "Tell us about your partnership idea", long: true }];
  }
}
