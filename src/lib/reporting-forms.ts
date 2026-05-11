// Daily report form schema with conditional logic per project type + team mode.
import type { FieldDef } from "./governance-forms";
import type { ReportProjectType } from "./reporting-store";

export type DailyFormContext = { projectType: ReportProjectType; teamMode: boolean };

export function dailyReportFields(ctx: DailyFormContext): FieldDef[] {
  const base: FieldDef[] = [
    { name: "today_tasks_completed", label: "Today's tasks completed", type: "textarea", required: true },
    { name: "hours_contributed", label: "Hours contributed", type: "number", required: true },
    { name: "blockers_faced", label: "Blockers faced", type: "textarea" },
    { name: "proof_of_work", label: "Proof of work (link)", type: "url", required: true,
      helper: "GitHub commit, Figma frame, doc, image, Loom, Drive link or video demo." },
    { name: "next_day_plan", label: "Next-day plan", type: "textarea", required: true },
    { name: "team_updates", label: "Team updates", type: "textarea",
      showIf: () => ctx.teamMode },
    { name: "mentor_comments", label: "Note for mentor", type: "textarea" },
  ];

  const coding: FieldDef[] = [
    { name: "github_commit_link", label: "GitHub commit link", type: "url", required: true },
    { name: "deployment_preview", label: "Deployment preview URL", type: "url" },
    { name: "technical_notes", label: "Technical notes", type: "textarea" },
  ];
  const design: FieldDef[] = [
    { name: "figma_frame_link", label: "Figma frame link", type: "url", required: true },
    { name: "design_revision_notes", label: "Design revision notes", type: "textarea" },
    { name: "visual_prototype_upload", label: "Visual prototype URL", type: "url" },
  ];
  const content: FieldDef[] = [
    { name: "draft_document", label: "Draft document URL", type: "url", required: true },
    { name: "word_count", label: "Word count", type: "number" },
    { name: "editorial_notes", label: "Editorial notes", type: "textarea" },
  ];
  const team: FieldDef[] = [
    { name: "team_member_contributions", label: "Team member contributions", type: "textarea" },
    { name: "team_blockers", label: "Team blockers", type: "textarea" },
    { name: "collaboration_updates", label: "Collaboration updates", type: "textarea" },
  ];

  const byType =
    ctx.projectType === "coding" ? coding :
    ctx.projectType === "design" ? design :
    ctx.projectType === "content" ? content : [];

  const teamFields = ctx.teamMode ? team : [];

  return [...base, ...byType, ...teamFields];
}
