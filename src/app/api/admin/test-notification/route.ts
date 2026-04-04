import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { sendToSubscriptions } from "@/lib/notifications";
import { createClient } from "@/lib/supabase/server";

/**
 * POST /api/admin/test-notification
 *
 * Envia uma notificação push de teste para o admin autenticado.
 * Requer role "admin" — retorna 401 (não logado) ou 403 (não admin).
 *
 * Como testar:
 *   1. Abra o app logado como admin (ex: largada.app)
 *   2. Abra o DevTools (F12) → Console
 *   3. Execute:
 *      fetch('/api/admin/test-notification', { method: 'POST' })
 *        .then(r => r.json()).then(console.log)
 *
 * Resposta de sucesso: { ok: true, sent: 1, failed: 0 }
 * Se não tiver inscrição push: { error: "Nenhuma inscrição push encontrada..." } (404)
 */
export async function POST() {
  const result = await requireAdmin();
  if (result instanceof NextResponse) return result;

  const { user } = result;
  const supabase = await createClient();

  const { data: subs } = await supabase
    .from("push_subscriptions")
    .select("endpoint, p256dh, auth")
    .eq("user_id", user.id);

  if (!subs || subs.length === 0) {
    return NextResponse.json(
      { error: "Nenhuma inscrição push encontrada para seu usuário" },
      { status: 404 },
    );
  }

  const sent = await sendToSubscriptions({
    title: "Teste de notificação 🏃",
    body: "Se você está vendo isso, as notificações push estão funcionando!",
    url: "/perfil",
    subscriptions: subs,
  });

  return NextResponse.json({ ok: true, ...sent });
}
