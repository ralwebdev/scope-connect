import type { AnswerBlock as AnswerBlockType } from "@/lib/aeo-content";
import { Card } from "@/components/ui/card";

interface Props {
  block: AnswerBlockType;
  citations?: { label: string; value: string }[];
}

/**
 * Additive AEO answer block. Renders short, AI-readable fact text directly
 * after the page heading. Uses semantic <article> / <dl> markup so answer
 * engines and LLM crawlers can extract definitions cleanly. Theme-aware via
 * existing tokens — no custom colors.
 */
export function AnswerBlock({ block, citations }: Props) {
  return (
    <article
      aria-label={block.heading}
      className="mx-auto w-full max-w-3xl px-4 pt-6 sm:px-6 lg:px-8"
    >
      <Card className="p-5 sm:p-6">
        <h2 className="text-base font-semibold text-foreground sm:text-lg">{block.heading}</h2>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{block.definition}</p>
        <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
          <Row term="How it works" desc={block.howItWorks} />
          <Row term="Who can use it" desc={block.whoCanUseIt} />
          <Row term="Key benefit" desc={block.keyBenefit} />
        </dl>
        {citations && citations.length > 0 && (
          <ul className="mt-4 space-y-1.5 border-t border-border/60 pt-3 text-xs text-muted-foreground">
            {citations.map((c) => (
              <li key={c.label}>
                <span className="font-medium text-foreground">{c.label}:</span> {c.value}
              </li>
            ))}
          </ul>
        )}
      </Card>
    </article>
  );
}

function Row({ term, desc }: { term: string; desc: string }) {
  return (
    <div>
      <dt className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{term}</dt>
      <dd className="mt-1 text-sm text-foreground">{desc}</dd>
    </div>
  );
}
