/**
 * Component to inject JSON-LD structured data.
 * This helps Google and AI search engines understand the site structure and organization.
 */

interface SchemaOrgProps {
  type?: 'WebSite' | 'Product' | 'Article' | 'Recipe';
  name?: string;
  description?: string;
  url?: string;
  image?: string;
  price?: number;
  currency?: string;
  author?: string;
  datePublished?: string;
  dateModified?: string;
}

export function SchemaOrg({
  type = 'WebSite',
  name,
  description,
  url,
  image,
  price,
  currency = 'AUD',
  author,
  datePublished,
  dateModified,
}: SchemaOrgProps) {
  const organizationSchema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "Lifestyle Medicine Gateway",
    url: "https://www.lifestylemedicinegateway.com",
    logo: "https://www.lifestylemedicinegateway.com/logo.png",
    sameAs: [
      "https://facebook.com/lifestylemedicinegateway",
      "https://instagram.com/lifestylemedicinegateway",
    ],
    description: "A marketplace for wellness products, services, and expert advice in lifestyle medicine.",
    contactPoint: {
      "@type": "ContactPoint",
      contactType: "customer service",
      url: "https://www.lifestylemedicinegateway.com/contact",
    },
  };

  const websiteSchema = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "Lifestyle Medicine Gateway",
    url: "https://www.lifestylemedicinegateway.com",
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: "https://www.lifestylemedicinegateway.com/search?q={search_term_string}",
      },
      "query-input": "required name=search_term_string",
    },
  };

  const schemas: object[] = [organizationSchema, websiteSchema];

  // Add page-specific schema
  if (type === 'Product' && name) {
    schemas.push({
      "@context": "https://schema.org",
      "@type": "Product",
      name,
      description: description || '',
      url: url || '',
      image: image || '',
      offers: {
        "@type": "Offer",
        price: price || 0,
        priceCurrency: currency,
        availability: "https://schema.org/InStock",
        seller: {
          "@type": "Organization",
          name: "Lifestyle Medicine Gateway",
        },
      },
    });
  }

  if (type === 'Article' && name) {
    schemas.push({
      "@context": "https://schema.org",
      "@type": "Article",
      headline: name,
      description: description || '',
      url: url || '',
      image: image || '',
      author: {
        "@type": "Person",
        name: author || "Lifestyle Medicine Gateway",
      },
      publisher: {
        "@type": "Organization",
        name: "Lifestyle Medicine Gateway",
        logo: {
          "@type": "ImageObject",
          url: "https://www.lifestylemedicinegateway.com/logo.png",
        },
      },
      datePublished: datePublished || new Date().toISOString(),
      dateModified: dateModified || datePublished || new Date().toISOString(),
    });
  }

  if (type === 'Recipe' && name) {
    schemas.push({
      "@context": "https://schema.org",
      "@type": "Recipe",
      name,
      description: description || '',
      url: url || '',
      image: image || '',
      author: {
        "@type": "Person",
        name: author || "Lifestyle Medicine Gateway",
      },
      datePublished: datePublished || new Date().toISOString(),
    });
  }

  return (
    <>
      {schemas.map((schema, i) => (
        <script
          key={i}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
        />
      ))}
    </>
  );
}
