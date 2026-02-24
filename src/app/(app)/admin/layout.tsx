import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { LayoutDashboard, Trophy, MessageSquarePlus } from "lucide-react";

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
    <div className="flex min-h-screen">
      <aside className="hidden w-60 border-r bg-muted/30 md:block">
        <div className="p-6">
          <Link href="/admin" className="text-lg font-extrabold uppercase tracking-wider text-primary">
            Largada <span className="text-xs font-semibold normal-case tracking-normal text-muted-foreground">Admin</span>
          </Link>
        </div>
        <nav className="space-y-1 px-3">
          <NavLink href="/admin" icon={LayoutDashboard}>
            Dashboard
          </NavLink>
          <NavLink href="/admin/corridas" icon={Trophy}>
            Corridas
          </NavLink>
          <NavLink href="/admin/sugestoes" icon={MessageSquarePlus}>
            Sugestões
          </NavLink>
        </nav>
      </aside>

      {/* Mobile nav */}
      <div className="fixed bottom-0 left-0 right-0 z-50 border-t bg-background md:hidden">
        <nav className="flex justify-around py-2">
          <MobileNavLink href="/admin" icon={LayoutDashboard} label="Dashboard" />
          <MobileNavLink href="/admin/corridas" icon={Trophy} label="Corridas" />
          <MobileNavLink href="/admin/sugestoes" icon={MessageSquarePlus} label="Sugestões" />
        </nav>
      </div>

      <main className="flex-1 pb-16 md:pb-0 pt-16">{children}</main>
    </div>
  );
}

function NavLink({
  href,
  icon: Icon,
  children,
}: {
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className="flex items-center gap-3 rounded-md px-3 py-2 text-sm text-muted-foreground hover:bg-accent hover:text-accent-foreground"
    >
      <Icon className="h-4 w-4" />
      {children}
    </Link>
  );
}

function MobileNavLink({
  href,
  icon: Icon,
  label,
}: {
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
}) {
  return (
    <Link
      href={href}
      className="flex flex-col items-center gap-1 text-xs text-muted-foreground"
    >
      <Icon className="h-5 w-5" />
      {label}
    </Link>
  );
}
