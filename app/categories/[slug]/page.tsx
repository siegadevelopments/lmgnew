'use client'

import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ProductCard } from "@/components/ProductCard";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { Skeleton } from "@/components/ui/skeleton";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

// Category config — maps slugs to display info + product filters
const categoryConfig: Record<string, {
  name: string;
  icon: string;
  description: string;
  heroDescription: string;
  color: string;
  keywords: string[];
  faqs: { question: string; answer: string }[];
  relatedCategories: string[];
}> = {
  "menopause-support": {
    name: "Menopause Support",
    icon: "🌸",
    description: "Natural, evidence-based menopause products",
    heroDescription: "Discover trusted products to help manage menopause symptoms naturally. Our curated selection includes supplements, topical relief, and lifestyle products recommended by health experts.",
    color: "from-pink-50 to-rose-50",
    keywords: ["menopause", "hormonal", "hot flash", "perimenopause", "hormone"],
    faqs: [
      { question: "What are the best natural supplements for menopause?", answer: "Evidence-based menopause supplements include black cohosh, red clover, evening primrose oil, and magnesium. These can help manage symptoms like hot flashes, mood changes, and sleep disruption. Always consult your healthcare provider before starting new supplements." },
      { question: "How long do menopause supplements take to work?", answer: "Most menopause supplements take 4-12 weeks of consistent use to show noticeable results. Individual responses vary depending on the product, dosage, and your unique physiology." },
      { question: "Are these products suitable for perimenopause?", answer: "Yes, many of our menopause support products are designed for all stages of menopause, including perimenopause. Product descriptions specify which stage they best support." },
    ],
    relatedCategories: ["womens-wellness", "healthy-ageing", "stress-management"],
  },
  "healthy-ageing": {
    name: "Healthy Ageing",
    icon: "✨",
    description: "Products for graceful, vibrant ageing",
    heroDescription: "Age vibrantly with our curated selection of longevity supplements, joint support, skin care, and wellness essentials. Evidence-based products to help you look and feel your best at any age.",
    color: "from-amber-50 to-yellow-50",
    keywords: ["ageing", "aging", "longevity", "anti-aging", "collagen", "joint"],
    faqs: [
      { question: "What supplements support healthy ageing?", answer: "Key supplements for healthy ageing include Omega-3 fatty acids, Vitamin D, CoQ10, collagen peptides, resveratrol, and NMN (Nicotinamide Mononucleotide). These support cellular health, joint function, skin elasticity, and cognitive function." },
      { question: "At what age should I start taking ageing supplements?", answer: "Most health experts recommend beginning targeted ageing supplements in your 40s, as this is when natural production of key compounds like CoQ10 and collagen begins to decline significantly." },
    ],
    relatedCategories: ["menopause-support", "brain-health", "heart-health"],
  },
  "gut-health": {
    name: "Gut Health",
    icon: "🦠",
    description: "Probiotics, prebiotics & digestive support",
    heroDescription: "A healthy gut is the foundation of overall wellness. Browse our range of probiotics, prebiotics, digestive enzymes, and gut-healing supplements from trusted Australian and international brands.",
    color: "from-green-50 to-emerald-50",
    keywords: ["gut", "probiotic", "prebiotic", "digestive", "microbiome", "fibre", "fiber"],
    faqs: [
      { question: "What's the difference between probiotics and prebiotics?", answer: "Probiotics are live beneficial bacteria that support gut health, while prebiotics are fibres that feed the good bacteria already in your gut. Both work together for optimal gut health — many experts recommend taking them in combination." },
      { question: "How do I choose the right probiotic?", answer: "Look for probiotics with multiple strains, a high CFU count (colony-forming units), and strains backed by clinical research. Consider your specific health goals — some strains target immunity, while others focus on digestive comfort or mood." },
    ],
    relatedCategories: ["weight-management", "stress-management", "healthy-ageing"],
  },
  "sleep-recovery": {
    name: "Sleep & Recovery",
    icon: "🌙",
    description: "Better sleep for better health",
    heroDescription: "Quality sleep is essential for health, recovery, and mental wellbeing. Explore our range of natural sleep aids, magnesium supplements, and recovery products for deeper, more restorative rest.",
    color: "from-indigo-50 to-blue-50",
    keywords: ["sleep", "insomnia", "magnesium", "melatonin", "recovery", "rest", "relaxation"],
    faqs: [
      { question: "What natural supplements help with sleep?", answer: "Effective natural sleep aids include magnesium glycinate, valerian root, L-theanine, passionflower, and tart cherry extract (a natural source of melatonin). These can promote relaxation and support your natural sleep cycle." },
      { question: "Is magnesium good for sleep?", answer: "Yes, magnesium — particularly magnesium glycinate — is one of the most well-researched natural sleep aids. It helps regulate neurotransmitters involved in sleep, and many Australians are deficient in this essential mineral." },
    ],
    relatedCategories: ["stress-management", "brain-health", "healthy-ageing"],
  },
  "stress-management": {
    name: "Stress Management",
    icon: "🧘",
    description: "Adaptogens & calming solutions",
    heroDescription: "Manage daily stress and promote mental wellbeing with our curated selection of adaptogens, calming supplements, meditation tools, and aromatherapy products from trusted wellness brands.",
    color: "from-violet-50 to-purple-50",
    keywords: ["stress", "anxiety", "adaptogen", "ashwagandha", "calm", "meditation", "relaxation"],
    faqs: [
      { question: "What are adaptogens?", answer: "Adaptogens are natural substances — typically herbs and mushrooms — that help your body adapt to stress. Popular adaptogens include ashwagandha, rhodiola rosea, holy basil, and medicinal mushrooms like reishi and lion's mane." },
      { question: "How quickly do stress supplements work?", answer: "Some stress-support supplements like L-theanine and GABA can provide noticeable calming effects within 30-60 minutes. Adaptogens typically require 2-4 weeks of consistent use for cumulative stress-resilience benefits." },
    ],
    relatedCategories: ["sleep-recovery", "brain-health", "menopause-support"],
  },
  "weight-management": {
    name: "Weight Management",
    icon: "⚖️",
    description: "Metabolism & healthy weight support",
    heroDescription: "Support healthy, sustainable weight management with our range of metabolism boosters, meal replacements, protein supplements, and fitness equipment. Evidence-based products for lasting results.",
    color: "from-orange-50 to-amber-50",
    keywords: ["weight", "metabolism", "protein", "meal replacement", "diet", "fitness"],
    faqs: [
      { question: "What supplements support healthy weight management?", answer: "Effective weight management supplements include green tea extract, conjugated linoleic acid (CLA), protein powders, fibre supplements, and chromium. These work best alongside a balanced diet and regular exercise." },
    ],
    relatedCategories: ["gut-health", "healthy-ageing", "heart-health"],
  },
  "heart-health": {
    name: "Heart Health",
    icon: "❤️",
    description: "Cardiovascular wellness essentials",
    heroDescription: "Support your cardiovascular health with our selection of CoQ10, Omega-3, and heart-health supplements. Products backed by research for long-term heart wellness.",
    color: "from-red-50 to-rose-50",
    keywords: ["heart", "cardiovascular", "omega", "coq10", "cholesterol", "blood pressure"],
    faqs: [
      { question: "What supplements support heart health?", answer: "Key heart health supplements include Omega-3 fish oil, CoQ10, magnesium, vitamin K2, and plant sterols. These support healthy cholesterol levels, blood pressure, and overall cardiovascular function." },
    ],
    relatedCategories: ["healthy-ageing", "weight-management", "stress-management"],
  },
  "brain-health": {
    name: "Brain Health",
    icon: "🧠",
    description: "Cognitive support & mental clarity",
    heroDescription: "Enhance mental clarity, focus, and long-term brain health with our curated selection of nootropics, omega-3s, and cognitive support supplements from trusted brands.",
    color: "from-cyan-50 to-teal-50",
    keywords: ["brain", "cognitive", "nootropic", "focus", "memory", "concentration", "mental"],
    faqs: [
      { question: "What supplements help with brain fog?", answer: "Supplements that may help with brain fog include lion's mane mushroom, omega-3 DHA, phosphatidylserine, B vitamins, and ginkgo biloba. Adequate sleep, hydration, and exercise also play crucial roles in cognitive clarity." },
    ],
    relatedCategories: ["healthy-ageing", "stress-management", "sleep-recovery"],
  },
  "womens-wellness": {
    name: "Women's Wellness",
    icon: "💜",
    description: "Holistic health for women",
    heroDescription: "Products designed specifically for women's unique health needs. From hormonal balance to iron & energy, prenatal care to bone health — find holistic wellness solutions curated by experts.",
    color: "from-fuchsia-50 to-pink-50",
    keywords: ["women", "woman", "female", "hormonal", "iron", "prenatal", "postnatal"],
    faqs: [
      { question: "What supplements should women over 40 take?", answer: "Women over 40 should consider vitamin D, calcium, magnesium, omega-3 fatty acids, B vitamins, iron (if needed), and a good-quality probiotic. These support bone health, hormonal balance, energy, and heart health during this important life stage." },
    ],
    relatedCategories: ["menopause-support", "healthy-ageing", "stress-management"],
  },
};

