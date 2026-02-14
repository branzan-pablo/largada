"use client";

import { createContext, useContext, useState, useCallback } from "react";

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

export function useLoginModal() {
  const ctx = useContext(LoginModalContext);
  if (!ctx) throw new Error("useLoginModal must be used within LoginModalProvider");
  return ctx;
}
