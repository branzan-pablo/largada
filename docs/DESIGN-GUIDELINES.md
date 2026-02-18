# DESIGN-GUIDELINES — Largada

## 1. Identidade Visual

**Conceito:** Clean, moderno e energético sem ser esportivo-clichê. A identidade deve transmitir organização e confiança (como Linear/Vercel), com um toque de energia e movimento que remeta à corrida sem usar ícones genéricos de corredores.

**Referências visuais:**

- [Linear](https://linear.app) — clareza, hierarquia, espaçamento generoso
- [Resend](https://resend.com) — tipografia forte, minimalismo
- [Vercel](https://vercel.com) — contraste, cards limpos
- [Strava](https://strava.com) — apenas como referência de linguagem esportiva (não o visual)

---

## 2. Paleta de Cores

### Cores Primárias

| Nome              | Hex       | Uso                                                                                                  |
| ----------------- | --------- | ---------------------------------------------------------------------------------------------------- |
| **Primary**       | `#F05A1E` | CTAs, botões primários, destaques, links ativos. Laranja energético que remete à energia da corrida. |
| **Primary Dark**  | `#d94e15` | Hover em botões primários, variante de ênfase.                                                       |
| **Primary Light** | `#FEF0EA` | Backgrounds sutis, badges, tags de destaque.                                                         |

### Cores Neutras

| Nome         | Hex       | Uso                                              |
| ------------ | --------- | ------------------------------------------------ |
| **Gray 950** | `#0C0D0E` | Títulos, texto principal em headings.            |
| **Gray 700** | `#3F4451` | Corpo de texto.                                  |
| **Gray 500** | `#6B7280` | Texto secundário, placeholders, metadados.       |
| **Gray 300** | `#D1D5DB` | Bordas, divisores.                               |
| **Gray 100** | `#F3F4F6` | Backgrounds de cards, inputs, áreas secundárias. |
| **White**    | `#FFFFFF` | Background principal.                            |

### Cores Semânticas

| Nome        | Hex       | Uso                                                         |
| ----------- | --------- | ----------------------------------------------------------- |
| **Success** | `#16A34A` | Confirmações, status "confirmada", badge "vou nessa" ativo. |
| **Warning** | `#EAB308` | Alertas, status "adiada", prazo próximo de expirar.         |
| **Error**   | `#DC2626` | Erros de validação, status "cancelada".                     |
| **Info**    | `#2563EB` | Links informativos, badges neutros.                         |

### Cores de Status de Corrida

| Status                | Cor                  | Badge                            |
| --------------------- | -------------------- | -------------------------------- |
| Confirmada            | `#16A34A` (Success)  | Fundo `#F0FDF4`, texto `#16A34A` |
| Adiada                | `#EAB308` (Warning)  | Fundo `#FEFCE8`, texto `#A16207` |
| Cancelada             | `#DC2626` (Error)    | Fundo `#FEF2F2`, texto `#DC2626` |
| Inscrições encerradas | `#6B7280` (Gray 500) | Fundo `#F3F4F6`, texto `#6B7280` |

---

## 3. Tipografia

**Font principal:** `Inter` (Google Fonts)

- Motivo: excelente legibilidade em telas pequenas, ampla variedade de pesos, estilo clean e moderno.

**Font alternativa (fallback):** `system-ui, -apple-system, sans-serif`

### Escala Tipográfica

| Elemento       | Tamanho         | Peso           | Line Height | Uso                                           |
| -------------- | --------------- | -------------- | ----------- | --------------------------------------------- |
| **Display**    | 48px / 3rem     | 700 (Bold)     | 1.1         | Hero headline da landing page                 |
| **H1**         | 36px / 2.25rem  | 700 (Bold)     | 1.2         | Título de página no app                       |
| **H2**         | 28px / 1.75rem  | 600 (Semibold) | 1.3         | Títulos de seção                              |
| **H3**         | 22px / 1.375rem | 600 (Semibold) | 1.35        | Subtítulos, nome de corrida no card           |
| **H4**         | 18px / 1.125rem | 600 (Semibold) | 1.4         | Labels de seção, títulos de filtro            |
| **Body**       | 16px / 1rem     | 400 (Regular)  | 1.6         | Texto padrão, descrições                      |
| **Body Small** | 14px / 0.875rem | 400 (Regular)  | 1.5         | Metadados, texto secundário, campos de filtro |
| **Caption**    | 12px / 0.75rem  | 500 (Medium)   | 1.4         | Labels, badges, contadores                    |

### Regras

- Máximo 2 pesos por página (Regular + Semibold ou Regular + Bold).
- Nunca usar texto abaixo de 12px.
- Em mobile, Display reduz para 36px e H1 para 28px.

---

## 4. Espaçamento

**Base:** sistema de 4px.

| Token      | Valor | Uso comum                                             |
| ---------- | ----- | ----------------------------------------------------- |
| `space-1`  | 4px   | Espaço mínimo entre ícone e texto                     |
| `space-2`  | 8px   | Padding interno de badges, gap entre elementos inline |
| `space-3`  | 12px  | Padding de inputs, gap entre items de lista           |
| `space-4`  | 16px  | Padding de cards, gap de grid                         |
| `space-5`  | 20px  | Margem entre blocos de conteúdo                       |
| `space-6`  | 24px  | Padding de containers, margem entre seções menores    |
| `space-8`  | 32px  | Margem entre seções                                   |
| `space-10` | 40px  | Padding de página (mobile)                            |
| `space-12` | 48px  | Padding de página (desktop)                           |
| `space-16` | 64px  | Margem entre seções da landing page                   |
| `space-20` | 80px  | Margem entre seções grandes da landing page           |

### Container

| Breakpoint          | Max Width | Padding lateral |
| ------------------- | --------- | --------------- |
| Mobile (< 640px)    | 100%      | 16px            |
| Tablet (640-1024px) | 100%      | 24px            |
| Desktop (> 1024px)  | 1200px    | 48px (centrado) |

---

## 5. Border Radius

| Token         | Valor  | Uso                                |
| ------------- | ------ | ---------------------------------- |
| `radius-sm`   | 6px    | Inputs, badges, tags               |
| `radius-md`   | 8px    | Cards, botões, dropdowns           |
| `radius-lg`   | 12px   | Modais, drawers, cards de destaque |
| `radius-full` | 9999px | Avatares, ícones circulares, pills |

**Regra:** consistência total. Todos os cards usam `radius-md`. Todos os inputs usam `radius-sm`. Não misturar.

---

## 6. Sombras

Uso mínimo de sombras — preferir bordas sutis.

| Token       | Valor                            | Uso                                |
| ----------- | -------------------------------- | ---------------------------------- |
| `shadow-sm` | `0 1px 2px rgba(0, 0, 0, 0.05)`  | Cards em hover                     |
| `shadow-md` | `0 4px 6px rgba(0, 0, 0, 0.07)`  | Dropdowns, popovers, bottom sheets |
| `shadow-lg` | `0 10px 15px rgba(0, 0, 0, 0.1)` | Modais                             |

**Regra:** cards no estado padrão usam apenas borda (`Gray 300`), sem sombra. Sombra aparece apenas em hover ou em elementos flutuantes (dropdown, modal, drawer).

---

## 7. Componentes shadcn/ui — Diretrizes de Uso

### Mapeamento de componentes por feature

| Elemento da UI             | Componente shadcn/ui                     | Notas                                                                        |
| -------------------------- | ---------------------------------------- | ---------------------------------------------------------------------------- |
| **Botão primário (CTA)**   | `Button` variant="default"               | Cor primária (`#E85D2A`), customizar via CSS variables.                      |
| **Botão secundário**       | `Button` variant="outline"               | Borda `Gray 300`, texto `Gray 700`.                                          |
| **Card de corrida**        | `Card` + `CardHeader` + `CardContent`    | Borda `Gray 300`, sem sombra default. Hover: `shadow-sm`.                    |
| **Badge de status**        | `Badge`                                  | Variantes customizadas por status (confirmada, adiada, cancelada).           |
| **Badge de distância**     | `Badge` variant="outline"                | Ex: "5K", "10K", "21K" em pills.                                             |
| **Badge de premiação**     | `Badge`                                  | Ícone + texto. Dinheiro: cor Success. Troféu: cor Warning.                   |
| **Input de busca**         | `Input` com ícone de busca               | Debounce 300ms, ícone Lucide `Search`.                                       |
| **Filtros (desktop)**      | `Select` + `Popover` + `Checkbox`        | Barra de filtros horizontal acima da listagem.                               |
| **Filtros (mobile)**       | `Sheet` (bottom sheet)                   | Botão "Filtros" abre sheet com todos os filtros empilhados.                  |
| **Slider de raio**         | `Slider`                                 | Valores: 10, 25, 50, 100 km. Label mostrando valor atual.                    |
| **Botão "Vou Nessa"**      | `Button` com ícone                       | Estado default: outline. Estado ativo: filled com ícone check + cor Success. |
| **Lista de participantes** | `Avatar` + `AvatarFallback`              | Empilhamento de avatares (max 5 visíveis + "+X").                            |
| **Tabs**                   | `Tabs`                                   | "Próximas" / "Passadas" em Minhas Corridas.                                  |
| **Formulário de sugestão** | `Form` + `Input` + `Textarea` + `Button` | Validação com mensagens de erro inline.                                      |
| **Toast de confirmação**   | `Toast` / `Sonner`                       | Feedback de ações (RSVP, sugestão enviada, etc).                             |
| **Dialog de login**        | `Dialog`                                 | Quando usuário tenta ação que requer auth.                                   |
| **Skeleton loading**       | `Skeleton`                               | Para cards de corrida durante carregamento.                                  |
| **Empty state**            | Customizado                              | Ilustração simples + texto quando não há corridas nos filtros.               |

### Customização do Theme

Sobrescrever as CSS variables do shadcn/ui:

```css
:root {
  --primary: 18 78% 54%; /* #E85D2A em HSL */
  --primary-foreground: 0 0% 100%; /* Branco */
  --radius: 0.5rem; /* 8px default */
  --background: 0 0% 100%; /* Branco */
  --foreground: 220 10% 5%; /* Gray 950 */
  --muted: 220 10% 96%; /* Gray 100 */
  --muted-foreground: 220 10% 42%; /* Gray 500 */
  --border: 220 10% 83%; /* Gray 300 */
  --input: 220 10% 83%; /* Gray 300 */
  --ring: 18 78% 54%; /* Primary */
}
```

---

## 8. Iconografia

**Biblioteca:** Lucide React (já incluída no shadcn/ui).

**Estilo:** stroke width 1.5px (padrão do Lucide), tamanho 20px para inline, 24px para destaque.

**Ícones sugeridos por contexto:**

| Contexto                 | Ícone Lucide                          |
| ------------------------ | ------------------------------------- |
| Busca                    | `Search`                              |
| Filtro                   | `SlidersHorizontal`                   |
| Calendário/Data          | `Calendar`                            |
| Local/Cidade             | `MapPin`                              |
| Distância                | `Route`                               |
| Raio km                  | `Radar`                               |
| Premiação dinheiro       | `DollarSign` ou `Trophy` + `Banknote` |
| Premiação troféu         | `Trophy`                              |
| Vou Nessa (default)      | `UserPlus`                            |
| Vou Nessa (ativo)        | `UserCheck`                           |
| Notificação              | `Bell`                                |
| Link externo (inscrição) | `ExternalLink`                        |
| Relógio/Prazo            | `Clock`                               |
| Usuário/Perfil           | `User`                                |
| Admin                    | `Shield`                              |
| Sugestão                 | `MessageSquarePlus`                   |

---

## 9. Responsividade

### Breakpoints

| Nome        | Largura        | Notas                                                                     |
| ----------- | -------------- | ------------------------------------------------------------------------- |
| **Mobile**  | < 640px        | Layout single column. Filtros em bottom sheet.                            |
| **Tablet**  | 640px - 1024px | Grid 2 colunas para cards. Filtros em barra lateral ou top bar.           |
| **Desktop** | > 1024px       | Grid 3 colunas para cards. Filtros em barra horizontal. Sidebar opcional. |

### Regras de Responsividade

- **Mobile-first:** todo CSS começa pelo mobile e escala para cima.
- **Touch targets:** mínimo 44x44px em mobile.
- **Cards de corrida:** full-width em mobile, 2 colunas em tablet, 3 em desktop.
- **Filtros:** bottom sheet com `Sheet` em mobile, barra horizontal em desktop.
- **Tabela de premiação:** horizontal scroll em mobile se necessário, ou stack vertical.
- **Imagem de percurso:** full-width com zoom (pinch-to-zoom) em mobile.
- **Header:** sticky, compacto em mobile (logo + avatar + CTA).
- **Navegação do app:** bottom navigation bar em mobile (Home, Buscar, Minhas Corridas, Perfil).

---

## 10. Estados e Feedback

| Estado              | Tratamento Visual                                                                                                         |
| ------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| **Loading**         | Skeleton components nos cards (shimmer effect).                                                                           |
| **Empty state**     | Ilustração minimalista + texto amigável + CTA contextual (ex: "Nenhuma corrida encontrada. Que tal ajustar os filtros?"). |
| **Error**           | Toast com cor Error + mensagem clara + ação de retry quando aplicável.                                                    |
| **Success**         | Toast com cor Success, auto-dismiss em 3 segundos.                                                                        |
| **Hover (desktop)** | Card eleva com `shadow-sm`. Botões escurecem levemente. Links recebem underline.                                          |
| **Focus**           | Ring de 2px na cor Primary para acessibilidade.                                                                           |
| **Disabled**        | Opacidade 50%, cursor not-allowed.                                                                                        |
