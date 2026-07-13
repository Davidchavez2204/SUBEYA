import { useEffect, useState, ReactNode } from "react";
import { Switch, Route, Router as WouterRouter, useLocation, Redirect } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { motion, useScroll, useTransform, AnimatePresence } from "framer-motion";
import {
  Briefcase,
  Award,
  Building,
  CheckCircle2,
  Target,
  Instagram,
  Facebook,
  Linkedin,
  Menu,
  X,
  Eye,
  EyeOff,
  Mail,
  Lock,
  User,
  ArrowRight,
  Sparkles,
  GraduationCap,
  MapPin,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { AuthProvider, useAuth } from "@/lib/auth-context";
import { api, getToken } from "@/lib/api";
import { toast } from "@/hooks/use-toast";
import EgresadoDashboard from "@/pages/egresado-dashboard";
import EmpresaDashboard from "@/pages/empresa-dashboard";
import NotFound from "@/pages/not-found";

type ModalTab = "registro" | "ingreso";
type RoleOption = "egresado" | "empresa";

type PublicJob = {
  id: string;
  title: string;
  companyName: string;
  modality: string;
  location: string;
  seniority: string;
  minExperienceYears: number;
  techRequirements: string[];
  softRequirements: string[];
};

const PENDING_JOB_KEY = "subeya_pending_job";

function AuthModal({ isOpen, onClose, defaultTab = "registro", defaultRole }: { isOpen: boolean; onClose: () => void; defaultTab?: ModalTab; defaultRole?: RoleOption }) {
  const { login, register } = useAuth();
  const [tab, setTab] = useState<ModalTab>(defaultTab);
  const [step, setStep] = useState(defaultRole ? 2 : 1);
  const [role, setRole] = useState<RoleOption | null>(defaultRole || null);
  const [showPassword, setShowPassword] = useState(false);
  const [form, setForm] = useState({ nombre: "", email: "", password: "" });
  const [loginForm, setLoginForm] = useState({ email: "", password: "" });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [, setLocation] = useLocation();

  useEffect(() => {
    setTab(defaultTab);
    setStep(defaultRole ? 2 : 1);
    setRole(defaultRole || null);
    setForm({ nombre: "", email: "", password: "" });
    setLoginForm({ email: "", password: "" });
    setError(null);
  }, [isOpen, defaultTab, defaultRole]);

  useEffect(() => {
    document.body.style.overflow = isOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  const goToDashboard = (userRole: RoleOption) => {
    onClose();
    const pendingJobId = sessionStorage.getItem(PENDING_JOB_KEY);
    sessionStorage.removeItem(PENDING_JOB_KEY);
    if (userRole === "egresado" && pendingJobId) {
      setLocation(`/egresado?apply=${pendingJobId}`);
    } else {
      setLocation(userRole === "empresa" ? "/empresa" : "/egresado");
    }
  };

  const handleRegister = async () => {
    if (!role) return;
    setError(null);
    setLoading(true);
    try {
      const user = await register({
        email: form.email.trim(),
        password: form.password,
        name: form.nombre.trim(),
        role,
        companyName: role === "empresa" ? form.nombre.trim() : undefined,
      });
      goToDashboard(user.role);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo crear la cuenta.");
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async () => {
    setError(null);
    setLoading(true);
    try {
      const user = await login(loginForm.email.trim(), loginForm.password);
      goToDashboard(user.role);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo iniciar sesión.");
    } finally {
      setLoading(false);
    }
  };

  const profileOptions = [
    { id: "egresado" as const, label: "Egresado", desc: "Busco empleo y quiero avanzar en mi carrera", icon: GraduationCap, color: "text-primary", border: "border-primary/60", bg: "bg-primary/10" },
    { id: "empresa" as const, label: "Empresa", desc: "Busco talento joven calificado", icon: Building, color: "text-[#3CC6E8]", border: "border-[#3CC6E8]/60", bg: "bg-[#3CC6E8]/10" },
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-[200] flex items-center justify-center p-4"
          onClick={onClose}
        >
          <div className="absolute inset-0 bg-black/60 backdrop-blur-md" />

          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 24 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 24 }}
            transition={{ type: "spring", bounce: 0.2, duration: 0.5 }}
            className="relative w-full max-w-md z-10"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="rounded-3xl border border-white/10 bg-[#0d0b1e]/90 backdrop-blur-2xl shadow-[0_0_80px_rgba(176,58,247,0.25)] overflow-hidden">
              <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-primary/60 to-transparent" />
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-32 bg-primary/20 blur-3xl pointer-events-none" />

              <div className="p-8 relative max-h-[85vh] overflow-y-auto">
                <button onClick={onClose} data-testid="button-close-modal" aria-label="Cerrar" className="absolute top-6 right-6 w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors">
                  <X size={16} />
                </button>

                <div className="flex items-center gap-2 mb-8">
                  <span className="text-xl font-extrabold tracking-tighter text-gradient">SUBEYA</span>
                  <Sparkles size={16} className="text-primary" />
                </div>

                <div className="flex gap-1 p-1 rounded-2xl bg-white/5 border border-white/10 mb-8">
                  {(["registro", "ingreso"] as ModalTab[]).map((t) => (
                    <button
                      key={t}
                      data-testid={`tab-${t}`}
                      onClick={() => {
                        setTab(t);
                        setStep(1);
                        setError(null);
                      }}
                      className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all capitalize ${tab === t ? "bg-gradient-to-r from-primary to-secondary text-white shadow-[0_0_16px_rgba(176,58,247,0.4)]" : "text-white/50 hover:text-white/80"}`}
                    >
                      {t === "registro" ? "Registrarse" : "Ingresar"}
                    </button>
                  ))}
                </div>

                {error && (
                  <div className="mb-5 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-sm">
                    {error}
                  </div>
                )}

                <AnimatePresence mode="wait">
                  {tab === "registro" ? (
                    <motion.div key="registro" initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 12 }} transition={{ duration: 0.2 }}>
                      {step === 1 ? (
                        <div>
                          <h2 className="text-2xl font-bold mb-1">Crea tu cuenta</h2>
                          <p className="text-white/50 text-sm mb-6">Selecciona tu perfil para empezar</p>
                          <div className="space-y-3 mb-6">
                            {profileOptions.map((opt) => (
                              <button
                                key={opt.id}
                                data-testid={`profile-type-${opt.id}`}
                                onClick={() => setRole(opt.id)}
                                className={`w-full flex items-center gap-4 p-4 rounded-2xl border transition-all text-left ${role === opt.id ? `${opt.border} ${opt.bg}` : "border-white/10 hover:border-white/20 hover:bg-white/5"}`}
                              >
                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${opt.bg} ${opt.color} shrink-0`}>
                                  <opt.icon size={20} />
                                </div>
                                <div>
                                  <div className="font-semibold text-white">{opt.label}</div>
                                  <div className="text-xs text-white/50">{opt.desc}</div>
                                </div>
                                {role === opt.id && <CheckCircle2 size={18} className={`ml-auto ${opt.color}`} />}
                              </button>
                            ))}
                          </div>
                          <Button
                            data-testid="button-next-step"
                            disabled={!role}
                            onClick={() => setStep(2)}
                            className="w-full h-12 rounded-xl bg-gradient-to-r from-primary to-secondary font-semibold text-white disabled:opacity-40 disabled:cursor-not-allowed shadow-[0_0_20px_rgba(176,58,247,0.3)] hover:opacity-90 transition-all"
                          >
                            Continuar <ArrowRight size={16} className="ml-2" />
                          </Button>
                        </div>
                      ) : (
                        <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.25 }}>
                          <div className="flex items-center gap-2 mb-6">
                            <button onClick={() => setStep(1)} className="w-7 h-7 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors">
                              <ArrowRight size={14} className="rotate-180" />
                            </button>
                            <div>
                              <h2 className="text-xl font-bold leading-none">Tus datos</h2>
                              <p className="text-white/40 text-xs mt-0.5">Perfil: {profileOptions.find((p) => p.id === role)?.label}</p>
                            </div>
                          </div>

                          <div className="space-y-4 mb-5">
                            <div className="relative">
                              <User size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40" />
                              <input
                                data-testid="input-nombre"
                                type="text"
                                aria-label={role === "empresa" ? "Nombre de la empresa" : "Nombre completo"}
                                placeholder={role === "empresa" ? "Nombre de la empresa" : "Nombre completo"}
                                value={form.nombre}
                                onChange={(e) => setForm((f) => ({ ...f, nombre: e.target.value }))}
                                className="w-full h-12 pl-10 pr-4 rounded-xl bg-white/5 border border-white/10 focus:border-primary/60 focus:bg-primary/5 outline-none text-sm text-white placeholder:text-white/30 transition-all"
                              />
                            </div>
                            <div className="relative">
                              <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40" />
                              <input
                                data-testid="input-email"
                                type="email"
                                aria-label="Correo electrónico"
                                placeholder="Correo electrónico"
                                value={form.email}
                                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                                className="w-full h-12 pl-10 pr-4 rounded-xl bg-white/5 border border-white/10 focus:border-primary/60 focus:bg-primary/5 outline-none text-sm text-white placeholder:text-white/30 transition-all"
                              />
                            </div>
                            <div className="relative">
                              <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40" />
                              <input
                                data-testid="input-password"
                                type={showPassword ? "text" : "password"}
                                aria-label="Contraseña"
                                placeholder="Contraseña (mínimo 6 caracteres)"
                                value={form.password}
                                onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                                className="w-full h-12 pl-10 pr-12 rounded-xl bg-white/5 border border-white/10 focus:border-primary/60 focus:bg-primary/5 outline-none text-sm text-white placeholder:text-white/30 transition-all"
                              />
                              <button type="button" onClick={() => setShowPassword((s) => !s)} aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"} className="absolute right-4 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/70 transition-colors">
                                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                              </button>
                            </div>
                          </div>

                          <Button
                            data-testid="button-crear-cuenta"
                            onClick={handleRegister}
                            disabled={loading || !form.nombre.trim() || !form.email.trim() || form.password.length < 6}
                            className="w-full h-12 rounded-xl bg-gradient-to-r from-primary to-secondary font-semibold text-white shadow-[0_0_20px_rgba(176,58,247,0.3)] hover:opacity-90 transition-all mb-4 disabled:opacity-40"
                          >
                            {loading ? "Creando cuenta..." : "Crear mi cuenta"}
                          </Button>
                        </motion.div>
                      )}
                    </motion.div>
                  ) : (
                    <motion.div key="ingreso" initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -12 }} transition={{ duration: 0.2 }}>
                      <h2 className="text-2xl font-bold mb-1">Bienvenido de vuelta</h2>
                      <p className="text-white/50 text-sm mb-6">Ingresa a tu cuenta de SUBEYA</p>

                      <div className="space-y-4 mb-5">
                        <div className="relative">
                          <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40" />
                          <input
                            data-testid="input-login-email"
                            type="email"
                            aria-label="Correo electrónico"
                            placeholder="Correo electrónico"
                            value={loginForm.email}
                            onChange={(e) => setLoginForm((f) => ({ ...f, email: e.target.value }))}
                            className="w-full h-12 pl-10 pr-4 rounded-xl bg-white/5 border border-white/10 focus:border-primary/60 focus:bg-primary/5 outline-none text-sm text-white placeholder:text-white/30 transition-all"
                          />
                        </div>
                        <div className="relative">
                          <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40" />
                          <input
                            data-testid="input-login-password"
                            type={showPassword ? "text" : "password"}
                            aria-label="Contraseña"
                            placeholder="Contraseña"
                            value={loginForm.password}
                            onChange={(e) => setLoginForm((f) => ({ ...f, password: e.target.value }))}
                            className="w-full h-12 pl-10 pr-12 rounded-xl bg-white/5 border border-white/10 focus:border-primary/60 focus:bg-primary/5 outline-none text-sm text-white placeholder:text-white/30 transition-all"
                          />
                          <button type="button" onClick={() => setShowPassword((s) => !s)} className="absolute right-4 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/70 transition-colors">
                            {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                          </button>
                        </div>
                      </div>

                      <Button
                        data-testid="button-ingresar"
                        onClick={handleLogin}
                        disabled={loading || !loginForm.email.trim() || !loginForm.password}
                        className="w-full h-12 rounded-xl bg-gradient-to-r from-primary to-secondary font-semibold text-white shadow-[0_0_20px_rgba(176,58,247,0.3)] hover:opacity-90 transition-all mb-4 disabled:opacity-40"
                      >
                        {loading ? "Ingresando..." : "Ingresar a mi cuenta"}
                      </Button>
                    </motion.div>
                  )}
                </AnimatePresence>

                <p className="text-center text-xs text-white/30 mt-6">
                  Al registrarte aceptas nuestros <a href="#" className="text-primary hover:underline">Términos</a> y <a href="#" className="text-primary hover:underline">Política de Privacidad</a>
                </p>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

