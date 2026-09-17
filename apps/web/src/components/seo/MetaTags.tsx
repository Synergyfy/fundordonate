// =============================================================================
// SEO Meta Tags Component
// Handles page titles, descriptions, and Open Graph tags.
// =============================================================================

import { useEffect } from "react";

interface MetaTagsProps {
  title: string;
  description?: string;
  image?: string;
  url?: string;
  type?: string;
  /** Site name for OG */
  siteName?: string;
  /** Twitter handle */
  twitterHandle?: string;
  /** Whether to noindex */
  noindex?: boolean;
}

const DEFAULT_SITE_NAME = "FundOrDonate";
const DEFAULT_TWITTER_HANDLE = "@fundordonate";

export function MetaTags({
  title,
  description,
  image,
  url,
  type = "website",
  siteName = DEFAULT_SITE_NAME,
  twitterHandle = DEFAULT_TWITTER_HANDLE,
  noindex = false,
}: MetaTagsProps) {
  useEffect(() => {
    // Title
    document.title = `${title} | ${siteName}`;

    // Meta tags
    const setMeta = (name: string, content: string, property?: boolean) => {
      const selector = property ? `meta[property="${name}"]` : `meta[name="${name}"]`;
      let el = document.querySelector(selector) as HTMLMetaElement;
      if (!el) {
        el = document.createElement("meta");
        if (property) {
          el.setAttribute("property", name);
        } else {
          el.setAttribute("name", name);
        }
        document.head.appendChild(el);
      }
      el.setAttribute("content", content);
    };

    // Standard meta
    if (description) setMeta("description", description);
    if (noindex) setMeta("robots", "noindex, nofollow");

    // Open Graph
    setMeta("og:title", title, true);
    if (description) setMeta("og:description", description, true);
    setMeta("og:type", type, true);
    setMeta("og:site_name", siteName, true);
    if (image) setMeta("og:image", image, true);
    if (url) setMeta("og:url", url, true);

    // Twitter
    setMeta("twitter:card", image ? "summary_large_image" : "summary");
    setMeta("twitter:title", title);
    if (description) setMeta("twitter:description", description);
    if (image) setMeta("twitter:image", image);
    setMeta("twitter:site", twitterHandle);

    // Cleanup on unmount
    return () => {
      document.title = siteName;
    };
  }, [title, description, image, url, type, siteName, twitterHandle, noindex]);

  return null;
}

// =============================================================================
// Pre-built Meta Tags for Common Pages
// =============================================================================

export function CampaignMetaTags({ campaign }: { campaign: { title: string; shortDescription?: string; featuredImage?: string; slug: string } }) {
  return (
    <MetaTags
      title={campaign.title}
      description={campaign.shortDescription || `Support ${campaign.title} on FundOrDonate`}
      image={campaign.featuredImage}
      url={`/c/${campaign.slug}`}
      type="article"
    />
  );
}

export function HubMetaTags({ name, description }: { name: string; description?: string }) {
  return (
    <MetaTags
      title={`${name} Hub`}
      description={description || `Support local campaigns in ${name} on FundOrDonate`}
      type="website"
    />
  );
}
