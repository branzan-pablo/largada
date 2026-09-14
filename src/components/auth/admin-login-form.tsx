"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient } from "@/lib/supabase/client";
import { loginSchema } from "@/lib/validations";

export function AdminLoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState<"password" | "google" | null>(null);

  async function login(event: React.FormEvent) {
    event.preventDefault();
    const parsed = loginSchema.safeParse({ email, password });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "Credenciais inválidas");
      return;
    }
    setLoading("password");
    const { error } = await createClient().auth.signInWithPassword(parsed.data);
    if (error) {
      toast.error(error.message === "Invalid login credentials" ? "E-mail ou senha incorretos" : error.message);
      setLoading(null);
      return;
    }
    router.replace("/admin");
    router.refresh();
  }

  async function loginWithGoogle() {
    setLoading("google");
    const { error } = await createClient().auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/auth/callback?next=/admin` },
    });
    if (error) {
      toast.error(error.message);
      setLoading(null);
    }
  }

  return (
    <div className="space-y-5">
      <Button type="button" variant="outline" className="h-11 w-full" onClick={loginWithGoogle} disabled={loading !== null}>
        {loading === "google" ? <Loader2 className="h-4 w-4 animate-spin" /> : "Continuar com Google"}
      </Button>
      <div className="flex items-center gap-3 text-xs text-muted-foreground"><span className="h-px flex-1 bg-border" />ou<span className="h-px flex-1 bg-border" /></div>
      <form onSubmit={login} className="space-y-4">
        <div className="space-y-2"><Label htmlFor="admin-email">E-mail</Label><Input id="admin-email" type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} required /></div>
        <div className="space-y-2"><Label htmlFor="admin-password">Senha</Label><Input id="admin-password" type="password" autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} required /></div>
        <Button className="h-11 w-full" disabled={loading !== null}>{loading === "password" ? <><Loader2 className="h-4 w-4 animate-spin" />Entrando...</> : "Entrar"}</Button>
      </form>
    </div>
  );
}
