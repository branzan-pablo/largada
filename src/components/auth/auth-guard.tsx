"use client";

import { useAuth } from "@/contexts/auth-context";
import { useLoginModal } from "@/contexts/login-modal-context";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useState } from "react";

interface AuthGuardProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export function AuthGuard({ children, fallback }: AuthGuardProps) {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return fallback ?? null;
  }

  if (!user) {
    return fallback ?? null;
  }

  return <>{children}</>;
}

interface AuthDialogProps {
  children: React.ReactNode;
}

export function AuthDialog({ children }: AuthDialogProps) {
  const { openLogin } = useLoginModal();
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <div onClick={() => setOpen(true)} role="button" tabIndex={0}>
        {children}
      </div>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Entre para continuar</DialogTitle>
          <DialogDescription>
            Crie sua conta ou faça login para marcar participação e receber avisos de corridas.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-3 pt-4">
          <Button
            onClick={() => {
              setOpen(false);
              openLogin();
            }}
          >
            Entrar ou criar conta
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
