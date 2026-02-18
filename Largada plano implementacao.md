# Largada — Plano de Implementação: Push Notifications por Raio

> **Versão:** 1.0  
> **Contexto:** Sistema em produção com Supabase + Next.js  
> **Objetivo:** Substituir match exato de cidade por raio geográfico configurável, com onboarding obrigatório de cidade e fluxo seguro de migração.

---

## Visão Geral das Fases

| Fase | Nome                             | Quando                               |
| ---- | -------------------------------- | ------------------------------------ |
| 0    | Hotfix de segurança              | Hoje — antes de qualquer outra coisa |
| 1    | Infraestrutura de banco          | Após hotfix                          |
| 2    | Backend — funções e triggers     | Após Fase 1                          |
| 3    | Frontend — onboarding            | Após Fase 2                          |
| 4    | Migração dos usuários legados    | Após Fase 3 validada                 |
| 5    | Seed de cidades via API (futuro) | Quando escalar                       |

---

## FASE 0 — Hotfix Imediato (Não mude dado nenhum ainda)

**Objetivo:** Parar de processar notificações para usuários com `city = NULL`.  
**Risco:** Zero. Esses usuários já não recebem nada útil.

### 0.1 — Corrigir `notifyNewRace()`

```typescript
// ANTES (bug atual)
const { data: profiles } = await supabase
  .from("profiles")
  .select("id, push_token")
  .eq("city", race.city)
  .eq("notifications_enabled", true);

// DEPOIS (hotfix)
const { data: profiles } = await supabase
  .from("profiles")
  .select("id, push_token")
  .eq("city", race.city)
  .eq("notifications_enabled", true)
  .not("city", "is", null); // guard explícito
```

### 0.2 — Corrigir `handle_new_user()`

```typescript
// ANTES
await supabase.from("profiles").insert({
  id: userId,
  city: null,
  notifications_enabled: true, // ← BUG: notifica sem cidade
});

// DEPOIS
await supabase.from("profiles").insert({
  id: userId,
  city: null,
  notifications_enabled: false, // ← correto: silêncio até ter cidade
  onboarding_completed: false,
});
```

**Deploy e validar. Só então avançar.**

---

## FASE 1 — Infraestrutura de Banco

### 1.1 — Habilitar PostGIS

Execute no SQL Editor do Supabase:

```sql
-- PostGIS já vem instalado no Supabase, só precisa habilitar
CREATE EXTENSION IF NOT EXISTS postgis;

-- Verificar se está ativo
SELECT PostGIS_Version();
```

### 1.2 — Criar tabela `cities`

```sql
CREATE TABLE cities (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        VARCHAR(100) NOT NULL,
  slug        VARCHAR(100) UNIQUE NOT NULL,
  state_code  CHAR(2)     NOT NULL,
  ibge_code   VARCHAR(7),
  latitude    DECIMAL(10, 7) NOT NULL,
  longitude   DECIMAL(10, 7) NOT NULL,
  geom        GEOGRAPHY(POINT, 4326)
              GENERATED ALWAYS AS (ST_MakePoint(longitude, latitude)) STORED,
  active      BOOLEAN DEFAULT true,
  created_at  TIMESTAMPTZ DEFAULT now()
);

-- Índice espacial (obrigatório para ST_DWithin ser performático)
CREATE INDEX idx_cities_geom ON cities USING GIST(geom);

-- Índice de busca por nome (autocomplete)
CREATE INDEX idx_cities_name ON cities USING GIN(to_tsvector('portuguese', name));
CREATE INDEX idx_cities_slug ON cities(slug);
```

### 1.3 — Popular `cities` com as cidades atuais

```sql
-- Inserir as cidades que você já suporta agora (hardcoded → banco)
INSERT INTO cities (name, slug, state_code, ibge_code, latitude, longitude) VALUES
  ('São José do Rio Preto', 'sao-jose-do-rio-preto', 'SP', '3549805', -20.8197, -49.3753),
  ('Votuporanga',           'votuporanga',           'SP', '3557105', -20.4228, -49.9728),
  ('Araçatuba',             'aracatuba',             'SP', '3503208', -21.2097, -50.4337),
  ('Catanduva',             'catanduva',             'SP', '3511102', -21.1381, -48.9728),
  ('Barretos',              'barretos',              'SP', '3505500', -20.5583, -48.5678),
  ('Ribeirão Preto',        'ribeirao-preto',        'SP', '3543402', -21.1775, -47.8103),
  ('São Paulo',             'sao-paulo',             'SP', '3550308', -23.5558, -46.6396);
  -- Adicione todas as cidades relevantes para o Largada

-- Confirmar que geom foi gerado
SELECT name, state_code, ST_AsText(geom) FROM cities LIMIT 3;
```

