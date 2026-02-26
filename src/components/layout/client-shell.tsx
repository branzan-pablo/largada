"use client";

import dynamic from "next/dynamic";

const LoginModal = dynamic(
  () =>
    import("@/components/auth/login-modal").then((m) => ({
      default: m.LoginModal,
    })),
  { ssr: false }
);

const Toaster = dynamic(
  () => import("sonner").then((m) => ({ default: m.Toaster })),
  { ssr: false }
);

export function ClientLoginModal() {
  return <LoginModal />;
}

export function ClientToaster() {
  return <Toaster position="bottom-center" richColors />;
}
