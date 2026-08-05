import { z } from "zod";

export const HealthResponseSchema = z.object({
  service: z.string().min(1),
  status: z.literal("ok"),
  timestamp: z.iso.datetime(),
  version: z.string().min(1).optional(),
});

export type HealthResponse = z.infer<typeof HealthResponseSchema>;
