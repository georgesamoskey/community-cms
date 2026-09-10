export type HomeContent = {
  brand: string;
  headline: string;
  support: string;
  ctaPrimary: string;
  ctaSecondary: string;
  sections: { title: string; body: string }[];
};

export const homeContent: HomeContent = {
  brand: "Community",
  headline: "L’épargne collective, enfin claire et accessible.",
  support:
    "Tontines, cotisations, Mobile Money et chat de groupe — une plateforme unifiée pour les membres et les communautés.",
  ctaPrimary: "Ouvrir mon espace",
  ctaSecondary: "Découvrir les fonctionnalités",
  sections: [
    {
      title: "Tontines modernes",
      body: "Créez ou rejoignez des cercles d’épargne avec des règles transparentes et un suivi en temps réel.",
    },
    {
      title: "Chat de communauté",
      body: "Chaque tontine et cagnotte a sa salle : messages, activité live et engagement sans quitter Community.",
    },
    {
      title: "Cotisations & Mobile Money",
      body: "Historique, rappels et paiements locaux — frais plateforme visibles avant chaque opération.",
    },
    {
      title: "Portail + ops HQ",
      body: "Les membres vivent sur le portail web ; les équipes pilotent conformité et trésorerie dans le backoffice.",
    },
  ],
};
