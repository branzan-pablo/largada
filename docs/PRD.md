# PRD — Largada

> Estado da implementação (setembro de 2026): 26 migrações cobrem o núcleo de
> corridas e RSVP, monetização AbacatePay, assinaturas de organizadores,
> analytics, Strava, notificações push, scrapers e recomendações por IA.

## 1. Visão Geral

Largada é uma aplicação web progressiva (PWA) que centraliza informações de corridas de rua regionais em um único lugar, permitindo que corredores do interior de São Paulo encontrem provas, vejam detalhes completos e sinalizem participação.

**Stack técnico:** Next.js + Supabase + shadcn/ui + Web Push (VAPID)

**Região inicial:** São José do Rio Preto/SP, Votuporanga/SP, Araçatuba/SP e cidades do entorno.

---

## 2. Personas

### Persona 1: Rafael — Corredor Profissional/Elite

- **Idade:** 28 anos
- **Cidade:** São José do Rio Preto/SP
- **Perfil:** Corre competitivamente há 8 anos. Treina 6x por semana com assessoria. Participa de 15-20 provas por ano, incluindo provas fora da região. Patrocinado por uma loja de artigos esportivos local.
- **Comportamento digital:** Usa Strava diariamente, acompanha rankings e tempos. Tem perfil ativo no Instagram sobre corrida.
- **Dor principal:** Precisa encontrar provas com premiação em dinheiro e saber exatamente as categorias e valores premiados para planejar seu calendário competitivo com antecedência.
- **Job to be done:** "Quero encontrar rapidamente todas as provas da região que têm premiação em dinheiro na minha categoria para montar meu calendário de competições."
- **Resultado ideal:** Ter um calendário completo de provas com premiação, filtrado pela região, com informações de percurso para avaliar se vale competir.

### Persona 2: Márcia — Corredora Amadora Engajada

- **Idade:** 35 anos
- **Cidade:** Votuporanga/SP
- **Perfil:** Corre há 3 anos, faz parte de um grupo de corrida local. Participa de 6-10 provas por ano. Treina 4x por semana.
- **Comportamento digital:** Usa WhatsApp como principal canal. Segue páginas de corrida no Instagram. Tem Strava mas não é power user.
- **Dor principal:** Descobre provas tarde demais (inscrições já fecharam) ou só fica sabendo por acaso via WhatsApp. Perde tempo procurando informações em vários lugares diferentes.
- **Job to be done:** "Quero saber de todas as corridas da minha região com antecedência para me programar e combinar com meu grupo de corrida."
- **Resultado ideal:** Receber notificações de novas provas, ver quem do grupo vai participar, ter todas as informações em um lugar só.

### Persona 3: Carlos — Corredor Amador Casual

- **Idade:** 42 anos
- **Cidade:** Araçatuba/SP
- **Perfil:** Começou a correr há 1 ano por recomendação médica. Corre 2-3x por semana no parque. Participou de 2 provas até agora, ambas por convite de amigos.
- **Comportamento digital:** Usa basicamente WhatsApp e Facebook. Não tem Strava.
- **Dor principal:** Não sabe que existem tantas corridas na região. Quando descobre, já não entende direito como funciona a inscrição, o que levar, qual distância escolher.
- **Job to be done:** "Quero descobrir corridas perto de mim que sejam acessíveis para iniciantes e entender tudo que preciso saber para participar."
- **Resultado ideal:** Encontrar provas com distâncias menores (5k) perto de casa, com informações claras e simples.

---

## 3. User Stories

### Autenticação

| ID    | User Story                                                                                                     | Prioridade |
| ----- | -------------------------------------------------------------------------------------------------------------- | ---------- |
| US-01 | Como corredor, quero me cadastrar com meu email e senha para criar minha conta.                                | MUST       |
| US-02 | Como corredor, quero me cadastrar/logar com minha conta Google para agilizar o acesso.                         | MUST       |
| US-03 | Como corredor, quero me cadastrar/logar com minha conta do Strava para usar minha identidade de corredor.      | MUST       |
| US-04 | Como corredor, quero informar minha cidade durante o cadastro para receber conteúdo relevante da minha região. | MUST       |
| US-05 | Como corredor, quero recuperar minha senha por email caso eu esqueça.                                          | MUST       |

