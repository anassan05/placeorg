import { authConfig } from "@/lib/auth/config";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { revokeSession, sameOrigin, SESSION_COOKIE } from "@/lib/auth/session";
export async function POST(request: Request) {
  try {
    if (!sameOrigin(request.headers.get("origin"))) return new Response("Forbidden", { status: 403 });
    await revokeSession((await cookies()).get(SESSION_COOKIE)?.value);
    const response = NextResponse.redirect(new URL("/login", authConfig().origin), 303);
    response.headers.set("Cache-Control", "no-store");
    response.cookies.set(SESSION_COOKIE, "", { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "strict", path: "/", maxAge: 0 });
    return response;
  } catch { return new Response("Logout is temporarily unavailable.", { status: 503, headers: { "Cache-Control": "no-store" } }); }
}
