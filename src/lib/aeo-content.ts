// Additive AEO/GEO content registry. Pure data, no side effects.
// Canonical vocabulary enforced via the strings below — keep titles, meta
// descriptions, answer blocks and FAQs sourced from this file so AI systems
// see consistent terminology across Scope Connect.

import type { FAQItem } from "@/components/site/FAQSection";

export interface AnswerBlock {
  heading: string;
  definition: string;
  howItWorks: string;
  whoCanUseIt: string;
  keyBenefit: string;
}

export interface AeoEntry {
  answer: AnswerBlock;
  faqs: FAQItem[];
  citations?: { label: string; value: string }[];
}

const CITATIONS_DEFAULT = [
  { label: "Student verification", value: "Students register independently and are verified by institution authorities." },
  { label: "Project model", value: "Projects focus on execution, collaboration and proof-of-work." },
  { label: "Challenge model", value: "Challenges test practical skill application." },
];

export const AEO: Record<string, AeoEntry> = {
  projects: {
    answer: {
      heading: "What is a Scope Connect project?",
      definition:
        "Scope Connect projects are real-world, proof-of-work student projects where learners collaborate to build practical experience.",
      howItWorks:
        "Students join institution-supported projects and contribute to execution, reporting and deliverables.",
      whoCanUseIt: "Students, faculty and institution chapters.",
      keyBenefit: "Hands-on execution and portfolio building.",
    },
    faqs: [
      { q: "What are Scope Connect projects?", a: "Execution-based learning activities where institution-verified students collaborate on real-world problems and ship proof-of-work." },
      { q: "How do projects work?", a: "Students join an institution-supported project, contribute through collaborative learning, submit daily reports and ship deliverables that are reviewed by moderators." },
      { q: "Can students collaborate on projects?", a: "Yes. Projects support team-based collaborative learning across disciplines and chapters." },
      { q: "How are projects verified?", a: "Every project passes Scope's trust-first moderation pipeline before publishing, with ongoing proof-of-work review through daily reporting." },
    ],
    citations: CITATIONS_DEFAULT,
  },
  challenges: {
    answer: {
      heading: "What is a Scope Connect challenge?",
      definition:
        "Challenges are skill-focused execution tasks designed to test learning through practical outcomes.",
      howItWorks: "Students participate individually or collaboratively and submit outcomes.",
      whoCanUseIt: "Students across disciplines.",
      keyBenefit: "Skill validation through execution.",
    },
    faqs: [
      { q: "What are Scope Connect challenges?", a: "Short, execution-based learning tasks designed to validate applied skills with verifiable outcomes." },
      { q: "How are challenges completed?", a: "Students pick a challenge, ship the required proof-of-work, and submit it for moderator review." },
      { q: "Can students work in teams?", a: "Yes. Many challenges support collaborative learning across institution-verified students." },
      { q: "How are challenge outcomes evaluated?", a: "Submissions are evaluated against rubric criteria and reviewed by Scope moderators before XP is awarded." },
    ],
    citations: CITATIONS_DEFAULT,
  },
  opportunities: {
    answer: {
      heading: "What is a Scope Connect opportunity?",
      definition:
        "Opportunities connect students with internships, collaborations and institution-supported growth pathways.",
      howItWorks: "Students discover and participate in relevant opportunities.",
      whoCanUseIt: "Verified students and institutions.",
      keyBenefit: "Practical exposure and career readiness.",
    },
    faqs: [
      { q: "What opportunities are available?", a: "Internships, co-founder roles, research collaborations and institution-supported growth pathways posted by verified builders and chapters." },
      { q: "Who can apply?", a: "Institution-verified students on Scope Connect can mark interest or apply directly." },
      { q: "Are opportunities institution-supported?", a: "Yes. Opportunities are posted within the student innovation ecosystem and reviewed before going live." },
      { q: "How are students verified?", a: "Students register independently and are verified by faculty or institution administrators." },
    ],
    citations: CITATIONS_DEFAULT,
  },
  chapters: {
    answer: {
      heading: "What is a Scope Connect chapter?",
      definition:
        "A Scope Connect chapter is an institution-backed innovation ecosystem where students participate in projects, challenges and opportunities.",
      howItWorks: "Students collaborate through institution-supported learning and execution.",
      whoCanUseIt: "Institution students, faculty and chapter leaders.",
      keyBenefit: "Community-driven proof-of-work learning.",
    },
    faqs: [
      { q: "What is a Scope Connect chapter?", a: "An institution-backed innovation ecosystem that runs verified projects, challenges and opportunities for its students." },
      { q: "How can students join?", a: "Sign in to Scope Connect and select your institution during onboarding. Your chapter coordinator will verify and onboard you." },
      { q: "Who verifies students?", a: "Faculty or institution administrators verify each student before they can participate." },
      { q: "What activities are available?", a: "Execution-based projects, weekly challenges, opportunities and student portfolio building." },
    ],
    citations: CITATIONS_DEFAULT,
  },
};

export function faqJsonLdScript(items: FAQItem[]) {
  return {
    type: "application/ld+json" as const,
    children: JSON.stringify({
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: items.map((it) => ({
        "@type": "Question",
        name: it.q,
        acceptedAnswer: { "@type": "Answer", text: it.a },
      })),
    }),
  };
}
