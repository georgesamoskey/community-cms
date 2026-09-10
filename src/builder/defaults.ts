import type {
  BlockType,
  BlogPostDoc,
  SiteBlock,
  SiteDocument,
  SitePage,
} from "./types";

let seq = 0;
export function uid(prefix = "id"): string {
  seq += 1;
  return `${prefix}_${Date.now().toString(36)}_${seq.toString(36)}`;
}

function page(
  slug: string,
  title: string,
  blocks: SiteBlock[],
  seo: SitePage["seo"] = {},
): SitePage {
  return {
    id: uid("page"),
    slug,
    title,
    status: "published",
    seo: {
      title,
      description: seo.description,
      ...seo,
    },
    blocks,
  };
}

export function createDefaultSiteDocument(): SiteDocument {
  const blog: BlogPostDoc[] = [
    {
      id: uid("post"),
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
      status: "published",
    },
    {
      id: uid("post"),
      slug: "cotisations-sans-stress",
      title: "Cotisations sans stress : rappels et transparence",
      date: "2026-02-12",
      excerpt:
        "Pourquoi la visibilité des échéances change la dynamique d’un groupe d’épargne.",
      body: [
        "Les retards de cotisation naissent souvent d’un manque de rappel, pas d’un manque de volonté.",
        "Community affiche l’historique et les prochaines échéances pour chaque membre, afin que chacun sache où en est le cercle.",
      ],
      status: "published",
    },
    {
      id: uid("post"),
      slug: "epargne-collective-digitale",
      title: "L’épargne collective à l’ère digitale",
      date: "2026-01-20",
      excerpt:
        "Ce que le numérique apporte aux pratiques traditionnelles de mutualisation.",
      body: [
        "Digitaliser une tontine ne signifie pas la remplacer : c’est la rendre plus lisible, plus sûre, et plus facile à faire grandir.",
        "Les outils Community s’inscrivent dans cette continuité — du premier versement au payout final.",
      ],
      status: "published",
    },
  ];

  return {
    version: 1,
    updatedAt: new Date().toISOString(),
    settings: {
      brand: "Community",
      tagline: "Épargne collective et tontines, en clair.",
      primaryCta: { label: "Connexion", href: "{{portal}}/login" },
      theme: {
        accent: "#167a66",
        sun: "#f0c14d",
        background: "#f4f7f6",
        foreground: "#122420",
      },
      i18n: { defaultLocale: "fr", locales: ["fr", "en", "rn", "sw"] },
    },
    nav: [
      { id: uid("nav"), label: "Fonctionnalités", href: "/features" },
      { id: uid("nav"), label: "Tarifs", href: "/pricing" },
      { id: uid("nav"), label: "À propos", href: "/about" },
      { id: uid("nav"), label: "Blog", href: "/blog" },
      { id: uid("nav"), label: "Contact", href: "/contact" },
      { id: uid("nav"), label: "Statut", href: "/status" },
    ],
    footer: {
      blurb: "Épargne collective et tontines, en clair.",
      links: [
        { id: uid("fl"), label: "Confidentialité", href: "/legal/privacy" },
        { id: uid("fl"), label: "Conditions", href: "/legal/terms" },
        {
          id: uid("fl"),
          label: "Portail membre",
          href: "{{portal}}/login",
          external: true,
        },
      ],
      showStudioLink: true,
    },
    localeOverlays: {
      en: {
        settings: {
          brand: "Community",
          tagline: "Collective savings and tontines, made clear.",
          primaryCta: { label: "Sign in", href: "{{portal}}/login" },
        },
        nav: [
          { id: uid("nav"), label: "Features", href: "/features" },
          { id: uid("nav"), label: "Pricing", href: "/pricing" },
          { id: uid("nav"), label: "About", href: "/about" },
          { id: uid("nav"), label: "Blog", href: "/blog" },
          { id: uid("nav"), label: "Contact", href: "/contact" },
          { id: uid("nav"), label: "Status", href: "/status" },
        ],
        footer: {
          blurb: "Collective savings and tontines, made clear.",
          links: [
            { id: uid("fl"), label: "Privacy", href: "/legal/privacy" },
            { id: uid("fl"), label: "Terms", href: "/legal/terms" },
            {
              id: uid("fl"),
              label: "Member portal",
              href: "{{portal}}/login",
              external: true,
            },
          ],
        },
      },
      rn: {
        settings: {
          brand: "Community",
          tagline: "Ugushora hamwe n’amatontine, bisobanutse.",
          primaryCta: { label: "Injira", href: "{{portal}}/login" },
        },
        nav: [
          { id: uid("nav"), label: "Ibikorwa", href: "/features" },
          { id: uid("nav"), label: "Ibiciro", href: "/pricing" },
          { id: uid("nav"), label: "Ivyerekeye", href: "/about" },
          { id: uid("nav"), label: "Blog", href: "/blog" },
          { id: uid("nav"), label: "Twandikire", href: "/contact" },
          { id: uid("nav"), label: "Imimerere", href: "/status" },
        ],
        footer: {
          blurb: "Ugushora hamwe n’amatontine, bisobanutse.",
          links: [
            { id: uid("fl"), label: "Ibanga", href: "/legal/privacy" },
            { id: uid("fl"), label: "Amabwiriza", href: "/legal/terms" },
            {
              id: uid("fl"),
              label: "Portal y’abanyamuryango",
              href: "{{portal}}/login",
              external: true,
            },
          ],
        },
      },
      sw: {
        settings: {
          brand: "Community",
          tagline: "Akiba ya pamoja na tontine, kwa uwazi.",
          primaryCta: { label: "Ingia", href: "{{portal}}/login" },
        },
        nav: [
          { id: uid("nav"), label: "Vipengele", href: "/features" },
          { id: uid("nav"), label: "Bei", href: "/pricing" },
          { id: uid("nav"), label: "Kuhusu", href: "/about" },
          { id: uid("nav"), label: "Blogu", href: "/blog" },
          { id: uid("nav"), label: "Wasiliana", href: "/contact" },
          { id: uid("nav"), label: "Hali", href: "/status" },
        ],
        footer: {
          blurb: "Akiba ya pamoja na tontine, kwa uwazi.",
          links: [
            { id: uid("fl"), label: "Faragha", href: "/legal/privacy" },
            { id: uid("fl"), label: "Masharti", href: "/legal/terms" },
            {
              id: uid("fl"),
              label: "Portal ya wanachama",
              href: "{{portal}}/login",
              external: true,
            },
          ],
        },
      },
    },
    pages: [
      page(
        "",
        "Accueil",
        [
          {
            id: uid("b"),
            type: "hero",
            props: {
              brand: "Community",
              headline: "L’épargne collective, enfin claire et accessible.",
              support:
                "Tontines, cotisations, Mobile Money et chat de groupe — une plateforme unifiée pour les membres et les communautés.",
              ctaPrimary: {
                label: "Créer un compte",
                href: "/register",
              },
              ctaSecondary: {
                label: "Découvrir les fonctionnalités",
                href: "/features",
              },
              ctaTertiary: {
                label: "Se connecter",
                href: "{{portal}}/login",
              },
              tone: "dark",
            },
          },
          {
            id: uid("b"),
            type: "statusBanner",
            props: { show: true },
          },
          {
            id: uid("b"),
            type: "featureGrid",
            props: {
              title: "Pourquoi Community",
              items: [
                {
                  title: "Tontines modernes",
                  summary:
                    "Créez ou rejoignez des cercles d’épargne avec des règles transparentes et un suivi en temps réel.",
                },
                {
                  title: "Chat de communauté",
                  summary:
                    "Chaque tontine et cagnotte a sa salle : messages, activité live et engagement sans quitter Community.",
                },
                {
                  title: "Cotisations & Mobile Money",
                  summary:
                    "Historique, rappels et paiements locaux — frais plateforme visibles avant chaque opération.",
                },
                {
                  title: "Portail + ops HQ",
                  summary:
                    "Les membres vivent sur le portail web ; les équipes pilotent conformité et trésorerie dans le backoffice.",
                },
              ],
            },
          },
        ],
        {
          description:
            "Community : tontines, cotisations et épargne collective pour les communautés.",
        },
      ),
      page("features", "Fonctionnalités", [
        {
          id: uid("b"),
          type: "featureGrid",
          props: {
            title: "Fonctionnalités",
            intro:
              "Du premier versement au chat de groupe : Community relie membres, finance et conversation sur la même plateforme.",
            items: [
              {
                title: "Gestion de tontines",
                summary: "Cycles, membres, échéances et répartition.",
                details:
                  "Définissez les règles du cercle, invitez des membres et suivez chaque tour jusqu’au payout.",
              },
              {
                title: "Chat temps réel",
                summary: "Salles liées aux tontines et cagnottes.",
                details:
                  "Messagerie Socket.IO + historique REST, typing, lectures et réactions.",
              },
              {
                title: "Cotisations & cagnottes",
                summary: "Suivi des contributions et alertes.",
                details:
                  "Les membres voient ce qui est dû et payé depuis le portail.",
              },
              {
                title: "Notifications",
                summary: "Alertes in-app synchronisées.",
                details: "Compteur non lu, marquage lu, préférences.",
              },
              {
                title: "Paiements & Mobile Money",
                summary: "Providers locaux et aperçu des frais.",
                details: "Fee-preview et initiation MM pour les comptes premium.",
              },
              {
                title: "Portail membre web",
                summary: "Espace connecté Keycloak dédié.",
                details: "Profil, finance et chat dans un même shell.",
              },
            ],
          },
        },
      ]),
      page("pricing", "Tarifs", [
        {
          id: uid("b"),
          type: "pricing",
          props: {
            title: "Tarifs",
            intro:
              "Des offres simples pour démarrer une tontine ou structurer une communauté entière.",
            plans: [
              {
                name: "Essentiel",
                price: "Gratuit",
                description: "Pour découvrir Community et rejoindre une tontine.",
                highlights: [
                  "Accès portail membre",
                  "1 à 2 tontines",
                  "Historique des cotisations",
                ],
                ctaLabel: "Créer un compte",
                ctaHref: "/register",
              },
              {
                name: "Premium",
                price: "Sur devis",
                description:
                  "Paiements, wallets et outils avancés pour les membres actifs.",
                highlights: [
                  "Moyens de paiement",
                  "Rappels automatiques",
                  "Support prioritaire",
                ],
                highlighted: true,
                ctaLabel: "Créer un compte",
                ctaHref: "/register",
              },
              {
                name: "Organisation",
                price: "Sur devis",
                description:
                  "Pour associations, coopératives et réseaux multi-cercles.",
                highlights: [
                  "Gestion multi-tontines",
                  "Rôles org_owner",
                  "Accompagnement dédié",
                ],
                ctaLabel: "Créer un compte",
                ctaHref: "/register",
              },
            ],
            footnote:
              "Les frais de plateforme éventuels sont communiqués avant chaque opération.",
          },
        },
      ]),
      page("about", "À propos", [
        {
          id: uid("b"),
          type: "richText",
          props: {
            title: "À propos",
            paragraphs: [
              "Nous construisons l’infrastructure digitale de l’épargne collective en Afrique et au-delà.",
              "Community est née d’un constat simple : les tontines et cercles d’épargne fonctionnent depuis des générations, mais manquent d’outils numériques clairs, sûrs et adaptés aux usages locaux.",
              "Notre produit combine un portail membre, une API métier robuste et un backoffice opérationnel — pour que chaque contribution soit suivie, chaque payout anticipé, et chaque communauté mieux outillée.",
            ],
          },
        },
        {
          id: uid("b"),
          type: "values",
          props: {
            items: [
              {
                title: "Clarté",
                text: "Des parcours compréhensibles, sans jargon inutile.",
              },
              {
                title: "Confiance",
                text: "Traçabilité des flux et gouvernance des rôles.",
              },
              {
                title: "Proximité",
                text: "Pensé pour les pratiques réelles des communautés.",
              },
            ],
          },
        },
      ]),
      page("contact", "Contact", [
        {
          id: uid("b"),
          type: "contact",
          props: {
            title: "Contact",
            intro:
              "Une question sur Community, une démo, ou un besoin organisation ? Écrivez-nous.",
            email: "hello@community.example",
            note: "Site marketing de démonstration — adaptez l’e-mail dans le studio.",
          },
        },
      ]),
      page("blog", "Blog", [
        {
          id: uid("b"),
          type: "blogList",
          props: {
            title: "Blog",
            intro: "Guides et idées pour l’épargne collective.",
          },
        },
      ]),
      page("legal/privacy", "Confidentialité", [
        {
          id: uid("b"),
          type: "legalSections",
          props: {
            title: "Politique de confidentialité",
            updated: "10 septembre 2026",
            sections: [
              {
                heading: "Données collectées",
                body: "Nous collectons les informations nécessaires au fonctionnement du service : identité de compte, coordonnées, et données liées aux tontines et cotisations.",
              },
              {
                heading: "Finalités",
                body: "Ces données servent à authentifier les membres, exécuter les parcours d’épargne, et assurer le support et la conformité.",
              },
              {
                heading: "Conservation",
                body: "Les données sont conservées pendant la durée nécessaire aux finalités décrites, puis archivées ou supprimées selon les obligations légales.",
              },
              {
                heading: "Contact",
                body: "Pour toute question relative à vos données, contactez-nous via la page Contact.",
              },
            ],
          },
        },
      ]),
      page("legal/terms", "Conditions", [
        {
          id: uid("b"),
          type: "legalSections",
          props: {
            title: "Conditions d’utilisation",
            updated: "10 septembre 2026",
            sections: [
              {
                heading: "Acceptation",
                body: "En utilisant Community, vous acceptez les présentes conditions et vous engagez à un usage loyal du service.",
              },
              {
                heading: "Compte membre",
                body: "Vous êtes responsable de la confidentialité de vos identifiants et des actions réalisées depuis votre compte.",
              },
              {
                heading: "Service",
                body: "Community fournit des outils numériques pour l’épargne collective. Les engagements entre membres d’une tontine restent de leur responsabilité.",
              },
              {
                heading: "Modifications",
                body: "Nous pouvons mettre à jour ces conditions ; la date de mise à jour est indiquée en tête de page.",
              },
            ],
          },
        },
      ]),
      page("status", "Statut plateforme", [
        {
          id: uid("b"),
          type: "richText",
          props: {
            title: "Statut de la plateforme",
            paragraphs: [
              "État des services Community en temps réel (API eagaseke).",
            ],
          },
        },
        {
          id: uid("b"),
          type: "statusBanner",
          props: { show: true },
        },
      ]),
    ],
    blog,
    media: [],
  };
}

