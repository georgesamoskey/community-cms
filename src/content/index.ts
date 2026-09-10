/** Point d’entrée contenu — les éditeurs modifient les modules sous src/content/*.ts */
export {
  homeContent,
  featuresContent,
  pricingContent,
  aboutContent,
  blogPosts,
  getPost,
  legalPrivacy,
  legalTerms,
  contactContent,
  contentCatalog,
  CONTENT_KEYS,
} from "./catalog";

export type { ContentKey } from "./catalog";
export type { HomeContent } from "./home";
export type { Feature } from "./features";
export type { Plan } from "./pricing";
export type { BlogPost } from "./blog";
