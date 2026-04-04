"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { useAuth } from "@/contexts/auth-context";
import { useLoginModal } from "@/contexts/login-modal-context";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { formatDateShort } from "@/lib/date";
import {
  Loader2,
  RefreshCw,
  Trophy,
  TrendingUp,
  Timer,
  Route,
  Mountain,
  Heart,
  ChevronRight,
  ArrowLeft,
  Zap,
  Target,
  Calendar,
} from "lucide-react";
import type {
  StravaActivity,
  StravaAthleteStats,
  CachedAthleteData,
} from "@/lib/strava";
import {
  metersToKm,
  formatPace,
  formatDurationShort,
  getWorkoutLabel,
  getDistanceBucket,
} from "@/lib/strava-utils";

// ─── Types ───────────────────────────────────────────────

interface RaceSuggestion {
  id: string;
  name: string;
  date: string;
  city: string;
  state: string;
  distances: string[];
  slug: string;
  matchReason: string;
}

// ─── Component ───────────────────────────────────────────

export function DesempenhoClient() {
  const { user, isLoading: authLoading } = useAuth();
  const { openLogin } = useLoginModal();

  const [data, setData] = useState<CachedAthleteData | null>(null);
  const [suggestions, setSuggestions] = useState<RaceSuggestion[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isStrava = user?.user_metadata?.provider === "strava";

  const fetchData = useCallback(async (refresh = false) => {
    try {
      if (refresh) setIsRefreshing(true);
      else setIsLoading(true);
      setError(null);

      const url = refresh
        ? "/api/strava/activities?refresh=1"
        : "/api/strava/activities";
      const res = await fetch(url);

      if (!res.ok) {
        setError("Erro ao carregar dados do Strava.");
        return;
      }

      const athleteData: CachedAthleteData = await res.json();
      setData(athleteData);

      // Fetch race suggestions if we have activities
      if (athleteData.activities.length > 0) {
        await fetchSuggestions(athleteData.activities);
      }
    } catch {
      setError("Erro ao carregar dados do Strava.");
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  const fetchSuggestions = async (activities: StravaActivity[]) => {
    try {
      // Determine athlete's preferred distances
      const distanceCounts = new Map<string, number>();
      for (const a of activities) {
        const bucket = getDistanceBucket(a.distance / 1000);
        distanceCounts.set(bucket, (distanceCounts.get(bucket) ?? 0) + 1);
      }

      // Get top 2 distance buckets
      const topBuckets = [...distanceCounts.entries()]
        .sort((a, b) => b[1] - a[1])
        .slice(0, 2)
        .map(([bucket]) => bucket);

      const res = await fetch("/api/strava/suggestions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ preferredDistances: topBuckets }),
      });

      if (res.ok) {
        const data = await res.json();
        setSuggestions(data.suggestions ?? []);
      }
    } catch {
      // Silently fail — suggestions are not critical
    }
  };

  useEffect(() => {
    if (!authLoading && !user) {
      openLogin();
      return;
    }
    if (user && isStrava) {
      fetchData();
    } else if (user && !isStrava) {
      setIsLoading(false);
    }
  }, [authLoading, user, isStrava, openLogin, fetchData]);

  if (authLoading || (!user && isLoading)) return null;

  // Not a Strava user
  if (!isStrava) {
    return (
      <div className="space-y-6">
        <Link
          href="/perfil"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar ao perfil
        </Link>
        <Card>
          <CardContent className="flex flex-col items-center gap-4 py-8 text-center">
            <Image
              src="/strava/api_logo_cptblWith_strava_horiz_orange.svg"
              alt="Compatible with Strava"
              width={365}
              height={37}
              className="h-6 w-auto"
              unoptimized
            />
            <p className="text-muted-foreground">
              Conecte sua conta Strava para ver seu histórico de desempenho e
              receber sugestões de corridas ideais para você.
            </p>
            <p className="text-sm text-muted-foreground">
              Faça login com Strava para acessar esta funcionalidade.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Needs scope upgrade
  if (data?.needs_scope_upgrade) {
    return (
      <div className="space-y-6">
        <Link
          href="/perfil"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar ao perfil
        </Link>
        <Card>
          <CardContent className="flex flex-col items-center gap-4 py-8 text-center">
            <Image
              src="/strava/api_logo_cptblWith_strava_horiz_orange.svg"
              alt="Compatible with Strava"
              width={365}
              height={37}
              className="h-6 w-auto"
              unoptimized
            />
            <p className="text-muted-foreground">
              Para acessar seu histórico de desempenho, precisamos de permissão
              para ler suas atividades no Strava.
            </p>
            <p className="text-sm text-muted-foreground">
              Reconecte sua conta Strava para conceder a nova permissão.
            </p>
            <ReconnectStravaButton />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-lg" />
          ))}
        </div>
        <Skeleton className="h-64 rounded-lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <Link
          href="/perfil"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar ao perfil
        </Link>
        <Card>
          <CardContent className="flex flex-col items-center gap-4 py-8 text-center">
            <p className="text-destructive">{error}</p>
            <Button variant="outline" onClick={() => fetchData()}>
              Tentar novamente
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const activities = data?.activities ?? [];
  const stats = data?.stats as StravaAthleteStats | null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Link
          href="/perfil"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Perfil
        </Link>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => fetchData(true)}
          disabled={isRefreshing}
        >
          {isRefreshing ? (
            <Loader2 className="mr-1 h-4 w-4 animate-spin" />
          ) : (
            <RefreshCw className="mr-1 h-4 w-4" />
          )}
          Atualizar
        </Button>
      </div>

      {/* Stats summary cards */}
      <StatsCards activities={activities} stats={stats} />

      {/* Pace trend */}
      {activities.length >= 3 && <PaceTrend activities={activities} />}

      {/* Distance distribution */}
      {activities.length >= 3 && (
        <DistanceDistribution activities={activities} />
      )}

      {/* Race suggestions */}
      {suggestions.length > 0 && (
        <RaceSuggestions suggestions={suggestions} />
      )}

      {/* Recent activities */}
      <RecentActivities activities={activities} />

      {/* Strava attribution */}
      <div className="flex items-center justify-center gap-2 pt-2">
        <Image
          src="/strava/api_logo_pwrdBy_strava_horiz_orange.svg"
          alt="Powered by Strava"
          width={200}
          height={24}
          className="h-4 w-auto opacity-60"
          unoptimized
        />
      </div>

      {data?.synced_at && (
        <p className="text-center text-xs text-muted-foreground">
          Última sincronização: {formatDateShort(data.synced_at)}
        </p>
      )}
    </div>
  );
}

// ─── Sub-components ──────────────────────────────────────

function StatsCards({
  activities,
  stats,
}: {
  activities: StravaActivity[];
  stats: StravaAthleteStats | null;
}) {
  const computed = useMemo(() => {
    const totalRuns = stats?.all_run_totals?.count ?? activities.length;
    const totalDistanceKm =
      (stats?.all_run_totals?.distance ?? activities.reduce((s, a) => s + a.distance, 0)) / 1000;
    const avgPace =
      activities.length > 0
        ? activities.reduce((s, a) => s + a.average_speed, 0) /
          activities.length
        : 0;
    const totalElevation =
      stats?.all_run_totals?.elevation_gain ??
      activities.reduce((s, a) => s + a.total_elevation_gain, 0);

    return { totalRuns, totalDistanceKm, avgPace, totalElevation };
  }, [activities, stats]);

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      <StatCard
        icon={<Route className="h-4 w-4 text-[#FC5200]" />}
        label="Total corridas"
        value={computed.totalRuns.toString()}
      />
      <StatCard
        icon={<TrendingUp className="h-4 w-4 text-[#FC5200]" />}
        label="Distância total"
        value={`${metersToKm(computed.totalDistanceKm * 1000)} km`}
      />
      <StatCard
        icon={<Timer className="h-4 w-4 text-[#FC5200]" />}
        label="Pace médio"
        value={`${formatPace(computed.avgPace)} /km`}
      />
      <StatCard
        icon={<Mountain className="h-4 w-4 text-[#FC5200]" />}
        label="Elevação total"
        value={`${Math.round(computed.totalElevation)} m`}
      />
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <Card className="gap-2 py-4">
      <CardContent className="flex flex-col gap-1 px-4">
        <div className="flex items-center gap-1.5 text-muted-foreground">
          {icon}
          <span className="text-xs">{label}</span>
        </div>
        <span className="text-lg font-bold">{value}</span>
      </CardContent>
    </Card>
  );
}

function PaceTrend({ activities }: { activities: StravaActivity[] }) {
  // Get last 12 run activities, sorted chronologically
  const recentRuns = useMemo(() => {
    return [...activities]
      .filter((a) => a.distance > 1000) // at least 1km
      .slice(0, 12)
      .reverse();
  }, [activities]);

  if (recentRuns.length < 3) return null;

  const paces = recentRuns.map((a) => 1000 / a.average_speed); // seconds per km
  const minPace = Math.min(...paces);
  const maxPace = Math.max(...paces);
  const range = maxPace - minPace || 1;

  // Check if improving (last 3 average vs first 3 average)
  const firstThreeAvg =
    paces.slice(0, 3).reduce((s, p) => s + p, 0) / 3;
  const lastThreeAvg =
    paces.slice(-3).reduce((s, p) => s + p, 0) / 3;
  const isImproving = lastThreeAvg < firstThreeAvg;

  return (
    <Card className="py-4">
      <CardContent className="space-y-3 px-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <TrendingUp className="h-4 w-4 text-[#FC5200]" />
            <span className="text-sm font-semibold">Evolução do pace</span>
          </div>
          {isImproving ? (
            <Badge
              variant="secondary"
              className="bg-green-50 text-green-700 text-xs"
            >
              Melhorando
            </Badge>
          ) : (
            <Badge variant="secondary" className="text-xs">
              Estável
            </Badge>
          )}
        </div>

        {/* Simple bar chart */}
        <div className="flex items-end gap-1" style={{ height: 80 }}>
          {recentRuns.map((activity, i) => {
            const pace = paces[i];
            // Invert: faster pace (lower number) = taller bar
            const height = ((maxPace - pace) / range) * 60 + 20;
            return (
              <div
                key={activity.id}
                className="group relative flex flex-1 flex-col items-center"
              >
                <div
                  className="w-full rounded-t bg-[#FC5200]/80 transition-colors group-hover:bg-[#FC5200]"
                  style={{ height }}
                />
                <div className="absolute -top-6 hidden rounded bg-foreground px-1.5 py-0.5 text-[10px] text-background group-hover:block whitespace-nowrap">
                  {formatPace(activity.average_speed)}/km
                </div>
              </div>
            );
          })}
        </div>

        <div className="flex justify-between text-[10px] text-muted-foreground">
          <span>
            {formatDateShort(recentRuns[0].start_date_local)}
          </span>
          <span>
            {formatDateShort(
              recentRuns[recentRuns.length - 1].start_date_local
            )}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}

function DistanceDistribution({
  activities,
}: {
  activities: StravaActivity[];
}) {
  const distribution = useMemo(() => {
    const buckets: Record<string, number> = {};
    for (const a of activities) {
      const bucket = getDistanceBucket(a.distance / 1000);
      buckets[bucket] = (buckets[bucket] ?? 0) + 1;
    }

    const total = activities.length;
    const ordered = ["< 3K", "5K", "10K", "21K", "30K", "42K"];
    return ordered
      .filter((b) => buckets[b])
      .map((bucket) => ({
        label: bucket,
        count: buckets[bucket],
        pct: Math.round((buckets[bucket] / total) * 100),
      }));
  }, [activities]);

  if (distribution.length === 0) return null;

  const maxCount = Math.max(...distribution.map((d) => d.count));

  return (
    <Card className="py-4">
      <CardContent className="space-y-3 px-4">
        <div className="flex items-center gap-1.5">
          <Target className="h-4 w-4 text-[#FC5200]" />
          <span className="text-sm font-semibold">
            Distâncias mais corridas
          </span>
        </div>

        <div className="space-y-2">
          {distribution.map((d) => (
            <div key={d.label} className="flex items-center gap-3">
              <span className="w-10 text-right text-sm font-medium">
                {d.label}
              </span>
              <div className="flex-1">
                <div
                  className="h-6 rounded bg-[#FC5200]/20"
                  style={{
                    width: `${(d.count / maxCount) * 100}%`,
                    minWidth: 32,
                  }}
                >
                  <div
                    className="flex h-full items-center rounded bg-[#FC5200]/80 px-2 text-xs font-medium text-white"
                    style={{
                      width: `${d.pct}%`,
                      minWidth: 32,
                    }}
                  >
                    {d.count}x
                  </div>
                </div>
              </div>
              <span className="w-10 text-xs text-muted-foreground">
                {d.pct}%
              </span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function RaceSuggestions({
  suggestions,
}: {
  suggestions: RaceSuggestion[];
}) {
  return (
    <Card className="py-4">
      <CardContent className="space-y-3 px-4">
        <div className="flex items-center gap-1.5">
          <Zap className="h-4 w-4 text-[#FC5200]" />
          <span className="text-sm font-semibold">Corridas ideais pra você</span>
        </div>
        <p className="text-xs text-muted-foreground">
          Baseado nas distâncias que você mais corre e na sua localização.
        </p>

        <div className="space-y-2">
          {suggestions.slice(0, 5).map((race) => (
            <Link
              key={race.id}
              href={`/corrida/${race.slug}`}
              className="flex items-center justify-between rounded-lg border p-3 hover:bg-accent transition-colors"
            >
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{race.name}</p>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {formatDateShort(race.date)}
                  </span>
                  <span>
                    {race.city}/{race.state}
                  </span>
                </div>
                <p className="mt-0.5 text-xs text-[#FC5200]">
                  {race.matchReason}
                </p>
              </div>
              <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
            </Link>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function RecentActivities({
  activities,
}: {
  activities: StravaActivity[];
}) {
  const [showAll, setShowAll] = useState(false);
  const displayed = showAll ? activities : activities.slice(0, 8);

  if (activities.length === 0) {
    return (
      <Card className="py-4">
        <CardContent className="px-4 text-center text-sm text-muted-foreground">
          Nenhuma atividade de corrida encontrada no Strava.
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="py-4">
      <CardContent className="space-y-1 px-4">
        <div className="flex items-center gap-1.5 pb-2">
          <Trophy className="h-4 w-4 text-[#FC5200]" />
          <span className="text-sm font-semibold">Atividades recentes</span>
          <span className="ml-auto text-xs text-muted-foreground">
            {activities.length} corridas
          </span>
        </div>

        {displayed.map((activity) => (
          <ActivityRow key={activity.id} activity={activity} />
        ))}

        {activities.length > 8 && !showAll && (
          <Button
            variant="ghost"
            size="sm"
            className="w-full text-muted-foreground"
            onClick={() => setShowAll(true)}
          >
            Ver todas ({activities.length})
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

function ActivityRow({ activity }: { activity: StravaActivity }) {
  const label = getWorkoutLabel(activity.workout_type);
  const distKm = parseFloat(metersToKm(activity.distance));

  return (
    <div className="flex items-center gap-3 rounded-lg py-2">
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="truncate text-sm font-medium">{activity.name}</p>
          {label && (
            <Badge
              variant="secondary"
              className={
                label === "Prova"
                  ? "bg-[#FC5200]/10 text-[#FC5200] text-[10px]"
                  : "text-[10px]"
              }
            >
              {label}
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <span>{formatDateShort(activity.start_date_local)}</span>
          <span className="font-medium text-foreground">
            {distKm} km
          </span>
          <span>{formatPace(activity.average_speed)}/km</span>
          <span>{formatDurationShort(activity.moving_time)}</span>
          {activity.has_heartrate && activity.average_heartrate && (
            <span className="flex items-center gap-0.5">
              <Heart className="h-3 w-3 text-red-400" />
              {Math.round(activity.average_heartrate)}
            </span>
          )}
        </div>
      </div>
      {activity.pr_count > 0 && (
        <div className="flex items-center gap-0.5 text-[#FC5200]">
          <Trophy className="h-3.5 w-3.5" />
          <span className="text-xs font-medium">{activity.pr_count}</span>
        </div>
      )}
    </div>
  );
}

function ReconnectStravaButton() {
  const [isLoading, setIsLoading] = useState(false);

  const handleReconnect = () => {
    setIsLoading(true);
    const clientId = process.env.NEXT_PUBLIC_STRAVA_CLIENT_ID;
    const siteUrl = window.location.origin;
    const redirectUri = `${siteUrl}/auth/strava/callback`;
    const scope = "read,profile:read_all,activity:read";
    const state = crypto.randomUUID();
    document.cookie = `strava_oauth_state=${state}; path=/; max-age=600; SameSite=Lax`;

    const encodedRedirect = encodeURIComponent(redirectUri);
    window.location.href = `https://www.strava.com/oauth/authorize?client_id=${clientId}&redirect_uri=${encodedRedirect}&response_type=code&scope=${scope}&approval_prompt=force&state=${state}`;
  };

  return (
    <button
      type="button"
      className="relative flex h-12 w-48 items-center justify-center overflow-hidden rounded-md border bg-white disabled:opacity-50"
      onClick={handleReconnect}
      disabled={isLoading}
    >
      {isLoading && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/80">
          <Loader2 className="h-4 w-4 animate-spin text-[#FC5200]" />
        </div>
      )}
      <Image
        src="/strava/btn_strava_connect_with_white.svg"
        alt="Connect with Strava"
        width={237}
        height={48}
        className="h-full w-auto"
        unoptimized
      />
    </button>
  );
}
