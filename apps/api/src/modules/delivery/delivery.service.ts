import { eq, type Database, deliveryZones } from "@hourlane/db";

export class DeliveryService {
  constructor(private db: Database) {}

  async getActiveZones() {
    return this.db
      .select({
        id: deliveryZones.id,
        cityName: deliveryZones.cityName,
        cityCode: deliveryZones.cityCode,
        feeKobo: deliveryZones.feeKobo,
        isActive: deliveryZones.isActive,
      })
      .from(deliveryZones)
      .where(eq(deliveryZones.isActive, true));
  }

  async getZoneById(id: string) {
    const results = await this.db
      .select()
      .from(deliveryZones)
      .where(eq(deliveryZones.id, id))
      .limit(1);

    return results[0] ?? null;
  }
}
