import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import {
  Briefcase,
  MapPin,
  Building2,
  LogOut,
  GraduationCap,
  Plus,
  X,
  Upload,
  FileText,
  ExternalLink,
  CheckCircle2,
  Sparkles,
  TrendingUp,
  Send,
  UserCircle2,
  Search,
  Trash2,
  ArrowUpDown,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { useAuth, EgresadoProfile, WorkExperience } from "@/lib/auth-context";
import { api, profileCvDownloadHref } from "@/lib/api";
import { toast } from "@/hooks/use-toast";
import { MatchRing } from "@/components/match-ring";
import { StatCard } from "@/components/stat-card";
import { EmptyState } from "@/components/empty-state";
import { SkillMatchBreakdown } from "@/components/skill-match-breakdown";
import { ExperienceFit } from "@/components/experience-fit";
import { statusMeta } from "@/lib/application-status";

type Job = {
  id: string;
  title: string;
  description: string;
  companyName: string;
  modality: string;
  location: string;
  seniority: string;
  minExperienceYears: number;
  techRequirements: string[];
  softRequirements: string[];
  matchScore?: number;
};

type JobDetail = Job & {
  missingTech?: string[];
  missingSoft?: string[];
  matchedTech?: string[];
  matchedSoft?: string[];
  experienceScore?: number;
  requiredYears?: number;
  candidateYears?: number;
  meetsExperience?: boolean;
  suggestedCourses?: { id: string; skill: string; title: string; provider: string; url: string; level: string }[];
};

type Application = {
  applicationId: string;
  status: string;
  appliedAt: string;
  cvFileName: string;
  job: { id: string; title: string; companyName: string; status: string } | null;
  matchScore: number;
  matchedTech: string[];
  matchedSoft: string[];
  missingTech: string[];
  missingSoft: string[];
  requiredYears: number;
  candidateYears: number;
  meetsExperience: boolean;
  suggestedCourses: { id: string; skill: string; title: string; provider: string; url: string; level: string }[];
};

function TagEditor({ label, tags, onChange, placeholder }: { label: string; tags: string[]; onChange: (tags: string[]) => void; placeholder: string }) {
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
      <Label className="mb-2 block">{label}</Label>
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
        {tags.length === 0 && <p className="text-xs text-muted-foreground">Aún no agregas habilidades.</p>}
      </div>
    </div>
  );
}

function JobCard({ job, onOpen, applied }: { job: Job; onOpen: () => void; applied?: boolean }) {
  return (
    <Card
      className="relative hover:border-primary/50 hover:-translate-y-0.5 transition-all cursor-pointer group overflow-hidden"
      onClick={onOpen}
      data-testid={`card-job-${job.id}`}
    >
      <div className="absolute top-0 inset-x-0 h-0.5 bg-gradient-to-r from-primary via-secondary to-[#3CC6E8] opacity-0 group-hover:opacity-100 transition-opacity" />
      {applied && (
        <Badge className="absolute top-4 right-4 z-10 bg-emerald-500/90 text-white gap-1 shadow-lg">
          <CheckCircle2 size={12} /> Postulado
        </Badge>
      )}
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <CardTitle className="text-lg leading-snug truncate">{job.title}</CardTitle>
            <p className="text-primary text-sm font-medium mt-1 flex items-center gap-1 truncate">
              <Building2 size={14} className="shrink-0" /> <span className="truncate">{job.companyName}</span>
            </p>
          </div>
          {typeof job.matchScore === "number" && !applied && <MatchRing score={job.matchScore} size={52} strokeWidth={4} />}
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap gap-3 text-xs text-muted-foreground mb-3">
          <span className="flex items-center gap-1"><MapPin size={12} /> {job.location}</span>
          <span className="flex items-center gap-1"><Briefcase size={12} /> {job.modality}</span>
          <span className="flex items-center gap-1"><GraduationCap size={12} /> {job.seniority}</span>
          <span className="flex items-center gap-1">{job.minExperienceYears > 0 ? `${job.minExperienceYears}+ años exp.` : "Sin experiencia mínima"}</span>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {job.techRequirements.slice(0, 4).map((t) => (
            <Badge key={t} variant="outline" className="text-xs">{t}</Badge>
          ))}
          {job.techRequirements.length > 4 && <Badge variant="outline" className="text-xs">+{job.techRequirements.length - 4}</Badge>}
        </div>
      </CardContent>
    </Card>
  );
}

