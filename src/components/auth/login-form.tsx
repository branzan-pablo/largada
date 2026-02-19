"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { loginSchema } from "@/lib/validations";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

interface LoginFormProps {
  redirectTo?: string;
  onSuccess?: () => void;
}

const primaryClass =
  "w-full flex items-center justify-center gap-2 bg-[#fc5200] text-white px-6 py-3 rounded-full font-semibold hover:bg-[#c94100] transition-colors";

export function LoginForm({ redirectTo, onSuccess }: LoginFormProps = {}) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showReset, setShowReset] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const router = useRouter();
  const supabase = createClient();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    const parsed = loginSchema.safeParse({ email, password });
    if (!parsed.success) {
      const fieldErrors: Record<string, string> = {};
      for (const issue of parsed.error.issues) {
        const field = issue.path[0]?.toString();
        if (field) fieldErrors[field] = issue.message;
      }
      setErrors(fieldErrors);
      return;
    }

    setIsLoading(true);

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      toast.error(
        error.message === "Invalid login credentials"
          ? "Email ou senha incorretos"
          : error.message
      );
      setIsLoading(false);
      return;
    }

    toast.success("Login realizado com sucesso!");
    setIsLoading(false);
    if (onSuccess) {
      onSuccess();
    } else {
      router.push(redirectTo || "/corridas");
      router.refresh();
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      toast.error("Digite seu email para recuperar a senha");
      return;
    }
    setIsLoading(true);

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/callback?next=/reset-password`,
    });

    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Email de recuperação enviado! Verifique sua caixa de entrada.");
    }
    setIsLoading(false);
  };

  if (showReset) {
    return (
      <form onSubmit={handleResetPassword} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="reset-email">Email</Label>
          <Input
            id="reset-email"
            type="email"
            placeholder="seu@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <Button type="submit" className={primaryClass} disabled={isLoading}>
          {isLoading ? "Enviando..." : "Enviar email de recuperação"}
        </Button>
        <button
          type="button"
          onClick={() => setShowReset(false)}
          className="w-full text-sm text-muted-foreground hover:text-foreground"
        >
          Voltar ao login
        </button>
      </form>
    );
  }

  return (
    <form onSubmit={handleLogin} className="space-y-4" noValidate>
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          placeholder="seu@email.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        {errors.email && <p className="text-xs text-destructive">{errors.email}</p>}
      </div>
      <div className="space-y-2">
        <Label htmlFor="password">Senha</Label>
        <Input
          id="password"
          type="password"
          placeholder="••••••••"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        {errors.password && <p className="text-xs text-destructive">{errors.password}</p>}
      </div>
      <Button type="submit" className={primaryClass} disabled={isLoading}>
        {isLoading ? "Entrando..." : "Entrar"}
      </Button>
      <button
        type="button"
        onClick={() => setShowReset(true)}
        className="w-full text-sm text-muted-foreground hover:text-foreground"
      >
        Esqueci minha senha
      </button>
    </form>
  );
}
