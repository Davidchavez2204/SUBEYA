import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import {
  Briefcase,
  MapPin,
  LogOut,
  Plus,
  X,
  Users,
  Download,
  GraduationCap,
  ExternalLink,
  Sparkles,
  TrendingUp,
  Layers,
  Mail,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogAction,
  AlertDialogCancel,
} from "@/components/ui/alert-dialog";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth, EmpresaProfile } from "@/lib/auth-context";
import { api } from "@/lib/api";
import { toast } from "@/hooks/use-toast";
import { MatchRing } from "@/components/match-ring";
import { StatCard } from "@/components/stat-card";
import { EmptyState } from "@/components/empty-state";
import { SkillMatchBreakdown } from "@/components/skill-match-breakdown";
import { ExperienceFit } from "@/components/experience-fit";
import { STATUS_META, statusMeta, ApplicationStatus } from "@/lib/application-status";

type Job = {
  id: string;
  title: string;
  description: string;
  modality: string;
  location: string;
  seniority: string;
  minExperienceYears: number;
  status: string;
  techRequirements: string[];
  softRequirements: string[];
  applicantsCount: number;
};

type Applicant = {
  applicationId: string;
  status: string;
  appliedAt: string;
  cvFileName: string;
  egresado: { id: string; name: string; email: string; career: string; techSkills: string[]; softSkills: string[] };
  matchScore: number;
  matchedTech: string[];
  matchedSoft: string[];
  missingTech: string[];
  missingSoft: string[];
  experienceScore: number;
  requiredYears: number;
  candidateYears: number;
  meetsExperience: boolean;
  suggestedCourses: { id: string; skill: string; title: string; provider: string; url: string; level: string }[];
};

function emptyJobForm() {
  return {
    title: "",
    description: "",
    modality: "Remoto",
    location: "Lima, Perú",
    seniority: "Junior",
    minExperienceYears: 0,
    techRequirements: [] as string[],
    softRequirements: [] as string[],
  };
}

function TagEditor({ tags, onChange, placeholder }: { tags: string[]; onChange: (tags: string[]) => void; placeholder: string }) {
  const [value, setValue] = useState("");
  const addTag = () => {
    const v = value.trim();
    if (!v || tags.some((t) => t.toLowerCase() === v.toLowerCase())) {
      setValue("");
      return;
    }
    onChange([...tags, v]);
    setValue("");
  };
  return (
    <div>
      <div className="flex gap-2 mb-3">
        <Input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              addTag();
            }
          }}
          placeholder={placeholder}
        />
        <Button type="button" variant="secondary" onClick={addTag}>
          <Plus size={16} />
        </Button>
      </div>
      <div className="flex flex-wrap gap-2">
        {tags.map((t) => (
          <Badge key={t} variant="secondary" className="gap-1 pr-1">
            {t}
            <button type="button" onClick={() => onChange(tags.filter((x) => x !== t))} className="ml-1 rounded-full hover:bg-white/20 p-0.5">
              <X size={12} />
            </button>
          </Badge>
        ))}
      </div>
    </div>
  );
}

function initials(name?: string) {
  if (!name) return "?";
  const parts = name.trim().split(/\s+/);
  return ((parts[0]?.[0] || "") + (parts[1]?.[0] || "")).toUpperCase();
}

