import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AdminNav } from "./admin-nav";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/corridas?login=true");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin") {
    redirect("/corridas");
  }

  return (
    <div className="min-h-screen">
      <div className="pt-8 pb-4">
        <h1 className="text-2xl font-bold">Admin</h1>
        <p className="text-muted-foreground">Gerencie corridas e sugestões</p>
      </div>
      <div className="border-b">
        <AdminNav />
      </div>

      <main className="py-8 md:py-12">{children}</main>
    </div>
  );
}
