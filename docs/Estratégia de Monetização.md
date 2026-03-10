# Estratégia de Monetização — Largada

## O que é o Largada hoje

Plataforma de descoberta de corridas de rua no Brasil. Funcionalidades atuais:

| Feature                                                                 | Público                    |
| ----------------------------------------------------------------------- | -------------------------- |
| Calendário de corridas com filtros (cidade, distância, premiação, raio) | Atletas                    |
| RSVP "Vou Nessa" + ver participantes                                    | Atletas                    |
| Push notifications (corrida nova / prazo de inscrição)                  | Atletas                    |
| Sugestão de corrida pela comunidade                                     | Atletas                    |
| Admin: CRUD de corridas, dashboard com stats                            | Organizadores/Admin        |
| Link de inscrição externo + tracking de cliques                         | Organizadores              |
| `is_promoted` — badge ⭐ "Destaque" + ordenação prioritária             | Já implementado no backend |

---

## 3 Modelos de Monetização Viáveis

### 🟢 Modelo 1: Corrida em Destaque (Promoted Race) — **RECOMENDADO PARA MVP**

**O que é:**
Organizadores pagam para sua corrida aparecer com badge ⭐ "Destaque" e ser exibida primeiro na listagem.

**Por que funciona:**

- `is_promoted` já existe no banco e no front (badge + ordenação)
- Valor claro para o organizador: mais visibilidade → mais inscrições
- Pagamento único por corrida = baixa fricção
- Admin já pode marcar manualmente; agora o organizador paga e ativa sozinho

**Onde aparece o botão de pagamento:**

- Página de detalhe da corrida — widget lateral **"Destacar esta corrida"** (visível só para o `created_by`)
- Ou um **painel do organizador** (futuro) com listagem das suas corridas

**Fluxo:**
Clicar → Checkout AbacatePay (PIX ou Cartão) → Webhook marca `is_promoted = true`

**Preço sugerido:**
R$ 149,00 por corrida (por período de destaque, ex: 30 dias)

---

### 🟡 Modelo 2: Largada PRO (Assinatura para Atletas)

**O que é:**
Plano mensal/anual com benefícios premium para corredores.

**Benefícios possíveis:**

- Alertas antecipados de abertura de inscrição (antes dos free)
- Filtros avançados (distância exata, organizador favorito)
- Histórico de corridas + estatísticas
- Badge **"PRO"** no perfil (social proof)
- Prioridade no suporte / sugestão de corridas

**Onde aparece:**

- Banner no topo da listagem de corridas
- Seção no Perfil — **"Upgrade para PRO"**
- Gate em features premium — ao tentar usar filtro avançado mostra modal de upgrade

**Preço sugerido:**
R$ 9,90/mês ou R$ 89,90/ano

> ⚠️ **WARNING**
> O app ainda é jovem. Cobrar de atletas pode reduzir crescimento.
> Recomendo começar pelo **Modelo 1 (B2B)** e só implementar PRO quando tiver uma base sólida de usuários.

---

### 🔵 Modelo 3: Inscrição Integrada (Marketplace — Futuro)

**O que é:**
O organizador vende inscrições direto pelo Largada (em vez de link externo).

**Receita:**
Comissão por inscrição vendida (ex: 5–8% + taxa fixa).

**Complexidade:**
Alta — requer gestão de participantes, ingressos, reembolsos.
Reservar para quando a plataforma tiver tração comprovada.

---

## Recomendação: Começar pelo Modelo 1

- **Fase 1:** Corrida em Destaque
- **Fase 2:** Largada PRO
- **Fase 3:** Inscrições integradas

Organizer pays to promote
Athlete subscribes for premium
Commission on registrations

---

## O que implementar agora (Fase 1)

1. **Painel do organizador** — tela onde o `created_by` vê suas corridas e pode clicar **"Destacar"**
2. **Checkout** — botão abre pagamento AbacatePay (PIX/Cartão, `ONE_TIME`, R$ 29,90)
3. **Webhook post-payment** — marca `is_promoted = true` na corrida automaticamente
4. **Badge + ordenação** — já funciona (`race-card.tsx` e `route.ts`)

---

## O que NÃO mudar por enquanto

- Landing page **("Gratuito. Sem cartão.")** — continua free para atletas
- RSVP, notificações, filtros — mantém tudo aberto
- Só organizadores pagam, atletas continuam **100% free**

---

## Próximos Passos Concretos

1. Validar esta estratégia (este documento)
2. Criar rota de checkout para **"Destacar Corrida"** conectada ao AbacatePay
3. Webhook processa pagamento → atualiza `is_promoted = true`
4. UI: botão na sidebar da corrida (visível para o criador)
5. (Opcional) Painel do organizador com histórico de pagamentos
