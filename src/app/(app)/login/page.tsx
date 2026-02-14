import { Suspense } from "react";
import { LoginPageClient } from "./login-page-client";

export const metadata = {
  title: "Entrar",
};

export default function LoginPage() {
  return (
    <main className="flex min-h-[calc(100vh-4rem-4rem)] items-center justify-center px-4 md:min-h-[calc(100vh-4rem)]">
      <Suspense>
        <LoginPageClient />
      </Suspense>
    </main>
  );
}
