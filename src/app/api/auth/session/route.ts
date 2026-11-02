import { cookies } from "next/headers";
import { currentActor, SESSION_COOKIE } from "@/lib/auth/session";
import { can } from "@/lib/auth/permissions";
export async function GET() {
  try {
    const actor = await currentActor((await cookies()).get(SESSION_COOKIE)?.value);
    if (!can(actor, "session:read")) return Response.json({ error: "Unauthorized" }, { status: 401, headers: { "Cache-Control": "no-store" } });
    return Response.json({ user: { email: actor!.email, role: actor!.role } }, { headers: { "Cache-Control": "no-store" } });
  } catch { return Response.json({ error: "Service unavailable" }, { status: 503, headers: { "Cache-Control": "no-store" } }); }
}