export const BLOCK_CATALOG: {
  type: BlockType;
  label: string;
  description: string;
  group: "layout" | "content" | "media" | "conversion" | "data";
}[] = [
  { type: "hero", label: "Hero", description: "Bandeau d’accroche", group: "layout" },
  { type: "columns", label: "Colonnes", description: "Grille multi-colonnes", group: "layout" },
  { type: "spacer", label: "Espacement", description: "Marge verticale", group: "layout" },
  { type: "divider", label: "Séparateur", description: "Ligne / label", group: "layout" },
  { type: "richText", label: "Texte", description: "Titre + paragraphes", group: "content" },
  { type: "featureGrid", label: "Features", description: "Grille de cartes", group: "content" },
  { type: "values", label: "Valeurs", description: "Piliers / principes", group: "content" },
  { type: "quote", label: "Citation", description: "Quote mise en avant", group: "content" },
  { type: "faq", label: "FAQ", description: "Questions / réponses", group: "content" },
  { type: "legalSections", label: "Légal", description: "Sections juridiques", group: "content" },
  { type: "html", label: "HTML", description: "Code libre", group: "content" },
  { type: "image", label: "Image", description: "Visuel + légende", group: "media" },
  { type: "gallery", label: "Galerie", description: "Grille d’images", group: "media" },
  { type: "video", label: "Vidéo", description: "Embed URL", group: "media" },
  { type: "logoCloud", label: "Logos", description: "Bandeau partenaires", group: "media" },
  { type: "ctaBand", label: "CTA", description: "Appel à l’action", group: "conversion" },
  { type: "buttons", label: "Boutons", description: "Groupe de CTAs", group: "conversion" },
  { type: "pricing", label: "Tarifs", description: "Plans tarifaires", group: "conversion" },
  { type: "contact", label: "Contact", description: "E-mail / téléphone", group: "conversion" },
  { type: "formLead", label: "Formulaire", description: "Lead mailto", group: "conversion" },
  { type: "testimonials", label: "Témoignages", description: "Avis clients", group: "conversion" },
  { type: "stats", label: "Stats", description: "Chiffres clés", group: "data" },
  { type: "blogList", label: "Blog", description: "Liste d’articles", group: "data" },
  { type: "statusBanner", label: "Statut API", description: "Santé plateforme", group: "data" },
];