const allCategorySlugs = Object.keys(categoryConfig);

export default function CategoryDetailPage() {
  const params = useParams();
  const slug = params?.slug as string;
  const config = categoryConfig[slug];

  const { data: products, isLoading } = useQuery({
    queryKey: ["products", "category", slug],
    queryFn: async () => {
      if (!config) return [];
      
      const { data, error } = await supabase
        .from("products")
        .select(`
          *,
          vendor_profiles!inner(store_name, store_logo_url, is_approved, is_live)
        `)
        .eq("status", "published")
        .eq("vendor_profiles.is_approved", true)
        .eq("vendor_profiles.is_live", true)
        .neq("product_type", "service");

      if (error) throw error;
      
      // Filter products by category keywords in title, category, or content
      const filtered = (data || []).filter((p: any) => {
        const searchText = `${p.title} ${p.category || ""} ${p.excerpt || ""}`.toLowerCase();
        return config.keywords.some(kw => searchText.includes(kw.toLowerCase()));
      });

      return filtered as any[];
    },
    enabled: !!config,
  });

  if (!config) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center p-4 text-center">
        <h1 className="text-2xl font-bold">Category not found</h1>
        <p className="mt-2 text-muted-foreground">This category doesn&apos;t exist yet.</p>
        <Link href="/categories" className="mt-4 text-primary hover:underline">
          Browse all categories →
        </Link>
      </div>
    );
  }

  const relatedCats = config.relatedCategories
    .map(s => ({ slug: s, ...categoryConfig[s] }))
    .filter(c => c.name);

  return (
    <div className="bg-background min-h-screen">
      {/* Category Hero */}
      <div className={`bg-gradient-to-br ${config.color} py-12 sm:py-16 border-b border-border`}>
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <Breadcrumbs
            items={[
              { label: "Categories", href: "/categories" },
              { label: config.name },
            ]}
          />
          <div className="mt-4 max-w-3xl">
            <span className="text-4xl" aria-hidden="true">{config.icon}</span>
            <h1 className="mt-3 text-3xl font-bold tracking-tight text-foreground sm:text-4xl lg:text-5xl">
              {config.name} Products
            </h1>
            <p className="mt-4 text-lg text-muted-foreground leading-relaxed">
              {config.heroDescription}
            </p>
            {products && (
              <p className="mt-3 text-sm font-medium text-primary">
                {products.length} product{products.length !== 1 ? "s" : ""} available
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Product Grid */}
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        {isLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 sm:gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="flex flex-col overflow-hidden bg-card border border-border/50 rounded-2xl">
                <Skeleton className="aspect-square w-full" />
                <div className="p-3 space-y-2">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-5 w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : products && products.length > 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 sm:gap-4"
          >
            {products.map((product: any) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </motion.div>
        ) : (
          <div className="text-center py-20">
            <span className="text-5xl">{config.icon}</span>
            <h2 className="mt-4 text-xl font-semibold">Products coming soon</h2>
            <p className="mt-2 text-muted-foreground">
              We&apos;re adding new {config.name.toLowerCase()} products regularly. Check back soon!
            </p>
            <Link href="/products" className="mt-4 inline-block text-primary hover:underline font-medium">
              Browse all products →
            </Link>
          </div>
        )}
      </div>

      {/* FAQs */}
      {config.faqs.length > 0 && (
        <section className="border-t border-border bg-surface py-12 sm:py-16">
          <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
            <h2 className="text-2xl font-bold tracking-tight text-foreground text-center">
              Frequently Asked Questions
            </h2>
            <p className="mt-2 text-center text-sm text-muted-foreground">
              Common questions about {config.name.toLowerCase()} products
            </p>
            <div className="mt-8">
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
          </div>
        </section>
      )}

      {/* Related Categories */}
      {relatedCats.length > 0 && (
        <section className="py-12 sm:py-16 border-t border-border">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <h2 className="text-xl font-bold text-foreground">Related Categories</h2>
            <div className="mt-6 grid gap-4 sm:grid-cols-3">
              {relatedCats.map((cat) => (
                <Link
                  key={cat.slug}
                  href={`/categories/${cat.slug}`}
                  className={`group flex items-center gap-3 rounded-xl border border-border bg-gradient-to-br ${cat.color} p-4 shadow-soft transition-all hover:shadow-card hover:-translate-y-0.5`}
                >
                  <span className="text-2xl">{cat.icon}</span>
                  <div>
                    <p className="font-semibold text-foreground group-hover:text-primary transition-colors">
                      {cat.name}
                    </p>
                    <p className="text-xs text-muted-foreground">{cat.description}</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
