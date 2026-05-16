# Largada — Relatório de Acompanhamento Pós-Auditoria UI/UX (2 semanas)

**Data:** 2026-05-16  
**Branch auditada:** `main`  
**Commit âncora esperado:** `caf330b` ("feat: mobile-first UI/UX audit pass") — **NÃO ENCONTRADO** (ver seção Novos Achados)  
**Commit mais recente no repositório:** `8b571fc` (2026-04-30)

---

## Status Geral

🔴 **VERMELHO** — A maioria dos padrões críticos da auditoria mobile-first **não foram aplicados ou revertidos**. Adicionalmente, o Next.js tem 11 advisories de segurança (incluindo HIGH) que requerem upgrade imediato.

---

## 1. Lighthouse Mobile

### URL Pública

| URL tentada | Resultado |
|---|---|
| `https://largadas.com.br` | **403 Forbidden** — possível Vercel Deployment Protection ativada |
| `https://largada.app` | **SSL/ERR_CERT_AUTHORITY_INVALID** — domínio não acessível |

**Lighthouse não pôde ser executado.** O servidor retornou 403 para `largadas.com.br`, bloqueando o headless Chrome. Isso pode indicar:
- Vercel Deployment Protection com senha ativa em produção
- Firewall / rate-limit bloqueando o user-agent `HeadlessChrome`

### Tabela de Métricas (comparativo com baselines estimados)

| Métrica | Baseline Pré-auditoria (est.) | Target | Medido | Status |
|---|---|---|---|---|
| LCP | ~3,5 s | < 3,0 s | N/A | ⚠️ não medido |
| CLS | ~0,15 | < 0,10 | N/A | ⚠️ não medido |
| TBT (proxy INP) | — | < 300 ms | N/A | ⚠️ não medido |
| TTFB | — | < 800 ms | N/A | ⚠️ não medido |
| Score Performance | ~70 | ≥ 80 | N/A | ⚠️ não medido |
| Score Acessibilidade | — | ≥ 90 | N/A | ⚠️ não medido |

**Ação requerida pelo usuário:** Rodar o Lighthouse manualmente em ambiente autorizado:
```bash
export CHROME_PATH="/root/.cache/puppeteer/chrome/linux-148.0.7778.167/chrome-linux64/chrome"
npx lighthouse@latest https://largadas.com.br \
  --only-categories=performance,accessibility,best-practices \
  --form-factor=mobile --throttling-method=simulate \
  --output=html --output-path=./lighthouse-report.html \
  --chrome-flags="--headless --no-sandbox --disable-gpu"
```

---

## 2. Verificação Estática dos Padrões da Auditoria

### Resultado por arquivo