### 1.4 — Atualizar tabela `profiles`

```sql
-- Adicionar colunas novas (não-destrutivo, colunas existentes intactas)
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS city_id               UUID REFERENCES cities(id),
  ADD COLUMN IF NOT EXISTS notification_radius_km INT  DEFAULT 150,
  ADD COLUMN IF NOT EXISTS onboarding_completed   BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS onboarding_skipped_count INT DEFAULT 0;

-- Mudar default de notifications_enabled para novos usuários
-- (não afeta rows existentes, só INSERTs futuros)
ALTER TABLE profiles
  ALTER COLUMN notifications_enabled SET DEFAULT false;

-- Índice para a query de notificação
CREATE INDEX idx_profiles_notifications
  ON profiles(city_id, notifications_enabled)
  WHERE city_id IS NOT NULL AND notifications_enabled = true;
```

### 1.5 — Atualizar tabela `races`

```sql
ALTER TABLE races
  ADD COLUMN IF NOT EXISTS city_id UUID REFERENCES cities(id);

-- Vincular corridas existentes (se tiver campo city como string)
-- Adaptar conforme seu schema atual
UPDATE races r
SET city_id = c.id
FROM cities c
WHERE LOWER(TRIM(r.city)) = LOWER(c.name)
   OR r.city = c.slug;

-- Verificar quantas ficaram sem vínculo
SELECT COUNT(*) FROM races WHERE city_id IS NULL;
```

### 1.6 — Adicionar RLS (Row Level Security)

```sql
-- Usuário só pode ver/editar o próprio perfil
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Cidades são públicas (leitura para todos)
ALTER TABLE cities ENABLE ROW LEVEL SECURITY;
CREATE POLICY "cities_public_read" ON cities FOR SELECT USING (true);
```

---

## FASE 2 — Backend: Funções e Triggers

### 2.1 — Função SQL para buscar destinatários por raio

```sql
CREATE OR REPLACE FUNCTION get_race_notification_recipients(p_race_city_id UUID)
RETURNS TABLE(
  profile_id  UUID,
  push_token  TEXT,
  distance_km NUMERIC
) AS $$
  SELECT
    p.id,
    p.push_token,
    ROUND(
      ST_Distance(uc.geom, rc.geom)::NUMERIC / 1000,
      1
    ) AS distance_km
  FROM profiles p
  JOIN cities uc ON uc.id = p.city_id
  JOIN cities rc ON rc.id = p_race_city_id
  WHERE
    p.notifications_enabled   = true
    AND p.city_id             IS NOT NULL
    AND p.push_token          IS NOT NULL
    AND ST_DWithin(
      uc.geom,
      rc.geom,
      p.notification_radius_km * 1000  -- metros
    )
  ORDER BY distance_km ASC;
$$ LANGUAGE sql STABLE;
```

### 2.2 — Função de autocomplete de cidades

```sql
CREATE OR REPLACE FUNCTION search_cities(p_query TEXT, p_limit INT DEFAULT 10)
RETURNS TABLE(
  id         UUID,
  name       VARCHAR,
  state_code CHAR(2),
  slug       VARCHAR
) AS $$
  SELECT id, name, state_code, slug
  FROM cities
  WHERE
    active = true
    AND (
      name ILIKE '%' || p_query || '%'
      OR unaccent(name) ILIKE '%' || unaccent(p_query) || '%'
    )
  ORDER BY
    CASE WHEN name ILIKE p_query || '%' THEN 0 ELSE 1 END,
    name
  LIMIT p_limit;
$$ LANGUAGE sql STABLE;

-- Habilitar extensão unaccent para busca sem acentuação
CREATE EXTENSION IF NOT EXISTS unaccent;
```

### 2.3 — Atualizar `notifyNewRace()` no TypeScript

