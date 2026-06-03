'use client'

import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ProductCard } from "@/components/ProductCard";
import { globalMockProductsList } from "@/lib/queries";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { Skeleton } from "@/components/ui/skeleton";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

// Guide configs — in production, these would come from the database
const guideConfig: Record<string, {
  title: string;
  icon: string;
  category: string;
  categorySlug: string;
  author: string;
  authorCredentials: string;
  readTime: string;
  updated: string;
  intro: string;
  howWeChose: string;
  keywords: string[];
  faqs: { question: string; answer: string }[];
  ctaText: string;
}> = {
  "best-menopause-products-australia": {
    title: "Best Menopause Products in Australia (2026)",
    icon: "🌸",
    category: "Menopause Support",
    categorySlug: "menopause-support",
    author: "Lifestyle Medicine Gateway Team",
    authorCredentials: "Health & Wellness Experts",
    readTime: "8 min read",
    updated: "June 2026",
    intro: "Menopause affects every woman differently, but the right products can make a significant difference in managing symptoms like hot flashes, mood changes, sleep disruption, and weight gain. We've reviewed dozens of products available in the Australian market to bring you the best evidence-based options for menopause support.",
    howWeChose: "Our selection criteria includes: clinical evidence supporting the product's efficacy, quality of ingredients, Australian availability, customer reviews and ratings, value for money, and transparency of the brand. We prioritise products from brands that are certified, independently tested, and recommended by healthcare professionals.",
    keywords: ["menopause", "perimenopause", "hot flash", "hormonal", "hormone"],
    faqs: [
      { question: "What are the most effective natural menopause supplements?", answer: "The most evidence-supported natural menopause supplements include black cohosh (for hot flashes), evening primrose oil (for breast tenderness), red clover (for menopausal symptoms), and magnesium (for sleep and mood). These have been studied in clinical trials and show varying degrees of benefit." },
      { question: "When should I start taking menopause supplements?", answer: "Many women benefit from starting supplements during perimenopause (typically in their late 40s), when symptoms first begin. However, the best time depends on your individual symptoms. Consult your healthcare provider for personalised advice." },
      { question: "Are menopause supplements safe to take with HRT?", answer: "Some supplements may interact with hormone replacement therapy (HRT). Always consult your doctor before combining supplements with HRT or any prescription medication." },
    ],
    ctaText: "Browse all menopause support products",
  },
  "best-gut-health-supplements": {
    title: "Best Gut Health Supplements (2026)",
    icon: "🦠",
    category: "Gut Health",
    categorySlug: "gut-health",
    author: "Lifestyle Medicine Gateway Team",
    authorCredentials: "Health & Wellness Experts",
    readTime: "6 min read",
    updated: "June 2026",
    intro: "Gut health is increasingly recognised as the cornerstone of overall wellness — affecting everything from immunity and mood to weight management and skin health. With so many probiotics and gut health products on the market, we've done the research to help you find the best options available in Australia.",
    howWeChose: "We evaluated gut health products based on: strain diversity and specificity, CFU count and viability, clinical research backing, storage requirements, Australian availability, and real customer reviews from our marketplace.",
    keywords: ["gut", "probiotic", "prebiotic", "digestive", "microbiome"],
    faqs: [
      { question: "How long does it take for probiotics to work?", answer: "Most people notice improvements in digestive comfort within 2-4 weeks of consistent probiotic use. However, more significant changes to gut microbiome composition may take 2-3 months." },
      { question: "Should I take probiotics with food or on an empty stomach?", answer: "This depends on the specific probiotic strain and formulation. Most probiotics survive better when taken with or just before a meal, but always check the specific product's instructions." },
    ],
    ctaText: "Browse all gut health products",
  },
  "best-sleep-support-products": {
    title: "Best Sleep Support Products (2026)",
    icon: "🌙",
    category: "Sleep & Recovery",
    categorySlug: "sleep-recovery",
    author: "Lifestyle Medicine Gateway Team",
    authorCredentials: "Health & Wellness Experts",
    readTime: "7 min read",
    updated: "June 2026",
    intro: "Quality sleep is non-negotiable for health, yet millions of Australians struggle with sleep issues. Whether it's difficulty falling asleep, staying asleep, or waking unrefreshed, the right products can help. We've tested and reviewed the best natural sleep support products available.",
    howWeChose: "Our evaluation criteria includes: ingredient quality and dosage, clinical evidence, onset of action, next-day effects (no grogginess), Australian manufacturing standards, and customer satisfaction ratings.",
    keywords: ["sleep", "insomnia", "magnesium", "melatonin", "rest"],
    faqs: [
      { question: "What is the best natural sleep supplement?", answer: "Magnesium glycinate is consistently rated as one of the best natural sleep supplements due to its calming effect on the nervous system. Other effective options include L-theanine, valerian root, and passionflower extract." },
    ],
    ctaText: "Browse all sleep support products",
  },
  "healthy-ageing-essentials": {
    title: "Healthy Ageing Essentials: Products for Longevity",
    icon: "✨",
    category: "Healthy Ageing",
    categorySlug: "healthy-ageing",
    author: "Lifestyle Medicine Gateway Team",
    authorCredentials: "Health & Wellness Experts",
    readTime: "9 min read",
    updated: "June 2026",
    intro: "Ageing is inevitable, but how we age is increasingly within our control. The right combination of lifestyle choices and targeted supplements can support cellular health, cognitive function, joint mobility, and overall vitality as we age. Here are the essential products for healthy ageing.",
    howWeChose: "We selected products based on: scientific evidence for longevity benefits, ingredient purity and bioavailability, long-term safety profile, Australian availability, and value for money relative to quality.",
    keywords: ["ageing", "aging", "longevity", "collagen", "joint", "mobility"],
    faqs: [
      { question: "What supplements should I take for healthy ageing?", answer: "Key supplements for healthy ageing include Omega-3 fatty acids, Vitamin D3, CoQ10, collagen peptides, resveratrol, and a high-quality multivitamin. Focus on supplements that address your specific health concerns and have strong evidence backing." },
    ],
    ctaText: "Browse all healthy ageing products",
  },
  "best-products-women-over-50": {
    title: "Best Products for Women Over 50",
    icon: "💜",
    category: "Women's Wellness",
    categorySlug: "womens-wellness",
    author: "Lifestyle Medicine Gateway Team",
    authorCredentials: "Health & Wellness Experts",
    readTime: "10 min read",
    updated: "June 2026",
    intro: "Women over 50 have unique health needs as their bodies navigate post-menopausal changes, bone density concerns, cardiovascular health, and cognitive wellness. We've curated the best products specifically designed to support women through this important life stage.",
    howWeChose: "Products were selected based on: relevance to women's health post-50, clinical evidence, quality of formulation, ease of use, Australian brand certification, and positive customer outcomes.",
    keywords: ["women", "woman", "female", "bone", "osteoporosis", "iron", "energy"],
    faqs: [
      { question: "What vitamins should women over 50 take daily?", answer: "Key vitamins and minerals for women over 50 include: Vitamin D3 (1000-2000 IU), Calcium (1200mg), Vitamin B12, Omega-3, Iron (if deficient), and Magnesium. A blood test from your GP can help identify specific deficiencies." },
    ],
    ctaText: "Browse all women's wellness products",
  },
  "best-stress-management-supplements": {
    title: "Best Stress Management Supplements",
    icon: "🧘",
    category: "Stress Management",
    categorySlug: "stress-management",
    author: "Lifestyle Medicine Gateway Team",
    authorCredentials: "Health & Wellness Experts",
    readTime: "6 min read",
    updated: "June 2026",
    intro: "Chronic stress can wreak havoc on your body, affecting everything from your immune system to your sleep. While lifestyle interventions are key, certain adaptogens and supplements can support your nervous system. Here are the top-rated stress management products.",
    howWeChose: "We looked for evidence-based adaptogens (like Ashwagandha), quality of extraction, correct clinical dosages, and fast-acting amino acids like L-Theanine.",
    keywords: ["stress", "anxiety", "adaptogen", "calm", "relaxation", "ashwagandha"],
    faqs: [
      { question: "How quickly do stress supplements work?", answer: "Amino acids like L-Theanine can promote calm within 30-60 minutes. Adaptogens like Ashwagandha may take 2-4 weeks of daily use to fully balance cortisol levels." },
    ],
    ctaText: "Browse all stress management products",
  },
  "best-weight-management-products": {
    title: "Best Weight Management Products",
    icon: "⚖️",
    category: "Weight Management",
    categorySlug: "weight-management",
    author: "Lifestyle Medicine Gateway Team",
    authorCredentials: "Health & Wellness Experts",
    readTime: "7 min read",
    updated: "June 2026",
    intro: "Healthy weight management goes beyond simple calorie counting; it involves metabolic health, balanced blood sugar, and sustainable habits. We've reviewed the most effective supplements and protein blends to support your metabolic goals.",
    howWeChose: "We selected products based on clean ingredient profiles, absence of artificial sweeteners, scientific backing for metabolic support, and positive user feedback.",
    keywords: ["weight", "metabolism", "diet", "meal replacement", "protein"],
    faqs: [
      { question: "Are meal replacement shakes healthy?", answer: "High-quality, plant-based or whey meal replacements with balanced macros and no added sugars can be a very healthy and convenient tool for weight management when used as part of a balanced diet." },
    ],
    ctaText: "Browse all weight management products",
  },
  "best-heart-health-supplements": {
    title: "Best Heart Health Supplements",
    icon: "❤️",
    category: "Heart Health",
    categorySlug: "heart-health",
    author: "Lifestyle Medicine Gateway Team",
    authorCredentials: "Health & Wellness Experts",
    readTime: "8 min read",
    updated: "June 2026",
    intro: "Cardiovascular wellness is fundamental to a long, healthy life. From supporting healthy cholesterol to managing blood pressure, these are the best evidence-based supplements for heart health available in Australia.",
    howWeChose: "We focused on products with pharmaceutical-grade purity, high concentrations of active ingredients like EPA/DHA and CoQ10, and rigorous third-party testing.",
    keywords: ["heart", "cardiovascular", "omega", "coq10"],
    faqs: [
      { question: "Why is Omega-3 important for the heart?", answer: "Omega-3 fatty acids, specifically EPA and DHA, help reduce inflammation, lower triglycerides, and support healthy blood pressure." },
    ],
    ctaText: "Browse all heart health products",
  },
  "best-brain-health-nootropics": {
    title: "Best Brain Health & Nootropics",
    icon: "🧠",
    category: "Brain Health",
    categorySlug: "brain-health",
    author: "Lifestyle Medicine Gateway Team",
    authorCredentials: "Health & Wellness Experts",
    readTime: "9 min read",
    updated: "June 2026",
    intro: "Whether you're looking to enhance daily focus, clear brain fog, or support long-term cognitive function, nootropics and brain health supplements can give you a mental edge. Discover our top picks.",
    howWeChose: "We evaluated based on clinical evidence for cognitive enhancement, neuroprotective properties (like those found in Lion's Mane mushroom), and lack of jittery side effects.",
    keywords: ["brain", "cognitive", "focus", "memory", "nootropic", "concentration", "mental"],
    faqs: [
      { question: "What is Lion's Mane mushroom good for?", answer: "Lion's Mane contains compounds that stimulate the growth of brain cells and is known for its ability to improve memory, focus, and overall cognitive function." },
    ],
    ctaText: "Browse all brain health products",
  },
};

