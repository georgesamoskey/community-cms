import { homeContent } from "./home";
import { featuresContent } from "./features";
import { pricingContent } from "./pricing";
import { aboutContent } from "./about";
import { blogPosts, getPost } from "./blog";
import { legalPrivacy, legalTerms } from "./legal";
import { contactContent } from "./contact";

export const contentCatalog = {
  home: homeContent,
  features: featuresContent,
  pricing: pricingContent,
  about: aboutContent,
  blog: blogPosts,
  "legal.privacy": legalPrivacy,
  "legal.terms": legalTerms,
  contact: contactContent,
} as const;

export type ContentKey = keyof typeof contentCatalog;

export const CONTENT_KEYS = Object.keys(contentCatalog) as ContentKey[];

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
};