| Arquivo | Padrão esperado | Status | Observação |
|---|---|---|---|
| `components/layout/bottom-nav.tsx` | tap targets `min-h-11 min-w-11` | ❌ | Botões/links têm `py-1 px-3` (~36×44px). Faltam classes `min-h-11 min-w-11` explícitas. |
| `components/races/race-card.tsx` | metadata com `truncate` / `min-w-0` | ❌ | Título tem `line-clamp-2`, mas spans de cidade e data não têm `truncate min-w-0`. Overflow possível em nomes longos. |
| `components/pwa/install-prompt.tsx` | snooze 14d/60d, `SHORT_SNOOZE_MS` / `LONG_SNOOZE_MS` | ❌ | Dismiss permanente com `largada_install_dismissed = "1"`. Sem lógica de snooze. Usuário que dispensa nunca mais vê o prompt. |
| `components/auth/oauth-buttons.tsx` | ambos os botões `h-12` | ⚠️ | Strava tem `h-12` ✅. Google usa `<Button variant="outline">` sem `h-12` explícito — herda `h-10` do shadcn default. |
| `app/(landing)/page.tsx` | `<Image>` hero com `sizes="100vw"`, subtítulo começando com "Descubra" | ✅ | Hero usa `fill` (correto para full-bleed). Subtítulo: "Descubra provas perto de você…" ✅ |
| `components/auth/login-form.tsx` | `inputMode`, `autoComplete`, `aria-invalid`, `aria-describedby` | ❌ | Nenhum desses atributos presente. Erros em `text-xs` (não `text-sm`). |
| `components/auth/register-form.tsx` | mesmos atributos de a11y mobile | ❌ | Mesmo problema do login-form. |
| `app/(app)/corrida/[slug]/race-detail-client.tsx` | `StickyActionBar` com `bottom-[calc(4rem+env(safe-area-inset-bottom))]` | ⚠️ | Elemento é `bottom-0` com `pb-[max(0.75rem,env(safe-area-inset-bottom))]`. Padrão funciona, mas difere do especificado. Potencial sobreposição com o bottom-nav. |
| `components/layout/mobile-menu.tsx` | sheet de navegação com links corretos | ✅ | Sheet lateral implementada com links, user area, botões de login/registro e admin link. |
| **`components/pwa/sticky-mobile-cta.tsx`** | dismiss + href dinâmico (count===1 → /corrida/\<slug\>) | ❌ | **ARQUIVO NÃO EXISTE** no repositório. |
| **`app/(landing)/landing-faq.tsx`** | `summary` com `min-h-14` e hover/active | ❌ | **ARQUIVO NÃO EXISTE** no repositório. |
| **`lib/landing-stats.ts`** | retorna `firstOpenSlug?: string` quando count===1 | ❌ | **ARQUIVO NÃO EXISTE** no repositório. |

### Síntese da verificação estática

- **5 de 12 padrões**: presentes parcialmente ou totalmente (✅/⚠️)
- **7 de 12 padrões**: ausentes ou com arquivos inexistentes (❌)
- **3 arquivos inteiros**: `sticky-mobile-cta.tsx`, `landing-faq.tsx`, `landing-stats.ts` nunca foram criados

---

## 3. Auditoria de Segurança (`pnpm audit`)

### Totais por severidade

| Severidade | Total |
|---|---|
| Critical | 0 |
| High | 32 |
| Moderate | 34 |
| Low | 6 |
| **Total** | **72** |

### Análise por dependência raiz

| Pacote raiz | Tipo | CVEs (sample) | Severity | Fix |
|---|---|---|---|---|
| **`next`** (16.1.6) | **Produção** | Middleware bypass, DoS Server Components, SSRF, XSS CSP, cache poisoning | HIGH/MOD | `pnpm update next@16.2.6` |
| `shadcn` (CLI) | Dev | Hono (muitos), qs, path-to-regexp, ajv, fast-uri, ip-address | HIGH/MOD | `pnpm update shadcn` (dev-only) |
| `eslint` / `eslint-config-next` | Dev | minimatch ReDoS (3 CVEs), flatted prototype pollution, brace-expansion DoS, picomatch ReDoS | HIGH/MOD | `pnpm update eslint eslint-config-next` |
| `supabase` (CLI) | Dev | `tar` — arbitrary file read/write via symlink chain (CVE-2026-26960) | HIGH | `pnpm update supabase` |
| `vitest` | Dev | `vite` — path traversal, arbitrary file read via WebSocket | HIGH | `pnpm update vitest` |
| `web-push` | **Produção** | `bn.js` — infinite loop (DoS) | Moderate | `pnpm update web-push` |
| `@tailwindcss/postcss` + `next>postcss` | **Produção (build)** | PostCSS XSS via `</style>` em CSS Stringify | Moderate | `pnpm update postcss` (indireta via next upgrade) |

### Top 5 ações de segurança ordenadas por risco real

1. 🚨 **`pnpm update next@16.2.6`** — Next.js tem 11 advisories (HIGH/MOD/LOW) no repositório, incluindo Middleware/Proxy bypass que permite contornar autenticação em App Router (`1118938`, `1118955`, `1118959`). **Risco de produção imediato.**

