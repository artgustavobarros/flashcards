import { healthSchema } from "@daruma/shared";
import type { z } from "zod";

// A non-2xx answer from Nest. The QueryClient sends a 401 back to the login page.
export class ApiError extends Error {
  readonly status: number;

  constructor(path: string, status: number) {
    super(`${path} answered ${status}`);
    this.name = "ApiError";
    this.status = status;
  }
}

async function getJson<T>(path: string, schema: z.ZodType<T>) {
  const res = await fetch(path);
  if (!res.ok) {
    throw new ApiError(path, res.status);
  }
  return schema.parse(await res.json());
}

export function getHealth() {
  return getJson("/api/health", healthSchema);
}
