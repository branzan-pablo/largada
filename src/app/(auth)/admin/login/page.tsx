import Image from "next/image";
import Link from "next/link";
import { AdminLoginForm } from "@/components/auth/admin-login-form";

export const metadata = { title: "Login administrativo" };

export default async function AdminLoginPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const forbidden = (await searchParams).error === "forbidden";
  return (
    <div className="w-full max-w-md rounded-xl border bg-white p-6 shadow-sm">
      <Link href="/" className="mb-6 flex items-center justify-center gap-1">
        <Image src="/logo_120.png" alt="" width={48} height={48} />
        <span className="font-[family-name:var(--font-logo)] text-3xl tracking-wide text-[#0D1B2A]">LARGADA</span>
      </Link>
      <h1 className="text-xl font-bold text-[#0D1B2A]">Acesso administrativo</h1>
      <p className="mb-6 mt-1 text-sm text-muted-foreground">Entre com uma conta autorizada.</p>
      {forbidden && <p role="alert" className="mb-4 rounded-md bg-red-50 p-3 text-sm text-red-700">Esta conta não possui acesso administrativo.</p>}
      <AdminLoginForm />
    </div>
  );
}
