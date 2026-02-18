# 🔔 Guia: Web Push Notifications com VAPID em Next.js

## Visão Geral

Web Push Notifications permitem enviar notificações para o navegador/dispositivo do usuário mesmo com o site fechado. O protocolo **VAPID** (Voluntary Application Server Identification) autentica seu servidor junto aos serviços de push (Google FCM, Mozilla, Apple) sem necessidade de contas externas.

---

## Arquitetura

```
┌──────────────┐      ┌────────────────┐      ┌────────────────┐
│  Next.js App │─────▶│  Seu Backend   │─────▶│  Push Service  │
│  (Frontend)  │      │  (API Route)   │      │  (FCM/Mozilla) │
└──────────────┘      └────────────────┘      └────────────────┘
       │                                              │
       │          ┌──────────────┐                    │
       └─────────▶│Service Worker│◀───────────────────┘
                  │   (sw.js)    │ recebe o push
                  └──────────────┘
```

**Fluxo resumido:**

1. Frontend pede permissão e se inscreve no `PushManager` usando a **chave pública VAPID**
2. O navegador retorna um objeto `PushSubscription` (endpoint + keys)
3. Você salva essa subscription no seu banco de dados
4. Quando quiser notificar, seu backend usa a **chave privada VAPID** para assinar e enviar a mensagem ao endpoint
5. O Push Service entrega ao Service Worker do usuário

---

## Passo 1 — Pegar Key pair VAPID já criado no Firebase Cloud Messaging

Já está configurado nas variáveis de ambiente (`.env.local`), mas revise.

Ou use dessa outra forma para gerar novas chaves com gerador externo:

## Passo 1.1 — Gerar Chaves VAPID

Instale a lib `web-push` (usada no backend):

```bash
npm install web-push
```

Gere o par de chaves uma única vez:

```bash
npx web-push generate-vapid-keys
```

**Saída:**

```
Public Key:  BDxG3aF...chave_publica_base64url
Private Key: k8JzYd...chave_privada_base64url
```

Salve em variáveis de ambiente (`.env.local`):

```env
NEXT_PUBLIC_VAPID_PUBLIC_KEY=BDxG3aF...
VAPID_PRIVATE_KEY=k8JzYd...
VAPID_SUBJECT=mailto:seu@email.com
```

> ⚠️ A chave **pública** é exposta no frontend (prefixo `NEXT_PUBLIC_`). A **privada** fica só no servidor.

---

## Passo 2 — Criar o Service Worker

Crie `public/sw.js` na raiz do projeto:

```js
// public/sw.js

// Recebe a notificação push
self.addEventListener("push", function (event) {
  if (!event.data) return;

  const data = event.data.json();

  const options = {
    body: data.body || "Nova notificação",
    icon: "/icon-192x192.png",
    badge: "/icon-192x192.png",
    vibrate: [200, 100, 200],
    data: { url: data.url || "/" },
    tag: "notif-" + Date.now(),
  };

  event.waitUntil(
    self.registration.showNotification(data.title || "Notificação", options),
  );
});

// Clique na notificação
self.addEventListener("notificationclick", function (event) {
  event.notification.close();
  const url = event.notification.data?.url || "/";

  event.waitUntil(
    clients.matchAll({ type: "window" }).then((list) => {
      for (const client of list) {
        if (client.url.includes(self.location.origin) && "focus" in client) {
          client.navigate(url);
          return client.focus();
        }
      }
      return clients.openWindow(url);
    }),
  );
});

self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (e) => e.waitUntil(clients.claim()));
```

---

## Passo 3 — Hook no Frontend (React)

```tsx
// src/hooks/usePushNotifications.ts
"use client";

import { useState, useEffect, useCallback } from "react";

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = window.atob(base64);
  const array = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) array[i] = raw.charCodeAt(i);
  return array;
}

export function usePushNotifications() {
  const [isSupported, setIsSupported] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [subscription, setSubscription] = useState<PushSubscription | null>(
    null,
  );

  useEffect(() => {
    const ok = "serviceWorker" in navigator && "PushManager" in window;
    setIsSupported(ok);
    if (!ok) return;

    navigator.serviceWorker.ready.then(async (reg) => {
      const sub = await reg.pushManager.getSubscription();
      setIsSubscribed(!!sub);
      setSubscription(sub);
    });
  }, []);

  const subscribe = useCallback(async (): Promise<PushSubscription | null> => {
    setIsLoading(true);
    try {
      const perm = await Notification.requestPermission();
      if (perm !== "granted") return null;

      const reg = await navigator.serviceWorker.register("/sw.js");
      await navigator.serviceWorker.ready;

      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(
          process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
        ),
      });

      // Envia a subscription para sua API salvar no banco
      await fetch("/api/push/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(sub.toJSON()),
      });

      setIsSubscribed(true);
      setSubscription(sub);
      return sub;
    } catch (err) {
      console.error("Erro ao inscrever:", err);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const unsubscribe = useCallback(async () => {
    try {
      if (subscription) {
        await subscription.unsubscribe();
        await fetch("/api/push/unsubscribe", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ endpoint: subscription.endpoint }),
        });
      }
      setIsSubscribed(false);
      setSubscription(null);
    } catch (err) {
      console.error("Erro ao desinscrever:", err);
    }
  }, [subscription]);

  return { isSupported, isSubscribed, isLoading, subscribe, unsubscribe };
}
```

