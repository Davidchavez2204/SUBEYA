import { LucideIcon } from "lucide-react";

export function StatCard({ icon: Icon, label, value, accent = "text-primary" }: { icon: LucideIcon; label: string; value: string | number; accent?: string }) {
  return (
    <div className="glass-card rounded-2xl p-5 flex items-center gap-4">
      <div className={`w-11 h-11 rounded-xl bg-white/5 flex items-center justify-center shrink-0 ${accent}`}>
        <Icon size={20} />
      </div>
      <div className="min-w-0">
        <div className="text-2xl font-extrabold leading-tight truncate">{value}</div>
        <div className="text-xs text-muted-foreground truncate">{label}</div>
      </div>
    </div>
  );
}
