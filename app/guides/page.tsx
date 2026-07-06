'use client'

import { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { BookOpen, Search, Filter, ShieldAlert, ArrowRight, BookOpenCheck, ExternalLink } from "lucide-react";

interface SolutionItem {
  name: string;
  type: "product" | "service" | "course" | "custom";
  slug?: string;
  bullets?: string[];
}

interface ArticleItem {
  title: string;
  slug: string;
}

interface GuideMatch {
  problem: string;
  category: string;
  solutions: SolutionItem[];
  vendor: {
    name: string;
    slug?: string;
  };
  articles?: ArticleItem[];
}

const categories = [
  "All Categories",
  "Gut & Digestion",
  "Stress & Mental Wellness",
  "Women's Wellness & Hormones",
  "Skin, Hair & Beauty",
  "Healthy Ageing & Longevity",
  "Healthy Home & Cleaning",
  "General Health & Education",
];

const guideMatches: GuideMatch[] = [
  {
    problem: "Parasites",
    category: "Gut & Digestion",
    solutions: [
      {
        name: "Daniella Hogarth 3-Step Parasite Protocol",
        type: "service",
        slug: "therapeutic-massage-114", // Fallback to available service
        bullets: ["Comprehensive gut health support", "Personalised practitioner guidance", "Step-by-step detoxification plan"],
      }
    ],
    vendor: {
      name: "Daniella Hogarth Energy & Wellness",
      slug: "daniella-hogarth-energy-wellness",
    },
    articles: [
      { title: "Gut + Menopause: Why Your Microbiome Matters", slug: "gut-microbiome-menopause-hormone-health" },
    ]
  },
  {
    problem: "Bloating & Poor Digestion",
    category: "Gut & Digestion",
    solutions: [
      {
        name: "Healthy Body Digestion Pak™ 2.0",
        type: "product",
        bullets: ["Digestive enzymes", "Probiotic support", "Essential trace nutrients for gut lining"],
      },
      {
        name: "Kombucha Starter",
        type: "product",
        slug: "kombucha-starter-0",
        bullets: ["Naturally fermented probiotics", "Support daily microbiome diversity"],
      }
    ],
    vendor: {
      name: "E-Training Group",
      slug: "e-training-group",
    },
    articles: [
      { title: "Brain Fog and the Foods That May Be Making It Worse", slug: "brain-fog-and-the-foods-that-may-be-making-it-worse" },
    ]
  },
  {
    problem: "Nutritional Deficiencies",
    category: "Healthy Ageing & Longevity",
    solutions: [
      { name: "Healthy Body Digestion Pak™ 2.0", type: "product", bullets: ["Enhanced nutrient absorption support"] },
      { name: "Healthy Body Start Pak™", type: "product", bullets: ["90 essential nutrients", "Broad-spectrum mineral blend"] },
      { name: "Healthy Body Pak™ range", type: "product", bullets: ["Targeted health supplementation packs"] }
    ],
    vendor: {
      name: "E-Training Group",
      slug: "e-training-group",
    },
    articles: [
      { title: "Carbohydrates, Sugar, and Health: What Science Says About Diabetes and Cancer Risk", slug: "carbohydrates-sugar-diabetes-cancer" }
    ]
  },
  {
    problem: "Brain Fog",
    category: "Stress & Mental Wellness",
    solutions: [
      {
        name: "Healthy Body Brain and Heart Pak™ 2.0",
        type: "product",
        bullets: ["Essential fatty acids for brain function", "Supports cognitive clarity and memory"],
      }
    ],
    vendor: {
      name: "E-Training Group",
      slug: "e-training-group",
    },
    articles: [
      { title: "Brain Fog and the Foods That May Be Making It Worse", slug: "brain-fog-and-the-foods-that-may-be-making-it-worse" }
    ]
  },
  {
    problem: "Heart Health",
    category: "Healthy Ageing & Longevity",
    solutions: [
      {
        name: "Healthy Body Brain and Heart Pak™ 2.0",
        type: "product",
        bullets: ["Cardiovascular cell support", "High-quality essential fatty acids (EFAs)"],
      }
    ],
    vendor: {
      name: "E-Training Group",
      slug: "e-training-group",
    }
  },
  {
    problem: "Healthy Ageing",
    category: "Healthy Ageing & Longevity",
    solutions: [
      { name: "Healthy Body Brain and Heart Pak™ 2.0", type: "product", bullets: ["Supports heart and brain longevity"] },
      { name: "Anti-Aging Healthy Body Pak™ 2.0", type: "product", bullets: ["Targeted antioxidants and cellular recovery"] }
    ],
    vendor: {
      name: "E-Training Group",
      slug: "e-training-group",
    },
    articles: [
      { title: "Can Plums Help Fight Cancer? What Science Says About Their Anti-Cancer Properties", slug: "plums-cancer-prevention" }
    ]
  },
  {
    problem: "Joint Discomfort",
    category: "Healthy Ageing & Longevity",
    solutions: [
      { name: "Healthy Body Bone and Joint Pak™ 2.0", type: "product", bullets: ["Glucosamine, chondroitin, and minerals", "Supports cartilage regeneration and joint comfort"] },
      { name: "Pure Copper Magnetic Therapy Bracelet - Celtic Knot Design", type: "product", slug: "pure-copper-magnetic-therapy-bracelet-celtic-knot-design", bullets: ["Celtic Knot Design in Pure Copper", "Integrated therapeutic magnets"] },
      { name: "Pure Copper Magnetic Therapy Ring - Celtic Knot", type: "product", slug: "pure-copper-magnetic-therapy-ring-celtic-knot-standard-size", bullets: ["Matching ring with therapeutic Neodymium magnets"] }
    ],
    vendor: {
      name: "E-Training Group",
      slug: "e-training-group",
    },
    articles: [
      { title: "Finding Relief from Restless Legs Syndrome: What Worked for Us", slug: "restless-legs-syndrome-natural-relief" },
      { title: "7 Best Fitness Apps for Women Over 50", slug: "best-fitness-apps-women-over-50-australia" }
    ]
  },
  {
    problem: "Recovery After Exercise",
    category: "Healthy Ageing & Longevity",
    solutions: [
      {
        name: "InfraHeal Red Infrared Light Therapy Mat",
        type: "product",
        bullets: ["Infrared light therapy", "Promotes cell recovery and relaxes muscles"],
      }
    ],
    vendor: {
      name: "E-Training Group",
      slug: "e-training-group",
    },
    articles: [
      { title: "Connecting with the Earth: Grounding, PEMF & Infrared Explained", slug: "connecting-with-the-earth:" }
    ]
  },
  {
    problem: "Muscle Soreness",
    category: "Healthy Ageing & Longevity",
    solutions: [
      {
        name: "InfraHeal Red Infrared Light Therapy Mat",
        type: "product",
        bullets: ["Soothes aches, spasms, and muscle soreness"],
      }
    ],
    vendor: {
      name: "E-Training Group",
      slug: "e-training-group",
    },
    articles: [
      { title: "Connecting with the Earth: Grounding, PEMF & Infrared Explained", slug: "connecting-with-the-earth:" }
    ]
  },
  {
    problem: "General Wellness",
    category: "Healthy Ageing & Longevity",
    solutions: [
      { name: "InfraHeal Red Infrared Light Therapy Mat", type: "product", bullets: ["Daily restorative body therapy"] },
      { name: "Healthy Body Pak™ range", type: "product", bullets: ["Essential daily nutrient foundation packs"] },
      { name: "Pure Stainless Steel Double Wall Insulated Water Bottle", type: "product", slug: "pure-stainless-steel-double-wall-insulated-water-bottle", bullets: ["Ditch plastic, keep hot/cold liquids insulated"] }
    ],
    vendor: {
      name: "E-Training Group",
      slug: "e-training-group",
    },
    articles: [
      { title: "Grounding: Why Reconnecting with Earth Could Be a Simple Key to Better Health", slug: "grounding-benefits-health" }
    ]
  },
  {
    problem: "Stress & Emotional Overload",
    category: "Stress & Mental Wellness",
    solutions: [
      { name: "Reiki & Energy Healing Sessions", type: "service", slug: "therapeutic-massage-114", bullets: ["Restores balance to your nervous system", "Releases stored emotional blocks"] },
      { name: "Sound Healing & Somatic Massage", type: "service", slug: "therapeutic-massage-114", bullets: ["Deep physical relaxation and sound vibration integration"] },
      { name: "Breathwork Sessions", type: "service", slug: "therapeutic-massage-114", bullets: ["Guided breathing to regulate cortisol and anxiety"] }
    ],
    vendor: {
      name: "Daniella Hogarth Energy & Wellness",
      slug: "daniella-hogarth-energy-wellness",
    },
    articles: [
      { title: "Fight or Flight — a simple guide to calming your system", slug: "fight-or-flight-—-a-simple-guide-to-calming-your-system" },
      { title: "Why Lifestyle Medicine is the Key to Managing Stress for Busy Professionals", slug: "why-lifestyle-medicine-is-the-key-to-managing-stress-for-busy-professionals" }
    ]
  },
  {
    problem: "Anxiety",
    category: "Stress & Mental Wellness",
    solutions: [
      { name: "Breathwork & Somatic Therapy", type: "service", slug: "therapeutic-massage-114", bullets: ["Release chronic bodily tension", "Calms hyperactive nervous systems"] },
      { name: "Reiki & Emotional Release Work", type: "service", slug: "therapeutic-massage-114", bullets: ["Intuitive energetic block clearing", "Promotes peace and inner safety"] }
    ],
    vendor: {
      name: "Daniella Hogarth Energy & Wellness",
      slug: "daniella-hogarth-energy-wellness",
    },
    articles: [
      { title: "Fight or Flight — a simple guide to calming your system", slug: "fight-or-flight-—-a-simple-guide-to-calming-your-system" }
    ]
  },
  {
    problem: "Trauma Recovery",
    category: "Stress & Mental Wellness",
    solutions: [
      { name: "Somatic Bodywork & NLP", type: "service", slug: "therapeutic-massage-114", bullets: ["Rewire subconscious patterns and body responses"] },
      { name: "Energy Healing", type: "service", slug: "therapeutic-massage-114", bullets: ["Safe environment to process deep emotional events"] },
      { name: "Plant Medicine Retreats Integration", type: "service", slug: "therapeutic-massage-114", bullets: ["Structured professional integration therapy"] }
    ],
    vendor: {
      name: "Daniella Hogarth Energy & Wellness",
      slug: "daniella-hogarth-energy-wellness",
    }
  },
  {
    problem: "Women's Wellness",
    category: "Women's Wellness & Hormones",
    solutions: [
      { name: "Women's Healing Circles", type: "service", slug: "therapeutic-massage-114", bullets: ["Communal healing and heart-centered sharing"] },
      { name: "Emotional Wellness Programs", type: "service", slug: "therapeutic-massage-114", bullets: ["Guided programs to support lifecycle changes"] },
      { name: "Set of 4 Organic Cotton Castor Oil Pads - Reusable Insert for Castor Oil Pads", type: "product", slug: "set-of-4-organic-cotton-castor-oil-pads-reusable-insert-for-castor-oil-wraps-copy", bullets: ["Perfect for hormone balance and liver packs"] },
      { name: "Moisturise, Soothe & Relax Bundle", type: "product", slug: "castor-oil-waist-wrap-roller-bundle", bullets: ["Castor oil waist wrap and rose quartz roller"] }
    ],
    vendor: {
      name: "Daniella Hogarth Energy & Wellness",
      slug: "daniella-hogarth-energy-wellness",
    },
    articles: [
      { title: "7 Best Fitness Apps for Women Over 50", slug: "best-fitness-apps-women-over-50-australia" },
      { title: "The Great Soy Debate: What You Need to Know", slug: "the-great-soy-debate:-what-you-need-to-know" }
    ]
  },
  {
    problem: "Neurodivergent Support",
    category: "Stress & Mental Wellness",
    solutions: [
      {
        name: "Neurodivergent Peer Support Groups & Somatic Sessions",
        type: "service",
        slug: "therapeutic-massage-114",
        bullets: ["Validation and somatic regulation strategies in a neuro-affirming space"],
      }
    ],
    vendor: {
      name: "Daniella Hogarth Energy & Wellness",
      slug: "daniella-hogarth-energy-wellness",
    }
  },
  {
    problem: "Hair Thinning",
    category: "Skin, Hair & Beauty",
    solutions: [
      {
        name: "Watermans Grow Me Shampoo & Conditioner Pack",
        type: "product",
        bullets: ["Premium hair growth formulation", "Biotin, Caffeine, and Rosemary oil based"],
      }
    ],
    vendor: {
      name: "E-Training Group",
      slug: "e-training-group",
    }
  },
  {
    problem: "Hair Loss After Pregnancy",
    category: "Skin, Hair & Beauty",
    solutions: [
      {
        name: "Watermans Grow Me Shampoo & Conditioner Pack",
        type: "product",
        bullets: ["Combats postpartum telogen effluvium", "Fortifies root health and speeds growth"],
      }
    ],
    vendor: {
      name: "E-Training Group",
      slug: "e-training-group",
    }
  },
  {
    problem: "Menopausal Hair Changes",
    category: "Skin, Hair & Beauty",
    solutions: [
      {
        name: "Watermans Grow Me Shampoo & Conditioner Pack",
        type: "product",
        bullets: ["Reduces hormone-related hair thinning and breakage"],
      }
    ],
    vendor: {
      name: "E-Training Group",
      slug: "e-training-group",
    },
    articles: [
      { title: "Gut + Menopause: Why Your Microbiome Matters", slug: "gut-microbiome-menopause-hormone-health" }
    ]
  },
  {
    problem: "Ageing Skin",
    category: "Skin, Hair & Beauty",
    solutions: [
      { name: "Organic Face Cream", type: "product", bullets: ["Locks in natural moisture", "Reduces look of fine lines without chemical fillers"] },
      { name: "Sea buckthorn Hand Cream for Dry Hands", type: "product", slug: "natural-sea-buckthorn-hand-butter", bullets: ["Deep nourishing Sea Buckthorn extracts"] }
    ],
    vendor: {
      name: "Daniella Hogarth Energy & Wellness",
      slug: "daniella-hogarth-energy-wellness",
    },
    articles: [
      { title: "The Surprising Benefits of Banana Peels", slug: "banana-peel-benefits" }
    ]
  },
  {
    problem: "Dry Skin",
    category: "Skin, Hair & Beauty",
    solutions: [
      { name: "Organic Face Cream", type: "product", bullets: ["Intense organic hydration for sensitive skin types"] },
      { name: "Sea buckthorn Hand Cream for Dry Hands", type: "product", slug: "natural-sea-buckthorn-hand-butter", bullets: ["Repairs dry and cracked hands"] },
      { name: "Natural Baby Balm", type: "product", slug: "natural-baby-balm", bullets: ["Perfect for baby dry skin, cradle cap, and eczema"] }
    ],
    vendor: {
      name: "Daniella Hogarth Energy & Wellness",
      slug: "daniella-hogarth-energy-wellness",
    }
  },
  {
    problem: "Natural Skin Care",
    category: "Skin, Hair & Beauty",
    solutions: [
      { name: "Organic Face Cream", type: "product", bullets: ["Toxin-free, plant-derived skincare"] },
      { name: "Sea Buckthorn Lip Balm for Dry Lips", type: "product", slug: "natural-sea-buckthorn-lip-balm", bullets: ["100% natural, chemical-free lip healing"] }
    ],
    vendor: {
      name: "Daniella Hogarth Energy & Wellness",
      slug: "daniella-hogarth-energy-wellness",
    },
    articles: [
      { title: "The Surprising Benefits of Banana Peels", slug: "banana-peel-benefits" }
    ]
  },
  {
    problem: "Building a Wellness Business",
    category: "General Health & Education",
    solutions: [
      {
        name: "Health and Wellness Training & Online Education",
        type: "course",
        bullets: ["Turn your holistic passion into a certified career", "Proven online modules and community support"],
      }
    ],
    vendor: {
      name: "E-Training Group",
      slug: "e-training-group",
    }
  },
  {
    problem: "Holistic Healing",
    category: "Stress & Mental Wellness",
    solutions: [
      { name: "Healing sessions & Energy work", type: "service", slug: "therapeutic-massage-114", bullets: ["Somatic emotional release sessions"] },
      { name: "Centred Spirit Holistic Healing sessions", type: "service", slug: "therapeutic-massage-114", bullets: ["Ancestral healing and restorative meditation"] }
    ],
    vendor: {
      name: "Daniella Hogarth Energy & Wellness",
      slug: "daniella-hogarth-energy-wellness",
    },
    articles: [
      { title: "Grounding: Why Reconnecting with Earth Could Be a Simple Key to Better Health", slug: "grounding-benefits-health" }
    ]
  },
  {
    problem: "Chemical-Free Lifestyle",
    category: "Healthy Home & Cleaning",
    solutions: [
      { name: "Mould Spray", type: "product", bullets: ["Pure essential-oil based mould control", "No chlorine or harsh toxic fumes"] },
      { name: "Multipurpose Spray", type: "product", bullets: ["Natural household sanitiser", "Safe for children and pets"] },
      { name: "Organic Deodorant Aluminium Free", type: "product", slug: "organic-aluminium-free-deodorant-157", bullets: ["Clean underarm care without endocrine disruptors"] }
    ],
    vendor: {
      name: "E-Training Group",
      slug: "e-training-group",
    }
  },
  {
    problem: "Mould in the Home",
    category: "Healthy Home & Cleaning",
    solutions: [
      {
        name: "Mould Spray",
        type: "product",
        bullets: ["Naturally eliminates mould spores", "Formulated with therapeutic-grade tea tree and clove oils"],
      }
    ],
    vendor: {
      name: "E-Training Group",
      slug: "e-training-group",
    }
  },
  {
    problem: "Natural Household Cleaning",
    category: "Healthy Home & Cleaning",
    solutions: [
      {
        name: "Multipurpose Spray",
        type: "product",
        bullets: ["Breaks down grease and dirt with citrus power", "No synthetic chemical residues left behind"],
      }
    ],
    vendor: {
      name: "E-Training Group",
      slug: "e-training-group",
    }
  },
  {
    problem: "Sun Protection (Chemical-Free)",
    category: "Skin, Hair & Beauty",
    solutions: [
      {
        name: "Pure Organic Sun & Sea Cream - Tallow + Non-Nano Zinc Oxide",
        type: "product",
        slug: "sun-and-sea",
        bullets: ["Physical sunscreen using non-nano Zinc Oxide", "Moisturising grass-fed tallow base", "Reef safe & baby safe"],
      }
    ],
    vendor: {
      name: "Catchin’ rays",
      slug: "catchin-rays",
    }
];

export const allGuides = guideMatches.map((match) => ({
  title: match.problem,
  description: `Solutions: ${match.solutions.map(s => s.name).join(", ")}. Vendor: ${match.vendor.name}`,
  slug: match.solutions[0]?.slug || "",
  category: match.category,
  icon: "🔍",
}));

export default function GuidesPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All Categories");

  const filteredMatches = guideMatches.filter((match) => {
    const matchesSearch =
      match.problem.toLowerCase().includes(searchQuery.toLowerCase()) ||
      match.solutions.some(s => s.name.toLowerCase().includes(searchQuery.toLowerCase())) ||
      match.vendor.name.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCategory =
      selectedCategory === "All Categories" || match.category === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  return (
    <div className="bg-background min-h-screen">
      {/* Hero Header */}
      <div className="bg-gradient-to-b from-surface to-background border-b border-border py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <Breadcrumbs items={[{ label: "Problem → Solution → Vendor Guide" }]} />

          <div className="mt-6 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div className="max-w-3xl">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                  <BookOpenCheck className="h-6 w-6 text-primary" />
                </div>
                <h1 className="text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
                  Problem → Solution → Vendor Guide
                </h1>
              </div>
              <p className="mt-3 text-lg text-muted-foreground leading-relaxed">
                Your directory for lifestyle medicine. Easily match symptoms or goals to evidence-based products, professional services, and trusted local vendors.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Directory Filters & Body */}
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        
        {/* Controls Layout */}
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between pb-8 border-b border-border">
          {/* Search bar */}
          <div className="relative w-full max-w-md">
            <Search className="absolute left-4 top-3 h-5 w-5 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search by problem, solution or vendor..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-11 pr-4 py-2.5 rounded-xl border border-border bg-card text-foreground shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all placeholder:text-muted-foreground/60"
            />
          </div>

          {/* Categories select or scroll */}
          <div className="flex flex-wrap gap-2 items-center">
            <span className="text-sm font-semibold text-muted-foreground flex items-center gap-1.5 mr-2">
              <Filter className="h-4 w-4" /> Filter:
            </span>
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                  selectedCategory === cat
                    ? "bg-primary text-primary-foreground shadow-md"
                    : "bg-card border border-border text-muted-foreground hover:border-muted hover:text-foreground"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Directory Grid */}
        <div className="mt-8">
          <AnimatePresence mode="popLayout">
            {filteredMatches.length > 0 ? (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {filteredMatches.map((match, idx) => (
                  <motion.div
                    key={match.problem}
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.3, delay: Math.min(idx * 0.05, 0.3) }}
                    className="flex flex-col h-full rounded-2xl border border-border bg-card p-6 shadow-soft hover:shadow-card hover:border-primary/10 transition-all duration-300 relative overflow-hidden group"
                  >
                    {/* Top Accent line & Category pill */}
                    <div className="absolute top-0 left-0 w-full h-[3px] bg-gradient-to-r from-primary/30 to-wellness/30 group-hover:from-primary group-hover:to-wellness transition-all duration-500" />
                    
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-primary bg-primary/5 px-2.5 py-1 rounded-full">
                        {match.category}
                      </span>
                    </div>

                    {/* Problem statement */}
                    <div className="mt-4">
                      <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground/80">If you experience:</span>
                      <h2 className="text-xl font-extrabold text-foreground group-hover:text-primary transition-colors mt-0.5">
                        {match.problem}
                      </h2>
                    </div>

                    {/* Solution Details */}
                    <div className="mt-5 flex-1 space-y-4">
                      <div>
                        <span className="text-xs font-bold uppercase tracking-wider text-primary">Recommended Solutions:</span>
                        <div className="mt-2 space-y-3">
                          {match.solutions.map((sol, sidx) => (
                            <div key={sidx} className="bg-surface/50 border border-border/60 rounded-xl p-3.5 hover:border-primary/20 transition-all">
                              {sol.slug ? (
                                <Link
                                  href={`/${sol.type === "service" ? "services" : "products"}/${sol.slug}`}
                                  className="group/sol flex items-center justify-between text-sm font-bold text-foreground hover:text-primary transition-colors"
                                >
                                  <span>{sol.name}</span>
                                  <ExternalLink className="h-3.5 w-3.5 opacity-60 group-hover/sol:opacity-100 transition-opacity" />
                                </Link>
                              ) : (
                                <div className="text-sm font-bold text-foreground">
                                  {sol.name}
                                </div>
                              )}
                              {sol.bullets && sol.bullets.length > 0 && (
                                <ul className="mt-1.5 space-y-1 pl-1">
                                  {sol.bullets.map((bullet, bidx) => (
                                    <li key={bidx} className="text-xs text-muted-foreground flex items-start gap-1.5 leading-relaxed">
                                      <span className="text-primary mt-1">•</span>
                                      <span>{bullet}</span>
                                    </li>
                                  ))}
                                </ul>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Vendor */}
                      <div className="pt-2 border-t border-border/40">
                        <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground/80">Trusted Vendor:</span>
                        <div className="mt-1.5 flex items-center justify-between">
                          {match.vendor.slug ? (
                            <Link
                              href={`/vendors/${match.vendor.slug}`}
                              className="text-sm font-semibold text-primary hover:underline flex items-center gap-1.5"
                            >
                              <span>{match.vendor.name}</span>
                              <ArrowRight className="h-3 w-3" />
                            </Link>
                          ) : (
                            <span className="text-sm font-semibold text-foreground">
                              {match.vendor.name}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Articles related */}
                    {match.articles && match.articles.length > 0 && (
                      <div className="mt-5 pt-4 border-t border-border/60">
                        <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground/80">Related Reading:</span>
                        <div className="mt-2 space-y-2">
                          {match.articles.map((art) => (
                            <Link
                              key={art.slug}
                              href={`/articles/${art.slug}`}
                              className="block text-xs font-medium text-muted-foreground hover:text-primary transition-colors bg-surface/30 px-3 py-2 rounded-lg border border-border/30 hover:border-primary/20"
                            >
                              {art.title}
                            </Link>
                          ))}
                        </div>
                      </div>
                    )}
                  </motion.div>
                ))}
              </div>
            ) : (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex flex-col items-center justify-center py-16 px-4 text-center rounded-2xl border border-dashed border-border bg-card"
              >
                <ShieldAlert className="h-10 w-10 text-muted-foreground/60" />
                <h3 className="mt-4 text-lg font-bold text-foreground">No matches found</h3>
                <p className="mt-2 text-sm text-muted-foreground max-w-sm">
                  We couldn&apos;t find any problem matches for &quot;{searchQuery}&quot;. Try adjusting your keywords.
                </p>
                <button
                  onClick={() => {
                    setSearchQuery("");
                    setSelectedCategory("All Categories");
                  }}
                  className="mt-4 text-sm font-semibold text-primary hover:underline cursor-pointer"
                >
                  Clear all filters
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