---

## Passo 4 — API Routes (Backend Next.js)

### 4a. Salvar inscrição

```ts
// src/app/api/push/subscribe/route.ts (App Router)
// ou src/pages/api/push/subscribe.ts (Pages Router)

import { NextResponse } from "next/server";

// Use seu banco preferido (Prisma, Drizzle, etc.)
import { db } from "@/lib/db";

export async function POST(req: Request) {
  const subscription = await req.json();

  // Salve no seu banco de dados
  await db.pushSubscription.upsert({
    where: { endpoint: subscription.endpoint },
    create: {
      endpoint: subscription.endpoint,
      p256dh: subscription.keys.p256dh,
      auth: subscription.keys.auth,
    },
    update: {
      p256dh: subscription.keys.p256dh,
      auth: subscription.keys.auth,
    },
  });

  return NextResponse.json({ ok: true });
}
```

### 4b. Remover inscrição

```ts
// src/app/api/push/unsubscribe/route.ts

import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function POST(req: Request) {
  const { endpoint } = await req.json();

  await db.pushSubscription.delete({
    where: { endpoint },
  });

  return NextResponse.json({ ok: true });
}
```

### 4c. Enviar notificação

```ts
// src/app/api/push/send/route.ts

import { NextResponse } from "next/server";
import webpush from "web-push";
import { db } from "@/lib/db";

// Configurar VAPID (faça isso uma vez, pode ir em um arquivo separado)
webpush.setVapidDetails(
  process.env.VAPID_SUBJECT!, // "mailto:seu@email.com"
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!,
);

export async function POST(req: Request) {
  const { title, body, url } = await req.json();

  // Buscar todas as inscrições do banco
  const subscriptions = await db.pushSubscription.findMany();

  const payload = JSON.stringify({ title, body, url });

  const results = await Promise.allSettled(
    subscriptions.map((sub) =>
      webpush.sendNotification(
        {
          endpoint: sub.endpoint,
          keys: { p256dh: sub.p256dh, auth: sub.auth },
        },
        payload,
      ),
    ),
  );

  // Limpar inscrições expiradas (status 404 ou 410)
  const expired = results
    .map((r, i) => (r.status === "rejected" ? subscriptions[i] : null))
    .filter(Boolean);

  if (expired.length) {
    await db.pushSubscription.deleteMany({
      where: { endpoint: { in: expired.map((e) => e!.endpoint) } },
    });
  }

  const sent = results.filter((r) => r.status === "fulfilled").length;

  return NextResponse.json({ sent, total: subscriptions.length });
}
```

---

## Passo 5 — Componente de Toggle

```tsx
"use client";

import { usePushNotifications } from "@/hooks/usePushNotifications";

export function PushToggle() {
  const { isSupported, isSubscribed, isLoading, subscribe, unsubscribe } =
    usePushNotifications();

  if (!isSupported) return null;

  return (
    <button
      onClick={isSubscribed ? unsubscribe : subscribe}
      disabled={isLoading}
    >
      {isLoading ? "⏳" : isSubscribed ? "🔔 Ativas" : "🔕 Ativar"}
    </button>
  );
}
```

---

## Passo 6 — Testar

```bash
# Enviar notificação de teste via curl
curl -X POST http://localhost:3000/api/push/send \
  -H "Content-Type: application/json" \
  -d '{"title":"Teste","body":"Funcionou!","url":"/"}'
```

---

## Considerações iOS

Push no iOS **só funciona em PWA** (instalado via Safari → "Adicionar à Tela de Início"):

```ts
const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
const isPWA = window.matchMedia("(display-mode: standalone)").matches;

if (isIOS && !isPWA) {
  alert("Instale o app via Safari para receber notificações");
}
```

---

## Resumo das Dependências

| Pacote     | Onde                 | Para quê                                |
| ---------- | -------------------- | --------------------------------------- |
| `web-push` | Backend (API Routes) | Assinar e enviar notificações via VAPID |

> É a **única dependência externa** necessária. Todo o resto usa APIs nativas do navegador.

---

## Checklist

- [ ] `npx web-push generate-vapid-keys` e salvar no `.env.local`
- [ ] Criar `public/sw.js`
- [ ] Criar hook `usePushNotifications`
- [ ] Criar API Route `POST /api/push/subscribe`
- [ ] Criar API Route `POST /api/push/unsubscribe`
- [ ] Criar API Route `POST /api/push/send`
- [ ] Criar tabela de subscriptions no banco
- [ ] Testar em desktop (Chrome/Firefox)
- [ ] Testar em Android (Chrome)
- [ ] Testar em iOS (Safari PWA)

---

## Troubleshooting

| Problema            | Causa                                   | Solução                                                  |
| ------------------- | --------------------------------------- | -------------------------------------------------------- |
| `403 Forbidden`     | Chave VAPID não bate com a subscription | Gerar nova subscription com a chave atual                |
| `410 Gone`          | Subscription expirou                    | Deletar do banco, usuário precisa reinscrever            |
| Não funciona no iOS | Fora do modo PWA                        | Instruir instalação via Safari                           |
| SW não registra     | Arquivo não está em `/public`           | Verificar que `sw.js` é acessível em `seusite.com/sw.js` |
| `InvalidStateError` | `userVisibleOnly` não setado            | Sempre usar `userVisibleOnly: true`                      |