const queryClient = new QueryClient();

function useDarkMode() {
  useEffect(() => {
    document.documentElement.classList.add("dark");
  }, []);
}

function SubeyaLanding() {
  useDarkMode();
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const { scrollY } = useScroll();
  const headerBg = useTransform(scrollY, [0, 100], ["rgba(10, 8, 20, 0)", "rgba(10, 8, 20, 0.8)"]);
  const headerBlur = useTransform(scrollY, [0, 100], ["blur(0px)", "blur(16px)"]);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [authModal, setAuthModal] = useState<{ open: boolean; tab: ModalTab; role?: RoleOption }>({ open: false, tab: "registro" });
  const [publicJobs, setPublicJobs] = useState<PublicJob[]>([]);
  const [loadingPublicJobs, setLoadingPublicJobs] = useState(true);

  const openRegister = () => setAuthModal({ open: true, tab: "registro" });
  const openLogin = () => setAuthModal({ open: true, tab: "ingreso" });
  const closeAuth = () => setAuthModal((s) => ({ ...s, open: false }));

  useEffect(() => {
    api
      .listJobs()
      .then((data) => setPublicJobs(data.jobs))
      .catch(() => {})
      .finally(() => setLoadingPublicJobs(false));
  }, []);

  const handleApplyClick = (job: PublicJob) => {
    if (user?.role === "egresado") {
      setLocation(`/egresado?apply=${job.id}`);
      return;
    }
    if (user?.role === "empresa") {
      toast({ title: "Esta cuenta es de empresa", description: "Inicia sesión con una cuenta de egresado para postular." });
      return;
    }
    sessionStorage.setItem(PENDING_JOB_KEY, job.id);
    setAuthModal({ open: true, tab: "registro", role: "egresado" });
  };

  const navItems = ["Inicio", "Cómo funciona", "Empleos", "Empresas"];

  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden selection:bg-primary/30">
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <motion.div animate={{ x: [0, 100, 0], y: [0, -50, 0], scale: [1, 1.2, 1] }} transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }} className="absolute top-[-10%] left-[-10%] w-[40vw] h-[40vw] rounded-full bg-primary/20 blur-[120px]" />
        <motion.div animate={{ x: [0, -100, 0], y: [0, 100, 0], scale: [1, 1.5, 1] }} transition={{ duration: 20, repeat: Infinity, ease: "easeInOut", delay: 2 }} className="absolute bottom-[-10%] right-[-10%] w-[50vw] h-[50vw] rounded-full bg-secondary/15 blur-[150px]" />
        <motion.div animate={{ x: [0, 50, 0], y: [0, 50, 0], scale: [1, 1.1, 1] }} transition={{ duration: 12, repeat: Infinity, ease: "easeInOut", delay: 5 }} className="absolute top-[40%] left-[60%] w-[30vw] h-[30vw] rounded-full bg-[#3CC6E8]/10 blur-[100px]" />
      </div>

      <motion.header style={{ backgroundColor: headerBg, backdropFilter: headerBlur }} className="fixed top-0 left-0 right-0 z-50 border-b border-white/5 transition-all duration-300">
        <div className="container mx-auto px-6 h-20 flex items-center justify-between">
          <span className="text-2xl font-extrabold tracking-tighter text-gradient">SUBEYA</span>

          <nav className="hidden lg:flex items-center gap-8 text-sm font-medium">
            {navItems.map((item) => (
              <a key={item} href={`#${item.toLowerCase().replace(/\s+/g, "-")}`} className="text-foreground/80 hover:text-white transition-colors">
                {item}
              </a>
            ))}
          </nav>

          <div className="hidden lg:flex items-center gap-4">
            <Button variant="ghost" onClick={openLogin} data-testid="button-ingresar-nav" className="text-foreground/80 hover:text-white hover:bg-white/5">Ingresar</Button>
            <Button onClick={openRegister} data-testid="button-registrarse-nav" className="bg-gradient-to-r from-primary to-secondary hover:opacity-90 shadow-[0_0_20px_rgba(176,58,247,0.3)] transition-all">Registrarse</Button>
          </div>

          <button className="lg:hidden text-white" onClick={() => setMobileMenuOpen(true)}>
            <Menu />
          </button>
        </div>
      </motion.header>

      <section id="inicio" className="relative pt-40 pb-20 lg:pt-56 lg:pb-32 px-6 z-10 flex flex-col items-center text-center">
        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }} className="max-w-4xl mx-auto flex flex-col items-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-primary/30 bg-primary/10 text-primary-foreground text-xs font-medium mb-8">
            <span className="flex h-2 w-2 rounded-full bg-primary animate-pulse"></span>
            Conectamos egresados con empresas, con % de coincidencia real
          </div>

          <h1 className="text-5xl lg:text-7xl font-extrabold tracking-tight leading-[1.1] mb-6">
            Encuentra tu match laboral con <span className="text-gradient">SUBEYA</span>
          </h1>

          <p className="text-lg lg:text-xl text-muted-foreground max-w-2xl mb-10">
            Las empresas publican ofertas con requisitos técnicos y blandos. Los egresados postulan subiendo solo su CV y ven al instante qué tan compatibles son — y qué cursos les faltan para mejorar.
          </p>

          <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto">
            <Button size="lg" onClick={openRegister} data-testid="button-soy-egresado" className="w-full sm:w-auto bg-gradient-to-r from-primary to-secondary text-white font-semibold h-14 px-8 rounded-full shadow-[0_0_30px_rgba(176,58,247,0.4)] hover:shadow-[0_0_40px_rgba(176,58,247,0.6)] transition-all">
              Soy egresado, buscar empleo
            </Button>
            <Button size="lg" variant="outline" onClick={openRegister} data-testid="button-soy-empresa" className="w-full sm:w-auto h-14 px-8 rounded-full glass border-white/20 hover:bg-white/10 transition-all font-semibold">
              Soy empresa, publicar oferta
            </Button>
          </div>
        </motion.div>

        <div className="absolute inset-0 pointer-events-none hidden lg:block">
          <motion.div animate={{ y: [0, -20, 0] }} transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }} className="absolute top-1/4 left-[15%] glass px-4 py-2 rounded-2xl flex items-center gap-2 border-l-4 border-l-[#5A82FF]">
            <Briefcase size={16} className="text-[#5A82FF]" />
            <span className="font-semibold text-sm">Ofertas laborales</span>
          </motion.div>
          <motion.div animate={{ y: [0, 20, 0] }} transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1 }} className="absolute top-1/3 right-[15%] glass px-4 py-2 rounded-2xl flex items-center gap-2 border-l-4 border-l-[#3CC6E8]">
            <Target size={16} className="text-[#3CC6E8]" />
            <span className="font-semibold text-sm">% de match</span>
          </motion.div>
          <motion.div animate={{ y: [0, -15, 0] }} transition={{ duration: 4.5, repeat: Infinity, ease: "easeInOut", delay: 0.5 }} className="absolute bottom-1/4 left-[20%] glass px-4 py-2 rounded-2xl flex items-center gap-2 border-l-4 border-l-primary">
            <Award size={16} className="text-primary" />
            <span className="font-semibold text-sm">Cursos sugeridos</span>
          </motion.div>
        </div>
      </section>

      <div className="relative z-10 container mx-auto px-6 space-y-32 pb-32">
        <section id="cómo-funciona">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-5xl font-bold mb-6">Cómo funciona <span className="text-gradient">el match</span></h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">Un algoritmo simple y transparente: 60% habilidades técnicas + 20% habilidades blandas + 20% experiencia laboral, extraída automáticamente de tu CV.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {[
              { title: "La empresa publica la oferta", desc: "Con requisitos técnicos y habilidades blandas específicas.", icon: Building, color: "text-[#3CC6E8]" },
              { title: "El egresado postula con su CV", desc: "Solo sube su CV en PDF o Word. Nada más.", icon: Briefcase, color: "text-primary" },
              { title: "Se calcula el % de coincidencia", desc: "Comparando el perfil del egresado contra los requisitos.", icon: Target, color: "text-[#5A82FF]" },
              { title: "Se sugieren cursos para mejorar", desc: "La plataforma recomienda cursos para cerrar la brecha.", icon: GraduationCap, color: "text-secondary" },
            ].map((item, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-100px" }} transition={{ duration: 0.5, delay: i * 0.1 }} whileHover={{ y: -5 }} className="glass-card p-6 rounded-2xl flex flex-col items-start gap-4 group">
                <div className={`p-3 rounded-xl bg-white/5 ${item.color} group-hover:scale-110 transition-transform`}>
                  <item.icon size={24} />
                </div>
                <h3 className="text-lg font-semibold">{item.title}</h3>
                <p className="text-sm text-muted-foreground">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </section>

        <section id="empleos">
          <div className="text-center mb-12">
            <h2 className="text-3xl lg:text-5xl font-bold mb-4">Empleos <span className="text-gradient">publicados ahora</span></h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Estas son ofertas reales publicadas por empresas en SUBEYA. Postula subiendo tu CV — si aún no tienes cuenta, te llevamos primero a crear tu perfil de egresado.
            </p>
          </div>

          {loadingPublicJobs ? (
            <p className="text-center text-muted-foreground">Cargando ofertas publicadas...</p>
          ) : publicJobs.length === 0 ? (
            <div className="glass-card max-w-xl mx-auto rounded-2xl p-10 text-center">
              <Briefcase className="mx-auto text-primary mb-4" size={32} />
              <p className="font-semibold mb-1">Todavía no hay ofertas publicadas</p>
              <p className="text-sm text-muted-foreground">En cuanto una empresa publique una vacante, aparecerá aquí para que puedas postular.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-10">
              {publicJobs.slice(0, 6).map((job, i) => (
                <motion.div
                  key={job.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-60px" }}
                  transition={{ duration: 0.4, delay: i * 0.05 }}
                  className="glass-card rounded-2xl p-6 flex flex-col gap-4 hover:border-primary/40 transition-colors"
                >
                  <div>
                    <h3 className="text-lg font-semibold leading-snug">{job.title}</h3>
                    <p className="text-primary text-sm font-medium mt-1 flex items-center gap-1">
                      <Building size={14} /> {job.companyName}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1"><MapPin size={12} /> {job.location}</span>
                    <span className="flex items-center gap-1"><Briefcase size={12} /> {job.modality}</span>
                    <span className="flex items-center gap-1"><GraduationCap size={12} /> {job.seniority}</span>
                    <span className="flex items-center gap-1">{job.minExperienceYears > 0 ? `${job.minExperienceYears}+ años` : "Sin experiencia mínima"}</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {job.techRequirements.slice(0, 3).map((t) => (
                      <span key={t} className="text-xs px-2 py-0.5 rounded-full border border-white/15 text-white/70">{t}</span>
                    ))}
                    {job.techRequirements.length > 3 && (
                      <span className="text-xs px-2 py-0.5 rounded-full border border-white/15 text-white/70">+{job.techRequirements.length - 3}</span>
                    )}
                  </div>
                  <Button
                    onClick={() => handleApplyClick(job)}
                    data-testid={`button-apply-landing-${job.id}`}
                    className="mt-auto bg-gradient-to-r from-primary to-secondary font-semibold"
                  >
                    Postular <ArrowRight size={16} className="ml-2" />
                  </Button>
                </motion.div>
              ))}
            </div>
          )}

          <div className="text-center">
            <Button size="lg" variant="outline" className="glass border-white/20 font-semibold" onClick={openRegister} data-testid="button-cta-egresado">
              Crear mi perfil de egresado <ArrowRight size={16} className="ml-2" />
            </Button>
          </div>
        </section>

        <section id="empresas" className="py-16 relative">
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-primary/5 to-transparent pointer-events-none"></div>
          <div className="text-center mb-12">
            <h2 className="text-3xl lg:text-5xl font-bold mb-4">Para <span className="text-gradient">Empresas</span></h2>
            <p className="text-muted-foreground text-lg">Publica vacantes, revisa candidatos ordenados por % de match y detecta brechas de habilidades.</p>
          </div>

          <div className="glass-card max-w-4xl mx-auto rounded-3xl p-8 md:p-12 text-center border-secondary/30">
            <Building className="mx-auto text-secondary mb-6" size={48} />
            <h3 className="text-2xl font-bold mb-8">Publica tus vacantes y conecta con el mejor talento</h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-10">
              {["Publicación de ofertas laborales", "Postulantes ordenados por % de match", "Brechas de habilidades por candidato"].map((label, i) => (
                <div key={i} className="glass p-4 rounded-xl text-sm font-medium">{label}</div>
              ))}
            </div>

            <Button size="lg" onClick={openRegister} data-testid="button-cta-empresa" className="bg-secondary hover:bg-secondary/80 text-white rounded-full px-8 h-12">
              Publicar mi primera oferta
            </Button>
          </div>
        </section>
      </div>

      <footer className="border-t border-white/10 bg-background/50 backdrop-blur-lg pt-20 pb-10">
        <div className="container mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10 mb-16">
            <div className="lg:col-span-1">
              <span className="text-3xl font-extrabold tracking-tighter text-gradient mb-6 block">SUBEYA</span>
              <p className="text-muted-foreground mb-6 max-w-sm">Conectando el talento joven peruano con las mejores oportunidades del mercado laboral.</p>
              <div className="flex gap-4">
                <a href="#" className="w-10 h-10 rounded-full glass flex items-center justify-center hover:bg-primary/20 hover:text-primary transition-colors"><Linkedin size={18} /></a>
                <a href="#" className="w-10 h-10 rounded-full glass flex items-center justify-center hover:bg-primary/20 hover:text-primary transition-colors"><Instagram size={18} /></a>
                <a href="#" className="w-10 h-10 rounded-full glass flex items-center justify-center hover:bg-primary/20 hover:text-primary transition-colors"><Facebook size={18} /></a>
              </div>
            </div>

            <div>
              <h4 className="font-bold mb-4">Plataforma</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#inicio" className="hover:text-primary transition-colors">Inicio</a></li>
                <li><a href="#empleos" className="hover:text-primary transition-colors">Empleos</a></li>
                <li><a href="#empresas" className="hover:text-primary transition-colors">Empresas</a></li>
              </ul>
            </div>

            <div>
              <h4 className="font-bold mb-4">Soporte</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#" className="hover:text-primary transition-colors">Centro de ayuda</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Términos y condiciones</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Privacidad</a></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-white/10 pt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-muted-foreground">
            <p>© {new Date().getFullYear()} SUBEYA. Todos los derechos reservados.</p>
            <p>Hecho con <span className="text-primary">♥</span> en Perú</p>
          </div>
        </div>
      </footer>

      <AuthModal isOpen={authModal.open} onClose={closeAuth} defaultTab={authModal.tab} defaultRole={authModal.role} />

      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div initial={{ opacity: 0, x: "100%" }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: "100%" }} transition={{ type: "spring", bounce: 0, duration: 0.4 }} className="fixed inset-0 z-[100] bg-background/95 backdrop-blur-xl p-6 flex flex-col">
            <div className="flex justify-between items-center mb-12">
              <span className="text-2xl font-extrabold text-gradient">SUBEYA</span>
              <button onClick={() => setMobileMenuOpen(false)} className="p-2 bg-white/10 rounded-full">
                <X />
              </button>
            </div>
            <nav className="flex flex-col gap-6 text-xl font-bold mb-auto">
              {navItems.map((item) => (
                <a key={item} href={`#${item.toLowerCase().replace(/\s+/g, "-")}`} onClick={() => setMobileMenuOpen(false)} className="border-b border-white/10 pb-4">
                  {item}
                </a>
              ))}
            </nav>
            <div className="flex flex-col gap-4 mt-8">
              <Button variant="outline" onClick={openLogin} data-testid="button-ingresar-mobile" className="w-full h-14 text-lg">Ingresar</Button>
              <Button onClick={openRegister} data-testid="button-registrarse-mobile" className="w-full h-14 text-lg bg-gradient-to-r from-primary to-secondary">Registrarse</Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function ProtectedRoute({ role, children }: { role: RoleOption; children: ReactNode }) {
  const { user, loading, refreshUser } = useAuth();
  useDarkMode();
  const [reconciling, setReconciling] = useState(false);

  // Justo después de iniciar sesión o registrarse, la navegación a /egresado o
  // /empresa puede ocurrir un instante antes de que el contexto de auth termine
  // de propagar el usuario recién autenticado (una condición de carrera entre el
  // cambio de ruta y el estado de React). En vez de redirigir de inmediato a "/"
  // cuando no hay usuario en contexto, verificamos si ya existe un token guardado
  // y, de ser así, confirmamos la sesión contra el backend antes de decidir.
  useEffect(() => {
    if (!loading && !user && getToken()) {
      setReconciling(true);
      refreshUser()
        .catch(() => {})
        .finally(() => setReconciling(false));
    }
  }, [loading, user, refreshUser]);

  if (loading || reconciling) {
    return <div className="min-h-screen flex items-center justify-center bg-background text-foreground">Cargando...</div>;
  }
  if (!user) return <Redirect to="/" />;
  if (user.role !== role) return <Redirect to={user.role === "empresa" ? "/empresa" : "/egresado"} />;
  return <>{children}</>;
}

function DashboardRedirect() {
  const { user, loading, refreshUser } = useAuth();
  const [reconciling, setReconciling] = useState(false);

  useEffect(() => {
    if (!loading && !user && getToken()) {
      setReconciling(true);
      refreshUser()
        .catch(() => {})
        .finally(() => setReconciling(false));
    }
  }, [loading, user, refreshUser]);

  if (loading || reconciling) return <div className="min-h-screen flex items-center justify-center bg-background text-foreground">Cargando...</div>;
  if (!user) return <Redirect to="/" />;
  return <Redirect to={user.role === "empresa" ? "/empresa" : "/egresado"} />;
}

function AppRouter() {
  return (
    <Switch>
      <Route path="/" component={SubeyaLanding} />
      <Route path="/dashboard" component={DashboardRedirect} />
      <Route path="/egresado">
        <ProtectedRoute role="egresado">
          <EgresadoDashboard />
        </ProtectedRoute>
      </Route>
      <Route path="/empresa">
        <ProtectedRoute role="empresa">
          <EmpresaDashboard />
        </ProtectedRoute>
      </Route>
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
            <AppRouter />
          </WouterRouter>
          <Toaster />
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
