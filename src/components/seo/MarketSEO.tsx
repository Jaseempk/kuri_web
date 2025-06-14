import { useEffect } from "react";
import { generateMarketShareUrl } from "../../utils/urlGenerator";
import { MarketMetadata } from "../markets/MarketCard";

interface KuriMarket {
  address: string;
  name?: string;
  creator: string;
  totalParticipants: number;
  activeParticipants: number;
  kuriAmount: string;
  intervalType: number;
  state: number;
}

interface MarketSEOProps {
  market: KuriMarket;
  metadata?: MarketMetadata | null;
}

/**
 * SEO component for market pages with dynamic meta tags
 * Optimizes for social media sharing and search engines
 */
export const MarketSEO = ({ market, metadata }: MarketSEOProps) => {
  useEffect(() => {
    // Generate dynamic title
    const getTitle = (): string => {
      if (metadata?.short_description) {
        return `${metadata.short_description} | Kuri Finance`;
      }
      if (market.name) {
        return `${market.name} | Kuri Finance`;
      }
      return `Kuri Circle - Community Savings | Kuri Finance`;
    };

    // Generate dynamic description
    const getDescription = (): string => {
      if (metadata?.long_description) {
        return metadata.long_description;
      }

      const intervalText = market.intervalType === 0 ? "weekly" : "monthly";
      const contributionAmount = (
        Number(market.kuriAmount) / 1_000_000
      ).toFixed(2);
      const totalPool = (
        (Number(market.kuriAmount) / 1_000_000) *
        market.totalParticipants
      ).toFixed(2);

      return `Join this community savings circle with ${market.activeParticipants}/${market.totalParticipants} members. Contribute $${contributionAmount} ${intervalText} to win $${totalPool}. Start building your financial future with Kuri Finance.`;
    };

    // Get social media image
    const getImageUrl = (): string => {
      if (metadata?.image_url) {
        return metadata.image_url;
      }

      // Fallback to default Kuri image
      const baseUrl =
        typeof window !== "undefined"
          ? window.location.origin
          : "https://kuri.finance";
      return `${baseUrl}/images/financialempowerment.jpg`;
    };

    // Generate canonical URL
    const getCanonicalUrl = (): string => {
      try {
        return generateMarketShareUrl(market.address);
      } catch {
        const baseUrl =
          typeof window !== "undefined"
            ? window.location.origin
            : "https://kuri.finance";
        return `${baseUrl}/markets/${market.address}`;
      }
    };

    const title = getTitle();
    const description = getDescription();
    const imageUrl = getImageUrl();
    const canonicalUrl = getCanonicalUrl();

    // Update document title
    document.title = title;

    // Function to set or update meta tag
    const setMetaTag = (
      property: string,
      content: string,
      isProperty = false
    ) => {
      const attribute = isProperty ? "property" : "name";
      let metaTag = document.querySelector(`meta[${attribute}="${property}"]`);

      if (!metaTag) {
        metaTag = document.createElement("meta");
        metaTag.setAttribute(attribute, property);
        document.head.appendChild(metaTag);
      }

      metaTag.setAttribute("content", content);
    };

    // Function to set or update link tag
    const setLinkTag = (rel: string, href: string) => {
      let linkTag = document.querySelector(
        `link[rel="${rel}"]`
      ) as HTMLLinkElement;

      if (!linkTag) {
        linkTag = document.createElement("link");
        linkTag.rel = rel;
        document.head.appendChild(linkTag);
      }

      linkTag.href = href;
    };

    // Basic meta tags
    setMetaTag("description", description);
    setLinkTag("canonical", canonicalUrl);

    // Open Graph tags for Facebook/LinkedIn
    setMetaTag("og:type", "website", true);
    setMetaTag("og:title", title, true);
    setMetaTag("og:description", description, true);
    setMetaTag("og:image", imageUrl, true);
    setMetaTag("og:url", canonicalUrl, true);
    setMetaTag("og:site_name", "Kuri Finance", true);
    setMetaTag("og:locale", "en_US", true);

    // Open Graph image details
    setMetaTag("og:image:width", "1200", true);
    setMetaTag("og:image:height", "630", true);
    setMetaTag("og:image:type", "image/jpeg", true);
    setMetaTag("og:image:alt", title, true);

    // Twitter Card tags
    setMetaTag("twitter:card", "summary_large_image");
    setMetaTag("twitter:title", title);
    setMetaTag("twitter:description", description);
    setMetaTag("twitter:image", imageUrl);
    setMetaTag("twitter:url", canonicalUrl);
    setMetaTag("twitter:site", "@KuriFinance");
    setMetaTag("twitter:creator", "@KuriFinance");

    // Additional meta tags
    setMetaTag("robots", "index, follow");
    setMetaTag("author", "Kuri Finance");
    setMetaTag("theme-color", "#C84E31");

    // Structured data for search engines
    const structuredData = {
      "@context": "https://schema.org",
      "@type": "FinancialProduct",
      name: title,
      description: description,
      image: imageUrl,
      url: canonicalUrl,
      provider: {
        "@type": "Organization",
        name: "Kuri Finance",
        url: "https://kuri.finance",
      },
      offers: {
        "@type": "Offer",
        category: "Community Savings Circle",
        availability: market.state === 0 ? "InStock" : "OutOfStock",
      },
    };

    // Add or update structured data script
    let structuredDataScript = document.querySelector(
      'script[type="application/ld+json"]'
    ) as HTMLScriptElement;
    if (!structuredDataScript) {
      structuredDataScript = document.createElement("script");
      structuredDataScript.type = "application/ld+json";
      document.head.appendChild(structuredDataScript);
    }
    structuredDataScript.textContent = JSON.stringify(structuredData);

    // Cleanup function to remove meta tags when component unmounts
    return () => {
      // Reset title to default
      document.title = "Kuri - Community Saving Circles";

      // Note: We don't remove meta tags on cleanup as they might be needed
      // for subsequent page views or when user navigates back
    };
  }, [market, metadata]);

  // This component doesn't render anything visible
  return null;
};
