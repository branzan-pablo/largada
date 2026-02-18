"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import { useLoginModal } from "@/contexts/login-modal-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { CityAutocomplete } from "@/components/onboarding/city-autocomplete";
import { RadiusSelector } from "@/components/onboarding/radius-selector";
import { usePushNotifications } from "@/hooks/use-push-notifications";
import { toast } from "sonner";
import { LogOut, Loader2, Mail, MapPin, Bell, Heart, MessageSquarePlus, ChevronRight } from "lucide-react";

export function ProfilePageClient() {
  const { user, profile, isLoading, signOut, updateProfile } = useAuth();
  const { openLogin } = useLoginModal();
  const router = useRouter();
  const { permission, isSupported, requestPermission } = usePushNotifications();

  const [fullName, setFullName] = useState(profile?.full_name ?? "");
  const [cityId, setCityId] = useState(profile?.city_id ?? "");
  const [cityName, setCityName] = useState(profile?.city ?? "");
  const [radius, setRadius] = useState(profile?.notification_radius_km ?? 150);
  const [notificationsEnabled, setNotificationsEnabled] = useState(
    profile?.notifications_enabled ?? false
  );
  const [isSaving, setIsSaving] = useState(false);

  // Sync state when profile loads or updates
  const [syncedProfileUpdatedAt, setSyncedProfileUpdatedAt] = useState<string | null>(null);
  if (profile && profile.updated_at !== syncedProfileUpdatedAt) {
    setFullName(profile.full_name ?? "");
    setCityId(profile.city_id ?? "");
    setCityName(profile.city ?? "");
    setRadius(profile.notification_radius_km ?? 150);
    setNotificationsEnabled(profile.notifications_enabled);
    setSyncedProfileUpdatedAt(profile.updated_at);
  }

  useEffect(() => {
    if (!isLoading && !user) {
      openLogin();
    }
  }, [isLoading, user, openLogin]);

  if (isLoading || !user || !profile) return null;

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName,
          cityId: cityId || undefined,
          notificationRadiusKm: radius,
          notificationsEnabled,
        }),
      });

      if (!res.ok) {
        toast.error("Erro ao salvar perfil.");
        return;
      }

      const updatedProfile = await res.json();
      updateProfile(updatedProfile);
      toast.success("Perfil atualizado!");
    } catch {
      toast.error("Erro ao salvar perfil.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    router.replace("/");
  };

  return (
    <div className="space-y-6">
      {/* Avatar and email */}
      <div className="flex items-center gap-4">
        <Avatar className="h-16 w-16">
          <AvatarImage src={profile.avatar_url ?? undefined} />
          <AvatarFallback className="text-lg">
            {profile.full_name?.charAt(0)?.toUpperCase() ?? "U"}
          </AvatarFallback>
        </Avatar>
        <div>
          <p className="font-semibold">{profile.full_name ?? "Corredor"}</p>
          <p className="flex items-center gap-1 text-sm text-muted-foreground">
            <Mail className="h-3.5 w-3.5" />
            {user.email}
          </p>
          {profile.city && (
            <p className="flex items-center gap-1 text-sm text-muted-foreground">
              <MapPin className="h-3.5 w-3.5" />
              {profile.city}/{profile.state}
            </p>
          )}
        </div>
      </div>

      <Separator />

      {/* Edit form */}
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="fullName">Nome completo</Label>
          <Input
            id="fullName"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="Seu nome"
          />
        </div>

        <div className="space-y-2">
          <Label>Cidade</Label>
          <CityAutocomplete
            onSelect={(c) => {
              setCityId(c.id);
              setCityName(c.name);
            }}
            initialCity={cityName ? `${cityName} — ${profile?.state ?? "SP"}` : undefined}
          />
        </div>

        {cityId && (
          <div className="space-y-2">
            <Label>Raio de notificação</Label>
            <RadiusSelector
              value={radius}
              onChange={setRadius}
              cityName={cityName}
            />
          </div>
        )}

        <div className="flex items-center justify-between rounded-lg border p-4">
          <div className="space-y-0.5">
            <Label htmlFor="notifications" className="flex items-center gap-1.5">
              <Bell className="h-4 w-4" />
              Notificações
            </Label>
            <p className="text-sm text-muted-foreground">
              Receba alertas de novas corridas na sua região
            </p>
            {isSupported && permission === "denied" && (
              <p className="text-xs text-destructive">
                Notificações bloqueadas no navegador. Libere nas configurações do site.
              </p>
            )}
          </div>
          <Switch
            id="notifications"
            checked={notificationsEnabled}
            disabled={isSupported && permission === "denied"}
            onCheckedChange={async (checked) => {
              if (checked && isSupported && permission !== "granted") {
                const granted = await requestPermission();
                if (!granted) {
                  toast.error("Permissão de notificação negada pelo navegador.");
                  return;
                }
              }
              setNotificationsEnabled(checked);
            }}
          />
        </div>

        <Button onClick={handleSave} disabled={isSaving} className="w-full">
          {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Salvar alterações
        </Button>
      </div>

      <Separator />

      {/* Navigation links */}
      <div className="space-y-1">
        <Link
          href="/perfil/minhas-corridas"
          className="flex items-center justify-between rounded-lg border p-4 hover:bg-accent"
        >
          <div className="flex items-center gap-2">
            <Heart className="h-4 w-4" />
            <span className="text-sm font-medium">Minhas Corridas</span>
          </div>
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
        </Link>
        <Link
          href="/perfil/sugestoes"
          className="flex items-center justify-between rounded-lg border p-4 hover:bg-accent"
        >
          <div className="flex items-center gap-2">
            <MessageSquarePlus className="h-4 w-4" />
            <span className="text-sm font-medium">Minhas Sugestões</span>
          </div>
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
        </Link>
      </div>

      <Separator />

      <Button
        variant="outline"
        className="w-full text-destructive"
        onClick={handleSignOut}
      >
        <LogOut className="mr-2 h-4 w-4" />
        Sair da conta
      </Button>
    </div>
  );
}