### Listagem e Busca de Corridas

| ID    | User Story                                                                                                                | Prioridade |
| ----- | ------------------------------------------------------------------------------------------------------------------------- | ---------- |
| US-06 | Como corredor, quero ver uma lista de corridas futuras da minha região para planejar minha participação.                  | MUST       |
| US-07 | Como corredor, quero filtrar corridas por cidade para encontrar provas perto de mim.                                      | MUST       |
| US-08 | Como corredor, quero filtrar corridas por data (mês/período) para planejar meu calendário.                                | MUST       |
| US-09 | Como corredor, quero filtrar corridas por distância (5k, 10k, 21k, 42k) para encontrar provas adequadas ao meu nível.     | MUST       |
| US-10 | Como corredor, quero filtrar corridas por raio em km a partir da minha cidade para ver provas acessíveis geograficamente. | MUST       |
| US-11 | Como corredor, quero filtrar corridas por tipo de premiação (dinheiro ou troféu) para priorizar provas competitivas.      | MUST       |
| US-12 | Como corredor, quero buscar corridas por texto (nome da prova, cidade, organizador) para encontrar uma prova específica.  | MUST       |
| US-13 | Como corredor, quero ver as corridas em formato de calendário mensal para ter visão geral do mês.                         | SHOULD     |

### Detalhe da Corrida

| ID    | User Story                                                                                                                     | Prioridade |
| ----- | ------------------------------------------------------------------------------------------------------------------------------ | ---------- |
| US-14 | Como corredor, quero ver todos os detalhes de uma corrida (data, horário, local, distâncias) para decidir se quero participar. | MUST       |
| US-15 | Como corredor, quero ver o valor da inscrição e o link direto para o site de inscrição para me inscrever facilmente.           | MUST       |
| US-16 | Como corredor, quero ver o prazo final de inscrição para não perder a data limite.                                             | MUST       |
| US-17 | Como corredor, quero saber se a corrida tem premiação em dinheiro, para quantos colocados e em quais categorias.               | MUST       |
| US-18 | Como corredor, quero ver o percurso da corrida (descrição textual e/ou imagem) para conhecer o trajeto.                        | MUST       |
| US-19 | Como corredor, quero ver quantas pessoas marcaram "vou nessa" para ter noção do interesse na prova.                            | MUST       |
| US-20 | Como corredor, quero ver quais usuários marcaram "vou nessa" para saber se conhecidos vão participar.                          | MUST       |

### RSVP ("Vou Nessa")

| ID    | User Story                                                                                                                | Prioridade |
| ----- | ------------------------------------------------------------------------------------------------------------------------- | ---------- |
| US-21 | Como corredor logado, quero marcar "vou nessa" em uma corrida para sinalizar minha intenção de participar.                | MUST       |
| US-22 | Como corredor, quero desmarcar "vou nessa" caso meus planos mudem.                                                        | MUST       |
| US-23 | Como corredor, quero ver todas as corridas que marquei "vou nessa" em um lugar só para acompanhar meu calendário pessoal. | MUST       |

### Push Notifications

| ID    | User Story                                                                                                                    | Prioridade |
| ----- | ----------------------------------------------------------------------------------------------------------------------------- | ---------- |
| US-24 | Como corredor, quero receber notificação quando uma nova corrida for cadastrada na minha região.                              | MUST       |
| US-25 | Como corredor, quero receber um lembrete quando o prazo de inscrição de uma corrida que marquei "vou nessa" estiver acabando. | MUST       |
| US-26 | Como corredor, quero poder ativar/desativar notificações nas minhas configurações.                                            | MUST       |

### Sugestão de Corrida

| ID    | User Story                                                                                                      | Prioridade |
| ----- | --------------------------------------------------------------------------------------------------------------- | ---------- |
| US-27 | Como corredor, quero sugerir uma corrida que não está na plataforma para ajudar a manter o calendário completo. | MUST       |
| US-28 | Como corredor que sugeriu uma corrida, quero saber se minha sugestão foi aprovada ou rejeitada.                 | SHOULD     |

