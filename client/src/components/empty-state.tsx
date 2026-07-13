import { LucideIcon } from "lucide-react";
import { ReactNode } from "react";

export function EmptyState({ icon: Icon, title, description, action }: { icon: LucideIcon; title: string; description: string; action?: ReactNode }) {
  return (
    <div className="glass-card rounded-2xl p-12 flex flex-col items-center text-center gap-3">
      <div className="w-14 h-14 rounded-2xl bg-white/5 text-primary flex items-center justify-center">
        <Icon size={26} />
      </div>
      <p className="font-semibold">{title}</p>
      <p className="text-sm text-muted-foreground max-w-sm">{description}</p>
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}
