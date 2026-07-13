import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from "react";
import { flushSync } from "react-dom";
import { api, getToken, setToken, clearToken, ApiError } from "@/lib/api";

export type WorkExperience = {
  id: string;
  title: string;
  period: string;
};

export type EgresadoProfile = {
  techSkills: string[];
  softSkills: string[];
  bio: string;
  career: string;
  cvFileName?: string | null;
  cvOriginalName?: string | null;
  experiences?: WorkExperience[];
  yearsOfExperience?: number;
};

export type EmpresaProfile = {
  companyName: string;
  sector: string;
  description: string;
};

export type User = {
  id: string;
  email: string;
  name: string;
  role: "empresa" | "egresado";
  profile: EgresadoProfile | EmpresaProfile;
};

type AuthContextValue = {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<User>;
  register: (payload: { email: string; password: string; name: string; role: "empresa" | "egresado"; companyName?: string }) => Promise<User>;
  logout: () => void;
  refreshUser: () => Promise<void>;
  setUser: (user: User) => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = getToken();
    if (!token) {
      setLoading(false);
      return;
    }
    api
      .me()
      .then((data) => setUser(data.user))
      .catch((err) => {
        if (err instanceof ApiError && err.status === 401) clearToken();
      })
      .finally(() => setLoading(false));
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const data = await api.login({ email, password });
    setToken(data.token);
    // flushSync obliga a React a aplicar el nuevo usuario en el contexto de
    // forma síncrona ANTES de que el código que sigue (la navegación al
    // dashboard) se ejecute. Sin esto, wouter puede disparar el cambio de
    // ruta un instante antes de que el usuario quede propagado en el
    // contexto, causando que el panel protegido redirija a "/" en el primer
    // intento de inicio de sesión.
    flushSync(() => setUser(data.user));
    return data.user as User;
  }, []);

  const register = useCallback(
    async (payload: { email: string; password: string; name: string; role: "empresa" | "egresado"; companyName?: string }) => {
      const data = await api.register(payload);
      setToken(data.token);
      flushSync(() => setUser(data.user));
      return data.user as User;
    },
    []
  );

  const logout = useCallback(() => {
    clearToken();
    flushSync(() => setUser(null));
  }, []);

  const refreshUser = useCallback(async () => {
    try {
      const data = await api.me();
      setUser(data.user);
    } catch (err) {
      // Solo cerramos la sesión si el backend confirmó que el token ya no es
      // válido (401). Cualquier otro error (red inestable, servidor
      // arrancando, etc.) no debe borrar un token que podría seguir siendo
      // válido.
      if (err instanceof ApiError && err.status === 401) {
        clearToken();
        setUser(null);
      }
      throw err;
    }
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, refreshUser, setUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth debe usarse dentro de <AuthProvider>");
  return ctx;
}
