// True when Postgres refused a row for a unique index. Drizzle wraps the driver's error in `cause`.
export function isUniqueViolation(error: unknown) {
  for (let current = error; current instanceof Error; current = current.cause) {
    if ((current as { code?: string }).code === "23505") {
      return true;
    }
  }
  return false;
}