2. ⚠️ **Atualizar `shadcn` CLI** — `shadcn` instala `@modelcontextprotocol/sdk>hono@4.11.x` no devDependencies. Hono tem 12+ advisories (cookie injection, path traversal, prototype pollution). Risco é limitado ao ambiente de dev, mas o upgrade é trivial.

3. ⚠️ **Atualizar `eslint` + `eslint-config-next`** — minimatch ReDoS e flatted prototype pollution afetam o pipeline de lint (CI). Não impactam runtime de produção.

4. 📌 **`pnpm update web-push`** — `bn.js` infinite loop (DoS) em dependência de produção usada para envio de push notifications VAPID. Baixo vetor de ataque direto, mas recomendado atualizar.

5. 📌 **Atualizar `vitest`** — `vite@<7.3.2` tem path traversal e arbitrary file read via dev server WebSocket. Risco zero em produção, mas relevante em ambientes de CI/CD com dev server exposto.

---

## 4. Métricas que Precisam de Input Humano

As métricas abaixo requerem acesso ao Vercel Dashboard (vercel.com/dashboard → projeto Largada → Analytics/Speed Insights):

- **CTR do botão "Ver as corridas"** (Hero da landing `/`): Verificar em Analytics → Events. Se não houver event tracking, adicionar em `src/components/landing/cta-buttons.tsx`:
  ```tsx
  import { track } from '@vercel/analytics';
  // nos handlers/links:
  onClick={() => track('hero_cta_click', { variant: 'ver_corridas' })}
  ```

- **CTR do botão "Criar conta grátis"**: Mesmo arquivo, adicionar:
  ```tsx
  onClick={() => { track('hero_cta_click', { variant: 'criar_conta' }); openRegister(); }}
  ```

- **Dismiss rate vs Install rate do InstallPrompt**: Variáveis actuais — `largada_install_dismissed` (localStorage). O prompt usa dismiss permanente, não snooze. Sem analytics de install rate implementado.

- **Dismiss rate do StickyMobileCta**: Componente `sticky-mobile-cta.tsx` **não existe** no codebase. Não há dados para coletar.

- **CTR do StickyActionBar (race-detail)** com 1 prova vs múltiplas: O `StickyActionBar` atual é específico de `/corrida/[slug]` e não tem lógica de "count===1 → link direto". Sem tracking implementado.

---

## 5. Punch List de Próximas Melhorias (ROI decrescente)

### 🥇 #1 — Upgrade Next.js 16.1.6 → 16.2.6 (Segurança + Perf)

**Impacto:** Corrige 11 advisories de segurança (Middleware bypass, DoS, XSS, SSRF). Next.js 16.2.x inclui melhorias de performance em Server Components e streaming.
**Esforço:** Baixo — `pnpm update next@16.2.6 eslint-config-next@16.2.6`.
**Risco:** Baixo — mudança de patch/minor dentro do 16.x.

```bash
pnpm update next@16.2.6 eslint-config-next@16.2.6
pnpm build  # verificar sem regressões
```

### 🥈 #2 — Atributos de acessibilidade mobile em forms de auth

**Impacto:** Melhora UX em 90% do tráfego mobile (teclado certo, preenchimento automático, validação acessível). Melhora score de Acessibilidade no Lighthouse (potencial +5-10pts).
**Esforço:** Médio — 2 arquivos, ~20 linhas.
**Arquivos:** `login-form.tsx`, `register-form.tsx`

Adicionar em cada `<Input>`:
- `email` field: `inputMode="email" autoComplete="email" autoCapitalize="none" aria-invalid={!!errors.email} aria-describedby="email-error"`
- `password` field: `autoComplete="current-password"` (login) / `autoComplete="new-password"` (register)
- Error `<p>` com `id="email-error"` e `role="alert"`
- Trocar `text-xs` por `text-sm` nos erros

### 🥉 #3 — Snooze no InstallPrompt + tap targets no bottom-nav

