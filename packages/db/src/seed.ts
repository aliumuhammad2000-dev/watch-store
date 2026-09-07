import "dotenv/config";
import { createDb } from "./index.js";
import { deliveryZones } from "./schema/index.js";

async function seed() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error("DATABASE_URL is not defined in environment");
  }

  const db = createDb(databaseUrl);

  console.log("Seeding initial delivery zones for Version 1...");

  // Insert Lagos & Abuja default zones (fees stored in integer kobo: ₦1 = 100 kobo)
  const initialZones = [
    {
      cityName: "Lagos",
      cityCode: "LOS",
      feeKobo: 350000, // ₦3,500
      isActive: true,
    },
    {
      cityName: "Abuja",
      cityCode: "ABV",
      feeKobo: 600000, // ₦6,000
      isActive: true,
    },
  ];

  for (const zone of initialZones) {
    await db
      .insert(deliveryZones)
      .values(zone)
      .onConflictDoUpdate({
        target: deliveryZones.cityCode,
        set: {
          feeKobo: zone.feeKobo,
          cityName: zone.cityName,
          isActive: zone.isActive,
          updatedAt: new Date(),
        },
      });
  }

  const zones = await db.select().from(deliveryZones);
  console.log("Current active delivery zones in Neon database:", zones);
}

async function main() {
  try {
    await seed();
    console.log("Database seeded successfully!");
  } catch (err) {
    console.error("Seeding failed:", err);
    process.exit(1);
  }
}

main();