export default function EmpresaDashboard() {
  const { user, logout, refreshUser } = useAuth();
  const [, setLocation] = useLocation();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loadingJobs, setLoadingJobs] = useState(true);
  const [creating, setCreating] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [form, setForm] = useState(emptyJobForm());

  const [applicantsJob, setApplicantsJob] = useState<Job | null>(null);
  const [applicants, setApplicants] = useState<Applicant[]>([]);
  const [loadingApplicants, setLoadingApplicants] = useState(false);

  const [jobToDelete, setJobToDelete] = useState<Job | null>(null);
  const [deletingJob, setDeletingJob] = useState(false);

  const profile = user?.profile as EmpresaProfile | undefined;
  const [companyName, setCompanyName] = useState(profile?.companyName || "");
  const [sector, setSector] = useState(profile?.sector || "");
  const [description, setDescription] = useState(profile?.description || "");
  const [savingProfile, setSavingProfile] = useState(false);

  const loadJobs = async () => {
    setLoadingJobs(true);
    try {
      const data = await api.myJobs();
      setJobs(data.jobs);
    } catch {
      toast({ title: "No se pudieron cargar tus ofertas", variant: "destructive" });
    } finally {
      setLoadingJobs(false);
    }
  };

  useEffect(() => {
    loadJobs();
  }, []);

  // Auto-actualización: refresca en silencio las ofertas (conteo de postulantes)
  // y, si está abierta la lista de postulantes, sus postulantes/estados cada 15s.
  useEffect(() => {
    const id = setInterval(() => {
      if (document.hidden) return;
      api.myJobs().then((d) => setJobs(d.jobs)).catch(() => {});
      if (applicantsJob) {
        api.jobApplicants(applicantsJob.id).then((d) => setApplicants(d.applicants)).catch(() => {});
      }
    }, 15000);
    return () => clearInterval(id);
  }, [applicantsJob]);

  useEffect(() => {
    setCompanyName(profile?.companyName || "");
    setSector(profile?.sector || "");
    setDescription(profile?.description || "");
  }, [user]);

  const handleCreateJob = async () => {
    if (!form.title.trim() || !form.description.trim()) {
      toast({ title: "Completa el título y la descripción", variant: "destructive" });
      return;
    }
    setCreating(true);
    try {
      await api.createJob(form);
      toast({ title: "Oferta publicada", description: "Ya es visible para los egresados." });
      setCreateOpen(false);
      setForm(emptyJobForm());
      await loadJobs();
    } catch (err) {
      toast({ title: err instanceof Error ? err.message : "No se pudo publicar la oferta", variant: "destructive" });
    } finally {
      setCreating(false);
    }
  };

  const toggleJobStatus = async (job: Job) => {
    try {
      await api.updateJob(job.id, { status: job.status === "publicada" ? "cerrada" : "publicada" });
      await loadJobs();
    } catch {
      toast({ title: "No se pudo actualizar la oferta", variant: "destructive" });
    }
  };

  const handleDeleteJob = async () => {
    if (!jobToDelete) return;
    setDeletingJob(true);
    try {
      const data = await api.deleteJob(jobToDelete.id);
      // Si el diálogo de postulantes estaba abierto sobre esta oferta, ciérralo.
      if (applicantsJob?.id === jobToDelete.id) setApplicantsJob(null);
      const affected = data?.affectedApplications ?? 0;
      toast({
        title: "Oferta eliminada",
        description:
          affected > 0
            ? `La oferta ya no es visible. ${affected} postulante(s) verán la oferta marcada como "eliminada".`
            : "La oferta ya no es visible para los egresados.",
      });
      setJobToDelete(null);
      await loadJobs();
    } catch (err) {
      toast({ title: err instanceof Error ? err.message : "No se pudo eliminar la oferta", variant: "destructive" });
    } finally {
      setDeletingJob(false);
    }
  };

  const handleDownloadCv = async (applicationId: string, fallbackName?: string) => {
    try {
      await api.downloadApplicationCv(applicationId, fallbackName);
    } catch (err) {
      toast({ title: err instanceof Error ? err.message : "No se pudo descargar el CV", variant: "destructive" });
    }
  };

  const openApplicants = async (job: Job) => {
    setApplicantsJob(job);
    setLoadingApplicants(true);
    try {
      const data = await api.jobApplicants(job.id);
      setApplicants(data.applicants);
    } catch {
      toast({ title: "No se pudieron cargar los postulantes", variant: "destructive" });
    } finally {
      setLoadingApplicants(false);
    }
  };

  const handleStatusChange = async (applicationId: string, status: ApplicationStatus) => {
    // Optimista: refleja el cambio de inmediato y revierte si falla.
    const previous = applicants;
    setApplicants((prev) => prev.map((a) => (a.applicationId === applicationId ? { ...a, status } : a)));
    try {
      await api.updateApplicationStatus(applicationId, status);
    } catch (err) {
      setApplicants(previous);
      toast({ title: err instanceof Error ? err.message : "No se pudo actualizar el estado", variant: "destructive" });
    }
  };

  const saveProfile = async () => {
    setSavingProfile(true);
    try {
      await api.updateEmpresaProfile({ companyName, sector, description });
      await refreshUser();
      toast({ title: "Perfil de empresa actualizado" });
    } catch (err) {
      toast({ title: err instanceof Error ? err.message : "No se pudo guardar el perfil", variant: "destructive" });
    } finally {
      setSavingProfile(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-white/10 sticky top-0 z-40 bg-background/80 backdrop-blur-lg">
        <div className="container mx-auto px-6 h-16 flex items-center justify-between">
          <button
            type="button"
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
            className="text-xl font-extrabold tracking-tighter text-gradient cursor-pointer bg-transparent border-0 p-0"
            aria-label="Ir al inicio del panel"
          >
            SUBEYA
          </button>
          <div className="flex items-center gap-4">
            <div className="text-sm text-right hidden sm:block">
              <div className="font-semibold">{profile?.companyName || user?.name}</div>
              <div className="text-xs text-muted-foreground">Empresa</div>
            </div>
            <Button variant="ghost" size="icon" onClick={() => { logout(); setLocation("/"); }} data-testid="button-logout">
              <LogOut size={18} />
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-6 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold mb-1">Panel de {profile?.companyName || "tu empresa"}</h1>
          <p className="text-muted-foreground text-sm">Gestiona tus ofertas y revisa a tus postulantes ordenados por % de match.</p>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
          <StatCard icon={Layers} label="Ofertas publicadas" value={jobs.length} accent="text-[#3CC6E8]" />
          <StatCard icon={Briefcase} label="Ofertas activas" value={jobs.filter((j) => j.status === "publicada").length} accent="text-primary" />
          <StatCard icon={Users} label="Total de postulantes" value={jobs.reduce((sum, j) => sum + j.applicantsCount, 0)} accent="text-secondary" />
          <StatCard icon={TrendingUp} label="Promedio postulantes/oferta" value={jobs.length ? Math.round((jobs.reduce((sum, j) => sum + j.applicantsCount, 0) / jobs.length) * 10) / 10 : 0} accent="text-emerald-400" />
        </div>

        <Tabs defaultValue="ofertas">
          <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
            <TabsList>
              <TabsTrigger value="perfil" data-testid="tab-perfil">Perfil de empresa</TabsTrigger>
              <TabsTrigger value="ofertas" data-testid="tab-ofertas">Mis ofertas</TabsTrigger>
            </TabsList>
            <Button onClick={() => setCreateOpen(true)} data-testid="button-open-create-job" className="bg-gradient-to-r from-primary to-secondary">
              <Plus size={16} className="mr-2" /> Publicar oferta
            </Button>
          </div>

          <TabsContent value="ofertas">
            {loadingJobs ? (
              <p className="text-muted-foreground">Cargando tus ofertas...</p>
            ) : jobs.length === 0 ? (
              <EmptyState
                icon={Sparkles}
                title="Aún no has publicado ninguna oferta"
                description="Crea tu primera oferta detallando los requisitos técnicos y blandos, y empieza a recibir postulantes con su % de match."
                action={
                  <Button onClick={() => setCreateOpen(true)} className="bg-gradient-to-r from-primary to-secondary" data-testid="button-empty-create-job">
                    <Plus size={16} className="mr-2" /> Publicar mi primera oferta
                  </Button>
                }
              />
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {jobs.map((job) => (
                  <Card key={job.id} className="hover:border-primary/40 transition-colors" data-testid={`card-job-${job.id}`}>
                    <CardHeader className="pb-2">
                      <div className="flex items-start justify-between gap-3">
                        <CardTitle className="text-lg">{job.title}</CardTitle>
                        <Badge variant={job.status === "publicada" ? "default" : "outline"} className="gap-1.5 shrink-0">
                          <span className={`w-1.5 h-1.5 rounded-full ${job.status === "publicada" ? "bg-emerald-400" : "bg-white/40"}`} />
                          {job.status}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="flex flex-wrap gap-3 text-xs text-muted-foreground mb-3">
                        <span className="flex items-center gap-1"><MapPin size={12} /> {job.location}</span>
                        <span className="flex items-center gap-1"><Briefcase size={12} /> {job.modality}</span>
                        <span className="flex items-center gap-1">{job.seniority}</span>
                        <span className="flex items-center gap-1">{job.minExperienceYears > 0 ? `${job.minExperienceYears}+ años exp.` : "Sin experiencia mínima"}</span>
                      </div>
                      <div className="flex flex-wrap gap-1.5 mb-4">
                        {job.techRequirements.slice(0, 4).map((t) => (
                          <Badge key={t} variant="outline" className="text-xs">{t}</Badge>
                        ))}
                        {job.techRequirements.length > 4 && <Badge variant="outline" className="text-xs">+{job.techRequirements.length - 4}</Badge>}
                      </div>
                      <div className="flex gap-2">
                        <Button variant="secondary" className="flex-1 gap-2" onClick={() => openApplicants(job)} data-testid={`button-applicants-${job.id}`}>
                          <Users size={16} /> {job.applicantsCount} postulante{job.applicantsCount === 1 ? "" : "s"}
                        </Button>
                        <Button variant="outline" onClick={() => toggleJobStatus(job)} data-testid={`button-toggle-${job.id}`}>
                          {job.status === "publicada" ? "Cerrar" : "Reabrir"}
                        </Button>
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => setJobToDelete(job)}
                          data-testid={`button-delete-${job.id}`}
                          className="text-red-400 hover:text-red-300 hover:bg-red-500/10 hover:border-red-500/40 shrink-0"
                          aria-label="Eliminar oferta"
                        >
                          <Trash2 size={16} />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="perfil">
            <Card className="max-w-2xl">
              <CardHeader>
                <CardTitle>Perfil de la empresa</CardTitle>
                <p className="text-sm text-muted-foreground">Esta información es visible para los egresados que revisan tus ofertas.</p>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <Label className="mb-2 block">Nombre de la empresa</Label>
                  <Input value={companyName} onChange={(e) => setCompanyName(e.target.value)} data-testid="input-company-name" />
                </div>
                <div>
                  <Label className="mb-2 block">Sector</Label>
                  <Input value={sector} onChange={(e) => setSector(e.target.value)} placeholder="Ej. Tecnología, Retail, Banca..." data-testid="input-sector" />
                </div>
                <div>
                  <Label className="mb-2 block">Descripción</Label>
                  <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={4} placeholder="Cuéntale a los egresados sobre tu empresa" data-testid="input-description" />
                </div>
                <Button onClick={saveProfile} disabled={savingProfile} data-testid="button-save-company-profile" className="bg-gradient-to-r from-primary to-secondary">
                  {savingProfile ? "Guardando..." : "Guardar perfil"}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>

      {/* Crear oferta */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Publicar nueva oferta laboral</DialogTitle>
            <DialogDescription>Detalla los requisitos técnicos y las habilidades blandas para calcular el % de match con cada egresado.</DialogDescription>
          </DialogHeader>
          <div className="space-y-5">
            <div>
              <Label className="mb-2 block">Título del puesto</Label>
              <Input value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} placeholder="Ej. Desarrollador Frontend Junior" data-testid="input-job-title" />
            </div>
            <div>
              <Label className="mb-2 block">Descripción</Label>
              <Textarea value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} rows={4} placeholder="Responsabilidades, equipo, beneficios..." data-testid="input-job-description" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <Label className="mb-2 block">Modalidad</Label>
                <Select value={form.modality} onValueChange={(v) => setForm((f) => ({ ...f, modality: v }))}>
                  <SelectTrigger data-testid="select-modality"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Remoto">Remoto</SelectItem>
                    <SelectItem value="Híbrido">Híbrido</SelectItem>
                    <SelectItem value="Presencial">Presencial</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="mb-2 block">Seniority</Label>
                <Select value={form.seniority} onValueChange={(v) => setForm((f) => ({ ...f, seniority: v }))}>
                  <SelectTrigger data-testid="select-seniority"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Practicante">Practicante</SelectItem>
                    <SelectItem value="Junior">Junior</SelectItem>
                    <SelectItem value="Semi Senior">Semi Senior</SelectItem>
                    <SelectItem value="Senior">Senior</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="mb-2 block">Años de experiencia mínimos</Label>
                <Input
                  type="number"
                  min={0}
                  step={0.5}
                  value={form.minExperienceYears}
                  onChange={(e) => setForm((f) => ({ ...f, minExperienceYears: Math.max(0, Number(e.target.value) || 0) }))}
                  data-testid="input-job-min-experience"
                />
                <p className="text-[11px] text-muted-foreground mt-1">Referencia: Junior 0, Semi Senior 2+, Senior 4+</p>
              </div>
              <div>
                <Label className="mb-2 block">Ubicación</Label>
                <Input value={form.location} onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))} data-testid="input-job-location" />
              </div>
            </div>
            <div>
              <Label className="mb-2 block">Requisitos técnicos</Label>
              <TagEditor tags={form.techRequirements} onChange={(v) => setForm((f) => ({ ...f, techRequirements: v }))} placeholder="Ej. React, SQL, Python... (Enter para agregar)" />
            </div>
            <div>
              <Label className="mb-2 block">Habilidades blandas</Label>
              <TagEditor tags={form.softRequirements} onChange={(v) => setForm((f) => ({ ...f, softRequirements: v }))} placeholder="Ej. Trabajo en equipo, Comunicación..." />
            </div>
            <Button onClick={handleCreateJob} disabled={creating} data-testid="button-submit-job" className="w-full bg-gradient-to-r from-primary to-secondary">
              {creating ? "Publicando..." : "Publicar oferta"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Postulantes */}
      <Dialog open={!!applicantsJob} onOpenChange={(open) => !open && setApplicantsJob(null)}>
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Postulantes: {applicantsJob?.title}</DialogTitle>
            <DialogDescription>Ordenados por % de coincidencia con la oferta.</DialogDescription>
          </DialogHeader>
          {loadingApplicants ? (
            <p className="text-muted-foreground">Cargando postulantes...</p>
          ) : applicants.length === 0 ? (
            <EmptyState icon={Users} title="Todavía no hay postulantes" description="En cuanto un egresado postule a esta oferta, aparecerá aquí ordenado por su % de coincidencia." />
          ) : (
            <div className="space-y-4">
              {applicants.map((a, i) => {
                const meta = statusMeta(a.status);
                const StatusIcon = meta.icon;
                return (
                  <Card key={a.applicationId} className={i === 0 ? "border-primary/40" : undefined} data-testid={`card-applicant-${a.applicationId}`}>
                    <CardHeader className="pb-2">
                      <div className="flex items-start justify-between gap-4 flex-wrap">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-11 h-11 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-sm font-bold text-white shrink-0">
                            {initials(a.egresado.name)}
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <CardTitle className="text-lg truncate">{a.egresado.name}</CardTitle>
                              {i === 0 && <Badge className="bg-primary/20 text-primary border-primary/40 text-[10px] shrink-0">Mejor match</Badge>}
                            </div>
                            <p className="text-sm text-muted-foreground truncate">{a.egresado.career || "Carrera no especificada"}</p>
                            <p className="text-xs text-muted-foreground flex items-center gap-1 truncate"><Mail size={11} /> {a.egresado.email}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3 shrink-0">
                          <Select value={a.status} onValueChange={(v) => handleStatusChange(a.applicationId, v as ApplicationStatus)}>
                            <SelectTrigger
                              className={`h-8 w-[150px] text-xs gap-1 border ${meta.badgeClass}`}
                              data-testid={`select-status-${a.applicationId}`}
                            >
                              <StatusIcon size={12} className="shrink-0" />
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {(Object.keys(STATUS_META) as ApplicationStatus[]).map((s) => (
                                <SelectItem key={s} value={s}>{STATUS_META[s].label}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <MatchRing score={a.matchScore} size={56} strokeWidth={5} />
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="mb-4">
                        <SkillMatchBreakdown
                          techMatched={a.matchedTech}
                          techMissing={a.missingTech}
                          softMatched={a.matchedSoft}
                          softMissing={a.missingSoft}
                        />
                        {a.matchedTech.length + a.missingTech.length + a.matchedSoft.length + a.missingSoft.length === 0 && (
                          <span className="text-xs text-muted-foreground">Este egresado no registró habilidades en su perfil.</span>
                        )}
                      </div>
                      <div className="mb-4">
                        <ExperienceFit requiredYears={a.requiredYears} candidateYears={a.candidateYears} meetsExperience={a.meetsExperience} />
                      </div>
                      <button
                        type="button"
                        onClick={() => handleDownloadCv(a.applicationId, a.cvFileName)}
                        className="inline-flex items-center gap-2 text-sm text-primary hover:underline mb-4"
                        data-testid={`link-cv-${a.applicationId}`}
                      >
                        <Download size={14} /> Descargar CV ({a.cvFileName})
                      </button>

                      {a.suggestedCourses.length > 0 && (
                        <div className="border-t border-white/10 pt-4">
                          <p className="text-sm font-semibold mb-2 flex items-center gap-1">
                            <GraduationCap size={14} className="text-primary" /> Cursos sugeridos para este candidato
                          </p>
                          <div className="grid sm:grid-cols-2 gap-2">
                            {a.suggestedCourses.map((c) => (
                              <a key={c.id} href={c.url} target="_blank" rel="noreferrer" className="glass p-3 rounded-xl text-xs flex items-center justify-between gap-2 hover:bg-white/10 transition-colors">
                                <span>
                                  <span className="font-semibold block">{c.title}</span>
                                  <span className="text-muted-foreground">{c.provider} · {c.level}</span>
                                </span>
                                <ExternalLink size={14} className="shrink-0 text-primary" />
                              </a>
                            ))}
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Confirmar eliminación de oferta */}
      <AlertDialog open={!!jobToDelete} onOpenChange={(open) => !open && !deletingJob && setJobToDelete(null)}>
        <AlertDialogContent data-testid="dialog-confirm-delete-job">
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar esta oferta?</AlertDialogTitle>
            <AlertDialogDescription>
              Vas a eliminar <span className="font-semibold text-foreground">"{jobToDelete?.title}"</span>.
              {jobToDelete && jobToDelete.applicantsCount > 0
                ? ` La oferta dejará de estar visible y sus ${jobToDelete.applicantsCount} postulante(s) la verán marcada como "eliminada". Esta acción no se puede deshacer.`
                : " La oferta dejará de estar visible. Esta acción no se puede deshacer."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deletingJob}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                handleDeleteJob();
              }}
              disabled={deletingJob}
              data-testid="button-confirm-delete-job"
              className="bg-red-500 hover:bg-red-500/90 text-white"
            >
              {deletingJob ? "Eliminando..." : "Sí, eliminar"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
