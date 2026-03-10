# Testes Automatizados — Largada

## Infraestrutura
- [x] Instalar Vitest como devDependency
- [x] Criar [vitest.config.ts](file:///c:/Users/pablo/Development/MVP/vitest.config.ts) com path aliases
- [x] Adicionar scripts `test`, `test:watch`, `test:coverage` ao [package.json](file:///c:/Users/pablo/Development/MVP/package.json)

## Fase 1 — Utilitários Puros
- [x] [src/lib/__tests__/date.test.ts](file:///c:/Users/pablo/Development/MVP/src/lib/__tests__/date.test.ts)
- [x] [src/lib/__tests__/utils.test.ts](file:///c:/Users/pablo/Development/MVP/src/lib/__tests__/utils.test.ts)
- [x] [src/lib/__tests__/geo.test.ts](file:///c:/Users/pablo/Development/MVP/src/lib/__tests__/geo.test.ts)
- [x] [src/lib/__tests__/rate-limit.test.ts](file:///c:/Users/pablo/Development/MVP/src/lib/__tests__/rate-limit.test.ts)

## Fase 2 — Validações Zod
- [x] [src/lib/__tests__/validations.test.ts](file:///c:/Users/pablo/Development/MVP/src/lib/__tests__/validations.test.ts)

## Fase 3 — Módulos com Dependências
- [x] [src/lib/__tests__/filter-utils.test.ts](file:///c:/Users/pablo/Development/MVP/src/lib/__tests__/filter-utils.test.ts)
- [x] [src/lib/__tests__/payments-errors.test.ts](file:///c:/Users/pablo/Development/MVP/src/lib/__tests__/payments-errors.test.ts)

## Fase 4 — Cobertura Extendida (módulos críticos)
- [x] `src/lib/__tests__/webhook.test.ts` — verificação HMAC + secret (12 testes)
- [x] `src/lib/__tests__/payments-env.test.ts` — validação de env vars (7 testes)
- [x] `src/lib/__tests__/payments-schemas.test.ts` — schemas Zod de billing/pix (25 testes)
- [x] `src/lib/__tests__/scrapers-helpers.test.ts` — isValidDate, normalizeForDedup, jaccardSimilarity, isSimilarRace (20 testes)
- [x] `src/lib/__tests__/subscriptions.test.ts` — canPromoteWithSubscription (6 testes)

## Verificação
- [x] Todos os testes passando (`pnpm test`) — 171 testes
- [x] Cobertura extendida passando
