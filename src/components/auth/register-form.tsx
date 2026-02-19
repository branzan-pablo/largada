"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
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

const primaryClass =
  "w-full flex items-center justify-center gap-2 bg-[#fc5200] text-white text-sm px-6 py-3 rounded-full font-semibold hover:bg-[#c94100] transition-colors";

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
          placeholder="Seu nome"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
        />
        {errors.fullName && <p className="text-xs text-destructive">{errors.fullName}</p>}
      </div>
      <div className="space-y-2">
        <Label htmlFor="reg-email">Email</Label>
        <Input
          id="reg-email"
          type="email"
          placeholder="seu@email.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        {errors.email && <p className="text-xs text-destructive">{errors.email}</p>}
      </div>
      <div className="space-y-2">
        <Label htmlFor="reg-password">Senha</Label>
        <Input
          id="reg-password"
          type="password"
          placeholder="Mínimo 6 caracteres"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        {errors.password && <p className="text-xs text-destructive">{errors.password}</p>}
      </div>
      <div className="space-y-2">
        <Label>Sua cidade</Label>
        <CityAutocomplete
          onSelect={setSelectedCity}
          onClear={() => setSelectedCity(null)}
          placeholder="Digite sua cidade..."
        />
        {errors.city && <p className="text-xs text-destructive">{errors.city}</p>}
      </div>
      <Button type="submit" className={primaryClass} disabled={isLoading}>
        {isLoading ? "Criando conta..." : "Criar conta"}
      </Button>
    </form>
  );
}
