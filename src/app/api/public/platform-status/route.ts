import { NextResponse } from "next/server";

function apiOrigin(): string {
  const o =
    process.env.EAGASEKE_API_ORIGIN ?? process.env.NEXT_PUBLIC_EAGASEKE_ORIGIN;
  if (!o) throw new Error("NEXT_PUBLIC_EAGASEKE_ORIGIN requis");
  return o.replace(/\/$/, "");
}

export async function GET() {
  try {
    const res = await fetch(`${apiOrigin()}/api/platform/status`, {
      cache: "no-store",
    });
    const data = await res.json().catch(() => ({}));
    return NextResponse.json(data, { status: res.status });
  } catch (e) {
    return NextResponse.json(
      {
        registrationOpen: true,
        error: e instanceof Error ? e.message : "Erreur",
      },
      { status: 200 },
    );
  }
}
