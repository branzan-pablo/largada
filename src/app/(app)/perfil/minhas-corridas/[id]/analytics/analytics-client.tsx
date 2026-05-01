"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Eye, MousePointerClick, Percent, ExternalLink } from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import type { RaceAnalytics } from "@/app/api/races/[id]/analytics/route";

export function AnalyticsClient({
  raceId,
  raceSlug,
}: {
  raceId: string;
  raceSlug: string;
}) {
  const [data, setData] = useState<RaceAnalytics | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/races/${raceId}/analytics`)
      .then(async (r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json() as Promise<RaceAnalytics>;
      })
      .then((d) => {
        if (!cancelled) setData(d);
      })
      .catch(() => {
        if (!cancelled) setError("Erro ao carregar analytics.");
      });
    return () => {
      cancelled = true;
    };
  }, [raceId]);

  if (error) {
    return (
      <p className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
        {error}
      </p>
    );
  }

  if (!data) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-lg" />
          ))}
        </div>
        <Skeleton className="h-64 rounded-lg" />
      </div>
    );
  }

  const { totals, daily } = data;
  const ctrPct = (totals.ctr * 100).toFixed(1);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <StatCard
          icon={Eye}
          label="Visualizações"
          value={totals.views.toLocaleString("pt-BR")}
        />
        <StatCard
          icon={MousePointerClick}
          label="Cliques em inscrição"
          value={totals.clicks.toLocaleString("pt-BR")}
        />
        <StatCard
          icon={Percent}
          label="Taxa de conversão"
          value={`${ctrPct}%`}
          hint={totals.views === 0 ? "Sem dados ainda" : undefined}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-semibold">
            Últimos 30 dias
          </CardTitle>
        </CardHeader>
        <CardContent>
          <DailyChart daily={daily} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-semibold">
            Compartilhar
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <p className="text-muted-foreground">
            Mande este link para divulgar — cada acesso conta como visualização e
            cada clique no botão de inscrição é registrado.
          </p>
          <Link
            href={`/corrida/${raceSlug}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 font-medium text-primary hover:underline"
          >
            Abrir página da corrida
            <ExternalLink className="h-3.5 w-3.5" />
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  hint,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-xs font-medium text-muted-foreground">
          {label}
        </CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <p className="text-2xl font-bold">{value}</p>
        {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
      </CardContent>
    </Card>
  );
}

function DailyChart({
  daily,
}: {
  daily: RaceAnalytics["daily"];
}) {
  const maxViews = Math.max(1, ...daily.map((d) => d.views));
  const empty = daily.every((d) => d.views === 0 && d.clicks === 0);

  if (empty) {
    return (
      <p className="py-8 text-center text-sm text-muted-foreground">
        Sem visualizações nos últimos 30 dias.
      </p>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex h-40 items-end gap-1">
        {daily.map((d) => {
          const viewH = (d.views / maxViews) * 100;
          const clickH = d.views > 0 ? (d.clicks / maxViews) * 100 : 0;
          return (
            <div
              key={d.date}
              className="group relative flex-1"
              title={`${d.date}: ${d.views} views, ${d.clicks} cliques`}
            >
              <div className="flex h-full flex-col-reverse">
                <div
                  className="rounded-t-sm bg-[#FF4D00]/20"
                  style={{ height: `${viewH}%` }}
                />
                <div
                  className="absolute bottom-0 left-0 right-0 rounded-t-sm bg-[#FF4D00]"
                  style={{ height: `${clickH}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
      <div className="flex items-center gap-4 pt-2 text-xs text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-3 w-3 rounded-sm bg-[#FF4D00]/20" />
          Views
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-3 w-3 rounded-sm bg-[#FF4D00]" />
          Cliques
        </span>
      </div>
    </div>
  );
}
