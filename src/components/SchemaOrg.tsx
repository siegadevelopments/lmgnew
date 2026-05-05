/**
 * Component to inject JSON-LD structured data.
 * This helps Google and AI search engines understand the site structure and organization.
 */
export function SchemaOrg() {
  const organizationSchema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "Lifestyle Medicine Gateway",
    url: "https://lifestylemedicinegateway.com",
    logo: "https://lifestylemedicinegateway.com/logo.png",
    sameAs: [
      "https://facebook.com/lifestylemedicinegateway",
      "https://instagram.com/lifestylemedicinegateway",
      "https://twitter.com/lmgateway",
    ],
    description: "A marketplace for wellness products, services, and expert advice.",
  };

  const websiteSchema = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    url: "https://lifestylemedicinegateway.com",
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: "https://lifestylemedicinegateway.com/shop?q={search_term_string}",
      },
      "query-input": "required name=search_term_string",
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }}
      />
    </>
  );
}

// NOTE: Using a placeholder for dangerouslySetInnerHTML key to avoid potential issues in some environments,
// but in standard React it's __html.
// Let's fix that.