### Administração

| ID    | User Story                                                                                    | Prioridade |
| ----- | --------------------------------------------------------------------------------------------- | ---------- |
| US-29 | Como admin, quero cadastrar novas corridas com todos os campos detalhados.                    | MUST       |
| US-30 | Como admin, quero editar informações de corridas existentes para manter os dados atualizados. | MUST       |
| US-31 | Como admin, quero revisar e aprovar/rejeitar sugestões de corridas enviadas por usuários.     | MUST       |
| US-32 | Como admin, quero marcar uma corrida como "cancelada" ou "adiada" sem removê-la da base.      | MUST       |

---

## 4. Requisitos Funcionais

### 4.1 Autenticação e Perfil

**Auth providers:**

- Email + senha via Supabase Auth
- Google OAuth via Supabase Auth
- Strava OAuth (login social — apenas autenticação, sem sync de dados no MVP)

**Perfil do usuário:**

- Nome
- Email
- Cidade base (usado para filtro de raio e notificações)
- Avatar (do provider OAuth ou upload)
- Preferência de notificações (on/off)

**Regras:**

- Usuário pode visualizar listagem e detalhes de corridas sem estar logado.
- Login é obrigatório para: marcar "vou nessa", sugerir corrida, receber notificações.
- Se o usuário tentar uma ação que requer login, redirecionar para tela de login com retorno automático após autenticação.

### 4.2 Corridas — Modelo de Dados

Cada corrida contém:

| Campo                     | Tipo                                         | Obrigatório               |
| ------------------------- | -------------------------------------------- | ------------------------- |
| Nome da corrida           | texto                                        | Sim                       |
| Data                      | data                                         | Sim                       |
| Horário de largada        | hora                                         | Sim                       |
| Cidade                    | texto                                        | Sim                       |
| Estado                    | texto                                        | Sim                       |
| Endereço/local de largada | texto                                        | Sim                       |
| Coordenadas (lat/lng)     | numérico                                     | Sim (para filtro de raio) |
| Distâncias disponíveis    | array (5k, 10k, 21k, 42k, outro)             | Sim                       |
| Valor da inscrição        | texto (pode ter faixas por lote)             | Sim                       |
| Link de inscrição         | URL                                          | Sim                       |
| Prazo final de inscrição  | data                                         | Sim                       |
| Tipo de premiação         | enum (dinheiro, troféu, ambos, nenhum)       | Sim                       |
| Detalhes da premiação     | texto (valores, categorias, nº de premiados) | Condicional               |
| Percurso                  | texto descritivo                             | Não                       |
| Imagem do percurso        | URL da imagem                                | Não                       |
| Organizador               | texto                                        | Não                       |
| Descrição adicional       | texto longo                                  | Não                       |
| Status                    | enum (confirmada, adiada, cancelada)         | Sim                       |
| Criado por                | referência ao admin                          | Sim                       |
| Origem                    | enum (admin, sugestão_aprovada)              | Sim                       |

### 4.3 Listagem e Filtros

**Listagem padrão:**

- Corridas futuras ordenadas por data (mais próxima primeiro).
- Corridas passadas não aparecem na listagem padrão.
- Cards com: nome, data, cidade, distâncias, tipo de premiação, contador de "vou nessa".

**Filtros (cumulativos):**

- **Cidade:** dropdown com cidades da região cadastrada.
- **Data:** seleção de período (de/até) ou mês específico.
- **Distância:** checkboxes (5k, 10k, 21k, 42k). Mostra corridas que oferecem pelo menos uma das distâncias selecionadas.
- **Raio em km:** slider ou input numérico (10km, 25km, 50km, 100km) a partir da cidade base do usuário. Requer que o usuário esteja logado e tenha cidade configurada.
- **Premiação:** checkboxes (dinheiro, troféu).

**Busca por texto:**

