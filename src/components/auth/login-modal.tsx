"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { LoginForm } from "@/components/auth/login-form";
import { RegisterForm } from "@/components/auth/register-form";
import { OAuthButtons } from "@/components/auth/oauth-buttons";
import { useLoginModal } from "@/contexts/login-modal-context";
import { useAuth } from "@/contexts/auth-context";
import Image from "next/image";

export function LoginModal() {
  const { isOpen, defaultTab, close } = useLoginModal();
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const [tab, setTab] = useState(defaultTab);

  // Sync tab when modal opens with a different default
  useEffect(() => {
    if (isOpen) setTab(defaultTab);
  }, [isOpen, defaultTab]);

  // Close modal when user logs in
  useEffect(() => {
    if (!isLoading && user && isOpen) {
      close();
      router.refresh();
    }
  }, [isLoading, user, isOpen, close, router]);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && close()}>
      <DialogContent className="sm:max-w-md p-0 gap-0 overflow-hidden text-foreground">
        <DialogHeader className="p-6 pb-0 text-center">
          <DialogTitle className="text-2xl font-extrabold uppercase tracking-wider text-primary">
            {/* Logo — same as header */}
            <div className="flex items-center gap-1">
              <Image
                src="/logo_120.png"
                alt="Largada"
                width={60}
                height={60}
              />
              <span className="font-[family-name:var(--font-logo)] text-2xl tracking-wide text-[#0D1B2A]">LARGADA</span>
            </div>
          </DialogTitle>
          <DialogDescription>
            Acesse sua conta ou crie uma nova para encontrar corridas na sua região
          </DialogDescription>
        </DialogHeader>

        <div className="p-6">
          <OAuthButtons />

          <div className="relative my-6">
            <Separator />
            <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-background px-3 text-xs text-muted-foreground">
              ou com email
            </span>
          </div>

          <Tabs value={tab} onValueChange={(v) => setTab(v as "login" | "register")}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="login">Entrar</TabsTrigger>
              <TabsTrigger value="register">Criar conta</TabsTrigger>
            </TabsList>
            <TabsContent value="login" className="mt-4">
              <LoginForm onSuccess={() => { close(); router.refresh(); }} />
            </TabsContent>
            <TabsContent value="register" className="mt-4">
              <RegisterForm />
            </TabsContent>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
}
