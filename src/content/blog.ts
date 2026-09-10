export type BlogPost = {
  slug: string;
  title: string;
  date: string;
  excerpt: string;
  body: string[];
};

export const blogPosts: BlogPost[] = [
  {
    slug: "demarrer-une-tontine",
    title: "Comment démarrer une tontine avec Community",
    date: "2026-03-01",
    excerpt:
      "Les étapes essentielles pour créer votre premier cercle d’épargne numérique.",
    body: [
      "Une tontine réussie repose sur des règles claires : montant, fréquence, ordre des tours et engagement des membres.",
      "Avec Community, vous définissez ces paramètres une fois, invitez vos proches, et suivez chaque cotisation depuis le portail membre.",
      "Commencez petit, documentez les accords, et laissez la plateforme porter le suivi opérationnel.",
    ],
  },
  {
    slug: "cotisations-sans-stress",
    title: "Cotisations sans stress : rappels et transparence",
    date: "2026-02-12",
    excerpt:
      "Pourquoi la visibilité des échéances change la dynamique d’un groupe d’épargne.",
    body: [
      "Les retards de cotisation naissent souvent d’un manque de rappel, pas d’un manque de volonté.",
      "Community affiche l’historique et les prochaines échéances pour chaque membre, afin que chacun sache où en est le cercle.",
    ],
  },
  {
    slug: "epargne-collective-digitale",
    title: "L’épargne collective à l’ère digitale",
    date: "2026-01-20",
    excerpt:
      "Ce que le numérique apporte aux pratiques traditionnelles de mutualisation.",
    body: [
      "Digitaliser une tontine ne signifie pas la remplacer : c’est la rendre plus lisible, plus sûre, et plus facile à faire grandir.",
      "Les outils Community s’inscrivent dans cette continuité — du premier versement au payout final.",
    ],
  },
];

export function getPost(slug: string): BlogPost | undefined {
  return blogPosts.find((p) => p.slug === slug);
}