- Campo de busca que filtra por nome da corrida, cidade e organizador.
- Busca em tempo real (debounce de 300ms).

### 4.4 RSVP

- Botão "Vou Nessa" na página de detalhe e no card da listagem.
- Toggle: clicar novamente desmarca.
- Contador visível de quantas pessoas marcaram.
- Lista de usuários que marcaram (nome + avatar) visível na página de detalhe.
- Seção "Minhas Corridas" no perfil do usuário com todas as provas marcadas, divididas em "Próximas" e "Passadas".

### 4.5 Push Notifications (Web Push / VAPID)

**Triggers:**

- Nova corrida cadastrada na região do usuário (baseado no raio geográfico configurado via PostGIS).
- Lembrete de prazo de inscrição: 3 dias antes do prazo expirar, para corridas marcadas com "vou nessa".

**Implementação:**

- Service Worker para receber push em PWA.
- Solicitar permissão de notificação no onboarding/perfil (com explicação do valor).
- Push subscription (endpoint + keys VAPID) salva no Supabase (`push_subscriptions`), vinculada ao usuário.
- Envio via `web-push` (server-side) usando protocolo VAPID — sem dependência de Firebase/FCM.
- Configuração on/off no perfil do usuário + raio de notificação configurável.

### 4.6 Sugestão de Corrida

**Formulário público (usuário logado):**

- Campos: nome da corrida, data, cidade, link (se tiver), observações.
- Campos mínimos — o admin completa depois.
- Status: pendente → aprovada/rejeitada.
- Usuário pode ver o status das suas sugestões no perfil.

### 4.7 Painel Admin

**Acesso:** role "admin" no Supabase (flag na tabela de usuários).

**Funcionalidades:**

- CRUD completo de corridas (todos os campos do modelo de dados).
- Fila de sugestões pendentes com ações de aprovar/rejeitar.
- Ao aprovar sugestão, abre formulário de cadastro pré-preenchido para completar dados.
- Dashboard simples: total de corridas, total de usuários, sugestões pendentes.

---

## 5. Requisitos Não-Funcionais

### Performance

- Tempo de carregamento inicial < 3 segundos em 3G.
- Listagem com paginação ou infinite scroll (20 corridas por página).
- Imagens otimizadas (Next.js Image com lazy loading).

### Responsividade

- **Mobile-first obrigatório.** O design começa pelo mobile e adapta para telas maiores.
- Breakpoints: mobile (< 640px), tablet (640-1024px), desktop (> 1024px).
- Todos os filtros devem funcionar perfeitamente em mobile (drawer/bottom sheet para filtros).
- Touch-friendly: botões e áreas de toque com mínimo de 44x44px.

### Segurança

- Supabase Row Level Security (RLS) ativado em todas as tabelas.
- Apenas admins podem criar/editar/deletar corridas.
- Rate limiting no formulário de sugestão para evitar spam.
- Sanitização de inputs em todos os formulários.

### SEO

- Páginas de corrida com meta tags dinâmicas (Open Graph) para compartilhamento no WhatsApp/redes sociais.
- URLs amigáveis: `/corrida/[slug]`.

### PWA

- Manifest configurado com ícone, nome e cores do app.
- Service Worker para push notifications.
- Prompt de "Adicionar à tela inicial" após segunda visita.

---

## 6. Integrações

| Serviço                     | Uso                | Detalhes                                                                         |
| --------------------------- | ------------------ | -------------------------------------------------------------------------------- |
| Supabase Auth               | Autenticação       | Email/senha + Google OAuth                                                       |
| Strava OAuth                | Login social       | Apenas autenticação, sem sync de dados                                           |
| Supabase Database           | Banco de dados     | PostgreSQL com RLS                                                               |
| Supabase Storage            | Armazenamento      | Imagens de percurso e avatares                                                   |
| Web Push (VAPID / web-push) | Push notifications | Via Service Worker (PWA), sem dependência de Firebase                            |
| Google Geocoding API        | Coordenadas        | Converter endereço em lat/lng para filtro de raio (ou geocoding manual no admin) |

---

## 7. Edge Cases

