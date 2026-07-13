const API_URL = import.meta.env.VITE_API_URL || "http://localhost:4000/api";
const TOKEN_KEY = "subeya_token";

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string) {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken() {
  localStorage.removeItem(TOKEN_KEY);
}

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

async function request(path: string, options: RequestInit = {}) {
  const token = getToken();
  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string> | undefined),
  };
  if (!(options.body instanceof FormData)) {
    headers["Content-Type"] = "application/json";
  }
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch(`${API_URL}${path}`, { ...options, headers });
  const isJson = res.headers.get("content-type")?.includes("application/json");
  const data = isJson ? await res.json() : null;

  if (!res.ok) {
    throw new ApiError(data?.error || "Ocurrió un error inesperado.", res.status);
  }
  return data;
}

export const api = {
  register: (payload: { email: string; password: string; name: string; role: "empresa" | "egresado"; companyName?: string }) =>
    request("/auth/register", { method: "POST", body: JSON.stringify(payload) }),

  login: (payload: { email: string; password: string }) =>
    request("/auth/login", { method: "POST", body: JSON.stringify(payload) }),

  me: () => request("/auth/me"),

  updateEgresadoProfile: (payload: {
    techSkills: string[];
    softSkills: string[];
    bio: string;
    career: string;
    yearsOfExperience: number;
    experiences: { id: string; title: string; period: string }[];
  }) => request("/profile/egresado", { method: "PUT", body: JSON.stringify(payload) }),

  uploadProfileCv: (cvFile: File) => {
    const formData = new FormData();
    formData.append("cv", cvFile);
    return request("/profile/egresado/cv", { method: "POST", body: formData });
  },

  updateEmpresaProfile: (payload: { companyName: string; sector: string; description: string }) =>
    request("/profile/empresa", { method: "PUT", body: JSON.stringify(payload) }),

  listJobs: () => request("/jobs"),

  getJob: (id: string) => request(`/jobs/${id}`),

  myJobs: () => request("/jobs/mine"),

  createJob: (payload: {
    title: string;
    description: string;
    techRequirements: string[];
    softRequirements: string[];
    modality: string;
    location: string;
    seniority: string;
    minExperienceYears: number;
  }) => request("/jobs", { method: "POST", body: JSON.stringify(payload) }),

  updateJob: (id: string, payload: Record<string, unknown>) =>
    request(`/jobs/${id}`, { method: "PATCH", body: JSON.stringify(payload) }),

  deleteJob: (id: string) => request(`/jobs/${id}`, { method: "DELETE" }),

  jobApplicants: (id: string) => request(`/jobs/${id}/applicants`),

  updateApplicationStatus: (applicationId: string, status: "recibido" | "en_revision" | "aceptado" | "rechazado") =>
    request(`/applications/${applicationId}/status`, { method: "PATCH", body: JSON.stringify({ status }) }),

  withdrawApplication: (applicationId: string) =>
    request(`/applications/${applicationId}`, { method: "DELETE" }),

  applyToJob: (id: string, options: { file?: File; useProfileCv?: boolean }) => {
    const formData = new FormData();
    if (options.file) formData.append("cv", options.file);
    if (options.useProfileCv) formData.append("useProfileCv", "true");
    return request(`/applications/jobs/${id}/apply`, { method: "POST", body: formData });
  },

  myApplications: () => request("/applications/mine"),

  downloadApplicationCv: (applicationId: string, fallbackName?: string) =>
    downloadFile(`/applications/${applicationId}/cv`, fallbackName),

  downloadProfileCv: (fallbackName?: string) => downloadFile(`/profile/egresado/cv`, fallbackName),

};

/**
 * Descarga un archivo protegido usando la cabecera Authorization (en vez de
 * pasar el token por la URL con ?token=, que puede quedar en logs/historial).
 * Trae el archivo como blob y dispara la descarga en el navegador.
 */
async function downloadFile(path: string, fallbackName = "archivo") {
  const token = getToken();
  const res = await fetch(`${API_URL}${path}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  if (!res.ok) {
    let message = "No se pudo descargar el archivo.";
    try {
      const data = await res.json();
      message = data?.error || message;
    } catch {
      // respuesta no-JSON: usamos el mensaje por defecto
    }
    throw new ApiError(message, res.status);
  }

  // Intenta obtener el nombre real desde la cabecera Content-Disposition.
  let filename = fallbackName;
  const disposition = res.headers.get("content-disposition") || "";
  const match = disposition.match(/filename\*?=(?:UTF-8''|")?([^";]+)/i);
  if (match) filename = decodeURIComponent(match[1].replace(/"/g, "").trim());

  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export function cvDownloadHref(applicationId: string) {
  const token = getToken();
  return `${API_URL}/applications/${applicationId}/cv?token=${encodeURIComponent(token || "")}`;
}

export function profileCvDownloadHref() {
  const token = getToken();
  return `${API_URL}/profile/egresado/cv?token=${encodeURIComponent(token || "")}`;
}

export { API_URL };