export function createBlock(type: BlockType, partial?: Partial<SiteBlock>): SiteBlock {
  const base = {
    id: uid("b"),
    type,
    props: defaultPropsFor(type),
    style: {
      paddingY: type === "hero" || type === "spacer" ? "none" : "md",
      paddingX: type === "hero" ? "none" : "md",
      width: "default",
    },
  } as SiteBlock;
  if (!partial) return base;
  return {
    ...base,
    ...partial,
    id: partial.id ?? base.id,
    type,
    props: (partial.props as SiteBlock["props"]) ?? base.props,
    style: partial.style ?? base.style,
  } as SiteBlock;
}

export function defaultPropsFor(type: BlockType): SiteBlock["props"] {
  switch (type) {
    case "hero":
      return {
        brand: "Community",
        headline: "Nouveau titre",
        support: "Sous-titre d’accompagnement.",
        ctaPrimary: { label: "Commencer", href: "/register" },
        ctaSecondary: { label: "En savoir plus", href: "/features" },
        tone: "dark",
        variant: "classic",
        minHeight: "lg",
      };
    case "richText":
      return {
        title: "Titre de section",
        paragraphs: ["Votre texte ici."],
        variant: "article",
      };
    case "featureGrid":
      return {
        title: "Fonctionnalités",
        items: [{ title: "Feature", summary: "Description courte.", icon: "✦" }],
        columns: 3,
        variant: "cards",
      };
    case "ctaBand":
      return {
        title: "Prêt à démarrer ?",
        body: "Rejoignez Community dès aujourd’hui.",
        buttonLabel: "Créer un compte",
        buttonHref: "/register",
        variant: "gradient",
      };
    case "pricing":
      return {
        title: "Tarifs",
        plans: [
          {
            name: "Starter",
            price: "0",
            description: "Pour commencer",
            highlights: ["Accès de base"],
            ctaLabel: "Créer un compte",
            ctaHref: "/register",
          },
        ],
      };
    case "faq":
      return {
        title: "FAQ",
        items: [{ question: "Question ?", answer: "Réponse." }],
        variant: "accordion",
      };
    case "image":
      return {
        src: "",
        alt: "Image",
        fullBleed: false,
        aspect: "16/9",
        objectFit: "cover",
      };
    case "stats":
      return {
        items: [
          { label: "Membres", value: "1k+" },
          { label: "Tontines", value: "120" },
        ],
        variant: "cards",
      };
    case "contact":
      return {
        title: "Contact",
        email: "hello@example.com",
        intro: "Écrivez-nous.",
      };
    case "blogList":
      return { title: "Blog", intro: "Derniers articles.", variant: "grid" };
    case "legalSections":
      return {
        title: "Mentions",
        sections: [{ heading: "Section", body: "Contenu." }],
      };
    case "values":
      return {
        items: [{ title: "Valeur", text: "Description.", icon: "◆" }],
      };
    case "statusBanner":
      return { show: true };
    case "spacer":
      return { size: "md" };
    case "html":
      return { html: "<p>HTML personnalisé</p>" };
    case "columns":
      return {
        gap: "md",
        stackOnMobile: true,
        columns: [
          {
            id: uid("col"),
            span: 6,
            blocks: [
              {
                id: uid("b"),
                type: "richText",
                props: {
                  title: "Colonne gauche",
                  paragraphs: ["Contenu."],
                },
              },
            ],
          },
          {
            id: uid("col"),
            span: 6,
            blocks: [
              {
                id: uid("b"),
                type: "richText",
                props: {
                  title: "Colonne droite",
                  paragraphs: ["Contenu."],
                },
              },
            ],
          },
        ],
      };
    case "buttons":
      return {
        align: "center",
        buttons: [
          {
            id: uid("btn"),
            label: "Action principale",
            href: "/register",
            style: "primary",
          },
          {
            id: uid("btn"),
            label: "Secondaire",
            href: "/features",
            style: "secondary",
          },
        ],
      };
    case "divider":
      return { style: "line", label: "" };
    case "quote":
      return {
        quote: "Une citation forte qui inspire confiance.",
        author: "Nom",
        role: "Rôle",
        variant: "large",
      };
    case "logoCloud":
      return {
        title: "Ils nous font confiance",
        logos: [
          { id: uid("logo"), name: "Partenaire", src: "" },
        ],
      };
    case "video":
      return {
        url: "https://www.youtube.com/embed/dQw4w9WgXcQ",
        title: "Vidéo",
        aspect: "16/9",
      };
    case "testimonials":
      return {
        title: "Ils en parlent",
        variant: "cards",
        items: [
          {
            id: uid("t"),
            quote: "Community a transformé notre tontine.",
            name: "Amina",
            role: "Organisatrice",
          },
        ],
      };
    case "gallery":
      return {
        title: "Galerie",
        columns: 3,
        images: [],
      };
    case "formLead":
      return {
        title: "Restons en contact",
        intro: "Laissez vos coordonnées — on vous répond.",
        submitLabel: "Envoyer",
        mailto: "hello@community.example",
        fields: [
          {
            id: uid("f"),
            name: "name",
            label: "Nom",
            type: "text",
            required: true,
          },
          {
            id: uid("f"),
            name: "email",
            label: "E-mail",
            type: "email",
            required: true,
          },
          {
            id: uid("f"),
            name: "message",
            label: "Message",
            type: "textarea",
          },
        ],
      };
  }
}

