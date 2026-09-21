const PIX_GUI = "BR.GOV.BCB.PIX";

function emvField(id: string, value: string) {
  const length = new TextEncoder().encode(value).length;
  return `${id}${String(length).padStart(2, "0")}${value}`;
}

export function crc16Ccitt(value: string) {
  let crc = 0xffff;

  for (const byte of new TextEncoder().encode(value)) {
    crc ^= byte << 8;
    for (let bit = 0; bit < 8; bit += 1) {
      crc = crc & 0x8000 ? (crc << 1) ^ 0x1021 : crc << 1;
      crc &= 0xffff;
    }
  }

  return crc.toString(16).toUpperCase().padStart(4, "0");
}

interface StaticPixPayloadOptions {
  key: string;
  recipient: string;
  city: string;
  description?: string;
  txid?: string;
}

export function createStaticPixPayload({
  key,
  recipient,
  city,
  description,
  txid = "***",
}: StaticPixPayloadOptions) {
  const merchantAccount = [
    emvField("00", PIX_GUI),
    emvField("01", key),
    description ? emvField("02", description) : "",
  ].join("");

  const payload = [
    emvField("00", "01"),
    emvField("26", merchantAccount),
    emvField("52", "0000"),
    emvField("53", "986"),
    emvField("58", "BR"),
    emvField("59", recipient),
    emvField("60", city),
    emvField("62", emvField("05", txid)),
    "6304",
  ].join("");

  return `${payload}${crc16Ccitt(payload)}`;
}

export const LARGADA_PIX_KEY = "38804005807";

export const LARGADA_PIX_PAYLOAD = createStaticPixPayload({
  key: LARGADA_PIX_KEY,
  recipient: "PABLO FERREIRA",
  city: "SAO JOSE RP",
  description: "APOIO LARGADA",
});
