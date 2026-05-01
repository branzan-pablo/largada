# Ambiente de homologação (staging)

Guia passo-a-passo para provisionar um ambiente isolado de produção,
acoplado a Vercel Preview Deployments e a um projeto Supabase próprio.

> **Resumo do isolamento:** banco separado, chaves separadas (Supabase, VAPID,
> Strava, AbacatePay sandbox), URL própria. Nada que você fizer aqui pode
> impactar a produção real.

---

## 0. Pré-requisitos

- [ ] Projeto Supabase **largad-staging** criado (você já fez)
- [ ] Acesso ao painel Vercel do projeto `largada`
- [ ] `pnpm` instalado localmente
- [ ] Senha do banco do Supabase staging anotada (criada no momento da criação do projeto — está no painel Supabase em Settings → Database)

---

## 1. Aplicar todas as migrações no Supabase staging

Você tem 18 migrações em `supabase/migrations/`. Tem dois caminhos.

### Caminho A — Supabase CLI (recomendado, automatizado)

```powershell
# 1. Login (abre o navegador, autoriza)
pnpm exec supabase login

# 2. Linkar o projeto local ao staging
#    O <project-ref> é o subdomínio: se a URL é https://abcdefgh.supabase.co,
#    o ref é "abcdefgh". Está também em Settings → General → Reference ID.
pnpm exec supabase link --project-ref <staging-project-ref>
#    -> ele vai pedir a database password (a que você definiu na criação do projeto)

# 3. Aplicar todas as migrações
pnpm exec supabase db push
```

Após o `db push`, abra o **SQL Editor** do staging e rode:

```sql
SELECT count(*) AS total FROM information_schema.tables
WHERE table_schema = 'public';
```

Deve retornar pelo menos 15 tabelas (races, profiles, rsvps, link_clicks,
race_views, payment_orders, etc.).

> ⚠️ **`supabase link` é por máquina, não por branch.** Se você usar o mesmo
> diretório para apontar pra prod depois, vai ter que `supabase link` de novo.
> Para evitar acidente, nunca rode `db push` sem antes confirmar o `project-ref`
> com `supabase status` ou olhando o `.supabase/config.toml` local.

### Caminho B — SQL Editor manual (sem CLI)

No painel do Supabase staging → **SQL Editor** → New query → cole o conteúdo
de cada arquivo na ordem `001_…` até `018_…` e rode um por um.

É tedioso mas não exige login no CLI. Se algum falhar, leia a mensagem — pode
ser dependência de uma migração anterior.

---

## 2. Aplicar o seed de staging

Após as migrações rodarem com sucesso, aplique o seed para ter dados visíveis:

```powershell
# Via CLI (depois do supabase link):
pnpm exec supabase db reset --no-seed
# Não — esse comando dropa o banco. NÃO USE em staging com migrations já aplicadas.
```

Em vez disso, abra `supabase/seed-staging.sql` e cole no **SQL Editor** do
Supabase staging. Esse seed cria:

- 5 cidades base (Noroeste Paulista)
- 1 perfil admin de teste
- 5 corridas de exemplo
- ~80 page views e ~20 clicks fake distribuídos em 30 dias para o dashboard
  de analytics ter algo visível

---

## 3. Gerar credenciais novas que devem ser específicas de staging

### 3.1 VAPID (Web Push)

```powershell
pnpm exec web-push generate-vapid-keys
```

Anote `Public Key` e `Private Key`. Vão para `NEXT_PUBLIC_VAPID_PUBLIC_KEY` e
`VAPID_PRIVATE_KEY` no Vercel (escopo Preview).

> Pelo isolamento ser bom, **ninguém de produção recebe push de staging**.
> Você precisa testar push em staging assinando do zero a partir do navegador.

### 3.2 CRON_SECRET

```powershell
# Gera um token aleatório
[System.Security.Cryptography.RandomNumberGenerator]::GetBytes((New-Object byte[] 32)) -join ''
# ou no bash:
openssl rand -hex 32
```

### 3.3 STRAVA_WEBHOOK_VERIFY_TOKEN

Qualquer string aleatória (similar ao CRON_SECRET).

---

## 4. App Strava de staging

O Strava só permite **um** redirect URI por app. Crie um app dedicado:

