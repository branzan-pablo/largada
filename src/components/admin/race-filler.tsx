"use client";

import { useState } from "react";
import { Sparkles, Link as LinkIcon, ImageIcon, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import type { RaceExtraction } from "@/lib/ai/schemas/race-extraction";

const ACCEPTED_IMAGE_TYPES = ["image/png", "image/jpeg", "image/webp", "image/gif"];
const MAX_IMAGE_BYTES = 4 * 1024 * 1024;

interface RaceFillerProps {
  onExtract: (fields: RaceExtraction) => void;
  disabled?: boolean;
}

async function fileToBase64(file: File): Promise<{ data: string; mime: string }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result;
      if (typeof result !== "string") {
        reject(new Error("Falha ao ler arquivo"));
        return;
      }
      const commaIdx = result.indexOf(",");
      const data = commaIdx >= 0 ? result.slice(commaIdx + 1) : result;
      resolve({ data, mime: file.type || "image/png" });
    };
    reader.onerror = () => reject(new Error("Falha ao ler arquivo"));
    reader.readAsDataURL(file);
  });
}

export function RaceFiller({ onExtract, disabled }: RaceFillerProps) {
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<"url" | "image">("url");
  const [url, setUrl] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  function reset() {
    setUrl("");
    setImageFile(null);
    setImagePreview(null);
    setLoading(false);
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
      toast.error("Formato não suportado. Use PNG, JPG, WEBP ou GIF.");
      e.target.value = "";
      return;
    }
    if (file.size > MAX_IMAGE_BYTES) {
      toast.error(`Imagem maior que ${MAX_IMAGE_BYTES / 1024 / 1024} MB.`);
      e.target.value = "";
      return;
    }
    setImageFile(file);
    const objectUrl = URL.createObjectURL(file);
    setImagePreview(objectUrl);
  }

  async function submit() {
    setLoading(true);
    try {
      let body: Record<string, string>;
      if (tab === "url") {
        if (!url.trim()) {
          toast.error("Informe uma URL.");
          return;
        }
        body = { url: url.trim() };
      } else {
        if (!imageFile) {
          toast.error("Selecione uma imagem.");
          return;
        }
        const { data, mime } = await fileToBase64(imageFile);
        body = { imageBase64: data, imageMimeType: mime };
      }

      const res = await fetch("/api/admin/ai/extract-race", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const json = await res.json();
      if (!res.ok) {
        toast.error(json.message || json.error || "Falha ao extrair dados.");
        return;
      }

      const extracted = json.extracted as RaceExtraction | null;
      if (!extracted) {
        toast.warning("Nada foi extraído.");
        return;
      }
      onExtract(extracted);
      toast.success("Dados extraídos. Revise antes de salvar.");
      setOpen(false);
      reset();
    } catch (err) {
      console.error("[RaceFiller]", err);
      toast.error("Erro inesperado ao extrair.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) reset();
      }}
    >
      <DialogTrigger asChild>
        <Button
          type="button"
          variant="outline"
          disabled={disabled}
          className="gap-2"
        >
          <Sparkles className="h-4 w-4" />
          Importar com IA
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Importar dados da corrida</DialogTitle>
          <DialogDescription>
            Cole o link da página de inscrição ou anexe o cartaz. A IA preenche
            os campos vazios do formulário. Campos que você já digitou são
            preservados.
          </DialogDescription>
        </DialogHeader>

        <Tabs value={tab} onValueChange={(v) => setTab(v as "url" | "image")}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="url" className="gap-2">
              <LinkIcon className="h-4 w-4" /> Link
            </TabsTrigger>
            <TabsTrigger value="image" className="gap-2">
              <ImageIcon className="h-4 w-4" /> Imagem
            </TabsTrigger>
          </TabsList>
          <TabsContent value="url" className="space-y-2">
            <Label htmlFor="race-filler-url">URL da página</Label>
            <Input
              id="race-filler-url"
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://www.sympla.com.br/evento/..."
              disabled={loading}
              autoFocus
            />
            <p className="text-xs text-muted-foreground">
              Suporta Sympla, Ticket Sports, Instagram (post público), sites de
              organizadores. Apenas links públicos.
            </p>
          </TabsContent>
          <TabsContent value="image" className="space-y-2">
            <Label htmlFor="race-filler-image">Cartaz / flyer</Label>
            <Input
              id="race-filler-image"
              type="file"
              accept={ACCEPTED_IMAGE_TYPES.join(",")}
              onChange={handleFileChange}
              disabled={loading}
            />
            {imagePreview && (
              <div className="mt-2 max-h-48 overflow-hidden rounded-md border">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={imagePreview}
                  alt="Preview do cartaz"
                  className="max-h-48 w-auto object-contain"
                />
              </div>
            )}
            <p className="text-xs text-muted-foreground">
              PNG, JPG, WEBP ou GIF até 4MB. A IA lê o cartaz e extrai os dados
              visíveis.
            </p>
          </TabsContent>
        </Tabs>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => setOpen(false)}
            disabled={loading}
          >
            Cancelar
          </Button>
          <Button type="button" onClick={submit} disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {loading ? "Extraindo..." : "Importar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
