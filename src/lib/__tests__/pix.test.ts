import { describe, expect, it } from "vitest";
import { crc16Ccitt, LARGADA_PIX_PAYLOAD } from "@/lib/pix";

describe("Pix BR Code", () => {
  it("implements CRC-16/CCITT-FALSE", () => {
    expect(crc16Ccitt("123456789")).toBe("29B1");
  });

  it("creates a static payload with the approved key and a valid checksum", () => {
    expect(LARGADA_PIX_PAYLOAD).toContain("0014BR.GOV.BCB.PIX");
    expect(LARGADA_PIX_PAYLOAD).toContain("011138804005807");
    expect(LARGADA_PIX_PAYLOAD).toContain("5914PABLO FERREIRA");

    const payloadWithoutChecksum = LARGADA_PIX_PAYLOAD.slice(0, -4);
    expect(LARGADA_PIX_PAYLOAD.slice(-4)).toBe(crc16Ccitt(payloadWithoutChecksum));
  });
});
