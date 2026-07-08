import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { Lock, LogOut } from "lucide-react"; // <--- Importación actualizada
import { verifyAdminPassword } from "@/lib/admin.functions";
import { useAdminAuth } from "@/features/admin/AdminAuth";
import { AdminDashboard } from "@/features/admin/AdminDashboard";

export const Route = createFileRoute("/admin/")({
  component: AdminHome,
});

function AdminHome() {
  const { password, setPassword } = useAdminAuth();
  if (password) return <AdminDashboard />;
  return <LoginForm onOk={setPassword} />;
}

function LoginForm({ onOk }: { onOk: (p: string) => void }) {
  const verify = useServerFn(verifyAdminPassword);
  const nav = useNavigate();
  const [pass, setPass] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true); setErr(null);
    try {
      const { ok } = await verify({ data: { password: pass } });
      if (ok) { onOk(pass); nav({ to: "/admin/inventario" }); }
      else setErr("Contraseña incorrecta");
    } catch (e: any) { setErr(e?.message ?? "Error"); }
    setLoading(false);
  }
  return (
    <div className="flex min-h-screen items-center justify-center bg-crema p-4">
      <form onSubmit={submit} className="w-full max-w-sm space-y-4 rounded-2xl bg-white p-6 shadow-lg ring-1 ring-mocha/10">
        <div className="flex items-center justify-between gap-2 text-shocking">
          <div className="flex items-center gap-2">
            <Lock className="h-5 w-5"/><h1 className="text-lg font-bold">Panel de Majito</h1>
          </div>
          <button type="button" onClick={() => nav({ to: "/" })} className="text-gray-400 hover:text-red-500 transition-colors">
            <LogOut className="h-5 w-5" />
          </button>
        </div>
        <p className="text-xs text-mocha">Ingresa la contraseña de administración.</p>
        <input
          type="password"
          value={pass}
          onChange={(e) => setPass(e.target.value)}
          autoFocus
          className="w-full rounded-lg border border-mocha/20 px-3 py-2 text-sm outline-none focus:border-shocking"
          placeholder="Contraseña"
        />
        {err && <p className="text-xs text-red-600">{err}</p>}
        <button disabled={loading || !pass} type="submit" className="w-full rounded-lg bg-shocking py-2 text-sm font-bold text-white disabled:opacity-40">
          {loading ? "Verificando…" : "Entrar"}
        </button>
      </form>
    </div>
  );
}