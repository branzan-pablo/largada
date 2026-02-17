import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { SupabaseClient, User } from "@supabase/supabase-js";

interface AuthResult {
  user: User;
  supabase: SupabaseClient;
}

interface AdminResult extends AuthResult {
  profile: { role: string };
}

/**
 * Require an authenticated user. Returns user + supabase client or a 401 response.
 */
export async function requireAuth(): Promise<AuthResult | NextResponse> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  return { user, supabase };
}

/**
 * Require an authenticated admin user. Returns user + profile + supabase client,
 * or a 401/403 response.
 */
export async function requireAdmin(): Promise<AdminResult | NextResponse> {
  const result = await requireAuth();
  if (result instanceof NextResponse) return result;

  const { user, supabase } = result;

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin") {
    return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
  }

  return { user, supabase, profile };
}
