import { createClient } from "@supabase/supabase-js";

const url = process.env.RLS_SUPABASE_URL;
const anonKey = process.env.RLS_SUPABASE_ANON_KEY;
const serviceKey = process.env.RLS_SUPABASE_SERVICE_KEY;
if (!url || !anonKey || !serviceKey) throw new Error("Missing RLS validation environment");

const admin = createClient(url, serviceKey, { auth: { persistSession: false } });
const suffix = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
const password = `Rls-${crypto.randomUUID()}-Aa1!`;
const users = [];

try {
  for (const label of ["owner", "other"]) {
    const { data, error } = await admin.auth.admin.createUser({
      email: `rls-${label}-${suffix}@example.invalid`, password, email_confirm: true,
    });
    if (error || !data.user) throw error ?? new Error("Could not create RLS user");
    users.push(data.user);
  }

  const clients = await Promise.all(users.map(async (user) => {
    const client = createClient(url, anonKey, { auth: { persistSession: false } });
    const { error } = await client.auth.signInWithPassword({ email: user.email, password });
    if (error) throw error;
    return client;
  }));

  const { data: races, error: raceError } = await clients[0]
    .from("races").select("id").limit(1);
  if (raceError || !races?.[0]) throw raceError ?? new Error("No race available for RLS test");

  const { data: rsvp, error: insertError } = await clients[0]
    .from("rsvps").insert({ user_id: users[0].id, race_id: races[0].id }).select("id").single();
  if (insertError) throw insertError;

  const { data: stolen, error: deleteError } = await clients[1]
    .from("rsvps").delete().eq("id", rsvp.id).select("id");
  if (deleteError || stolen?.length) throw deleteError ?? new Error("Cross-user RSVP deletion was allowed");

  const { data: changed, error: updateError } = await clients[1]
    .from("profiles").update({ full_name: "RLS violation" }).eq("id", users[0].id).select("id");
  if (updateError || changed?.length) throw updateError ?? new Error("Cross-user profile update was allowed");

  const anonymous = createClient(url, anonKey, { auth: { persistSession: false } });
  const { data: events, error: eventsError } = await anonymous.from("payment_events").select("id").limit(1);
  if (eventsError || events?.length) throw eventsError ?? new Error("Anonymous payment event access was allowed");

  console.log("RLS validation passed: ownership writes and payment events are protected.");
} finally {
  for (const user of users) await admin.auth.admin.deleteUser(user.id);
}
