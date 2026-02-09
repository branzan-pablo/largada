import { Suspense } from "react";
import { LoginPageClient } from "./login-page-client";

export const metadata = {
  title: "Entrar",
};

export default function LoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center px-4">
      <Suspense>
        <LoginPageClient />
      </Suspense>
    </main>
  );
}
