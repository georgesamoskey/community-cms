"use client";

import Link from "next/link";
import { useState } from "react";
import { portalUrl } from "@/lib/site";
import { useI18n } from "@/lib/i18n/context";
import { AuthLocaleSwitcher } from "@/components/auth-locale-switcher";
import { type CountryCode } from "@/lib/i18n/config";

const COUNTRIES = [
  { code: "BI", label: "Burundi" },
  { code: "CD", label: "RDC" },
  { code: "RW", label: "Rwanda" },
  { code: "TZ", label: "Tanzanie" },
  { code: "KE", label: "Kenya" },
  { code: "UG", label: "Ouganda" },
];

const inputClass =
  "mt-1.5 w-full rounded-xl border border-ink-200 bg-white px-3.5 py-2.5 text-sm outline-none focus:border-lagoon-500 focus:ring-2 focus:ring-lagoon-500/20";

export default function ForgotPasswordPage() {
  const { t, country: i18nCountry, setCountry: setI18nCountry } = useI18n();
  const [step, setStep] = useState<"phone" | "reset" | "done">("phone");
  const [country, setCountryState] = useState(i18nCountry);
  const [phone, setPhone] = useState("");
  const [otpRequestId, setOtpRequestId] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [devCode, setDevCode] = useState<string | null>(null);
  const [newPassword, setNewPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const setCountry = (c: string) => {
    setCountryState(c as CountryCode);
    setI18nCountry(c as CountryCode);
  };

  const requestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/public/password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, country }),
      });
      const data = (await res.json()) as {
        error?: string;
        requestId?: string;
        devCode?: string;
      };
      if (!res.ok) throw new Error(data.error || t("common.error"));
      setOtpRequestId(data.requestId ?? "");
      setDevCode(data.devCode ?? null);
      setStep("reset");
    } catch (err) {
      setError(err instanceof Error ? err.message : t("common.error"));
    } finally {
      setBusy(false);
    }
  };

  const reset = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/public/password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "reset",
          phone,
          country,
          otpRequestId,
          otpCode,
          newPassword,
        }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(data.error || t("common.error"));
      setStep("done");
    } catch (err) {
      setError(err instanceof Error ? err.message : t("common.error"));
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="mx-auto max-w-md px-4 py-16 sm:px-6">
      <div className="mb-6 flex justify-end">
        <AuthLocaleSwitcher />
      </div>
      <h1 className="font-display text-3xl font-semibold text-ink-900">
        {t("forgot.title")}
      </h1>
      <p className="mt-2 text-sm text-ink-700/80">{t("forgot.subtitle")}</p>

      {step === "done" ? (
        <div className="mt-8 space-y-4 rounded-3xl border border-ink-100 bg-white p-6 text-center shadow-sm">
          <p className="font-display text-xl font-semibold text-ink-900">
            {t("forgot.done")}
          </p>
          <a
            href={`${portalUrl()}/login`}
            className="inline-flex w-full items-center justify-center rounded-full bg-lagoon-600 px-5 py-3 text-sm font-semibold text-white"
          >
            {t("forgot.backToLogin")}
          </a>
        </div>
      ) : step === "reset" ? (
        <form onSubmit={(e) => void reset(e)} className="mt-8 space-y-4 rounded-3xl border border-ink-100 bg-white p-6 shadow-sm">
          {devCode ? (
            <p className="rounded-xl bg-amber-50 px-3 py-2 text-sm text-amber-950">
              Mode dev — code : <strong>{devCode}</strong>
            </p>
          ) : null}
          {error ? (
            <p className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm">
              {error}
            </p>
          ) : null}
          <label className="block text-sm font-medium">
            {t("register.otpCode")}
            <input
              className={inputClass}
              value={otpCode}
              onChange={(e) =>
                setOtpCode(e.target.value.replace(/\D/g, "").slice(0, 6))
              }
              required
              minLength={6}
              maxLength={6}
            />
          </label>
          <label className="block text-sm font-medium">
            {t("forgot.newPassword")}
            <input
              className={inputClass}
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              minLength={6}
              required
            />
          </label>
          <button
            type="submit"
            disabled={busy}
            className="w-full rounded-full bg-lagoon-600 px-5 py-3 text-sm font-semibold text-white disabled:opacity-60"
          >
            {busy ? t("common.loading") : t("forgot.reset")}
          </button>
        </form>
      ) : (
        <form
          onSubmit={(e) => void requestOtp(e)}
          className="mt-8 space-y-4 rounded-3xl border border-ink-100 bg-white p-6 shadow-sm"
        >
          {error ? (
            <p className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm">
              {error}
            </p>
          ) : null}
          <label className="block text-sm font-medium">
            {t("common.country")}
            <select
              className={inputClass}
              value={country}
              onChange={(e) => setCountry(e.target.value)}
            >
              {COUNTRIES.map((c) => (
                <option key={c.code} value={c.code}>
                  {c.label}
                </option>
              ))}
            </select>
          </label>
          <label className="block text-sm font-medium">
            {t("auth.phone")}
            <input
              className={inputClass}
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+257…"
              required
            />
          </label>
          <button
            type="submit"
            disabled={busy}
            className="w-full rounded-full bg-lagoon-600 px-5 py-3 text-sm font-semibold text-white disabled:opacity-60"
          >
            {busy ? t("common.loading") : t("forgot.sendCode")}
          </button>
          <Link
            href="/register"
            className="block text-center text-sm font-medium text-lagoon-700"
          >
            {t("auth.createAccount")}
          </Link>
        </form>
      )}
    </main>
  );
}
