"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { portalUrl } from "@/lib/site";
import { useI18n } from "@/lib/i18n/context";
import { AuthLocaleSwitcher } from "@/components/auth-locale-switcher";
import { type CountryCode } from "@/lib/i18n/config";

const COUNTRIES: Array<{
  code: string;
  label: string;
  dial: string;
  hint: string;
}> = [
  { code: "BI", label: "Burundi", dial: "+257", hint: "79 12 34 56" },
  { code: "CD", label: "RDC", dial: "+243", hint: "81 234 5678" },
  { code: "RW", label: "Rwanda", dial: "+250", hint: "78 123 4567" },
  { code: "TZ", label: "Tanzanie", dial: "+255", hint: "71 234 5678" },
  { code: "KE", label: "Kenya", dial: "+254", hint: "712 345678" },
  { code: "UG", label: "Ouganda", dial: "+256", hint: "70 123 4567" },
];

const inputClass =
  "mt-1.5 w-full rounded-xl border border-ink-200 bg-white px-3.5 py-2.5 text-sm text-ink-900 outline-none transition focus:border-lagoon-500 focus:ring-2 focus:ring-lagoon-500/20";

type Step = "form" | "otp" | "done";

export default function RegisterClient() {
  const search = useSearchParams();
  const invite = search.get("invite");
  const ref = (search.get("ref") || search.get("referral") || "").toUpperCase();
  const { t, locale, country: i18nCountry, setCountry: setI18nCountry } = useI18n();

  // Funnel viralité (dev) : compte chaque ouverture /register?ref=
  useEffect(() => {
    if (!ref) return;
    const key = `ref_hit_${ref}`;
    try {
      if (sessionStorage.getItem(key)) return;
      sessionStorage.setItem(key, "1");
    } catch {
      /* ignore */
    }
    void fetch(`/api/public/referral/${encodeURIComponent(ref)}/hit`, {
      method: "POST",
    }).catch(() => undefined);
  }, [ref]);

  const [platformClosed, setPlatformClosed] = useState<string | null>(null);
  useEffect(() => {
    void fetch("/api/public/platform-status")
      .then((r) => r.json())
      .then((d: { registrationOpen?: boolean; message?: string | null }) => {
        if (d.registrationOpen === false) {
          setPlatformClosed(
            d.message ||
              "Les inscriptions sont temporairement fermées.",
          );
        }
      })
      .catch(() => undefined);
  }, []);

  const [step, setStep] = useState<Step>("form");
  const [country, setCountryState] = useState(i18nCountry);
  const setCountry = (c: string) => {
    setCountryState(c as CountryCode);
    setI18nCountry(c as CountryCode);
  };

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phoneLocal, setPhoneLocal] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [password2, setPassword2] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [otpRequestId, setOtpRequestId] = useState("");
  const [devCode, setDevCode] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<{
    loginUrl: string;
    phone: string;
    autoLogin: boolean;
  } | null>(null);

  const meta = useMemo(
    () => COUNTRIES.find((c) => c.code === country) ?? COUNTRIES[0],
    [country],
  );

  const fullPhone = () => {
    const digits = phoneLocal.replace(/\s+/g, "");
    return digits.startsWith("+")
      ? digits
      : `${meta.dial}${digits.replace(/^0+/, "")}`;
  };

  const sendOtp = async () => {
    setError(null);
    if (password !== password2) {
      setError("Les mots de passe ne correspondent pas");
      return;
    }
    setBusy(true);
    try {
      const phone = fullPhone();
      const res = await fetch("/api/public/otp/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, country }),
      });
      const data = (await res.json()) as {
        error?: string;
        requestId?: string;
        devCode?: string;
      };
      if (!res.ok) throw new Error(data.error || `Erreur ${res.status}`);
      setOtpRequestId(data.requestId ?? "");
      setDevCode(data.devCode ?? null);
      setStep("otp");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Envoi OTP impossible");
    } finally {
      setBusy(false);
    }
  };

  const completeRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      const phone = fullPhone();
      const res = await fetch("/api/public/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          phone,
          email: email.trim() || undefined,
          password,
          country,
          otpRequestId,
          otpCode: otpCode.trim(),
          preferredLanguage: locale,
          referralCode: ref || undefined,
          inviteToken: invite || undefined,
        }),
      });
      const data = (await res.json()) as {
        error?: string;
        loginUrl?: string;
        phone?: string;
        autoLogin?: boolean;
      };
      if (!res.ok) throw new Error(data.error || `Erreur ${res.status}`);
      const loginUrl =
        data.loginUrl || `${portalUrl()}/login?registered=1`;
      setDone({
        loginUrl,
        phone: data.phone || phone,
        autoLogin: !!data.autoLogin,
      });
      setStep("done");
      if (data.autoLogin && data.loginUrl) {
        window.location.href = data.loginUrl;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Inscription impossible");
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="relative overflow-hidden bg-[var(--background)]">
      <div
        aria-hidden
        className="pointer-events-none absolute -left-24 top-0 h-72 w-72 rounded-full bg-lagoon-500/15 blur-3xl"
      />
      <div className="relative mx-auto grid max-w-6xl gap-10 px-4 py-14 sm:px-6 lg:grid-cols-[1.05fr_0.95fr] lg:py-20">
        <section className="cms-rise flex flex-col justify-center">
          <p className="text-sm font-semibold uppercase tracking-wider text-lagoon-700">
            Compte membre
          </p>
          <div className="mb-4">
            <AuthLocaleSwitcher />
          </div>
          <h1 className="mt-3 font-display text-4xl font-semibold tracking-tight text-ink-900 sm:text-5xl">
            {t("register.title")}
          </h1>
          <p className="mt-4 max-w-lg text-base leading-relaxed text-ink-700/80">
            {t("register.subtitle")}
          </p>
          {invite || ref ? (
            <p className="mt-4 rounded-xl border border-lagoon-200 bg-lagoon-50 px-3 py-2 text-sm text-lagoon-900">
              {ref
                ? `Code ${ref} — bonus bienvenue à l’inscription + challenge 1ère cotisation.`
                : "Vous avez une invitation — créez votre compte pour l’accepter."}
            </p>
          ) : null}
          {platformClosed ? (
            <p className="mt-4 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-900">
              {platformClosed}
            </p>
          ) : null}
        </section>

        <section className="cms-rise-delay rounded-3xl border border-ink-100 bg-white/95 p-6 shadow-lg shadow-ink-900/5 sm:p-8">
          {platformClosed ? (
            <p className="text-center text-sm text-ink-700">
              Revenez plus tard ou contactez le support.
            </p>
          ) : step === "done" && done ? (
            <div className="space-y-4 text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-lagoon-100 text-2xl text-lagoon-800">
                ✓
              </div>
              <h2 className="font-display text-2xl font-semibold text-ink-900">
                {t("register.accountCreated")}
              </h2>
              <p className="text-sm text-ink-700/80">
                {done.autoLogin
                  ? "Connexion au portail en cours…"
                  : `Connectez-vous avec ${done.phone}`}
              </p>
              <a
                href={
                  invite
                    ? `${done.loginUrl}${done.loginUrl.includes("?") ? "&" : "?"}invite=${encodeURIComponent(invite)}`
                    : done.loginUrl
                }
                className="inline-flex w-full items-center justify-center rounded-full bg-lagoon-600 px-5 py-3 text-sm font-semibold text-white"
              >
                {t("register.openPortal")}
              </a>
            </div>
          ) : step === "otp" ? (
            <form onSubmit={(e) => void completeRegister(e)} className="space-y-4">
              <h2 className="font-display text-2xl font-semibold text-ink-900">
                {t("register.verifyPhone")}
              </h2>
              <p className="text-sm text-ink-700/70">
                Code envoyé au <strong>{fullPhone()}</strong>
              </p>
              {devCode ? (
                <p className="rounded-xl bg-amber-50 px-3 py-2 text-sm text-amber-950">
                  Mode dev — code : <strong>{devCode}</strong>
                </p>
              ) : null}
              {error ? (
                <p className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-950">
                  {error}
                </p>
              ) : null}
              <label className="block text-sm font-medium text-ink-800">
                {t("register.otpCode")}
                <input
                  className={inputClass}
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  required
                  minLength={6}
                  maxLength={6}
                />
              </label>
              <button
                type="submit"
                disabled={busy || otpCode.length !== 6}
                className="w-full rounded-full bg-lagoon-600 px-5 py-3 text-sm font-semibold text-white disabled:opacity-60"
              >
                {busy ? t("common.loading") : t("register.create")}
              </button>
              <button
                type="button"
                className="w-full text-sm font-medium text-lagoon-700"
                disabled={busy}
                onClick={() => void sendOtp()}
              >
                Renvoyer le code
              </button>
              <button
                type="button"
                className="w-full text-sm text-ink-500"
                onClick={() => setStep("form")}
              >
                ← Modifier les infos
              </button>
            </form>
          ) : (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                void sendOtp();
              }}
              className="space-y-4"
            >
              <div>
                <h2 className="font-display text-2xl font-semibold text-ink-900">
                  Inscription
                </h2>
                <p className="mt-1 text-sm text-ink-700/70">
                  Déjà membre ?{" "}
                  <a
                    href={`${portalUrl()}/login`}
                    className="font-semibold text-lagoon-700 hover:underline"
                  >
                    {t("auth.signIn")}
                  </a>
                  {" · "}
                  <Link href="/forgot-password" className="font-semibold text-lagoon-700 hover:underline">
                    {t("auth.forgotPassword")}
                  </Link>
                </p>
              </div>
              {error ? (
                <p className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-950">
                  {error}
                </p>
              ) : null}
              <label className="block text-sm font-medium text-ink-800">
                {t("common.country")}
                <select
                  className={inputClass}
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                  required
                >
                  {COUNTRIES.map((c) => (
                    <option key={c.code} value={c.code}>
                      {c.label} ({c.dial})
                    </option>
                  ))}
                </select>
              </label>
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block text-sm font-medium text-ink-800">
                  {t("register.firstName")}
                  <input
                    className={inputClass}
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    required
                  />
                </label>
                <label className="block text-sm font-medium text-ink-800">
                  {t("register.lastName")}
                  <input
                    className={inputClass}
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    required
                  />
                </label>
              </div>
              <label className="block text-sm font-medium text-ink-800">
                {t("auth.phone")}
                <div className="mt-1.5 flex gap-2">
                  <span className="inline-flex items-center rounded-xl border border-ink-200 bg-ink-50 px-3 text-sm font-semibold">
                    {meta.dial}
                  </span>
                  <input
                    className="w-full rounded-xl border border-ink-200 px-3.5 py-2.5 text-sm outline-none focus:border-lagoon-500 focus:ring-2 focus:ring-lagoon-500/20"
                    value={phoneLocal}
                    onChange={(e) => setPhoneLocal(e.target.value)}
                    placeholder={meta.hint}
                    required
                  />
                </div>
              </label>
              <label className="block text-sm font-medium text-ink-800">
                {t("register.emailOptional")}
                <input
                  className={inputClass}
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </label>
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block text-sm font-medium text-ink-800">
                  {t("auth.password")}
                  <input
                    className={inputClass}
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    minLength={6}
                    required
                  />
                </label>
                <label className="block text-sm font-medium text-ink-800">
                  {t("register.confirmPassword")}
                  <input
                    className={inputClass}
                    type="password"
                    value={password2}
                    onChange={(e) => setPassword2(e.target.value)}
                    minLength={6}
                    required
                  />
                </label>
              </div>
              <button
                type="submit"
                disabled={busy}
                className="w-full rounded-full bg-lagoon-600 px-5 py-3 text-sm font-semibold text-white disabled:opacity-60"
              >
                {busy ? t("common.loading") : t("register.sendOtp")}
              </button>
            </form>
          )}
        </section>
      </div>
    </main>
  );
}
