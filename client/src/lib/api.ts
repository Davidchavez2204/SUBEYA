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

};

export function cvDownloadHref(applicationId: string) {
  const token = getToken();
  return `${API_URL}/applications/${applicationId}/cv?token=${encodeURIComponent(token || "")}`;
}

export function profileCvDownloadHref() {
  const token = getToken();
  return `${API_URL}/profile/egresado/cv?token=${encodeURIComponent(token || "")}`;
}

export { API_URL };