```typescript
// lib/notifications/notifyNewRace.ts

interface Recipient {
  profile_id: string;
  push_token: string;
  distance_km: number;
}

interface Race {
  id: string;
  name: string;
  date: string;
  city_id: string;
  city_name: string; // via JOIN com cities
}

export async function notifyNewRace(race: Race): Promise<void> {
  // 1. Buscar destinatários via função SQL com raio
  const { data: recipients, error } = (await supabase.rpc(
    "get_race_notification_recipients",
    {
      p_race_city_id: race.city_id,
    },
  )) as { data: Recipient[] | null; error: unknown };

  if (error) {
    console.error("[notifyNewRace] Erro ao buscar destinatários:", error);
    return;
  }

  if (!recipients?.length) {
    console.log(`[notifyNewRace] Nenhum destinatário para corrida ${race.id}`);
    return;
  }

  console.log(`[notifyNewRace] Enviando para ${recipients.length} usuários`);

  // 2. Montar payload personalizado por distância
  const notifications = recipients.map((user) => ({
    token: user.push_token,
    title:
      user.distance_km === 0
        ? `Nova corrida na sua cidade! 🏃`
        : `Nova corrida a ${user.distance_km}km de você 🏃`,
    body: `${race.name} — ${formatDate(race.date)} em ${race.city_name}`,
    data: {
      type: "new_race",
      raceId: race.id,
    },
  }));

  // 3. Enviar em batches (Expo, FCM, etc — adaptar ao seu provider)
  await sendPushBatch(notifications);
}
```

### 2.4 — Atualizar `handle_new_user()`

```typescript
// Trigger chamado após OAuth (Supabase Auth hook ou API route)
export async function handle_new_user(userId: string): Promise<void> {
  const { error } = await supabase.from("profiles").insert({
    id: userId,
    city: null, // string legada — deprecar depois
    city_id: null, // FK nova
    notifications_enabled: false, // ← não notifica sem cidade
    notification_radius_km: 150, // default recomendado
    onboarding_completed: false,
    onboarding_skipped_count: 0,
    created_at: new Date().toISOString(),
  });

  if (error) {
    console.error("[handle_new_user] Falha ao criar profile:", error);
    throw error;
  }
}
```

---

## FASE 3 — Frontend: Onboarding

### 3.1 — Middleware de redirecionamento

```typescript
// middleware.ts
import { NextRequest, NextResponse } from "next/server";
import { createMiddlewareClient } from "@supabase/auth-helpers-nextjs";

const PUBLIC_ROUTES = ["/login", "/onboarding", "/api"];

export async function middleware(request: NextRequest) {
  const res = NextResponse.next();
  const supabase = createMiddlewareClient({ req: request, res });

  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) return res;

  const isPublic = PUBLIC_ROUTES.some((r) =>
    request.nextUrl.pathname.startsWith(r),
  );

  if (isPublic) return res;

  const { data: profile } = await supabase
    .from("profiles")
    .select("city_id, onboarding_completed, onboarding_skipped_count")
    .eq("id", session.user.id)
    .single();

  const needsOnboarding =
    profile &&
    !profile.onboarding_completed &&
    profile.city_id === null &&
    (profile.onboarding_skipped_count ?? 0) < 3; // máximo 3 re-prompts

  if (needsOnboarding) {
    return NextResponse.redirect(new URL("/onboarding", request.url));
  }

  return res;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
```

### 3.2 — Página `/onboarding`

```typescript
// app/onboarding/page.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSupabaseClient, useUser } from '@supabase/auth-helpers-react';
import CityAutocomplete from '@/components/CityAutocomplete';
import RadiusSlider from '@/components/RadiusSlider';

export default function OnboardingPage() {
  const supabase = useSupabaseClient();
  const user = useUser();
  const router = useRouter();

  const [selectedCity, setSelectedCity] = useState<City | null>(null);
  const [radius, setRadius] = useState(150);
  const [loading, setLoading] = useState(false);

  async function handleConfirm() {
    if (!selectedCity || !user) return;
    setLoading(true);

    await supabase.from('profiles').update({
      city_id: selectedCity.id,
      city: selectedCity.name,          // manter string legada por ora
      notification_radius_km: radius,
      notifications_enabled: true,
      onboarding_completed: true,
    }).eq('id', user.id);

    router.push('/dashboard?welcome=true');
  }

  async function handleSkip() {
    if (!user) return;

    await supabase.rpc('increment_onboarding_skipped', { p_user_id: user.id });
    router.push('/dashboard');
  }

  return (
    <div className="onboarding-container">
      <h1>Você é de qual cidade?</h1>
      <p>Vou te avisar das corridas mais perto de você.</p>

      <CityAutocomplete onSelect={setSelectedCity} />

      {selectedCity && (
        <>
          <h2>Até onde você topa viajar?</h2>
          <RadiusSlider
            value={radius}
            onChange={setRadius}
            options={[50, 100, 150, 200]}
          />
          <p className="hint">
            Corridas em até <strong>{radius}km</strong> de {selectedCity.name}
          </p>
        </>
      )}

      <button
        onClick={handleConfirm}
        disabled={!selectedCity || loading}
        className="btn-primary"
      >
        {loading ? 'Salvando...' : 'Quero ver corridas perto de mim →'}
      </button>

      <button onClick={handleSkip} className="btn-ghost">
        Pular por agora
      </button>
    </div>
  );
}
```

