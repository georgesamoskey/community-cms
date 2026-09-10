import { NextRequest, NextResponse } from "next/server";

function apiOrigin(): string {
  const o =
    process.env.EAGASEKE_API_ORIGIN ?? process.env.NEXT_PUBLIC_EAGASEKE_ORIGIN;
  if (!o) throw new Error("NEXT_PUBLIC_EAGASEKE_ORIGIN requis");
  return o.replace(/\/$/, "");
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const path =
      typeof body?.action === "string" && body.action === "reset"
        ? "password/reset"
        : "password/forgot";
    const { action: _a, ...payload } = body as Record<string, unknown>;
    const res = await fetch(`${apiOrigin()}/api/auth/${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify(payload),
    });
    const data = (await res.json().catch(() => ({}))) as Record<string, unknown>;
    if (!res.ok) {
      const msg =
        (typeof data.message === "string" && data.message) ||
        (typeof data.error === "string" && data.error) ||
        `Erreur ${res.status}`;
      return NextResponse.json({ error: msg }, { status: res.status });
    }
    return NextResponse.json(data);
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Erreur" },
      { status: 502 },
    );
  }
}
