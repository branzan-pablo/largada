import { formatDateFull, formatTime } from "@/lib/date";

export type InstagramFormat = "post" | "story";

export interface RaceImageData {
  raceName: string;
  city: string;
  state: string;
  date: string;
  startTime: string | null;
  distances: string[];
  shareUrl: string;
  imageUrl?: string | null;
}

const DIMENSIONS: Record<InstagramFormat, { w: number; h: number }> = {
  post: { w: 1080, h: 1350 },
  story: { w: 1080, h: 1920 },
};

function loadImage(src: string): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = src;
  });
}

function drawCover(ctx: CanvasRenderingContext2D, img: HTMLImageElement, x: number, y: number, w: number, h: number) {
  const ir = img.width / img.height;
  const tr = w / h;
  let sx = 0, sy = 0, sw = img.width, sh = img.height;
  if (ir > tr) {
    sw = img.height * tr;
    sx = (img.width - sw) / 2;
  } else {
    sh = img.width / tr;
    sy = (img.height - sh) / 2;
  }
  ctx.drawImage(img, sx, sy, sw, sh, x, y, w, h);
}

function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
  maxLines: number
): string[] {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let current = "";
  for (const word of words) {
    const test = current ? `${current} ${word}` : word;
    if (ctx.measureText(test).width > maxWidth && current) {
      lines.push(current);
      current = word;
      if (lines.length === maxLines - 1) break;
    } else {
      current = test;
    }
  }
  if (current && lines.length < maxLines) lines.push(current);
  if (lines.length === maxLines) {
    const last = lines[maxLines - 1];
    if (ctx.measureText(last).width > maxWidth) {
      let truncated = last;
      while (ctx.measureText(`${truncated}…`).width > maxWidth && truncated.length > 0) {
        truncated = truncated.slice(0, -1);
      }
      lines[maxLines - 1] = `${truncated}…`;
    }
  }
  return lines;
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

export async function renderRaceShareImage(
  data: RaceImageData,
  format: InstagramFormat
): Promise<Blob> {
  const { w, h } = DIMENSIONS[format];
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas 2D não disponível");

  // Background
  const bgImg = data.imageUrl ? await loadImage(data.imageUrl) : null;
  if (bgImg) {
    try {
      drawCover(ctx, bgImg, 0, 0, w, h);
    } catch {
      // tainted — fallback handled below
    }
  }
  if (!bgImg) {
    const grad = ctx.createLinearGradient(0, 0, w, h);
    grad.addColorStop(0, "#0D1B2A");
    grad.addColorStop(1, "#1B263B");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);
  }

  // Dark overlay for legibility
  const overlay = ctx.createLinearGradient(0, 0, 0, h);
  overlay.addColorStop(0, "rgba(13, 27, 42, 0.55)");
  overlay.addColorStop(0.45, "rgba(13, 27, 42, 0.35)");
  overlay.addColorStop(1, "rgba(13, 27, 42, 0.95)");
  ctx.fillStyle = overlay;
  ctx.fillRect(0, 0, w, h);

  const pad = 72;
  const fontStack = '"Inter", "Helvetica Neue", Arial, sans-serif';

  // Top badge: Largada
  ctx.font = `700 30px ${fontStack}`;
  const badgeText = "LARGADA";
  const badgeW = ctx.measureText(badgeText).width + 48;
  const badgeH = 54;
  ctx.fillStyle = "#F59E0B";
  roundRect(ctx, pad, pad, badgeW, badgeH, 27);
  ctx.fill();
  ctx.fillStyle = "#0D1B2A";
  ctx.textBaseline = "middle";
  ctx.textAlign = "center";
  ctx.fillText(badgeText, pad + badgeW / 2, pad + badgeH / 2 + 2);

  // Bottom-anchored content block
  ctx.textAlign = "left";
  let cursorY = h - pad;

  // URL at very bottom
  ctx.font = `500 28px ${fontStack}`;
  ctx.fillStyle = "rgba(255,255,255,0.85)";
  ctx.textBaseline = "bottom";
  const urlLabel = data.shareUrl.replace(/^https?:\/\//, "");
  ctx.fillText(urlLabel, pad, cursorY);
  cursorY -= 44;

  ctx.font = `400 24px ${fontStack}`;
  ctx.fillStyle = "rgba(255,255,255,0.7)";
  ctx.fillText("Confirme sua presença no Largada", pad, cursorY);
  cursorY -= 56;

  // Distances chips
  const distances = data.distances.map((d) => d.toUpperCase());
  ctx.font = `700 26px ${fontStack}`;
  const chipH = 52;
  const chipGap = 12;
  let chipX = pad;
  const chipY = cursorY - chipH;
  for (const d of distances) {
    const tw = ctx.measureText(d).width;
    const cw = tw + 40;
    if (chipX + cw > w - pad) break;
    ctx.fillStyle = "rgba(245, 158, 11, 0.95)";
    roundRect(ctx, chipX, chipY, cw, chipH, 26);
    ctx.fill();
    ctx.fillStyle = "#0D1B2A";
    ctx.textBaseline = "middle";
    ctx.textAlign = "center";
    ctx.fillText(d, chipX + cw / 2, chipY + chipH / 2 + 2);
    chipX += cw + chipGap;
  }
  cursorY = chipY - 36;

  // Date + time + location line
  ctx.textAlign = "left";
  ctx.textBaseline = "bottom";
  ctx.font = `600 34px ${fontStack}`;
  ctx.fillStyle = "#ffffff";
  const timePart = data.startTime ? ` · ${formatTime(data.startTime)}` : "";
  const dateLine = `${formatDateFull(data.date)}${timePart}`;
  ctx.fillText(dateLine, pad, cursorY);
  cursorY -= 48;

  ctx.font = `500 32px ${fontStack}`;
  ctx.fillStyle = "rgba(255,255,255,0.9)";
  ctx.fillText(`${data.city}/${data.state}`, pad, cursorY);
  cursorY -= 40;

  // Race name (big, wrapped — up to 3 lines)
  const nameMaxWidth = w - pad * 2;
  const nameSize = format === "story" ? 88 : 76;
  ctx.font = `800 ${nameSize}px ${fontStack}`;
  ctx.fillStyle = "#ffffff";
  const lines = wrapText(ctx, data.raceName, nameMaxWidth, 3);
  const lineHeight = nameSize * 1.08;
  // Draw from bottom up
  for (let i = lines.length - 1; i >= 0; i--) {
    ctx.fillText(lines[i], pad, cursorY);
    cursorY -= lineHeight;
  }

  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob);
        else reject(new Error("Falha ao gerar imagem"));
      },
      "image/jpeg",
      0.92
    );
  });
}

export function buildImageFilename(raceName: string, format: InstagramFormat) {
  const slug = raceName
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 60) || "largada";
  return `${slug}-${format}.jpg`;
}