### 3.3 — Componente `CityAutocomplete`

```typescript
// components/CityAutocomplete.tsx
'use client';

import { useState, useCallback } from 'react';
import { useSupabaseClient } from '@supabase/auth-helpers-react';
import { useDebouncedCallback } from 'use-debounce';

interface City {
  id: string;
  name: string;
  state_code: string;
  slug: string;
}

interface Props {
  onSelect: (city: City) => void;
}

export default function CityAutocomplete({ onSelect }: Props) {
  const supabase = useSupabaseClient();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<City[]>([]);

  const search = useDebouncedCallback(async (q: string) => {
    if (q.length < 2) return setResults([]);

    const { data } = await supabase.rpc('search_cities', {
      p_query: q,
      p_limit: 8,
    });

    setResults(data ?? []);
  }, 300);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setQuery(e.target.value);
    search(e.target.value);
  }

  function handleSelect(city: City) {
    setQuery(`${city.name} — ${city.state_code}`);
    setResults([]);
    onSelect(city);
  }

  return (
    <div className="autocomplete-wrapper">
      <input
        type="text"
        placeholder="Digite sua cidade..."
        value={query}
        onChange={handleChange}
        className="autocomplete-input"
      />
      {results.length > 0 && (
        <ul className="autocomplete-results">
          {results.map((city) => (
            <li key={city.id} onClick={() => handleSelect(city)}>
              {city.name}
              <span className="state-badge">{city.state_code}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
```

### 3.4 — Banner no Dashboard para usuários sem cidade

```typescript
// components/OnboardingBanner.tsx
'use client';

import Link from 'next/link';
import { useProfile } from '@/hooks/useProfile';

export default function OnboardingBanner() {
  const { profile } = useProfile();

  if (profile?.city_id) return null; // cidade configurada, sem banner

  return (
    <div className="banner-warning">
      <span>📍 Configure sua cidade para receber notificações de corridas</span>
      <Link href="/onboarding" className="banner-cta">
        Configurar agora →
      </Link>
    </div>
  );
}
```

### 3.5 — Função SQL auxiliar para o skip

```sql
CREATE OR REPLACE FUNCTION increment_onboarding_skipped(p_user_id UUID)
RETURNS VOID AS $$
  UPDATE profiles
  SET onboarding_skipped_count = COALESCE(onboarding_skipped_count, 0) + 1
  WHERE id = p_user_id;
$$ LANGUAGE sql;
```

---

## FASE 4 — Migração dos Usuários Legados em Produção

> ⚠️ Execute com atenção. Faça backup antes.

### 4.1 — Diagnóstico (só leitura, sem risco)

```sql
-- Quantos usuários estão no estado inconsistente?
SELECT
  COUNT(*)                                                     AS total_usuarios,
  COUNT(*) FILTER (WHERE city_id IS NULL)                      AS sem_cidade,
  COUNT(*) FILTER (WHERE city_id IS NULL AND notifications_enabled = true) AS notificacao_ativa_sem_cidade,
  COUNT(*) FILTER (WHERE city_id IS NOT NULL)                  AS com_cidade
FROM profiles;

-- Quais cidades (string) têm mais usuários para priorizar mapeamento?
SELECT city, COUNT(*) FROM profiles
WHERE city IS NOT NULL AND city_id IS NULL
GROUP BY city ORDER BY COUNT(*) DESC;
```

