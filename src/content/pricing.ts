export type Plan = {
  id: string;
  name: string;
  price: string;
  period: string;
  description: string;
  highlights: string[];
  highlighted?: boolean;
};

export const pricingContent = {
  title: "Tarifs",
  intro:
    "Des offres simples pour démarrer une tontine ou structurer une communauté entière.",
  plans: [
    {
      id: "starter",
      name: "Essentiel",
      price: "Gratuit",
      period: "",
      description: "Pour découvrir Community et rejoindre une tontine.",
      highlights: [
        "Accès portail membre",
        "1 à 2 tontines",
        "Historique des cotisations",
      ],
    },
    {
      id: "premium",
      name: "Premium",
      price: "Sur devis",
      period: "",
      description: "Paiements, wallets et outils avancés pour les membres actifs.",
      highlights: [
        "Moyens de paiement",
        "Rappels automatiques",
        "Support prioritaire",
      ],
      highlighted: true,
    },
    {
      id: "org",
      name: "Organisation",
      price: "Sur devis",
      period: "",
      description: "Pour associations, coopératives et réseaux multi-cercles.",
      highlights: [
        "Gestion multi-tontines",
        "Rôles org_owner",
        "Accompagnement dédié",
      ],
    },
  ] satisfies Plan[],
  footnote:
    "Les frais de plateforme éventuels sont communiqués avant chaque opération.",
};
