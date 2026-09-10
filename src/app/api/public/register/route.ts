import { NextRequest, NextResponse } from "next/server";

const COUNTRIES = new Set(["BI", "CD", "TZ", "RW", "UG", "KE"]);

function apiOrigin(): string {
  const o =
    process.env.EAGASEKE_API_ORIGIN ?? process.env.NEXT_PUBLIC_EAGASEKE_ORIGIN;
  if (!o) throw new Error("NEXT_PUBLIC_EAGASEKE_ORIGIN requis");
  return o.replace(/\/$/, "");
}

function portalBridgeUrl(ticket: string): string {
  const base =
    process.env.NEXT_PUBLIC_PORTAL_URL?.replace(/\/$/, "") ||
    "http://localhost:3003";
  const u = new URL(`${base}/auth/bridge`);
  u.searchParams.set("ticket", ticket);
  u.searchParams.set("callbackUrl", "/app/chat");
  return u.toString();
}

function portalLoginUrl(phone?: string): string {
  const base =
    process.env.NEXT_PUBLIC_PORTAL_URL?.replace(/\/$/, "") ||
    "http://localhost:3003";
  const u = new URL(`${base}/login`);
  u.searchParams.set("registered", "1");
  if (phone) u.searchParams.set("phone", phone);
  return u.toString();
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as Record<string, unknown>;
    const firstName = String(body.firstName ?? "").trim();
    const lastName = String(body.lastName ?? "").trim();
    const phone = String(body.phone ?? "").trim();
    const password = String(body.password ?? "");
    const email = String(body.email ?? "").trim();
    const country = String(body.country ?? "BI").toUpperCase();
    const otpRequestId = String(body.otpRequestId ?? "").trim();
    const otpCode = String(body.otpCode ?? "").trim();
    const preferredLanguage = String(body.preferredLanguage ?? "")
      .trim()
      .toLowerCase();
    const referralCode = String(body.referralCode ?? body.ref ?? "")
      .trim()
      .toUpperCase();
    const inviteToken = String(body.inviteToken ?? body.invite ?? "").trim();
    const LANGS = new Set(["fr", "en", "rn", "sw"]);

    if (!firstName || !lastName) {
      return NextResponse.json(
        { error: "Prénom et nom requis" },
        { status: 400 },
      );
    }
    if (!phone) {
      return NextResponse.json({ error: "Téléphone requis" }, { status: 400 });
    }
    if (password.length < 6) {
      return NextResponse.json(
        { error: "Mot de passe : 6 caractères minimum" },
        { status: 400 },
      );
    }
    if (!COUNTRIES.has(country)) {
      return NextResponse.json({ error: "Pays non supporté" }, { status: 400 });
    }
    if (!otpRequestId || otpCode.length !== 6) {
      return NextResponse.json(
        { error: "Code OTP requis (6 chiffres)" },
        { status: 400 },
      );
    }

    const payload: Record<string, string> = {
      firstName,
      lastName,
      phone,
      password,
      country,
      otpRequestId,
      otpCode,
    };
    if (email) payload.email = email;
    if (LANGS.has(preferredLanguage)) {
      payload.preferredLanguage = preferredLanguage;
    }
    if (referralCode) payload.referralCode = referralCode;
    if (inviteToken) payload.inviteToken = inviteToken;

    const res = await fetch(`${apiOrigin()}/api/auth/register`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(payload),
    });

    const data = (await res.json().catch(() => ({}))) as Record<
      string,
      unknown
    >;

    if (!res.ok) {
      const msg =
        (typeof data.message === "string" && data.message) ||
        (Array.isArray(data.message) && data.message.join(", ")) ||
        (typeof data.error === "string" && data.error) ||
        `Inscription refusée (${res.status})`;
      return NextResponse.json({ error: msg }, { status: res.status });
    }

    const userPhone =
      typeof (data.user as { phone?: string } | undefined)?.phone === "string"
        ? (data.user as { phone: string }).phone
        : phone;

    const loginTicket =
      typeof data.loginTicket === "string" ? data.loginTicket : null;

    return NextResponse.json({
      ok: true,
      message: loginTicket
        ? "Compte créé — connexion automatique…"
        : "Compte créé. Connectez-vous au portail.",
      phone: userPhone,
      loginUrl: loginTicket
        ? portalBridgeUrl(loginTicket)
        : portalLoginUrl(userPhone),
      autoLogin: Boolean(loginTicket),
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Erreur serveur";
    return NextResponse.json({ error: msg }, { status: 502 });
  }
}