1. https://www.strava.com/settings/api → **Create App** (ou se você já tem um
   chamado "Largada", crie um segundo "Largada Staging")
2. **Authorization Callback Domain:** o domínio do seu staging (ver §6 abaixo)
   - Se vai usar URL Preview do Vercel: `largada-git-staging.vercel.app`
   - Se vai usar alias custom: `staging.largadas.com.br`
3. Anote `Client ID` e `Client Secret`
4. **Webhook subscription** (opcional para staging): pode pular — é mais fácil
   testar sem webhook em homologação

---

## 5. AbacatePay em modo dev

A AbacatePay tem **API Key de desenvolvimento** que não cobra de verdade
(simula pagamento). No painel AbacatePay:

1. Settings → API Keys → procurar **Dev/Sandbox key** (chave começa com prefixo
   diferente da production)
2. Use essa chave em `ABACATEPAY_API_KEY` no Vercel Preview
3. Para o webhook, gere um secret novo só para staging

> Se a sua conta AbacatePay não tiver chave de dev, fale com o suporte ou
> abra uma conta separada de teste. Em último caso pode usar a chave de produção
> com cuidado — o seed só usa CPFs de teste.

---

## 6. Decidir o domínio do staging

Tem três caminhos, ordem de robustez:

| Opção | Esforço | Domínio | Estabilidade |
|---|---|---|---|
| **Preview por branch** (default) | 0 | `largada-git-<branch>-pablo.vercel.app` | Muda quando branch muda |
| **Branch fixa `staging`** | 5 min | `largada-git-staging-pablo.vercel.app` | Estável enquanto a branch existir |
| **Alias custom** | 10 min | `staging.largadas.com.br` | Estável e bonito |

**Recomendado:** opção 2 ou 3 — porque webhook AbacatePay e callback Strava
precisam de URL fixa. Se ficar mudando a URL, você reconfigura o tempo todo.

### Como criar a branch + alias staging

```powershell
git checkout -b staging
git push -u origin staging
```

No Vercel:
- Settings → **Git** → "Production Branch" continua `main` (não mexer)
- Settings → **Domains** → Add domain `staging.largadas.com.br`
  → Branch: `staging`
- Configure o DNS na Cloudflare/Registro.br: CNAME
  `staging.largadas.com.br` → `cname.vercel-dns.com`

---

## 7. Configurar variáveis de ambiente no Vercel

Settings → **Environment Variables** → para cada var abaixo, cole o valor de
staging e marque **apenas o escopo "Preview"** (deixa "Production" e
"Development" desmarcados).

Se você criou a branch `staging` (§6), pode usar **"Specific Branch: staging"**
ao invés de "Preview" — fica ainda mais isolado.

| Variável | Valor staging |
|---|---|
| `NEXT_PUBLIC_APP_URL` | `https://staging.largadas.com.br` (ou preview URL) |
| `NEXT_PUBLIC_SUPABASE_URL` | URL do projeto staging Supabase |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Anon key do staging |
| `SUPABASE_SERVICE_ROLE_KEY` | Service role key do staging |
| `NEXT_PUBLIC_VAPID_PUBLIC_KEY` | Public VAPID gerado em §3.1 |
| `VAPID_PRIVATE_KEY` | Private VAPID gerado em §3.1 |
| `VAPID_SUBJECT` | `mailto:lucas.cabral@adaptedtech.com.br` (mesma OK) |
| `NEXT_PUBLIC_STRAVA_CLIENT_ID` | Client ID do app Strava staging (§4) |
| `STRAVA_CLIENT_SECRET` | Client Secret do app Strava staging |
| `STRAVA_WEBHOOK_VERIFY_TOKEN` | Token gerado em §3.3 |
| `ABACATEPAY_API_KEY` | API key sandbox (§5) |
| `ABACATEPAY_WEBHOOK_SECRET` | Webhook secret de staging (§5) |
| `CRON_SECRET` | Token gerado em §3.2 |

> ⚠️ **Nunca cole valores de staging no escopo Production por engano.**
> Confira sempre o checkbox antes de salvar.

---

## 8. Configurar URLs no Supabase Auth (staging)

Painel Supabase staging → **Authentication** → **URL Configuration**:

- **Site URL:** `https://staging.largadas.com.br` (ou a Preview URL)
- **Redirect URLs (allow list):**
  - `https://staging.largadas.com.br/auth/callback`
  - `https://staging.largadas.com.br/auth/strava/callback`
  - `https://staging.largadas.com.br/auth/confirm`
  - `http://localhost:3000/auth/callback` (para dev local)

Se quiser dev local apontando pro staging, você pode também colocar essas mesmas
vars no `.env.local` da sua máquina.

---

## 9. Atualizar webhook AbacatePay para staging

Painel AbacatePay → Webhooks (em modo sandbox) → URL:

```
https://staging.largadas.com.br/api/payments/webhook?webhookSecret=<ABACATEPAY_WEBHOOK_SECRET-DE-STAGING>
```

(O código já espera o secret na query string — mesmo padrão da prod.)

---

## 10. Crons no staging

**Vercel cron jobs só rodam em production deployments.** Em Preview/staging
eles **não disparam sozinhos**.

Pra testar manualmente, basta chamar a rota do cron passando o `CRON_SECRET`:

```powershell
curl https://staging.largadas.com.br/api/cron/scrape-equilibrio `
  -H "Authorization: Bearer <CRON_SECRET-staging>"

curl https://staging.largadas.com.br/api/cron/deadline-reminder `
  -H "Authorization: Bearer <CRON_SECRET-staging>"
```

Se quiser cron de verdade em staging (não recomendo — gasta scrape gratuito de
sites externos), você precisaria de um agendador externo (GitHub Actions ou
cron-job.org) batendo nessas URLs.

---

## 11. Validar smoke test em staging

Acesse `https://staging.largadas.com.br` e confirme:

- [ ] Listagem `/corridas` carrega 5 corridas seed
- [ ] Login por email funciona (cria usuário no projeto staging, não na prod)
- [ ] `/perfil/minhas-corridas?tab=created` mostra as corridas criadas
- [ ] Botão "Analytics" abre a página com gráfico populado pelo seed
- [ ] `/admin` mostra cards de Visualizações e Cliques com números do seed
  (precisa marcar role='admin' no profile do user de teste — ver §12)
- [ ] Disparo manual de cron retorna 200

---

## 12. Promover seu user para admin no staging

Após fazer login no staging com seu email, no SQL Editor:

```sql
UPDATE public.profiles SET role = 'admin'
WHERE id = (SELECT id FROM auth.users WHERE email = 'lucas.cabral@adaptedtech.com.br');
```

---

## 13. Fluxo de trabalho daqui pra frente

```
feat/affiliate-dashboard  → merge → staging  → smoke test em staging.largadas.com.br
                                                ↓ ok?
                                              merge → main → produção
```

```powershell
# Após validar a feature na branch:
git checkout staging
git merge feat/affiliate-dashboard
git push                                  # dispara deploy no staging

# Smoke test manual...

# Se ok:
git checkout main
git merge staging
git push                                  # dispara deploy em produção
```

---

## Custos

- **Vercel Preview:** grátis no plano Hobby, sem limite prático
- **Supabase staging:** grátis (free tier permite 2 projetos por org)
- **AbacatePay sandbox:** grátis
- **Domínio staging.largadas.com.br:** grátis se já tem largadas.com.br

Total: **R$ 0/mês** enquanto staging não exceder os limites do free tier do
Supabase (500MB DB, 1GB bandwidth, 50k MAU).

---

## Troubleshooting

**`db push` falha com "permission denied":** confira se você está linkado ao
projeto certo — `pnpm exec supabase status` mostra o `project_ref` ativo.

**`/api/views` retorna 500 em staging:** valide que `race_views` existe
(`SELECT * FROM race_views LIMIT 1` no SQL Editor).

**Login redireciona pra prod:** você esqueceu de configurar Site URL no Auth
do Supabase staging (§8).

**Strava OAuth dá "invalid redirect_uri":** o callback domain do app Strava
precisa bater com o domínio do staging exatamente (sem `https://`, sem path).

**Push não chega:** VAPID public/private precisam ser do **mesmo par**. Se você
trocou o private mas não o public no `NEXT_PUBLIC_VAPID_PUBLIC_KEY`, todas as
subscriptions ficam inválidas. Use sempre o output de uma única execução do
`web-push generate-vapid-keys`.