### 4.2 — Vincular usuários existentes a `city_id`

```sql
-- Tentar vincular pelo campo city (string) com cities.name
UPDATE profiles p
SET city_id = c.id
FROM cities c
WHERE p.city_id IS NULL
  AND p.city IS NOT NULL
  AND (
    LOWER(TRIM(p.city)) = LOWER(c.name)
    OR p.city = c.slug
    OR unaccent(LOWER(TRIM(p.city))) = unaccent(LOWER(c.name))
  );

-- Checar quantos foram vinculados
SELECT COUNT(*) FROM profiles WHERE city_id IS NOT NULL;

-- Checar quem sobrou sem vínculo (cidades com grafia diferente)
SELECT DISTINCT city, COUNT(*) FROM profiles
WHERE city IS NOT NULL AND city_id IS NULL
GROUP BY city ORDER BY COUNT(*) DESC;
-- Corrigir manualmente os casos que sobrarem
```

### 4.3 — Disparar e-mail de reengajamento

> Antes de desativar notificações dos legados, converta o problema em oportunidade.

Enviar para todos com `city_id IS NULL`:

```
Assunto: Não perca nenhuma corrida perto de você 🏃

[Nome], configure sua cidade no Largada e comece a receber
alertas das próximas provas na sua região — incluindo corridas
a até 150km de distância.

→ [Configurar minha cidade]
```

### 4.4 — Desativar notificações dos que ainda ficaram sem cidade

```sql
-- Executar SOMENTE após e-mail enviado (dar 48-72h de janela)
BEGIN;

-- Snapshot de segurança antes de alterar
CREATE TABLE profiles_migration_backup_v1 AS
  SELECT * FROM profiles WHERE city_id IS NULL;

-- Desativar notificações de quem não tem cidade
UPDATE profiles
SET
  notifications_enabled     = false,
  onboarding_completed      = false,
  onboarding_skipped_count  = 0
WHERE
  city_id IS NULL
  AND notifications_enabled = true;

-- Confirmar resultado
SELECT COUNT(*) FROM profiles WHERE city_id IS NULL AND notifications_enabled = true;
-- Deve retornar 0

COMMIT;
```

### 4.5 — Cleanup pós-migração (somente após tudo estável)

```sql
-- Após validar que city_id está funcionando para todos,
-- marcar coluna city (string) como deprecated
COMMENT ON COLUMN profiles.city IS 'DEPRECATED: usar city_id. Manter até Q3/2025 para retrocompatibilidade.';

-- Futuramente: DROP COLUMN city (não agora)
```

---

## FASE 5 — Seed Automático de Cidades via API do IBGE (Futuro)

### 5.1 — Script de seed

```typescript
// scripts/seed-cities-ibge.ts
// Executar: npx ts-node scripts/seed-cities-ibge.ts

import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!, // service key para bypass de RLS
);

interface IBGEMunicipio {
  id: number;
  nome: string;
  microrregiao: {
    mesorregiao: {
      UF: { sigla: string };
    };
  };
}

async function getCoordinates(
  name: string,
  state: string,
): Promise<{ lat: number; lng: number } | null> {
  // Nominatim (OpenStreetMap) — gratuito, respeitar 1 req/s
  const query = encodeURIComponent(`${name}, ${state}, Brasil`);
  const url = `https://nominatim.openstreetmap.org/search?q=${query}&format=json&limit=1`;

  const res = await fetch(url, {
    headers: { "User-Agent": "Largada App (contato@largada.app)" },
  });
  const data = await res.json();

  if (!data.length) return null;

  await new Promise((r) => setTimeout(r, 1100)); // respeitar rate limit

  return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-");
}

async function seedCities(stateFilter?: string) {
  const url =
    "https://servicodados.ibge.gov.br/api/v1/localidades/municipios?orderBy=nome";
  const res = await fetch(url);
  const municipios: IBGEMunicipio[] = await res.json();

  const filtered = stateFilter
    ? municipios.filter(
        (m) => m.microrregiao.mesorregiao.UF.sigla === stateFilter,
      )
    : municipios;

  console.log(`Processando ${filtered.length} municípios...`);

  for (const m of filtered) {
    const state = m.microrregiao.mesorregiao.UF.sigla;
    const coords = await getCoordinates(m.nome, state);

    if (!coords) {
      console.warn(`Sem coordenadas: ${m.nome} — ${state}`);
      continue;
    }

    const { error } = await supabase.from("cities").upsert(
      {
        name: m.nome,
        slug: slugify(m.nome),
        state_code: state,
        ibge_code: String(m.id),
        latitude: coords.lat,
        longitude: coords.lng,
      },
      { onConflict: "slug" }, // upsert seguro
    );

    if (error) console.error(`Erro ao inserir ${m.nome}:`, error);
    else console.log(`✓ ${m.nome} — ${state}`);
  }

  console.log("Seed concluído.");
}

