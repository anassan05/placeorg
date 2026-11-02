import { authConfig } from "@/lib/auth/config";
import { NextResponse } from "next/server";
import { authenticate, sameOrigin, SESSION_COOKIE, SESSION_SECONDS } from "@/lib/auth/session";
import { readLoginBody } from "@/lib/auth/request";

export async function POST(request: Request) {
  try {
    if (!sameOrigin(request.headers.get("origin"))) return new Response("Forbidden", { status: 403 });
    const form = await readLoginBody(request);
    if (!form || form.getAll("email").length !== 1 || form.getAll("password").length !== 1) return new Response("Bad request", { status: 400 });
    const token = await authenticate(form.get("email") ?? "", form.get("password") ?? "");
    const destination = new URL(token ? "/workspace" : "/login?error=credentials", authConfig().origin);
    const response = NextResponse.redirect(destination, 303);
    response.headers.set("Cache-Control", "no-store");
    if (token) response.cookies.set(SESSION_COOKIE, token, { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "strict", path: "/", maxAge: SESSION_SECONDS });
    return response;
  } catch {
    return new Response("Authentication is temporarily unavailable.", { status: 503, headers: { "Cache-Control": "no-store" } });
  }
}