**Impacto:** Dois problemas de UX com custo zero de conversão — dismiss permanente elimina instalações futuras; tap targets abaixo de 44px causam toques errados em mobile.
**Esforço:** Médio.

**Install Prompt** — substituir dismiss permanente por snooze:
```tsx
const SHORT_SNOOZE_MS = 14 * 24 * 60 * 60 * 1000; // 14 dias
const LONG_SNOOZE_MS  = 60 * 24 * 60 * 60 * 1000; // 60 dias

// Em vez de: localStorage.setItem("largada_install_dismissed", "1")
// Usar:
localStorage.setItem("largada_install_snooze_until", String(Date.now() + SHORT_SNOOZE_MS));
// E na leitura do useEffect:
const snoozed = localStorage.getItem("largada_install_snooze_until");
if (snoozed && Date.now() < parseInt(snoozed)) return; // ainda em snooze
```

**Bottom Nav** — adicionar tap targets mínimos:
```tsx
// Trocar className dos links/buttons:
"flex flex-col items-center gap-0.5 px-3 py-1 min-h-11 min-w-11 justify-center text-xs"
```

---

## 6. Novos Achados (reauditoria de arquivos críticos)

### 6.1 Commit âncora `caf330b` não existe

O commit `"feat: mobile-first UI/UX audit pass"` (`caf330b`) **não existe no repositório**. Os commits mais próximos da auditoria são de 2026-04-08:
- `80375ec` — "perf: improve Core Web Vitals (mobile)"
- `ce4dcbb` — "perf: server-side race fetch + ISR for LCP improvement"
- `8ff254d` — "feat: improve race list UX — compact mobile filters"

Isso sugere que a auditoria de 10 etapas foi **parcialmente implementada** em commits separados antes de 30 de abril, mas **nunca teve um commit consolidado** com todos os padrões.

### 6.2 StickyActionBar sobrepõe o bottom-nav

Em `race-detail-client.tsx:237`, o `StickyActionBar` usa `fixed bottom-0`. O `BottomNav` também usa `fixed bottom-0`. Em `/corrida/[slug]`, **os dois componentes estão na mesma posição**, causando sobreposição. O StickyActionBar deveria usar `bottom-[4rem]` (altura do nav) ou o bottom-nav deveria ser ocultado na rota de detalhe.

### 6.3 InstallPrompt — dismiss permanente vs snooze

A lógica atual guarda `largada_install_dismissed = "1"` sem expiração. Um usuário que dispensa o prompt na primeira visita **nunca mais verá a proposta de instalação**, mesmo semanas depois. A variável mencionada na auditoria (`largada_install_snooze_until`) não existe — toda a lógica de snooze não foi implementada.

### 6.4 Google OAuth button não tem `h-12`

O botão Strava tem `h-12` ✅. O botão Google usa `<Button variant="outline">` sem height explícito, herdando `h-10` do shadcn (40px). Isso cria **inconsistência visual** e tap target menor que o Strava. Adicionar `className="h-12"` ao Button do Google.

### 6.5 Sem event tracking nos CTAs

Nenhum dos CTAs da landing (`cta-buttons.tsx`) tem `track()` do Vercel Analytics. Dados de CTR e conversão da auditoria não podem ser medidos.

### 6.6 `race-card.tsx` — metadados sem proteção de overflow

A linha de cidade/estado e a linha de data (`<span>`) não têm `truncate` nem `min-w-0`. Em nomes de cidades longas ou combinações data+hora extensas, pode ocorrer overflow horizontal no card.

---

## 7. Status do GitHub Issue

`gh` CLI não está autenticado neste ambiente remoto. Relatório disponível em `audit-followup-report.md`. Para criar o issue automaticamente, conecte via `/web-setup` ou use o MCP do GitHub disponível nesta sessão.

---

*Relatório gerado por auditoria estática automatizada em 2026-05-16. Lighthouse não foi executado (largadas.com.br retornou 403). Os dados de segurança são baseados em `pnpm audit` com 873 dependências analisadas.*
