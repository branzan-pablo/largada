"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CityAutocomplete } from "@/components/onboarding/city-autocomplete";
import { registerSchema } from "@/lib/validations";
import { toast } from "sonner";

interface City {
  id: string;
  name: string;
  state_code: string;
  slug: string;
  latitude: number;
  longitude: number;
}

const submitClass = "h-12 w-full text-base font-semibold";

export function RegisterForm() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [selectedCity, setSelectedCity] = useState<City | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const router = useRouter();
  const supabase = createClient();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    const parsed = registerSchema.safeParse({
      fullName,
      email,
      password,
      city: selectedCity?.name ?? "",
    });
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

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          ...(selectedCity && {
            city: selectedCity.name,
            state: selectedCity.state_code,
            latitude: selectedCity.latitude,
            longitude: selectedCity.longitude,
          }),
        },
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error) {
      toast.error(error.message);
      setIsLoading(false);
      return;
    }

    toast.success(
      "Conta criada! Verifique seu email para confirmar o cadastro."
    );
    setIsLoading(false);
    router.push("/corridas");
    router.refresh();
  };

  return (
    <form onSubmit={handleRegister} className="space-y-4" noValidate>
      <div className="space-y-2">
        <Label htmlFor="fullName">Nome completo</Label>
        <Input
          id="fullName"
          type="text"
          autoComplete="name"
          autoCapitalize="words"
          placeholder="Seu nome"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          aria-invalid={!!errors.fullName}
          aria-describedby={errors.fullName ? "fullName-error" : undefined}
        />
        {errors.fullName && (
          <p id="fullName-error" role="alert" className="text-sm text-destructive">
            {errors.fullName}
          </p>
        )}
      </div>
      <div className="space-y-2">
        <Label htmlFor="reg-email">E-mail</Label>
        <Input
          id="reg-email"
          type="email"
          inputMode="email"
          autoComplete="email"
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
          placeholder="seu@email.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          aria-invalid={!!errors.email}
          aria-describedby={errors.email ? "reg-email-error" : undefined}
        />
        {errors.email && (
          <p id="reg-email-error" role="alert" className="text-sm text-destructive">
            {errors.email}
          </p>
        )}
      </div>
      <div className="space-y-2">
        <Label htmlFor="reg-password">Senha</Label>
        <Input
          id="reg-password"
          type="password"
          autoComplete="new-password"
          placeholder="Mínimo 6 caracteres"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          aria-invalid={!!errors.password}
          aria-describedby={errors.password ? "reg-password-error" : undefined}
        />
        {errors.password && (
          <p id="reg-password-error" role="alert" className="text-sm text-destructive">
            {errors.password}
          </p>
        )}
      </div>
      <div className="space-y-2">
        <Label>Sua cidade</Label>
        <CityAutocomplete
          onSelect={setSelectedCity}
          onClear={() => setSelectedCity(null)}
          placeholder="Digite sua cidade..."
        />
        {errors.city && (
          <p role="alert" className="text-sm text-destructive">
            {errors.city}
          </p>
        )}
      </div>
      <Button type="submit" className={submitClass} disabled={isLoading}>
        {isLoading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Criando conta...
          </>
        ) : (
          "Criar conta"
        )}
      </Button>
    </form>
  );
}
