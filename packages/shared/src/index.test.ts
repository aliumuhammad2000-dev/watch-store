import { describe, it, expect } from "vitest";
import {
  koboToNgn,
  ngnToKobo,
  formatKoboToNgn,
  NIGERIAN_PHONE_REGEX,
  CheckoutSchema,
} from "./index.js";

describe("Monetary helpers", () => {
  it("converts kobo to NGN correctly", () => {
    expect(koboToNgn(350000)).toBe(3500);
    expect(koboToNgn(12500000)).toBe(125000);
    expect(koboToNgn(50)).toBe(0.5);
  });

  it("converts NGN to kobo correctly", () => {
    expect(ngnToKobo(3500)).toBe(350000);
    expect(ngnToKobo(125000)).toBe(12500000);
  });

  it("formats kobo into Nigerian Naira currency string", () => {
    const formatted = formatKoboToNgn(350000);
    expect(formatted).toContain("3,500");
  });
});

describe("Nigerian phone number regex", () => {
  it("validates valid Nigerian numbers", () => {
    expect(NIGERIAN_PHONE_REGEX.test("+2348012345678")).toBe(true);
    expect(NIGERIAN_PHONE_REGEX.test("08012345678")).toBe(true);
    expect(NIGERIAN_PHONE_REGEX.test("09087654321")).toBe(true);
    expect(NIGERIAN_PHONE_REGEX.test("07011223344")).toBe(true);
  });

  it("rejects invalid numbers", () => {
    expect(NIGERIAN_PHONE_REGEX.test("123456")).toBe(false);
    expect(NIGERIAN_PHONE_REGEX.test("+12025550123")).toBe(false);
    expect(NIGERIAN_PHONE_REGEX.test("06012345678")).toBe(false);
  });
});

describe("CheckoutSchema", () => {
  it("validates guest checkout input accurately", () => {
    const valid = CheckoutSchema.safeParse({
      productId: "11111111-1111-1111-1111-111111111111",
      deliveryZoneId: "22222222-2222-2222-2222-222222222222",
      customerName: "Adeyemi John",
      customerEmail: "adeyemi@example.com",
      customerPhone: "08012345678",
      streetAddress: "15 Marina Street",
      areaLocality: "Lagos Island",
      termsAccepted: true,
    });
    expect(valid.success).toBe(true);
  });

  it("fails if terms are not accepted", () => {
    const invalid = CheckoutSchema.safeParse({
      productId: "11111111-1111-1111-1111-111111111111",
      deliveryZoneId: "22222222-2222-2222-2222-222222222222",
      customerName: "Adeyemi John",
      customerEmail: "adeyemi@example.com",
      customerPhone: "08012345678",
      streetAddress: "15 Marina Street",
      areaLocality: "Lagos Island",
      termsAccepted: false,
    });
    expect(invalid.success).toBe(false);
  });
});
