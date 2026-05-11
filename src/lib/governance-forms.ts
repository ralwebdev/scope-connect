// Form schemas for the progressive-disclosure dynamic form engine.
// Conditional fields are gated by `showIf({ values })` predicates.
import type { ContentEntity } from "./governance-store";

export type FieldType = "text" | "textarea" | "number" | "select" | "url" | "date";

export type FieldDef = {
  name: string;
  label: string;
  type: FieldType;
  placeholder?: string;
  required?: boolean;
  options?: string[];
  helper?: string;
  showIf?: (values: Record<string, unknown>) => boolean;
};

export type FormSchema = {
  entity: ContentEntity;
  /** The discriminator field whose value drives conditional branches. */
  discriminator: string;
  fields: FieldDef[];
};

/* ------------------------------ Challenge ------------------------------ */

const challengeSchema: FormSchema = {
  entity: "challenge",
  discriminator: "challenge_type",
  fields: [
    { name: "title", label: "Title", type: "text", required: true, placeholder: "Build a…" },
    { name: "challenge_type", label: "Challenge Type", type: "select", required: true,
      options: ["coding", "design", "content_writing", "video_editing"] },
    { name: "difficulty", label: "Difficulty", type: "select", required: true,
      options: ["Beginner", "Intermediate", "Advanced"] },
    { name: "duration", label: "Duration", type: "text", required: true, placeholder: "e.g. 2 weeks" },
    { name: "institution_scope", label: "Institution Scope", type: "select",
      options: ["platform_wide", "regional", "institution_specific", "internal_campus"] },
    { name: "eligibility", label: "Eligibility", type: "text", placeholder: "Who can participate?" },
    { name: "description", label: "Description", type: "textarea", required: true },
    { name: "submission_format", label: "Submission Format", type: "text", placeholder: "Repo link / PDF / video URL" },
    { name: "evaluation_method", label: "Evaluation Method", type: "select",
      options: ["manual_review", "peer_review", "mentor_review", "automated_validation"] },
    { name: "mentor_assigned", label: "Mentor Assigned", type: "text", placeholder: "Optional" },

    // coding
    { name: "programming_language", label: "Programming Language", type: "text",
      showIf: (v) => v.challenge_type === "coding" },
    { name: "github_repository", label: "GitHub Repository", type: "url",
      showIf: (v) => v.challenge_type === "coding" },
    { name: "tech_stack", label: "Tech Stack", type: "text",
      showIf: (v) => v.challenge_type === "coding" },
    { name: "deployment_link", label: "Deployment Link", type: "url",
      showIf: (v) => v.challenge_type === "coding" },

    // design
    { name: "figma_link", label: "Figma Link", type: "url",
      showIf: (v) => v.challenge_type === "design" },
    { name: "behance_link", label: "Behance Link", type: "url",
      showIf: (v) => v.challenge_type === "design" },
    { name: "design_category", label: "Design Category", type: "select",
      options: ["UI/UX", "Brand", "Illustration", "Print", "Motion"],
      showIf: (v) => v.challenge_type === "design" },
    { name: "submission_resolution", label: "Submission Resolution", type: "text",
      showIf: (v) => v.challenge_type === "design" },

    // content_writing
    { name: "word_limit", label: "Word Limit", type: "number",
      showIf: (v) => v.challenge_type === "content_writing" },
    { name: "writing_style", label: "Writing Style", type: "select",
      options: ["Long-form", "Listicle", "Editorial", "Technical", "Marketing copy"],
      showIf: (v) => v.challenge_type === "content_writing" },
    { name: "target_audience", label: "Target Audience", type: "text",
      showIf: (v) => v.challenge_type === "content_writing" },
    { name: "document_upload", label: "Document Link", type: "url",
      showIf: (v) => v.challenge_type === "content_writing" },

    // video_editing
    { name: "video_duration", label: "Video Duration (sec)", type: "number",
      showIf: (v) => v.challenge_type === "video_editing" },
    { name: "editing_software", label: "Editing Software", type: "text",
      showIf: (v) => v.challenge_type === "video_editing" },
    { name: "drive_link", label: "Drive Link", type: "url",
      showIf: (v) => v.challenge_type === "video_editing" },
    { name: "render_quality", label: "Render Quality", type: "select",
      options: ["720p", "1080p", "4K"],
      showIf: (v) => v.challenge_type === "video_editing" },
  ],
};

/* ------------------------------ Project ------------------------------ */

