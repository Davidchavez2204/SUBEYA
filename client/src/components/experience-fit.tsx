import { Check, X, Briefcase } from "lucide-react";

export function ExperienceFit({
  requiredYears,
  candidateYears,
  meetsExperience,
}: {
  requiredYears: number;
  candidateYears: number;
  meetsExperience: boolean;
}) {
  if (requiredYears === 0) {
    return (
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <Briefcase size={13} className="shrink-0" />
        Esta oferta no exige años mínimos de experiencia. Tienes {candidateYears} año{candidateYears === 1 ? "" : "s"} registrados.
      </div>
    );
  }

  return (
    <div>
      <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground mb-1.5">Experiencia laboral</p>
      <span
        className={
          meetsExperience
            ? "inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30"
            : "inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full bg-white/5 text-white/50 border border-white/10"
        }
      >
        {meetsExperience ? <Check size={12} /> : <X size={12} />}
        Requiere {requiredYears}+ años · Tienes {candidateYears}
      </span>
    </div>
  );
}
