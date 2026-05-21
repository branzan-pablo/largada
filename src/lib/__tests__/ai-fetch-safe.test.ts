import { describe, it, expect } from "vitest";
import { cleanHtml, __TESTING__ } from "@/lib/ai/fetch-safe";

const { isPrivateIPv4, isPrivateIPv6 } = __TESTING__;

describe("isPrivateIPv4", () => {
  it("blocks RFC 1918 ranges", () => {
    expect(isPrivateIPv4("10.0.0.1")).toBe(true);
    expect(isPrivateIPv4("10.255.255.255")).toBe(true);
    expect(isPrivateIPv4("172.16.0.1")).toBe(true);
    expect(isPrivateIPv4("172.31.255.254")).toBe(true);
    expect(isPrivateIPv4("192.168.1.1")).toBe(true);
  });

  it("blocks loopback and link-local", () => {
    expect(isPrivateIPv4("127.0.0.1")).toBe(true);
    expect(isPrivateIPv4("169.254.169.254")).toBe(true);
    expect(isPrivateIPv4("0.0.0.0")).toBe(true);
  });

  it("blocks CGNAT 100.64.0.0/10", () => {
    expect(isPrivateIPv4("100.64.0.1")).toBe(true);
    expect(isPrivateIPv4("100.127.255.255")).toBe(true);
  });

  it("allows public IPs", () => {
    expect(isPrivateIPv4("8.8.8.8")).toBe(false);
    expect(isPrivateIPv4("1.1.1.1")).toBe(false);
    expect(isPrivateIPv4("142.250.79.142")).toBe(false);
    expect(isPrivateIPv4("172.15.0.1")).toBe(false); // just below private range
    expect(isPrivateIPv4("172.32.0.1")).toBe(false); // just above private range
    expect(isPrivateIPv4("100.63.255.255")).toBe(false); // just below CGNAT
    expect(isPrivateIPv4("100.128.0.1")).toBe(false); // just above CGNAT
  });
});

describe("isPrivateIPv6", () => {
  it("blocks loopback", () => {
    expect(isPrivateIPv6("::1")).toBe(true);
    expect(isPrivateIPv6("::")).toBe(true);
  });

  it("blocks link-local and unique-local", () => {
    expect(isPrivateIPv6("fe80::1")).toBe(true);
    expect(isPrivateIPv6("fc00::1")).toBe(true);
    expect(isPrivateIPv6("fd12:3456:789a::1")).toBe(true);
  });

  it("blocks IPv4-mapped private addresses", () => {
    expect(isPrivateIPv6("::ffff:10.0.0.1")).toBe(true);
    expect(isPrivateIPv6("::ffff:127.0.0.1")).toBe(true);
  });

  it("allows public IPv6", () => {
    expect(isPrivateIPv6("2001:4860:4860::8888")).toBe(false);
    expect(isPrivateIPv6("2606:4700:4700::1111")).toBe(false);
  });
});

describe("cleanHtml", () => {
  it("strips script tags and their content", () => {
    const html = "<body><h1>Corrida</h1><script>alert(1)</script></body>";
    expect(cleanHtml(html)).not.toContain("alert");
    expect(cleanHtml(html)).toContain("Corrida");
  });

  it("strips style tags", () => {
    const html = "<body><style>h1{color:red}</style><h1>Title</h1></body>";
    expect(cleanHtml(html)).not.toContain("color:red");
  });

  it("strips HTML comments", () => {
    const html = "<body><!-- secret --><p>Visible</p></body>";
    expect(cleanHtml(html)).not.toContain("secret");
    expect(cleanHtml(html)).toContain("Visible");
  });

  it("strips noscript and svg blocks", () => {
    const html = "<body><noscript>nope</noscript><svg><path/></svg><p>ok</p></body>";
    const cleaned = cleanHtml(html);
    expect(cleaned).not.toContain("nope");
    expect(cleaned).not.toContain("<svg");
    expect(cleaned).toContain("ok");
  });

  it("truncates to maxChars", () => {
    const long = "a".repeat(50_000);
    expect(cleanHtml(long, 1000).length).toBeLessThanOrEqual(1000);
  });
});
