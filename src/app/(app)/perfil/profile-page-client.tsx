"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { REGION_CITIES } from "@/lib/constants";
import { useNotifications } from "@/hooks/use-notifications";
import { toast } from "sonner";
import { LogOut, Loader2, Mail, MapPin, Bell } from "lucide-react";

export function ProfilePageClient() {
  const { user, profile, isLoading, signOut, refetchProfile } = useAuth();
  const router = useRouter();
  const { permission, isSupported, requestPermission } = useNotifications();

  const [fullName, setFullName] = useState(profile?.full_name ?? "");
  const [city, setCity] = useState(profile?.city ?? "");
  const [notificationsEnabled, setNotificationsEnabled] = useState(
    profile?.notifications_enabled ?? false
  );
  const [isSaving, setIsSaving] = useState(false);

  // Sync state when profile loads
  const [syncedProfileId, setSyncedProfileId] = useState<string | null>(null);
  if (profile && profile.id !== syncedProfileId) {
    setFullName(profile.full_name ?? "");
    setCity(profile.city ?? "");
    setNotificationsEnabled(profile.notifications_enabled);
    setSyncedProfileId(profile.id);
  }

  if (isLoading) return null;

  if (!user || !profile) {
    router.replace("/login");
    return null;
  }

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName,
          city: city || undefined,
          notificationsEnabled,
        }),
      });

      if (!res.ok) {
        toast.error("Erro ao salvar perfil.");
        return;
      }

      await refetchProfile(user.id);
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
          <Label htmlFor="city">Cidade</Label>
          <Select value={city} onValueChange={setCity}>
            <SelectTrigger id="city">
              <SelectValue placeholder="Selecione sua cidade" />
            </SelectTrigger>
            <SelectContent>
              {REGION_CITIES.map((c) => (
                <SelectItem key={c.name} value={c.name}>
                  {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

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
