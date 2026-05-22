# GitHub Actions

## supabase-migrations.yml

Applies pending SQL migrations from `supabase/migrations/` to a Supabase project.

### When it runs

- **Auto** — on every push to `main` that touches `supabase/migrations/**`. Target: production.
- **Manual** — run on demand via Actions → "Apply Supabase Migrations" → "Run workflow". Choose `production` or `staging`.

### Required GitHub secrets

Set in **Settings → Secrets and variables → Actions** (or per-environment under **Settings → Environments**):

| Secret | Where to get | Used by |
|---|---|---|
| `SUPABASE_ACCESS_TOKEN` | https://supabase.com/dashboard/account/tokens | Both jobs |
| `SUPABASE_PROJECT_REF_PROD` | Prod project URL `<ref>.supabase.co` | production job |
| `SUPABASE_DB_PASSWORD_PROD` | Prod project → Settings → Database → Connection string | production job |
| `SUPABASE_PROJECT_REF_STAGING` | Staging project URL `<ref>.supabase.co` | staging job |
| `SUPABASE_DB_PASSWORD_STAGING` | Staging project → Settings → Database | staging job |

Optionally bind secrets to GitHub Environments named `production` and `staging` for required-reviewer protection.

### One-time setup: sync migration history

If migrations 001..022 were applied manually via the SQL editor before this workflow existed, the Supabase migration table is empty and `db push` would try to re-run everything (and fail because objects already exist). Fix once per project:

```bash
# On your local machine
pnpm supabase link --project-ref <prod-ref>

# Mark every existing migration as already applied
pnpm supabase migration list --linked  # shows local vs remote
pnpm supabase migration repair --status applied 001
pnpm supabase migration repair --status applied 002
# ... repeat for every migration timestamp shown as local-only
```

Or use the all-in-one form if your local migration files use the `<timestamp>_*.sql` naming convention. After repair, `supabase db push` becomes a no-op on the first run and only applies genuinely new migrations going forward.

### What happens on a failed migration

The job fails fast. The transaction is rolled back by Postgres. The next push that fixes the migration will retry automatically.
