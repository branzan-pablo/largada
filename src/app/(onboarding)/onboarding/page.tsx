"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import { usePushNotifications } from "@/hooks/use-push-notifications";
import { CityAutocomplete } from "@/components/onboarding/city-autocomplete";
import { RadiusSelector } from "@/components/onboarding/radius-selector";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Loader2, MapPin } from "lucide-react";

interface SelectedCity {
  id: string;
  name: string;
  state_code: string;
  slug: string;
  latitude: number;
  longitude: number;
}

export default function OnboardingPage() {
  const { user, updateProfile, profile } = useAuth();
  const router = useRouter();
  const { isSupported, subscribe } = usePushNotifications();

  const [selectedCity, setSelectedCity] = useState<SelectedCity | null>(null);
  const [radius, setRadius] = useState(150);
  const [isLoading, setIsLoading] = useState(false);

  async function handleConfirm() {
    if (!selectedCity || !user) return;
    setIsLoading(true);

    try {
      // Request push permission and create subscription before saving profile
      if (isSupported) {
        await subscribe();
      }

      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cityId: selectedCity.id,
          notificationRadiusKm: radius,
          notificationsEnabled: true,
          onboardingCompleted: true,
        }),
      });

      if (res.ok) {
        const updatedProfile = await res.json();
        updateProfile(updatedProfile);
        router.push("/corridas");
      } else {
        toast.error("Erro ao salvar. Tente novamente.");
      }
    } catch {
      toast.error("Erro ao salvar. Tente novamente.");
    } finally {
      setIsLoading(false);
    }
  }

  async function handleSkip() {
    if (!user) return;
    setIsLoading(true);

    try {
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ onboardingCompleted: true }),
      });

      if (res.ok) {
        const updatedProfile = await res.json();
        updateProfile(updatedProfile);
      }
      router.push("/corridas");
    } finally {
      setIsLoading(false);
    }
  }

  if (!user) return null;

  return (
    <div className="w-full max-w-md space-y-8">
      <div className="space-y-2 text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full border border-zinc-800 bg-zinc-900">
          <MapPin className="h-6 w-6 text-zinc-400" />
        </div>
        <h1 className="text-2xl font-bold text-white">
          De qual cidade você vai correr?
        </h1>
        <p className="text-sm text-zinc-500">
          A gente filtra o calendário para o que tá perto de você.
        </p>
      </div>

      <div className="space-y-6">
        <div className="space-y-2">
          <CityAutocomplete
            onSelect={setSelectedCity}
            initialCity={profile?.city}
          />
        </div>

        {selectedCity && (
          <div className="space-y-2">
            <p className="text-sm font-medium text-zinc-300">
              Até onde você topa viajar para uma corrida?
            </p>
            <RadiusSelector
              value={radius}
              onChange={setRadius}
              cityName={selectedCity.name}
            />
          </div>
        )}

        <div className="space-y-3">
          <Button
            onClick={handleConfirm}
            disabled={!selectedCity || isLoading}
            className="w-full"
          >
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Quero ver corridas perto de mim
          </Button>

          <button
            onClick={handleSkip}
            disabled={isLoading}
            className="w-full text-center text-sm text-zinc-600 hover:text-zinc-400 transition-colors"
          >
            Definir depois
          </button>
        </div>
      </div>
    </div>
  );
}
