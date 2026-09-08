import { describe, it, expect } from "vitest";
import {
  renderOrderConfirmedEmail,
  renderOrderStatusUpdatedEmail,
} from "./email-templates.js";

describe("Email templates", () => {
  it("renders order confirmed email with recipient name and tracking link", () => {
    const rendered = renderOrderConfirmedEmail({
      customerName: "Babatunde",
      customerEmail: "babatunde@example.com",
      orderNumber: "HL-2026-0001",
      productName: "Rolex Submariner Date",
      totalKobo: 12500000,
      secureStatusToken: "tok_12345",
      webAppUrl: "https://hourlane.ng",
    });

    expect(rendered.subject).toContain("HL-2026-0001");
    expect(rendered.html).toContain("Babatunde");
    expect(rendered.html).toContain("Rolex Submariner Date");
    expect(rendered.html).toContain("https://hourlane.ng/order-status/tok_12345");
    expect(rendered.text).toContain("HL-2026-0001");
  });

  it("renders status update email with appropriate status badge and message", () => {
    const rendered = renderOrderStatusUpdatedEmail({
      customerName: "Babatunde",
      orderNumber: "HL-2026-0001",
      productName: "Rolex Submariner Date",
      status: "out_for_delivery",
      secureStatusToken: "tok_12345",
      webAppUrl: "https://hourlane.ng",
    });

    expect(rendered.subject).toContain("OUT FOR DELIVERY");
    expect(rendered.html).toContain("OUT FOR DELIVERY");
    expect(rendered.html).toContain("Babatunde");
    expect(rendered.text).toContain("https://hourlane.ng/order-status/tok_12345");
  });
});
