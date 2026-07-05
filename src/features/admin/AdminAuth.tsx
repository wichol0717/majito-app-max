import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

const KEY = "majito_admin_pass";

interface Ctx {
  password: string | null;
  setPassword: (p: string | null) => void;
}

const AdminCtx = createContext<Ctx>({ password: null, setPassword: () => {} });

export function AdminAuthProvider({ children }: { children: ReactNode }) {
  const [password, setPass] = useState<string | null>(null);
  useEffect(() => {
    if (typeof window !== "undefined") setPass(sessionStorage.getItem(KEY));
  }, []);
  const setPassword = (p: string | null) => {
    if (typeof window !== "undefined") {
      if (p) sessionStorage.setItem(KEY, p);
      else sessionStorage.removeItem(KEY);
    }
    setPass(p);
  };
  return <AdminCtx.Provider value={{ password, setPassword }}>{children}</AdminCtx.Provider>;
}

export function useAdminAuth() {
  return useContext(AdminCtx);
}