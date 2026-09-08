import { describe, it, expect } from "vitest";
import { AdminService } from "./admin.service.js";

describe("AdminService address validation rules", () => {
  it("rejects address modification if order is already out for delivery", async () => {
    const mockDb = {
      select: () => ({
        from: () => ({
          where: () => ({
            limit: () =>
              Promise.resolve([
                {
                  id: "order-123",
                  status: "out_for_delivery",
                  streetAddress: "Old Address",
                  areaLocality: "Ikeja",
                },
              ]),
          }),
        }),
      }),
    };

    const service = new AdminService(mockDb as any);

    await expect(
      service.updateOrderAddress(
        "order-123",
        { streetAddress: "New Address", areaLocality: "Victoria Island" },
        "Customer moved",
        "admin-1"
      )
    ).rejects.toThrow("Delivery address cannot be modified once order status is 'out_for_delivery'");
  });

  it("rejects address modification if order is delivered", async () => {
    const mockDb = {
      select: () => ({
        from: () => ({
          where: () => ({
            limit: () =>
              Promise.resolve([
                {
                  id: "order-123",
                  status: "delivered",
                  streetAddress: "Old Address",
                  areaLocality: "Ikeja",
                },
              ]),
          }),
        }),
      }),
    };

    const service = new AdminService(mockDb as any);

    await expect(
      service.updateOrderAddress(
        "order-123",
        { streetAddress: "New Address", areaLocality: "Victoria Island" },
        "Customer moved",
        "admin-1"
      )
    ).rejects.toThrow("Delivery address cannot be modified once order status is 'delivered'");
  });
});
