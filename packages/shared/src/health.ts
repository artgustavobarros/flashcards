import { z } from "zod";

export const healthSchema = z.object({
  db: z.enum(["up", "down"]),
  status: z.literal("ok"),
});

export type Health = z.infer<typeof healthSchema>;
