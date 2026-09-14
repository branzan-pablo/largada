# Staging do Largada

O ambiente de staging valida somente o calendário público, a gestão administrativa e os scrapers. Use um projeto Supabase e credenciais separados de produção.

## Variáveis

Configure no ambiente Preview da Vercel:

- `NEXT_PUBLIC_APP_URL=https://staging.largadas.com.br`
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `GOOGLE_GENERATIVE_AI_API_KEY`
- `CRON_SECRET`

Para os testes Playwright remotos, configure também:

- `E2E_BASE_URL=https://staging.largadas.com.br`
- `E2E_ADMIN_EMAIL`
- `E2E_ADMIN_PASSWORD`
- `E2E_RACE_SLUG`

## Supabase

1. Aplique todas as migrations históricas com `pnpm exec supabase db push --linked`.
2. Em Authentication, mantenha somente as contas administrativas necessárias.
3. Garanta que cada Admin possua `profiles.role = 'admin'`.
4. Habilite Google em Authentication > Providers somente se o login Google for usado.
5. Configure `https://staging.largadas.com.br/auth/callback` na allowlist de Redirect URLs.
6. No Google Cloud, use como callback o endereço exibido pelo provedor Google no Supabase: `https://<project-ref>.supabase.co/auth/v1/callback`.

Nunca exponha `SUPABASE_SERVICE_ROLE_KEY` ou o segredo OAuth do Google em variáveis `NEXT_PUBLIC_*`.

## Validação

Execute antes de promover:

```bash
pnpm lint
pnpm test
pnpm build
pnpm test:e2e
```

Valide manualmente:

1. `/` redireciona para `/corridas`.
2. Busca, filtros, paginação e detalhe funcionam anonimamente.
3. O link de inscrição abre o destino da corrida.
4. `/admin` redireciona visitantes para `/admin/login`.
5. Admin cria, edita, aprova e reprova corridas.
6. Upload de imagem e preenchimento por IA funcionam.
7. Uma execução controlada de scraper cria corrida como `pending_review` e não a publica antes da aprovação.

## Crons

A Vercel executa apenas os scrapers declarados em `vercel.json`. Todos exigem `Authorization: Bearer <CRON_SECRET>` quando acionados manualmente.

Exemplo:

```bash
curl -H "Authorization: Bearer $CRON_SECRET" https://staging.largadas.com.br/api/cron/scrape-equilibrio
```

Não execute scrapers de staging contra o banco de produção.
