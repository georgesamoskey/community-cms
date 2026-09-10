import type { Metadata } from "next";
import { Suspense } from "react";
import RegisterClient from "./register-client";

export const metadata: Metadata = {
  title: "Créer un compte",
  description:
    "Inscription Community avec vérification SMS et accès portail.",
};

export default function RegisterPage() {
  return (
    <Suspense fallback={<p className="p-8 text-center text-sm">Chargement…</p>}>
      <RegisterClient />
    </Suspense>
  );
}