// Começar só com SP para validar
seedCities("SP");
```

### 5.2 — Estratégia de execução do seed

```
1. Rodar primeiro apenas 'SP' e validar no banco
2. Testar autocomplete com as cidades novas
3. Expandir para outros estados gradualmente
4. Não fazer tudo de uma vez — Nominatim tem rate limit de 1 req/s
   (5.570 municípios brasileiros = ~1h30 de execução)
```

---

## Checklist de Execução

### Fase 0 — Hotfix

- [ ] Atualizar guard em `notifyNewRace()` com `.not('city', 'is', null)`
- [ ] Atualizar `handle_new_user()` com `notifications_enabled: false`
- [ ] Fazer deploy e validar em produção

### Fase 1 — Banco

- [ ] Habilitar PostGIS no Supabase
- [ ] Criar tabela `cities` com índice GIST
- [ ] Popular cidades suportadas atualmente
- [ ] Adicionar colunas em `profiles`: `city_id`, `notification_radius_km`, `onboarding_completed`, `onboarding_skipped_count`
- [ ] Alterar default de `notifications_enabled` para `false`
- [ ] Adicionar `city_id` em `races`
- [ ] Vincular corridas existentes a `city_id`

### Fase 2 — Backend

- [ ] Criar função `get_race_notification_recipients()`
- [ ] Criar função `search_cities()`
- [ ] Criar função `increment_onboarding_skipped()`
- [ ] Habilitar extensão `unaccent`
- [ ] Atualizar `notifyNewRace()` para usar `rpc()`
- [ ] Atualizar `handle_new_user()`
- [ ] Testar query de raio com dados reais

### Fase 3 — Frontend

- [ ] Atualizar middleware para redirecionar ao onboarding
- [ ] Criar página `/onboarding` com seleção de cidade + raio
- [ ] Criar componente `CityAutocomplete` com debounce
- [ ] Criar componente `RadiusSlider`
- [ ] Adicionar `OnboardingBanner` no layout do dashboard
- [ ] Testar fluxo completo: login → onboarding → dashboard

### Fase 4 — Migração

- [ ] Rodar diagnóstico (só leitura)
- [ ] Vincular usuários existentes via `city` string → `city_id`
- [ ] Corrigir manualmente os casos de grafia diferente
- [ ] Enviar e-mail de reengajamento para usuários sem cidade
- [ ] Aguardar 48-72h
- [ ] Criar backup (`profiles_migration_backup_v1`)
- [ ] Desativar notificações de quem ficou sem cidade
- [ ] Validar: `COUNT(*) WHERE city_id IS NULL AND notifications_enabled = true` = 0

### Fase 5 — Futuro

- [ ] Implementar script de seed do IBGE
- [ ] Rodar com filtro `SP` e validar
- [ ] Expandir para outros estados

---

## Pontos de Atenção

**PostGIS**: `ST_DWithin` com índice GIST é O(log n) — performático mesmo com milhares de usuários. Não precisa de cache a menos que o volume de corridas seja altíssimo.

**Raio configurável**: Já está no schema (`notification_radius_km`). Você pode expor um slider nas configurações de perfil depois sem nenhuma mudança de banco.

**Unaccent**: A extensão `unaccent` do Postgres garante que "Araçatuba" seja encontrado mesmo digitando "Aracatuba". Essencial para UX brasileiro.

**Nominatim / IBGE**: A API do IBGE retorna todos os municípios mas sem coordenadas nesse endpoint. As coordenadas precisam vir do Nominatim (OpenStreetMap) ou de um dataset externo. O script acima já combina os dois.

**Backup antes da migração**: A tabela `profiles_migration_backup_v1` é segurança — nunca altere dados de produção sem uma cópia pontual.
