"use client";

import { useState } from "react";
import { Loader2, ExternalLink } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { useAuth } from "@/contexts/auth-context";
import { useLoginModal } from "@/contexts/login-modal-context";

interface CheckoutButtonProps {
  tier: string;
  label: string;
  apiPath: string;
  className?: string;
}

export function CheckoutButton({ tier, label, apiPath, className }: CheckoutButtonProps) {
  const { user, profile } = useAuth();
  const { openLogin } = useLoginModal();
  const [loading, setLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [taxId, setTaxId] = useState("");
  const [cellphone, setCellphone] = useState("");

  const checkout = async (customer?: { name: string; email: string; taxId: string; cellphone: string }) => {
    if (!user) {
      openLogin();
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(apiPath, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tier, ...(customer ? { customer } : {}) }),
      });

      if (res.status === 401) {
        openLogin();
        return;
      }

      if (res.status === 422) {
        setDialogOpen(true);
        return;
      }

      if (!res.ok) {
        const err = await res.json();
        toast.error(err.error || "Erro ao criar cobrança.");
        return;
      }

      const { url } = await res.json();
      if (url) window.location.href = url;
    } catch {
      toast.error("Erro ao processar. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  const handleCustomerSubmit = async () => {
    if (!taxId.trim() || !cellphone.trim()) {
      toast.error("Preencha CPF/CNPJ e celular.");
      return;
    }
    setDialogOpen(false);
    await checkout({
      name: profile?.full_name || user?.email?.split("@")[0] || "",
      email: user?.email || "",
      taxId: taxId.trim(),
      cellphone: cellphone.trim(),
    });
  };

  return (
    <>
      <button onClick={() => checkout()} disabled={loading} className={className}>
        {loading ? <Loader2 className="mx-auto h-4 w-4 animate-spin" /> : label}
      </button>

      <Dialog open={dialogOpen} onOpenChange={(open) => {
        setDialogOpen(open);
        if (!open) { setTaxId(""); setCellphone(""); }
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Dados para pagamento</DialogTitle>
            <DialogDescription>
              Precisamos do seu CPF/CNPJ e celular para processar a cobrança.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor={`taxId-${tier}`}>CPF/CNPJ</Label>
              <Input
                id={`taxId-${tier}`}
                placeholder="000.000.000-00"
                value={taxId}
                onChange={e => setTaxId(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor={`phone-${tier}`}>Celular</Label>
              <Input
                id={`phone-${tier}`}
                placeholder="(17) 99999-9999"
                value={cellphone}
                onChange={e => setCellphone(e.target.value)}
              />
            </div>
            <Button
              className="w-full"
              disabled={loading || !taxId.trim() || !cellphone.trim()}
              onClick={handleCustomerSubmit}
            >
              {loading ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Processando...</>
              ) : (
                <>Ir para pagamento<ExternalLink className="ml-2 h-4 w-4" /></>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
