const fs = require('fs');

const newGuideMatchesStr = `const guideMatches: GuideMatch[] = [
  {
    problem: "Parasites",
    category: "Gut & Digestion",
    solutions: [
      {
        name: "ParaTox - Parasite and Worm Cleanse",
        type: "product",
        slug: "paratox-parasite-and-worm-cleanse",
        bullets: ["Comprehensive gut health support", "Step-by-step detoxification plan"],
      },
      {
        name: "Qenda Ultimate Fibre - Bowel & Parasite Cleanse",
        type: "product",
        slug: "qenda-ultimate-fibre-bowel-parasite-cleanse",
        bullets: ["Supports bowel maintenance", "Rich in dietary fibre"],
      }
    ],
    vendor: {
      name: "Daniella Hogarth Energy & Wellness",
      slug: "f575958c-804b-4a51-ba44-a923275fe53d",
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
        name: "Mind Your Gut Health",
        type: "product",
        slug: "mind-your-gut-health",
        bullets: ["Digestive enzymes", "Probiotic support", "Essential trace nutrients for gut lining"],
      },
      {
        name: "Kombucha Starter",
        type: "product",
        slug: "kombucha-starter",
        bullets: ["Naturally fermented probiotics", "Support daily microbiome diversity"],
      }
    ],
    vendor: {
      name: "Daniella Hogarth Energy & Wellness",
      slug: "f575958c-804b-4a51-ba44-a923275fe53d",
    },
    articles: [
      { title: "Brain Fog and the Foods That May Be Making It Worse", slug: "brain-fog-and-the-foods-that-may-be-making-it-worse" },
    ]
  },
  {
    problem: "Nutritional Deficiencies",
    category: "Healthy Ageing & Longevity",
    solutions: [
      { name: "Colloidal Silver", type: "product", slug: "colloidal-silver", bullets: ["Enhanced nutrient absorption support"] },
      { name: "Magnesium Oil Spray", type: "product", slug: "magnesium-oil-spray", bullets: ["Broad-spectrum mineral blend"] },
      { name: "Turmeric Latte\`100g", type: "product", slug: "turmeric-latte-100g", bullets: ["Targeted health supplementation"] }
    ],
    vendor: {
      name: "Daniella Hogarth Energy & Wellness",
      slug: "f575958c-804b-4a51-ba44-a923275fe53d",
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
        name: "Revive Tonic",
        type: "product",
        slug: "revive-tonic",
        bullets: ["Essential fatty acids for brain function", "Supports cognitive clarity and memory"],
      }
    ],
    vendor: {
      name: "Daniella Hogarth Energy & Wellness",
      slug: "f575958c-804b-4a51-ba44-a923275fe53d",
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
        name: "Beef Bone Broth",
        type: "product",
        slug: "beef-bone-broth",
        bullets: ["Cardiovascular cell support", "High-quality essential fatty acids (EFAs)"],
      }
    ],
    vendor: {
      name: "Daniella Hogarth Energy & Wellness",
      slug: "f575958c-804b-4a51-ba44-a923275fe53d",
    }
  },
  {
    problem: "Healthy Ageing",
    category: "Healthy Ageing & Longevity",
    solutions: [
      { name: "Celtic Knot Set", type: "product", slug: "celtic-knot-set", bullets: ["Supports heart and brain longevity"] },
      { name: "Tallow Balm Bundle", type: "product", slug: "tallow-balm-bundle", bullets: ["Targeted antioxidants and cellular recovery"] }
    ],
    vendor: {
      name: "A Better",
      slug: "a1dfc727-c3c7-40b9-916f-32ded47e20dc",
    },
    articles: [
      { title: "Can Plums Help Fight Cancer? What Science Says About Their Anti-Cancer Properties", slug: "plums-cancer-prevention" }
    ]
  },
  {
    problem: "Joint Discomfort",
    category: "Healthy Ageing & Longevity",
    solutions: [
      { name: "Pure Copper Magnetic Therapy Bracelet - Celtic Knot Design", type: "product", slug: "pure-copper-magnetic-therapy-bracelet-celtic-knot-design", bullets: ["Celtic Knot Design in Pure Copper", "Integrated therapeutic magnets"] },
      { name: "Pure Copper Magnetic Therapy Ring - Celtic Knot", type: "product", slug: "pure-copper-magnetic-therapy-ring-celtic-knot-standard-size", bullets: ["Matching ring with therapeutic Neodymium magnets"] }
    ],
    vendor: {
      name: "A Better",
      slug: "a1dfc727-c3c7-40b9-916f-32ded47e20dc",
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
        name: "Self-Care Renew Bundle",
        type: "product",
        slug: "self-care-renew-bundle",
        bullets: ["Promotes cell recovery and relaxes muscles"],
      }
    ],
    vendor: {
      name: "A Better",
      slug: "a1dfc727-c3c7-40b9-916f-32ded47e20dc",
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
        name: "Castor Oil Wellness Bundle",
        type: "product",
        slug: "castor-oil-bundle",
        bullets: ["Soothes aches, spasms, and muscle soreness"],
      }
    ],
    vendor: {
      name: "A Better",
      slug: "a1dfc727-c3c7-40b9-916f-32ded47e20dc",
    },
    articles: [
      { title: "Connecting with the Earth: Grounding, PEMF & Infrared Explained", slug: "connecting-with-the-earth:" }
    ]
  },
  {
    problem: "General Wellness",
    category: "Healthy Ageing & Longevity",
    solutions: [
      { name: "Pure Stainless Steel Double Wall Insulated Water Bottle", type: "product", slug: "pure-stainless-steel-double-wall-insulated-water-bottle", bullets: ["Ditch plastic, keep hot/cold liquids insulated"] },
      { name: "Rose Quartz Roller Set", type: "product", slug: "rose-quartz-roller-set", bullets: ["Daily restorative body therapy"] }
    ],
    vendor: {
      name: "A Better",
      slug: "a1dfc727-c3c7-40b9-916f-32ded47e20dc",
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
      slug: "f575958c-804b-4a51-ba44-a923275fe53d",
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
      slug: "f575958c-804b-4a51-ba44-a923275fe53d",
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
      slug: "f575958c-804b-4a51-ba44-a923275fe53d",
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
      name: "A Better",
      slug: "a1dfc727-c3c7-40b9-916f-32ded47e20dc",
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
      slug: "f575958c-804b-4a51-ba44-a923275fe53d",
    }
  },
  {
    problem: "Hair Thinning",
    category: "Skin, Hair & Beauty",
    solutions: [
      {
        name: "Organic Castor Oil 300ml",
        type: "product",
        slug: "organic-castor-oil-300ml",
        bullets: ["Premium hair growth formulation", "Rosemary oil based"],
      }
    ],
    vendor: {
      name: "Daniella Hogarth Energy & Wellness",
      slug: "f575958c-804b-4a51-ba44-a923275fe53d",
    }
  },
  {
    problem: "Hair Loss After Pregnancy",
    category: "Skin, Hair & Beauty",
    solutions: [
      {
        name: "Organic Castor Oil 300ml",
        type: "product",
        slug: "organic-castor-oil-300ml",
        bullets: ["Combats postpartum telogen effluvium", "Fortifies root health and speeds growth"],
      }
    ],
    vendor: {
      name: "Daniella Hogarth Energy & Wellness",
      slug: "f575958c-804b-4a51-ba44-a923275fe53d",
    }
  },
  {
    problem: "Menopausal Hair Changes",
    category: "Skin, Hair & Beauty",
    solutions: [
      {
        name: "Organic Face Cream 120ml",
        type: "product",
        slug: "organic-face-cream-120ml",
        bullets: ["Reduces hormone-related hair thinning and breakage"],
      }
    ],
    vendor: {
      name: "Daniella Hogarth Energy & Wellness",
      slug: "f575958c-804b-4a51-ba44-a923275fe53d",
    },
    articles: [
      { title: "Gut + Menopause: Why Your Microbiome Matters", slug: "gut-microbiome-menopause-hormone-health" }
    ]
  },
  {
    problem: "Ageing Skin",
    category: "Skin, Hair & Beauty",
    solutions: [
      { name: "Organic Face Cream 120ml", type: "product", slug: "organic-face-cream-120ml", bullets: ["Locks in natural moisture", "Reduces look of fine lines without chemical fillers"] },
      { name: "Pure Organic Tallow Balm - Unscented 60 mL", type: "product", slug: "pure-organic-tallow-balm", bullets: ["Deep nourishing extracts"] }
    ],
    vendor: {
      name: "A Better",
      slug: "a1dfc727-c3c7-40b9-916f-32ded47e20dc",
    },
    articles: [
      { title: "The Surprising Benefits of Banana Peels", slug: "banana-peel-benefits" }
    ]
  },
  {
    problem: "Dry Skin",
    category: "Skin, Hair & Beauty",
    solutions: [
      { name: "Organic Face Cream 120ml", type: "product", slug: "organic-face-cream-120ml", bullets: ["Intense organic hydration for sensitive skin types"] },
      { name: "Pure Organic Tallow Balm - Unscented 60 mL", type: "product", slug: "pure-organic-tallow-balm", bullets: ["Repairs dry and cracked hands"] }
    ],
    vendor: {
      name: "A Better",
      slug: "a1dfc727-c3c7-40b9-916f-32ded47e20dc",
    }
  },
  {
    problem: "Natural Skin Care",
    category: "Skin, Hair & Beauty",
    solutions: [
      { name: "Organic Face Cream 120ml", type: "product", slug: "organic-face-cream-120ml", bullets: ["Toxin-free, plant-derived skincare"] }
    ],
    vendor: {
      name: "Daniella Hogarth Energy & Wellness",
      slug: "f575958c-804b-4a51-ba44-a923275fe53d",
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
        name: "Holistic Therapy including somatic (embodiment) work",
        type: "service",
        slug: "holistic-therapy-including-somatic-embodiment-work",
        bullets: ["Turn your holistic passion into a certified career", "Proven online modules and community support"],
      }
    ],
    vendor: {
      name: "Centred Spirit Holistic Healing",
      slug: "0369fcb3-c44d-48b5-a01e-4a99025427f6",
    }
  },
  {
    problem: "Holistic Healing",
    category: "Stress & Mental Wellness",
    solutions: [
      { name: "Intuitive Reiki Session - 60 minutes", type: "service", slug: "intuitive-reiki-session-60-minutes", bullets: ["Somatic emotional release sessions"] },
      { name: "Holistic Therapy plus Reiki", type: "service", slug: "holistic-therapy-plus-reiki", bullets: ["Ancestral healing and restorative meditation"] }
    ],
    vendor: {
      name: "Centred Spirit Holistic Healing",
      slug: "0369fcb3-c44d-48b5-a01e-4a99025427f6",
    },
    articles: [
      { title: "Grounding: Why Reconnecting with Earth Could Be a Simple Key to Better Health", slug: "grounding-benefits-health" }
    ]
  },
  {
    problem: "Chemical-Free Lifestyle",
    category: "Healthy Home & Cleaning",
    solutions: [
      { name: "Mould Spray (500 ML)", type: "product", slug: "mould-spray-500-ml", bullets: ["Pure essential-oil based mould control", "No chlorine or harsh toxic fumes"] },
      { name: "Multipurpose Spray (500 ML)", type: "product", slug: "multipurpose-spray-500-ml", bullets: ["Natural household sanitiser", "Safe for children and pets"] },
      { name: "Introductory Pack", type: "product", slug: "introductory-pack", bullets: ["Clean household care"] }
    ],
    vendor: {
      name: "Noosa Nude",
      slug: "081fc2f3-7dab-4273-a5fe-02e46cf82277",
    }
  },
  {
    problem: "Mould in the Home",
    category: "Healthy Home & Cleaning",
    solutions: [
      {
        name: "Mould Spray (500 ML)",
        type: "product",
        slug: "mould-spray-500-ml",
        bullets: ["Naturally eliminates mould spores", "Formulated with therapeutic-grade tea tree and clove oils"],
      }
    ],
    vendor: {
      name: "Noosa Nude",
      slug: "081fc2f3-7dab-4273-a5fe-02e46cf82277",
    }
  },
  {
    problem: "Natural Household Cleaning",
    category: "Healthy Home & Cleaning",
    solutions: [
      {
        name: "Multi Purpose Spray - Lemon Myrtle 500ml",
        type: "product",
        slug: "multi-purpose-spray-lemon-myrtle-500ml",
        bullets: ["Breaks down grease and dirt with citrus power", "No synthetic chemical residues left behind"],
      },
      {
        name: "Super Concentrate - Lemon Myrtle 500ml",
        type: "product",
        slug: "super-concentrate-lemon-myrtle-500ml",
        bullets: ["Concentrated natural cleaning power"],
      }
    ],
    vendor: {
      name: "Go Organic Shopping Australia",
      slug: "cf2123af-eeb6-42eb-b1e4-737796f9c356",
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
      name: "A Better",
      slug: "a1dfc727-c3c7-40b9-916f-32ded47e20dc",
    }
  },
];`;

const content = fs.readFileSync('app/guides/page.tsx', 'utf8');
const startIdx = content.indexOf('const guideMatches: GuideMatch[] = [');
const endIdx = content.indexOf('];', startIdx) + 2;

const newContent = content.substring(0, startIdx) + newGuideMatchesStr + content.substring(endIdx);
fs.writeFileSync('app/guides/page.tsx', newContent);
console.log('Successfully updated page.tsx');
