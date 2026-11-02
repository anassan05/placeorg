/** Fail closed when required security configuration is absent or unsafe. */
export function authConfig() {
  const databaseUrl = process.env.AUTH_DATABASE_URL;
  const rateLimitSecret = process.env.AUTH_RATE_LIMIT_SECRET;
  const originText = process.env.APP_ORIGIN;
  if (!databaseUrl || !rateLimitSecret || !/^[a-fA-F0-9]{64}$/.test(rateLimitSecret) || !originText) throw new Error("Authentication is not configured");
  const origin = new URL(originText);
  if (origin.origin !== originText || !["http:", "https:"].includes(origin.protocol)) throw new Error("APP_ORIGIN must be an exact origin");
  if (process.env.NODE_ENV === "production" && origin.protocol !== "https:") throw new Error("Production APP_ORIGIN must use HTTPS");
  return { databaseUrl, rateLimitSecret, origin: origin.origin };
}
