"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
} from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";

interface LoginModalContextValue {
  isOpen: boolean;
  defaultTab: "login" | "register";
  openLogin: () => void;
  openRegister: () => void;
  close: () => void;
}

const LoginModalContext = createContext<LoginModalContextValue | null>(null);

export function LoginModalProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [defaultTab, setDefaultTab] = useState<"login" | "register">("login");

  const openLogin = useCallback(() => {
    setDefaultTab("login");
    setIsOpen(true);
  }, []);

  const openRegister = useCallback(() => {
    setDefaultTab("register");
    setIsOpen(true);
  }, []);

  const close = useCallback(() => {
    setIsOpen(false);
  }, []);

  return (
    <LoginModalContext.Provider value={{ isOpen, defaultTab, openLogin, openRegister, close }}>
      {children}
    </LoginModalContext.Provider>
  );
}

/**
 * Watches URL params (?login=true, ?error=auth|confirmation) and auto-opens the login modal.
 * Must be rendered inside LoginModalProvider and wrapped in Suspense.
 */
export function LoginModalUrlHandler() {
  const { openLogin } = useLoginModal();
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const login = searchParams.get("login");
    const error = searchParams.get("error");

    if (error) {
      import("sonner").then(({ toast }) => {
        if (error === "strava_limit") {
          toast.error("Login com Strava temporariamente indisponível. Use outra forma de login.", { duration: 6000 });
        } else if (error === "auth") {
          toast.error("Erro na autenticação. Tente novamente.");
        } else if (error === "confirmation") {
          toast.error("Erro ao confirmar email. Tente novamente.");
        }
      });
    }

    if (login === "true" || error) {
      openLogin();

      // Clean URL params
      const params = new URLSearchParams(searchParams.toString());
      params.delete("login");
      params.delete("error");
      const remaining = params.toString();
      router.replace(remaining ? `${pathname}?${remaining}` : pathname);
    }
  }, [searchParams, router, pathname, openLogin]);

  return null;
}

export function useLoginModal() {
  const ctx = useContext(LoginModalContext);
  if (!ctx) throw new Error("useLoginModal must be used within LoginModalProvider");
  return ctx;
}
