/** Liveness only: a successful response does not attest to database readiness. */
export function GET() {
  return Response.json({ status: "ok" }, { headers: { "Cache-Control": "no-store" } });
}
