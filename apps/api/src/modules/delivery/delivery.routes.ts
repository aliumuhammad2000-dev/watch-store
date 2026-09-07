import { FastifyPluginAsync } from "fastify";
import { ZodTypeProvider } from "fastify-type-provider-zod";
import { z } from "zod";
import { DeliveryService } from "./delivery.service.js";

const DeliveryZoneResponseSchema = z.object({
  id: z.string().uuid(),
  cityName: z.string(),
  cityCode: z.string(),
  feeKobo: z.number().int().nonnegative(),
  isActive: z.boolean(),
});

export const deliveryRoutes: FastifyPluginAsync = async (fastify) => {
  const deliveryService = new DeliveryService(fastify.db);
  const typedFastify = fastify.withTypeProvider<ZodTypeProvider>();

  typedFastify.get(
    "/api/v1/delivery-zones",
    {
      schema: {
        summary: "List active delivery zones",
        description:
          "Returns available delivery zones and fixed delivery fees in NGN kobo for checkout.",
        tags: ["Delivery"],
        response: {
          200: z.object({
            zones: z.array(DeliveryZoneResponseSchema),
          }),
        },
      },
    },
    async () => {
      const zones = await deliveryService.getActiveZones();
      return { zones };
    }
  );
};