export default function EgresadoDashboard() {
  const { user, logout, refreshUser } = useAuth();
  const [, setLocation] = useLocation();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [selectedJob, setSelectedJob] = useState<JobDetail | null>(null);
  const [loadingJobs, setLoadingJobs] = useState(true);
  const [applying, setApplying] = useState(false);
  const [cvFile, setCvFile] = useState<File | null>(null);
  const [useSavedCv, setUseSavedCv] = useState(false);

  const profile = user?.profile as EgresadoProfile | undefined;
  const [techSkills, setTechSkills] = useState<string[]>(profile?.techSkills || []);
  const [softSkills, setSoftSkills] = useState<string[]>(profile?.softSkills || []);
  const [bio, setBio] = useState(profile?.bio || "");
  const [career, setCareer] = useState(profile?.career || "");
  const [experiences, setExperiences] = useState<WorkExperience[]>(profile?.experiences || []);
  const [yearsOfExperience, setYearsOfExperience] = useState<number>(profile?.yearsOfExperience || 0);
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileCvFile, setProfileCvFile] = useState<File | null>(null);
  const [extractingCv, setExtractingCv] = useState(false);

  const appliedJobIds = new Set(applications.map((a) => a.job?.id).filter(Boolean));
  const [activeTab, setActiveTab] = useState("ofertas");

  const [jobSearch, setJobSearch] = useState("");
  const [jobSort, setJobSort] = useState<"match" | "recientes">("match");
  const [appToWithdraw, setAppToWithdraw] = useState<Application | null>(null);
  const [withdrawing, setWithdrawing] = useState(false);

  const filteredJobs = (() => {
    const q = jobSearch.trim().toLowerCase();
    const matches = jobs.filter((job) => {
      if (!q) return true;
      const haystack = [job.title, job.companyName, job.location, job.modality, job.seniority, ...job.techRequirements, ...job.softRequirements]
        .join(" ")
        .toLowerCase();
      return haystack.includes(q);
    });
    if (jobSort === "match") {
      return [...matches].sort((a, b) => (b.matchScore ?? -1) - (a.matchScore ?? -1));
    }
    // "recientes": el backend devuelve las ofertas de más antigua a más nueva.
    return [...matches].reverse();
  })();

  const loadJobs = async () => {
    setLoadingJobs(true);
    try {
      const data = await api.listJobs();
      setJobs(data.jobs);
    } catch (err) {
      toast({ title: "No se pudieron cargar las ofertas", variant: "destructive" });
    } finally {
      setLoadingJobs(false);
    }
  };

  const loadApplications = async () => {
    try {
      const data = await api.myApplications();
      setApplications(data.applications);
    } catch {
      // silencioso
    }
  };

  useEffect(() => {
    loadJobs();
    loadApplications();
  }, []);

  useEffect(() => {
    setTechSkills(profile?.techSkills || []);
    setSoftSkills(profile?.softSkills || []);
    setBio(profile?.bio || "");
    setCareer(profile?.career || "");
    setExperiences(profile?.experiences || []);
    setYearsOfExperience(profile?.yearsOfExperience || 0);
  }, [user]);

  const openJob = async (id: string) => {
    try {
      const data = await api.getJob(id);
      setSelectedJob(data.job);
      setCvFile(null);
      setUseSavedCv(!!profile?.cvFileName);
    } catch {
      toast({ title: "No se pudo abrir la oferta", variant: "destructive" });
    }
  };

  // Si llegamos aquí desde la landing con "Postular" a una oferta específica
  // (?apply=<jobId>), abrimos esa oferta automáticamente.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const jobId = params.get("apply");
    if (jobId) {
      setActiveTab("ofertas");
      openJob(jobId);
      window.history.replaceState({}, "", "/egresado");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);


  const handleApply = async () => {
    if (!selectedJob) return;
    if (!cvFile && !useSavedCv) return;
    setApplying(true);
    try {
      await api.applyToJob(selectedJob.id, useSavedCv ? { useProfileCv: true } : { file: cvFile! });
      toast({ title: "¡Postulación enviada!", description: "La empresa ya puede ver tu % de match y tu CV." });
      setSelectedJob(null);
      setCvFile(null);
      await loadApplications();
    } catch (err) {
      toast({ title: err instanceof Error ? err.message : "No se pudo postular", variant: "destructive" });
    } finally {
      setApplying(false);
    }
  };

  const handleWithdraw = async () => {
    if (!appToWithdraw) return;
    setWithdrawing(true);
    try {
      await api.withdrawApplication(appToWithdraw.applicationId);
      toast({ title: "Postulación retirada", description: "Ya no aparecerás como postulante en esta oferta. Puedes volver a postular cuando quieras." });
      setAppToWithdraw(null);
      await loadApplications();
    } catch (err) {
      toast({ title: err instanceof Error ? err.message : "No se pudo retirar la postulación", variant: "destructive" });
    } finally {
      setWithdrawing(false);
    }
  };

  const handleExtractCv = async () => {
    if (!profileCvFile) return;
    setExtractingCv(true);
    try {
      const data = await api.uploadProfileCv(profileCvFile);
      const extractedTech: string[] = data.extracted?.techSkills || [];
      const extractedSoft: string[] = data.extracted?.softSkills || [];
      const extractedExperience: { entries: WorkExperience[]; yearsOfExperience: number } = data.extracted?.experience || { entries: [], yearsOfExperience: 0 };

      setTechSkills((prev) => {
        const merged = [...prev];
        for (const s of extractedTech) if (!merged.some((m) => m.toLowerCase() === s.toLowerCase())) merged.push(s);
        return merged;
      });
      setSoftSkills((prev) => {
        const merged = [...prev];
        for (const s of extractedSoft) if (!merged.some((m) => m.toLowerCase() === s.toLowerCase())) merged.push(s);
        return merged;
      });
      if (extractedExperience.entries.length > 0) {
        setExperiences(extractedExperience.entries.map((e, i) => ({ id: `exp-${Date.now()}-${i}`, title: e.title, period: e.period })));
        setYearsOfExperience(extractedExperience.yearsOfExperience);
      }

      await refreshUser();
      setProfileCvFile(null);

      const totalFound = extractedTech.length + extractedSoft.length;
      if (data.extractionEmpty) {
        toast({ title: "CV guardado", description: "No pudimos leer texto del archivo, pero ya quedó guardado en tu perfil." });
      } else if (totalFound === 0 && extractedExperience.entries.length === 0) {
        toast({ title: "CV guardado", description: "No detectamos habilidades ni experiencia en el texto. Puedes agregarlas manualmente abajo." });
      } else {
        const parts = [`${extractedTech.length} técnicas y ${extractedSoft.length} blandas`];
        if (extractedExperience.entries.length > 0) {
          parts.push(`${extractedExperience.entries.length} experiencia(s) laboral(es) (~${extractedExperience.yearsOfExperience} años)`);
        }
        toast({
          title: "¡CV analizado!",
          description: `Detectamos ${parts.join(" y ")}. Revísalo abajo antes de guardar.`,
        });
      }
    } catch (err) {
      toast({ title: err instanceof Error ? err.message : "No se pudo analizar el CV", variant: "destructive" });
    } finally {
      setExtractingCv(false);
    }
  };

  const removeExperience = (id: string) => {
    setExperiences((prev) => prev.filter((e) => e.id !== id));
  };

  const saveProfile = async () => {
    setSavingProfile(true);
    try {
      await api.updateEgresadoProfile({ techSkills, softSkills, bio, career, yearsOfExperience, experiences });
      await refreshUser();
      toast({ title: "Perfil actualizado", description: "Tu % de match se recalculará en cada oferta." });
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
          <span className="text-xl font-extrabold tracking-tighter text-gradient">SUBEYA</span>
          <div className="flex items-center gap-4">
            <div className="text-sm text-right hidden sm:block">
              <div className="font-semibold">{user?.name}</div>
              <div className="text-xs text-muted-foreground">Egresado</div>
            </div>
            <Button variant="ghost" size="icon" onClick={() => { logout(); setLocation("/"); }} data-testid="button-logout">
              <LogOut size={18} />
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-6 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold mb-1">Hola, {user?.name?.split(" ")[0]} 👋</h1>
          <p className="text-muted-foreground text-sm">Este es el resumen de tu búsqueda laboral en SUBEYA.</p>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
          <StatCard icon={Briefcase} label="Ofertas disponibles" value={jobs.length} accent="text-[#3CC6E8]" />
          <StatCard icon={Send} label="Postulaciones enviadas" value={applications.length} accent="text-primary" />
          <StatCard
            icon={TrendingUp}
            label="Match promedio"
            value={applications.length ? `${Math.round(applications.reduce((sum, a) => sum + a.matchScore, 0) / applications.length)}%` : "—"}
            accent="text-emerald-400"
          />
          <StatCard icon={UserCircle2} label="Habilidades en tu perfil" value={techSkills.length + softSkills.length} accent="text-secondary" />
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-8">
            <TabsTrigger value="ofertas" data-testid="tab-ofertas">Ofertas laborales</TabsTrigger>
            <TabsTrigger value="postulaciones" data-testid="tab-postulaciones">Mis postulaciones</TabsTrigger>
            <TabsTrigger value="perfil" data-testid="tab-perfil">Mi perfil</TabsTrigger>
          </TabsList>

          <TabsContent value="ofertas">
            {loadingJobs ? (
              <p className="text-muted-foreground">Cargando ofertas...</p>
            ) : jobs.length === 0 ? (
              <EmptyState icon={Search} title="Todavía no hay ofertas publicadas" description="Vuelve pronto: en cuanto una empresa publique una vacante, aparecerá aquí con tu % de match." />
            ) : (
              <>
                <div className="flex flex-col sm:flex-row gap-3 mb-6">
                  <div className="relative flex-1">
                    <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      value={jobSearch}
                      onChange={(e) => setJobSearch(e.target.value)}
                      placeholder="Buscar por puesto, empresa, habilidad o ubicación..."
                      className="pl-9"
                      data-testid="input-search-jobs"
                    />
                  </div>
                  <Select value={jobSort} onValueChange={(v) => setJobSort(v as "match" | "recientes")}>
                    <SelectTrigger className="w-full sm:w-[210px] gap-2" data-testid="select-sort-jobs">
                      <ArrowUpDown size={14} className="shrink-0 text-muted-foreground" />
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="match">Mayor % de match</SelectItem>
                      <SelectItem value="recientes">Más recientes</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {filteredJobs.length === 0 ? (
                  <EmptyState icon={Search} title="Sin resultados" description={`No encontramos ofertas que coincidan con "${jobSearch}". Prueba con otra palabra.`} />
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                    {filteredJobs.map((job) => (
                      <JobCard key={job.id} job={job} onOpen={() => openJob(job.id)} applied={appliedJobIds.has(job.id)} />
                    ))}
                  </div>
                )}
              </>
            )}
          </TabsContent>

          <TabsContent value="postulaciones">
            {applications.length === 0 ? (
              <EmptyState icon={Send} title="Aún no has postulado a ninguna oferta" description="Explora las ofertas publicadas y postula subiendo tu CV para empezar a recibir seguimiento aquí." />
            ) : (
              <div className="space-y-5">
                {applications.map((app) => {
                  const meta = statusMeta(app.status);
                  const StatusIcon = meta.icon;
                  return (
                    <Card key={app.applicationId} data-testid={`card-application-${app.applicationId}`}>
                      <CardHeader className="pb-2">
                        <div className="flex items-start justify-between gap-4 flex-wrap">
                          <div>
                            <CardTitle className="text-lg">{app.job?.title || "Oferta eliminada"}</CardTitle>
                            <p className="text-primary text-sm font-medium mt-1">{app.job?.companyName}</p>
                          </div>
                          <div className="flex items-center gap-4">
                            <div className="text-right">
                              <Badge className={`gap-1 border ${meta.badgeClass}`}>
                                <StatusIcon size={12} /> {meta.label}
                              </Badge>
                              <p className="text-[11px] text-muted-foreground mt-1 max-w-[180px]">{meta.description}</p>
                            </div>
                            <MatchRing score={app.matchScore} size={52} strokeWidth={4} />
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="flex items-center justify-between gap-3 mb-4 flex-wrap">
                          <p className="text-xs text-muted-foreground flex items-center gap-1">
                            <FileText size={12} /> CV enviado: {app.cvFileName}
                          </p>
                          {app.status !== "aceptado" && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setAppToWithdraw(app)}
                              data-testid={`button-withdraw-${app.applicationId}`}
                              className="h-8 text-red-400 hover:text-red-300 hover:bg-red-500/10 gap-1.5"
                            >
                              <Trash2 size={14} /> Retirar postulación
                            </Button>
                          )}
                        </div>

                        <div className="mb-4">
                          <SkillMatchBreakdown
                            techMatched={app.matchedTech}
                            techMissing={app.missingTech}
                            softMatched={app.matchedSoft}
                            softMissing={app.missingSoft}
                          />
                        </div>

                        <div className="mb-4">
                          <ExperienceFit requiredYears={app.requiredYears} candidateYears={app.candidateYears} meetsExperience={app.meetsExperience} />
                        </div>

                        {app.suggestedCourses.length > 0 && (
                          <div className="border-t border-white/10 pt-4">
                            <p className="text-sm font-semibold mb-2 flex items-center gap-1">
                              <GraduationCap size={14} className="text-primary" /> Cursos sugeridos para mejorar tu match
                            </p>
                            <div className="grid sm:grid-cols-2 gap-2">
                              {app.suggestedCourses.map((c) => (
                                <a
                                  key={c.id}
                                  href={c.url}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="glass p-3 rounded-xl text-xs flex items-center justify-between gap-2 hover:bg-white/10 transition-colors"
                                >
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
          </TabsContent>

          <TabsContent value="perfil">
            <Card className="max-w-2xl mb-6 border-primary/30">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles size={18} className="text-primary" /> Completa tu perfil con tu CV
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  Sube tu CV en PDF o Word (.docx) y detectamos automáticamente tus habilidades técnicas y blandas
                  para agregarlas a tu perfil. Luego puedes revisarlas, quitar las que no apliquen y sumar más a mano.
                </p>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                  <label className="flex-1 flex items-center gap-2 glass px-4 py-3 rounded-xl cursor-pointer hover:bg-white/10 transition-colors text-sm">
                    <Upload size={16} className="text-primary shrink-0" />
                    {profileCvFile ? profileCvFile.name : "Selecciona tu archivo de CV"}
                    <input
                      type="file"
                      accept=".pdf,.docx"
                      className="hidden"
                      data-testid="input-profile-cv-file"
                      onChange={(e) => setProfileCvFile(e.target.files?.[0] || null)}
                    />
                  </label>
                  <Button
                    onClick={handleExtractCv}
                    disabled={!profileCvFile || extractingCv}
                    data-testid="button-extract-cv"
                    className="bg-gradient-to-r from-primary to-secondary shrink-0"
                  >
                    {extractingCv ? "Analizando CV..." : "Extraer habilidades"}
                  </Button>
                </div>

                {profile?.cvFileName && (
                  <a
                    href={profileCvDownloadHref()}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 text-sm text-primary hover:underline"
                    data-testid="link-profile-cv"
                  >
                    <FileText size={14} /> Ver el CV guardado en tu perfil ({profile.cvOriginalName})
                  </a>
                )}
              </CardContent>
            </Card>

            <Card className="max-w-2xl">
              <CardHeader>
                <CardTitle>Mi perfil de egresado</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Estas habilidades se usan para calcular tu % de coincidencia con cada oferta. Mantenlas actualizadas.
                </p>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <Label className="mb-2 block">Carrera</Label>
                  <Input value={career} onChange={(e) => setCareer(e.target.value)} placeholder="Ej. Ingeniería de Sistemas" data-testid="input-career" />
                </div>
                <div>
                  <Label className="mb-2 block">Sobre mí</Label>
                  <Textarea value={bio} onChange={(e) => setBio(e.target.value)} placeholder="Cuéntale a las empresas sobre ti" rows={3} data-testid="input-bio" />
                </div>
                <TagEditor label="Habilidades técnicas" tags={techSkills} onChange={setTechSkills} placeholder="Ej. React, SQL, Python..." />
                <TagEditor label="Habilidades blandas" tags={softSkills} onChange={setSoftSkills} placeholder="Ej. Trabajo en equipo, Liderazgo..." />

                <div>
                  <Label className="mb-2 block">Años de experiencia</Label>
                  <div className="flex items-center gap-3">
                    <Input
                      type="number"
                      min={0}
                      step={0.5}
                      value={yearsOfExperience}
                      onChange={(e) => setYearsOfExperience(Math.max(0, Number(e.target.value) || 0))}
                      className="w-28"
                      data-testid="input-years-experience"
                    />
                    <p className="text-xs text-muted-foreground">
                      Se autocompleta al subir tu CV, pero puedes corregirlo aquí si algo no se detectó bien.
                    </p>
                  </div>
                </div>

                {experiences.length > 0 && (
                  <div>
                    <Label className="mb-2 block">Experiencia detectada en tu CV</Label>
                    <div className="space-y-2">
                      {experiences.map((exp) => (
                        <div key={exp.id} className="flex items-start justify-between gap-3 glass rounded-xl px-4 py-3">
                          <div className="min-w-0">
                            <p className="text-sm font-medium truncate">{exp.title}</p>
                            <p className="text-xs text-muted-foreground">{exp.period}</p>
                          </div>
                          <button
                            type="button"
                            onClick={() => removeExperience(exp.id)}
                            data-testid={`button-remove-experience-${exp.id}`}
                            className="shrink-0 rounded-full hover:bg-white/10 p-1.5 text-white/40 hover:text-white/70 transition-colors"
                          >
                            <X size={14} />
                          </button>
                        </div>
                      ))}
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">
                      Si quitas alguna entrada que no corresponde, recuerda ajustar los años de experiencia de arriba.
                    </p>
                  </div>
                )}

                <Button onClick={saveProfile} disabled={savingProfile} data-testid="button-save-profile" className="bg-gradient-to-r from-primary to-secondary">
                  {savingProfile ? "Guardando..." : "Guardar perfil"}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

      </main>

      <Dialog open={!!selectedJob} onOpenChange={(open) => !open && setSelectedJob(null)}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          {selectedJob && (
            <>
              <DialogHeader>
                <DialogTitle className="text-2xl">{selectedJob.title}</DialogTitle>
                <DialogDescription className="flex items-center gap-1 text-primary font-medium">
                  <Building2 size={14} /> {selectedJob.companyName}
                </DialogDescription>
              </DialogHeader>

              {typeof selectedJob.matchScore === "number" && (
                <div className="glass-card rounded-2xl p-4 flex items-center gap-4">
                  <MatchRing score={selectedJob.matchScore} size={64} strokeWidth={5} label="" />
                  <div className="flex-1">
                    <p className="text-sm font-semibold mb-0.5">Tu % de coincidencia con esta oferta</p>
                    <p className="text-xs text-muted-foreground">
                      {selectedJob.matchScore >= 75
                        ? "¡Excelente compatibilidad! Tu perfil cubre casi todos los requisitos."
                        : selectedJob.matchScore >= 45
                        ? "Buena base. Revisa los cursos sugeridos para acercarte más al perfil ideal."
                        : "Compatibilidad baja todavía. Los cursos sugeridos pueden ayudarte a cerrar la brecha."}
                    </p>
                  </div>
                </div>
              )}

              <p className="text-sm text-muted-foreground whitespace-pre-line">{selectedJob.description}</p>

              <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                <span className="flex items-center gap-1"><MapPin size={12} /> {selectedJob.location}</span>
                <span className="flex items-center gap-1"><Briefcase size={12} /> {selectedJob.modality}</span>
                <span className="flex items-center gap-1"><GraduationCap size={12} /> {selectedJob.seniority}</span>
              </div>

              <div>
                <p className="text-sm font-semibold mb-3">Requisitos de la oferta</p>
                <SkillMatchBreakdown
                  techMatched={selectedJob.matchedTech || []}
                  techMissing={selectedJob.missingTech || selectedJob.techRequirements}
                  softMatched={selectedJob.matchedSoft || []}
                  softMissing={selectedJob.missingSoft || selectedJob.softRequirements}
                />
              </div>

              {typeof selectedJob.requiredYears === "number" && (
                <ExperienceFit
                  requiredYears={selectedJob.requiredYears}
                  candidateYears={selectedJob.candidateYears || 0}
                  meetsExperience={!!selectedJob.meetsExperience}
                />
              )}

              {selectedJob.suggestedCourses && selectedJob.suggestedCourses.length > 0 && (
                <div>
                  <p className="text-sm font-semibold mb-2 flex items-center gap-1">
                    <GraduationCap size={14} className="text-primary" /> Cursos sugeridos para mejorar tu match
                  </p>
                  <div className="grid sm:grid-cols-2 gap-2">
                    {selectedJob.suggestedCourses.map((c) => (
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

              {appliedJobIds.has(selectedJob.id) ? (
                <div className="glass p-4 rounded-xl text-sm flex items-center gap-2 text-emerald-400">
                  <CheckCircle2 size={16} /> Ya postulaste a esta oferta.
                </div>
              ) : (
                <div className="border-t border-white/10 pt-4 space-y-3">
                  <Label className="block">Postular con tu CV</Label>

                  {profile?.cvFileName && (
                    <button
                      type="button"
                      onClick={() => setUseSavedCv(true)}
                      data-testid="option-use-saved-cv"
                      className={`w-full flex items-center gap-3 p-3 rounded-xl border text-left transition-colors ${useSavedCv ? "border-primary/60 bg-primary/10" : "border-white/10 hover:border-white/20"}`}
                    >
                      <FileText size={16} className="text-primary shrink-0" />
                      <span className="text-sm">
                        Usar el CV de mi perfil <span className="text-muted-foreground">({profile.cvOriginalName})</span>
                      </span>
                      {useSavedCv && <CheckCircle2 size={16} className="text-primary ml-auto shrink-0" />}
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => setUseSavedCv(false)}
                    data-testid="option-use-new-cv"
                    className={`w-full flex items-center gap-3 p-3 rounded-xl border text-left transition-colors ${!useSavedCv ? "border-primary/60 bg-primary/10" : "border-white/10 hover:border-white/20"}`}
                  >
                    <Upload size={16} className="text-primary shrink-0" />
                    <span className="text-sm">Subir un CV distinto para esta postulación</span>
                    {!useSavedCv && <CheckCircle2 size={16} className="text-primary ml-auto shrink-0" />}
                  </button>

                  {!useSavedCv && (
                    <label className="flex items-center gap-2 glass px-4 py-3 rounded-xl cursor-pointer hover:bg-white/10 transition-colors text-sm">
                      <Upload size={16} className="text-primary shrink-0" />
                      {cvFile ? cvFile.name : "Selecciona tu archivo de CV (PDF o Word)"}
                      <input
                        type="file"
                        accept=".pdf,.docx"
                        className="hidden"
                        data-testid="input-cv-file"
                        onChange={(e) => setCvFile(e.target.files?.[0] || null)}
                      />
                    </label>
                  )}

                  <Button
                    onClick={handleApply}
                    disabled={applying || (useSavedCv ? !profile?.cvFileName : !cvFile)}
                    data-testid="button-apply"
                    className="w-full bg-gradient-to-r from-primary to-secondary"
                  >
                    {applying ? "Enviando..." : "Postular"}
                  </Button>
                </div>

              )}
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Confirmar retiro de postulación */}
      <AlertDialog open={!!appToWithdraw} onOpenChange={(open) => !open && !withdrawing && setAppToWithdraw(null)}>
        <AlertDialogContent data-testid="dialog-confirm-withdraw">
          <AlertDialogHeader>
            <AlertDialogTitle>¿Retirar tu postulación?</AlertDialogTitle>
            <AlertDialogDescription>
              Vas a retirar tu postulación a <span className="font-semibold text-foreground">"{appToWithdraw?.job?.title || "esta oferta"}"</span>.
              La empresa dejará de verte como postulante. Podrás volver a postular más adelante si la oferta sigue abierta.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={withdrawing}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                handleWithdraw();
              }}
              disabled={withdrawing}
              data-testid="button-confirm-withdraw"
              className="bg-red-500 hover:bg-red-500/90 text-white"
            >
              {withdrawing ? "Retirando..." : "Sí, retirar"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
