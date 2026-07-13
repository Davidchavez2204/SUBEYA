import { Inbox, Eye, CheckCircle2, XCircle, LucideIcon } from "lucide-react";

export type ApplicationStatus = "recibido" | "en_revision" | "aceptado" | "rechazado";

export const STATUS_META: Record<ApplicationStatus, { label: string; description: string; badgeClass: string; icon: LucideIcon }> = {
  recibido: {
    label: "Recibido",
    description: "La empresa aún no ha abierto tu postulación.",
    badgeClass: "bg-white/10 text-white/70 border-white/20",
    icon: Inbox,
  },
  en_revision: {
    label: "En revisión",
    description: "La empresa ya vio tu postulación y la está evaluando.",
    badgeClass: "bg-yellow-500/15 text-yellow-300 border-yellow-500/30",
    icon: Eye,
  },
  aceptado: {
    label: "Aceptado",
    description: "¡Felicidades! La empresa avanzó con tu postulación.",
    badgeClass: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
    icon: CheckCircle2,
  },
  rechazado: {
    label: "Rechazado",
    description: "La empresa decidió no continuar con tu postulación esta vez.",
    badgeClass: "bg-red-500/15 text-red-300 border-red-500/30",
    icon: XCircle,
  },
};

export function statusMeta(status: string) {
  return STATUS_META[(status as ApplicationStatus)] || STATUS_META.recibido;
}