export const SECTION_TEMPLATES: import("./types").SectionTemplate[] = [
  {
    id: "hero-split",
    name: "Hero split + CTA",
    description: "Hero classique + bandeau CTA",
    category: "hero",
    blocks: [
      {
        type: "hero",
        props: defaultPropsFor("hero") as import("./types").HeroProps,
        style: { paddingY: "none", paddingX: "none" },
      },
      {
        type: "ctaBand",
        props: defaultPropsFor("ctaBand") as import("./types").CtaBandProps,
        style: {
          paddingY: "lg",
          background: "transparent",
        },
      },
    ],
  },
  {
    id: "social-proof",
    name: "Preuve sociale",
    description: "Stats + témoignages + logos",
    category: "social",
    blocks: [
      {
        type: "stats",
        props: defaultPropsFor("stats") as import("./types").StatsProps,
        style: { background: "#0f2e28", textColor: "#fff", paddingY: "lg" },
      },
      {
        type: "testimonials",
        props: defaultPropsFor("testimonials") as import("./types").TestimonialsProps,
      },
      {
        type: "logoCloud",
        props: defaultPropsFor("logoCloud") as import("./types").LogoCloudProps,
      },
    ],
  },
  {
    id: "convert",
    name: "Conversion",
    description: "Features + pricing + formulaire",
    category: "conversion",
    blocks: [
      {
        type: "featureGrid",
        props: defaultPropsFor("featureGrid") as import("./types").FeatureGridProps,
      },
      {
        type: "pricing",
        props: defaultPropsFor("pricing") as import("./types").PricingProps,
      },
      {
        type: "formLead",
        props: defaultPropsFor("formLead") as import("./types").FormLeadProps,
        style: { background: "#e8f5f1", radius: "xl", paddingY: "lg" },
      },
    ],
  },
  {
    id: "two-col-story",
    name: "Histoire 2 colonnes",
    description: "Texte + citation côte à côte",
    category: "layout",
    blocks: [
      {
        type: "columns",
        props: {
          gap: "lg",
          stackOnMobile: true,
          columns: [
            {
              id: "c1",
              span: 8,
              blocks: [
                {
                  id: "x1",
                  type: "richText",
                  props: {
                    title: "Notre histoire",
                    paragraphs: [
                      "Community digitalise l’épargne collective sans perdre l’âme des tontines.",
                    ],
                  },
                },
              ],
            },
            {
              id: "c2",
              span: 4,
              blocks: [
                {
                  id: "x2",
                  type: "quote",
                  props: {
                    quote: "Clarté, confiance, proximité.",
                    author: "Équipe Community",
                    variant: "card",
                  },
                },
              ],
            },
          ],
        },
      },
    ],
  },
];
