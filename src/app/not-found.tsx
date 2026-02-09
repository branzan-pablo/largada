import Link from "next/link";

export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center">
      <h1 className="text-6xl font-bold text-primary">404</h1>
      <p className="mt-4 text-lg text-muted-foreground">
        Página não encontrada
      </p>
      <Link
        href="/"
        className="mt-6 rounded-md bg-primary px-6 py-2 text-primary-foreground hover:bg-primary/90"
      >
        Voltar ao início
      </Link>
    </main>
  );
}
