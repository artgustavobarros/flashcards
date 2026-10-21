import { healthSchema } from "@daruma/shared";

export async function getHealth() {
  const res = await fetch("/api/health");
  if (!res.ok) {
    throw new Error(`GET /api/health failed: ${res.status}`);
  }
  return healthSchema.parse(await res.json());
}