| Cenário                                                     | Tratamento                                                                                                                   |
| ----------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| Corrida cancelada após usuários marcarem "vou nessa"        | Atualizar status para "cancelada", enviar push notification para quem marcou, manter RSVP visível com badge de cancelamento. |
| Corrida adiada sem nova data                                | Status "adiada", exibir aviso na página, manter na listagem com destaque visual diferente.                                   |
| Prazo de inscrição expirado                                 | Ocultar link de inscrição, exibir "Inscrições encerradas", manter corrida visível na listagem até a data da prova.           |
| Usuário tenta filtrar por raio sem cidade configurada       | Exibir mensagem pedindo para configurar cidade no perfil, com link direto.                                                   |
| Sugestão duplicada de corrida                               | Admin identifica manualmente na fila de revisão. No futuro, detecção automática por nome + data + cidade.                    |
| Corrida com múltiplos lotes de preço                        | Campo de valor aceita texto livre para descrever faixas (ex: "1º lote R$80, 2º lote R$100").                                 |
| Usuário desmarca "vou nessa" após receber lembrete de prazo | Cancelar lembrete futuro, sem impacto.                                                                                       |
| Push notification negada pelo navegador                     | Registrar que o usuário negou, não solicitar novamente. Exibir opção nas configurações para reativar com instruções.         |

---

## 8. Critérios de Aceitação por Feature

### Autenticação

- [ ] Usuário consegue criar conta com email/senha e recebe email de confirmação.
- [ ] Usuário consegue logar com Google em menos de 3 cliques.
- [ ] Usuário consegue logar com Strava em menos de 3 cliques.
- [ ] Após login, usuário é redirecionado para a página que tentava acessar.
- [ ] Recuperação de senha funciona e envia email em menos de 1 minuto.

### Listagem e Filtros

- [ ] Listagem carrega em menos de 2 segundos.
- [ ] Todos os 5 filtros funcionam individualmente.
- [ ] Filtros combinados retornam resultados corretos (AND lógico).
- [ ] Filtro de raio calcula distância corretamente a partir da cidade do usuário.
- [ ] Busca por texto retorna resultados em tempo real com debounce.
- [ ] Em mobile, filtros abrem em drawer/bottom sheet sem quebrar o layout.
- [ ] Corridas passadas não aparecem na listagem padrão.

### Detalhe da Corrida

- [ ] Todos os campos preenchidos são exibidos corretamente.
- [ ] Link de inscrição abre em nova aba.
- [ ] Após prazo expirado, link de inscrição é substituído por "Inscrições encerradas".
- [ ] Contador de RSVP é atualizado em tempo real.
- [ ] Página gera meta tags corretas para compartilhamento (OG image, título, descrição).

### RSVP

- [ ] Botão "Vou Nessa" funciona como toggle (marcar/desmarcar).
- [ ] Contador atualiza imediatamente após clique.
- [ ] Lista de participantes mostra nome e avatar.
- [ ] Seção "Minhas Corridas" no perfil lista corretamente próximas e passadas.
- [ ] Usuário não logado é redirecionado para login ao tentar marcar.

### Push Notifications

- [ ] Permissão é solicitada com mensagem explicativa, não abruptamente.
- [ ] Notificação de nova corrida é recebida em menos de 5 minutos após cadastro.
- [ ] Lembrete de prazo é enviado 3 dias antes da expiração.
- [ ] Configuração on/off no perfil funciona corretamente.
- [ ] App funciona normalmente se usuário negar permissão de notificação.

### Sugestão de Corrida

- [ ] Formulário é acessível apenas para usuários logados.
- [ ] Campos obrigatórios são validados antes do envio.
- [ ] Sugestão aparece na fila do admin com status "pendente".
- [ ] Usuário visualiza status da sugestão no perfil.

### Admin

- [ ] Apenas usuários com role "admin" acessam o painel.
- [ ] CRUD de corridas funciona com todos os campos.
- [ ] Aprovação de sugestão pré-preenche o formulário de cadastro.
- [ ] Dashboard mostra métricas corretas.
