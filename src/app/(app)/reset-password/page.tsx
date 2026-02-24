import { Suspense } from "react";
import { ResetPasswordClient } from "./reset-password-client";

export const metadata = {
  title: "Redefinir Senha",
};

export default function ResetPasswordPage() {
  return (
    <main className="flex min-h-[calc(100vh-4rem-4rem)] items-center justify-center px-4 pt-16 md:min-h-[calc(100vh-4rem)]">
      <Suspense>
        <ResetPasswordClient />
      </Suspense>
    </main>
  );
}
