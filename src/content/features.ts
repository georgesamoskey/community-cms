export type Feature = {
  slug: string;
  title: string;
  summary: string;
  details: string;
};

export const featuresContent = {
  title: "Fonctionnalités",
  intro:
    "Du premier versement au chat de groupe : Community relie membres, finance et conversation sur la même plateforme.",
  features: [
    {
      slug: "tontines",
      title: "Gestion de tontines",
      summary: "Cycles, membres, échéances et répartition.",
      details:
        "Définissez les règles du cercle, invitez des membres et suivez chaque tour jusqu’au payout. L’API expose GET /tontines/mine au portail.",
    },
    {
      slug: "chat",
      title: "Chat temps réel",
      summary: "Salles liées aux tontines et cagnottes.",
      details:
        "Messagerie Socket.IO (namespace chat) + historique REST, typing, lectures et réactions — disponible dans le portail membre.",
    },
    {
      slug: "cotisations",
      title: "Cotisations & cagnottes",
      summary: "Suivi des contributions et alertes.",
      details:
        "Les membres voient ce qui est dû et payé via /cotisations/my-cotisations et /contributions/my-contributions.",
    },
    {
      slug: "notifications",
      title: "Notifications",
      summary: "Alertes in-app synchronisées.",
      details:
        "Compteur non lu, marquage lu, préférences — branchées sur /notifications du backend.",
    },
    {
      slug: "paiements",
      title: "Paiements & Mobile Money",
      summary: "Providers locaux et aperçu des frais.",
      details:
        "Liste des providers, fee-preview et initiation MM pour les comptes premium (portal.payments).",
    },
    {
      slug: "portail",
      title: "Portail membre web",
      summary: "Espace connecté Keycloak dédié.",
      details:
        "Client OIDC « portal », distinct du backoffice HQ — profil, finance et chat dans un même shell.",
    },
  ] satisfies Feature[],
};
