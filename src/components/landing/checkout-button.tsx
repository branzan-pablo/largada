"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  const [needsCustomer, setNeedsCustomer] = useState(false);
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
        setNeedsCustomer(true);
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
    await checkout({
      name: profile?.full_name || user?.email?.split("@")[0] || "",
      email: user?.email || "",
      taxId: taxId.trim(),
      cellphone: cellphone.trim(),
    });
  };

  if (needsCustomer) {
    return (
      <div className="space-y-3 rounded-2xl border border-gray-200 bg-white p-4">
        <p className="text-xs font-medium text-[#6B7280]">Dados para o pagamento:</p>
        <div className="space-y-1.5">
          <Label htmlFor={`taxId-${tier}`} className="text-xs text-[#6B7280]">CPF/CNPJ</Label>
          <Input
            id={`taxId-${tier}`}
            placeholder="000.000.000-00"
            value={taxId}
            onChange={e => setTaxId(e.target.value)}
            className="h-9 text-sm"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor={`phone-${tier}`} className="text-xs text-[#6B7280]">Celular</Label>
          <Input
            id={`phone-${tier}`}
            placeholder="(17) 99999-9999"
            value={cellphone}
            onChange={e => setCellphone(e.target.value)}
            className="h-9 text-sm"
          />
        </div>
        <button
          onClick={handleCustomerSubmit}
          disabled={loading || !taxId.trim() || !cellphone.trim()}
          className={className}
        >
          {loading ? <Loader2 className="mx-auto h-4 w-4 animate-spin" /> : "Ir para pagamento"}
        </button>
      </div>
    );
  }

  return (
    <button onClick={() => checkout()} disabled={loading} className={className}>
      {loading ? <Loader2 className="mx-auto h-4 w-4 animate-spin" /> : label}
    </button>
  );
}
