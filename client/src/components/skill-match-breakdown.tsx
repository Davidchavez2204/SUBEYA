import { Check, X } from "lucide-react";

function SkillRow({ items, matched }: { items: string[]; matched: boolean }) {
  if (items.length === 0) return null;
  return (
    <div className="flex flex-wrap gap-1.5">
      {items.map((t) => (
        <span
          key={t}
          className={
            matched
              ? "inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30"
              : "inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full bg-white/5 text-white/40 border border-white/10"
          }
        >
          {matched ? <Check size={11} /> : <X size={11} />}
          {t}
        </span>
      ))}
    </div>
  );
}

export function SkillMatchBreakdown({
  techMatched,
  techMissing,
  softMatched,
  softMissing,
}: {
  techMatched: string[];
  techMissing: string[];
  softMatched: string[];
  softMissing: string[];
}) {
  const hasTech = techMatched.length + techMissing.length > 0;
  const hasSoft = softMatched.length + softMissing.length > 0;

  if (!hasTech && !hasSoft) return null;

  return (
    <div className="space-y-4">
      {hasTech && (
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground mb-1.5">Habilidades técnicas</p>
          <div className="space-y-1.5">
            <SkillRow items={techMatched} matched />
            <SkillRow items={techMissing} matched={false} />
          </div>
        </div>
      )}
      {hasSoft && (
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground mb-1.5">Habilidades blandas</p>
          <div className="space-y-1.5">
            <SkillRow items={softMatched} matched />
            <SkillRow items={softMissing} matched={false} />
          </div>
        </div>
      )}
    </div>
  );
}
