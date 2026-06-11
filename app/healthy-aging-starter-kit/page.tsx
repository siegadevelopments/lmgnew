import { Metadata } from "next";
import { HealthyAgingHero } from "@/components/healthy-aging/HealthyAgingHero";
import { LifestyleMedicinePillars } from "@/components/healthy-aging/LifestyleMedicinePillars";
import { WhatYouWillLearn } from "@/components/healthy-aging/WhatYouWillLearn";
import { HealthyAgingChecklist } from "@/components/healthy-aging/HealthyAgingChecklist";
import { DynamicResources } from "@/components/healthy-aging/DynamicResources";
import { DynamicArticles } from "@/components/healthy-aging/DynamicArticles";
import { TestimonialsFAQSection } from "@/components/healthy-aging/TestimonialsFAQSection";
import { EmailCaptureForm } from "@/components/healthy-aging/EmailCaptureForm";

export const metadata: Metadata = {
  title: "Healthy Aging Starter Kit | Lifestyle Medicine Guide",
  description: "Get your free evidence-based lifestyle medicine guide to improve energy, sleep, mobility, and long-term wellbeing. Start your healthy aging journey today.",
  openGraph: {
    title: "Healthy Aging Starter Kit | Lifestyle Medicine Guide",
    description: "Get your free evidence-based lifestyle medicine guide to improve energy, sleep, mobility, and long-term wellbeing.",
    url: "https://lifestylemedicinegateway.com/healthy-aging-starter-kit",
    type: "website",
    images: [
      {
        url: "/og-healthy-aging.jpg",
        width: 1200,
        height: 630,
        alt: "Healthy Aging Starter Kit",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Healthy Aging Starter Kit",
    description: "Evidence-based lifestyle medicine strategies for healthy aging.",
    images: ["/og-healthy-aging.jpg"],
  },
  alternates: {
    canonical: "https://lifestylemedicinegateway.com/healthy-aging-starter-kit",
  },
};

export default function HealthyAgingStarterKitPage() {
  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": [
      {
        "@type": "Question",
        "name": "What is healthy aging?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Healthy aging is the process of developing and maintaining the functional ability that enables wellbeing in older age. It's about preserving physical, mental, and cognitive health through daily lifestyle choices rather than just treating diseases as they occur."
        }
      },
      {
        "@type": "Question",
        "name": "What is lifestyle medicine?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Lifestyle medicine is a medical specialty that uses therapeutic lifestyle interventions as a primary modality to treat chronic conditions. The six pillars are whole-food, plant-predominant eating, physical activity, restorative sleep, stress management, avoidance of risky substances, and positive social connections."
        }
      }
    ]
  };

  return (
    <main className="min-h-screen bg-white">
      {/* JSON-LD Schema for FAQ */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
      
      <HealthyAgingHero />
      <LifestyleMedicinePillars />
      <WhatYouWillLearn />
      <HealthyAgingChecklist />
      
      {/* Recommended Resources (Server Component) */}
      <DynamicResources />
      
      {/* Related Articles (Server Component) */}
      <DynamicArticles />
      
      <TestimonialsFAQSection />

      {/* Final CTA Section */}
      <section className="py-24 bg-teal-900 text-white relative overflow-hidden">
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-white via-transparent to-transparent"></div>
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-2xl mx-auto text-center space-y-8">
            <h2 className="text-4xl md:text-5xl font-bold font-playfair mb-4">
              Start Your Healthy Aging Journey Today
            </h2>
            <p className="text-teal-100 text-lg mb-8">
              Join our community and receive healthy aging tips, lifestyle medicine resources, and trusted wellness recommendations directly to your inbox.
            </p>
            <div className="bg-white p-8 rounded-2xl shadow-2xl text-left max-w-md mx-auto">
              <h3 className="text-xl font-semibold text-teal-900 mb-6 text-center">
                Get Your Free Starter Kit
              </h3>
              <EmailCaptureForm buttonText="Download Free Guide" />
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