export default function GuideDetailPage() {
  const params = useParams();
  const slug = params?.slug as string;
  const config = guideConfig[slug];

  const { data: products, isLoading } = useQuery({
    queryKey: ["products", "guide", slug],
    queryFn: async () => {
      if (!config) return [];
      const { data, error } = await supabase
        .from("products")
        .select(`*, vendor_profiles!inner(store_name, store_logo_url, is_approved, is_live)`)
        .eq("status", "published")
        .eq("vendor_profiles.is_approved", true)
        .eq("vendor_profiles.is_live", true)
        .neq("product_type", "service")
        .limit(6);

      if (error) throw error;

      const filtered = (data || []).filter((p: any) => {
        const searchText = `${p.title} ${p.category || ""} ${p.excerpt || ""}`.toLowerCase();
        return config.keywords.some(kw => searchText.includes(kw.toLowerCase()));
      });

      if (filtered.length > 0) return filtered;

      // Fallback to relevant realistic mock products if no matching products exist in DB
      const guideMocks = globalMockProductsList.filter(m => 
        config.keywords.some((kw: string) => (m.keywords || []).includes(kw.toLowerCase()))
      );

      return guideMocks.slice(0, 6).map((m, i) => ({
        ...m,
        id: `mock-guide-${slug}-${i}`,
        slug: `mock-product-${slug}-${i}`,
      })) as any[];
    },
    enabled: !!config,
  });

  if (!config) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center p-4 text-center">
        <h1 className="text-2xl font-bold">Guide not found</h1>
        <p className="mt-2 text-muted-foreground">This guide doesn&apos;t exist yet.</p>
        <Link href="/guides" className="mt-4 text-primary hover:underline">
          Browse all guides →
        </Link>
      </div>
    );
  }

  return (
    <div className="bg-background min-h-screen">
      {/* Guide Header */}
      <div className="bg-surface border-b border-border py-10 sm:py-14">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <Breadcrumbs
            items={[
              { label: "Buying Guides", href: "/guides" },
              { label: config.title },
            ]}
          />
          <div className="mt-4">
            <span className="text-4xl">{config.icon}</span>
            <h1 className="mt-3 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
              {config.title}
            </h1>
            <div className="mt-4 flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
              <span>By {config.author}</span>
              <span>•</span>
              <span>{config.authorCredentials}</span>
              <span>•</span>
              <span>{config.readTime}</span>
              <span>•</span>
              <span>Updated {config.updated}</span>
            </div>
            <Link
              href={`/categories/${config.categorySlug}`}
              className="mt-3 inline-block text-xs font-medium text-primary bg-primary/5 px-3 py-1 rounded-full hover:bg-primary/10 transition-colors"
            >
              {config.category}
            </Link>
          </div>
        </div>
      </div>

      {/* Guide Content */}
      <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:px-8">
        {/* Introduction */}
        <section>
          <h2 className="text-xl font-bold text-foreground">Why This Guide Matters</h2>
          <p className="mt-4 text-base text-muted-foreground leading-relaxed">
            {config.intro}
          </p>
        </section>

        {/* Quick Picks */}
        {products && products.length > 0 && (
          <section className="mt-12">
            <h2 className="text-xl font-bold text-foreground">Our Top Picks</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Our expert-reviewed recommendations from the Lifestyle Medicine Gateway marketplace
            </p>
            <div className="mt-6 grid grid-cols-2 sm:grid-cols-3 gap-3">
              {products.slice(0, 3).map((product: any) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </section>
        )}

        {/* How We Chose */}
        <section className="mt-12">
          <h2 className="text-xl font-bold text-foreground">How We Chose These Products</h2>
          <p className="mt-4 text-base text-muted-foreground leading-relaxed">
            {config.howWeChose}
          </p>
        </section>

        {/* All Recommended Products */}
        {products && products.length > 3 && (
          <section className="mt-12">
            <h2 className="text-xl font-bold text-foreground">All Recommended Products</h2>
            <div className="mt-6 grid grid-cols-2 sm:grid-cols-3 gap-3">
              {products.map((product: any) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </section>
        )}

        {/* FAQs */}
        {config.faqs.length > 0 && (
          <section className="mt-12">
            <h2 className="text-xl font-bold text-foreground">Frequently Asked Questions</h2>
            <div className="mt-6">
              <Accordion type="multiple" className="space-y-3">
                {config.faqs.map((faq, i) => (
                  <AccordionItem
                    key={i}
                    value={`faq-${i}`}
                    className="rounded-xl border border-border bg-card px-5 shadow-soft"
                  >
                    <AccordionTrigger className="text-left text-sm font-semibold text-foreground hover:text-primary py-4">
                      {faq.question}
                    </AccordionTrigger>
                    <AccordionContent className="text-sm text-muted-foreground leading-relaxed pb-4">
                      {faq.answer}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </div>
            {/* FAQ Schema */}
            <script
              type="application/ld+json"
              dangerouslySetInnerHTML={{
                __html: JSON.stringify({
                  "@context": "https://schema.org",
                  "@type": "FAQPage",
                  mainEntity: config.faqs.map((faq) => ({
                    "@type": "Question",
                    name: faq.question,
                    acceptedAnswer: {
                      "@type": "Answer",
                      text: faq.answer,
                    },
                  })),
                }),
              }}
            />
          </section>
        )}

        {/* CTA */}
        <section className="mt-12 rounded-2xl bg-gradient-to-br from-primary/5 to-wellness/5 border border-primary/10 p-8 text-center">
          <h2 className="text-xl font-bold text-foreground">Ready to Shop?</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Browse our full range of {config.category.toLowerCase()} products from trusted brands.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Link href={`/categories/${config.categorySlug}`}>
              <Button size="lg" className="font-bold">
                {config.ctaText}
              </Button>
            </Link>
            <Link href="/products">
              <Button variant="outline" size="lg" className="font-bold">
                Shop All Products
              </Button>
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}