const projectSchema: FormSchema = {
  entity: "project",
  discriminator: "project_type",
  fields: [
    { name: "project_title", label: "Project Title", type: "text", required: true },
    { name: "project_type", label: "Project Type", type: "select", required: true,
      options: ["software_development", "magazine_production", "marketing_campaign", "research", "other"] },
    { name: "project_mode", label: "Project Mode", type: "select", required: true,
      options: ["individual", "team"] },
    { name: "team_size", label: "Team Size", type: "number",
      showIf: (v) => v.project_mode === "team" },
    { name: "collaboration_allowed", label: "Open to Collaboration", type: "select",
      options: ["yes", "no", "by_invite"] },
    { name: "project_duration", label: "Project Duration", type: "text", placeholder: "e.g. 6 weeks" },
    { name: "milestones", label: "Milestones", type: "textarea", placeholder: "List 3-5 milestones" },
    { name: "deliverables", label: "Deliverables", type: "textarea" },
    { name: "mentor_or_supervisor", label: "Mentor / Supervisor", type: "text" },
    { name: "reporting_structure", label: "Reporting Structure", type: "select",
      options: ["weekly", "bi-weekly", "milestone-based"] },
    { name: "review_frequency", label: "Review Frequency", type: "select",
      options: ["weekly", "bi-weekly", "monthly"] },

    // magazine
    { name: "editorial_team", label: "Editorial Team", type: "text",
      showIf: (v) => v.project_type === "magazine_production" },
    { name: "design_team", label: "Design Team", type: "text",
      showIf: (v) => v.project_type === "magazine_production" },
    { name: "content_deadline", label: "Content Deadline", type: "date",
      showIf: (v) => v.project_type === "magazine_production" },
    { name: "publishing_date", label: "Publishing Date", type: "date",
      showIf: (v) => v.project_type === "magazine_production" },
    { name: "magazine_sections", label: "Magazine Sections", type: "textarea",
      showIf: (v) => v.project_type === "magazine_production" },

    // software
    { name: "repository_link", label: "Repository Link", type: "url",
      showIf: (v) => v.project_type === "software_development" },
    { name: "tech_stack", label: "Tech Stack", type: "text",
      showIf: (v) => v.project_type === "software_development" },
    { name: "deployment_target", label: "Deployment Target", type: "text",
      showIf: (v) => v.project_type === "software_development" },
    { name: "sprint_structure", label: "Sprint Structure", type: "text",
      showIf: (v) => v.project_type === "software_development" },

    // marketing
    { name: "campaign_goal", label: "Campaign Goal", type: "text",
      showIf: (v) => v.project_type === "marketing_campaign" },
    { name: "social_platforms", label: "Social Platforms", type: "text",
      showIf: (v) => v.project_type === "marketing_campaign" },
    { name: "target_audience", label: "Target Audience", type: "text",
      showIf: (v) => v.project_type === "marketing_campaign" },
    { name: "campaign_budget", label: "Campaign Budget (₹)", type: "number",
      showIf: (v) => v.project_type === "marketing_campaign" },
  ],
};

/* ------------------------------ Opportunity ------------------------------ */

const opportunitySchema: FormSchema = {
  entity: "opportunity",
  discriminator: "opportunity_type",
  fields: [
    { name: "opportunity_title", label: "Title", type: "text", required: true },
    { name: "opportunity_type", label: "Opportunity Type", type: "select", required: true,
      options: ["internship", "campus_ambassador", "volunteering", "freelance"] },
    { name: "stipend_or_honorarium", label: "Stipend / Honorarium", type: "text", placeholder: "e.g. ₹10k/mo or unpaid" },
    { name: "eligibility", label: "Eligibility", type: "text" },
    { name: "application_deadline", label: "Application Deadline", type: "date", required: true },
    { name: "duration", label: "Duration", type: "text" },
    { name: "required_skills", label: "Required Skills", type: "text" },
    { name: "selection_process", label: "Selection Process", type: "textarea" },

    // internship
    { name: "daily_reporting_required", label: "Daily Reporting Required", type: "select",
      options: ["yes", "no"], showIf: (v) => v.opportunity_type === "internship" },
    { name: "mentor_assigned", label: "Mentor Assigned", type: "text",
      showIf: (v) => v.opportunity_type === "internship" },
    { name: "certificate_policy", label: "Certificate Policy", type: "text",
      showIf: (v) => v.opportunity_type === "internship" },

    // ambassador
    { name: "campus_target", label: "Campus Target", type: "text",
      showIf: (v) => v.opportunity_type === "campus_ambassador" },
    { name: "referral_expectation", label: "Referral Expectation", type: "text",
      showIf: (v) => v.opportunity_type === "campus_ambassador" },
    { name: "community_growth_metrics", label: "Community Growth Metrics", type: "text",
      showIf: (v) => v.opportunity_type === "campus_ambassador" },
  ],
};

export const FORM_SCHEMAS: Record<ContentEntity, FormSchema> = {
  challenge: challengeSchema,
  project: projectSchema,
  opportunity: opportunitySchema,
};

export function visibleFields(schema: FormSchema, values: Record<string, unknown>): FieldDef[] {
  return schema.fields.filter((f) => !f.showIf || f.showIf(values));
}

export function titleOf(item: { entity: ContentEntity; data: Record<string, unknown> }): string {
  const d = item.data;
  return String(
    d.title || d.project_title || d.opportunity_title || "Untitled"
  );
}
