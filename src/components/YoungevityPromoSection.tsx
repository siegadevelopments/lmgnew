import { Button } from "@/components/ui/button";
import { ExternalLink } from "lucide-react";

const AFFILIATE_BASE = "https://etraininggroup.youngevity.com/au_en";
const REGISTER_URL = `${AFFILIATE_BASE}/join/process/`;

const promos = [
  {
    id: 1,
    title: "Anti-Aging Healthy Body Pak™ 2.0",
    description: "Beyond Tangy Tangerine® 2.0 + Ultimate EFA Plus™ + Beyond Osteo-fx™ + Cell Shield RTQ™",
    price: 227.59,
    originalPrice: 284.89,
    url: `${AFFILIATE_BASE}/anti-aging-healthy-body-pak-2-0.html`,
    image: "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=800&q=80",
    badge: "Best Seller",
  },
  {
    id: 2,
    title: "Healthy Body Bone and Joint Pak™ 2.0",
    description: "Targeted support for bones, cartilage, and joint mobility with 90 essential nutrients.",
    price: 257.84,
    originalPrice: 322.29,
    url: `${AFFILIATE_BASE}/healthy-body-bone-and-joint-pak-2-0.html`,
    image: "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=800&q=80",
    badge: "Popular",
  },
  {
    id: 3,
    title: "Healthy Body Brain and Heart Pak™ 2.0",
    description: "Supports cognitive function, cardiovascular health, and mental clarity.",
    price: 266.09,
    originalPrice: 333.29,
    url: `${AFFILIATE_BASE}/healthy-body-brain-and-heart-pak-2-0.html`,
    image: "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=800&q=80",
    badge: null,
  },
  {
    id: 4,
    title: "Healthy Body Digestion Pak™ 2.0",
    description: "Promotes healthy gut flora, digestion, and nutrient absorption.",
    price: 245.08,
    originalPrice: 306.89,
    url: `${AFFILIATE_BASE}/healthy-body-digestion-pak-2-0.html`,
    image: "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=800&q=80",
    badge: null,
  },
  {
    id: 5,
    title: "Healthy Body Start Pak 2.0 Liquid Osteo",
    description: "The perfect starter kit — Tangy Tangerine + Liquid Osteo-fx + EFA Plus.",
    price: 184.36,
    originalPrice: 230.99,
    url: `${AFFILIATE_BASE}/healthy-body-start-pak-2-0-liquid-osteo.html`,
    image: "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=800&q=80",
    badge: "Great Value",
  },
];

// Gradient placeholder colors for when images fail to load
const gradients = [
  "from-orange-400 to-amber-500",
  "from-teal-400 to-emerald-500",
  "from-violet-400 to-purple-500",
  "from-sky-400 to-blue-500",
  "from-rose-400 to-pink-500",
];

export function YoungevityPromoSection() {
  return (
    <section className="bg-background py-16 sm:py-20 border-t border-border">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-10 text-center">
          <span className="inline-block rounded-full bg-primary/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-primary mb-3">
            Affiliate Partner
          </span>
          <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Get 20% off your Youngevity orders when registered
          </h2>
          <p className="mt-3 text-muted-foreground max-w-xl mx-auto text-sm">
            Dr. Wallach's 90 essential nutrients — clinically formulated Healthy Body Paks delivered to your door.
          </p>
          <div className="mt-5 flex items-center justify-center gap-3 flex-wrap">
            <Button
              variant="wellness"
              className="gap-2"
              onClick={() => window.open(REGISTER_URL, "_blank", "noopener,noreferrer")}
            >
              <ExternalLink className="h-4 w-4" />
              Register now!
            </Button>
            <Button
              variant="outline"
              className="gap-2"
              onClick={() => window.open(AFFILIATE_BASE, "_blank", "noopener,noreferrer")}
            >
              Browse all products
            </Button>
          </div>
        </div>

        {/* Product Cards */}
        <div className="mt-10 flex gap-4 overflow-x-auto pb-6 scrollbar-hide -mx-4 px-4 sm:mx-0 sm:px-0 sm:grid sm:gap-5 sm:overflow-x-visible sm:pb-0 sm:grid-cols-2 lg:grid-cols-5">
          {promos.map((promo, idx) => (
            <a
              key={promo.id}
              href={promo.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-none w-[42%] sm:w-auto group flex flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-soft transition-all duration-300 hover:-translate-y-1 hover:shadow-card hover:border-primary/20"
            >
              {/* Image */}
              <div className="relative overflow-hidden bg-muted aspect-square">
                <img
                  src={promo.image}
                  alt={promo.title}
                  className="h-full w-full object-contain p-3 transition-transform duration-500 group-hover:scale-105"
                  onError={(e) => {
                    const img = e.target as HTMLImageElement;
                    img.style.display = "none";
                    const parent = img.parentElement;
                    if (parent && !parent.querySelector(".fallback-bg")) {
                      const div = document.createElement("div");
                      div.className = `fallback-bg absolute inset-0 bg-gradient-to-br ${gradients[idx]} flex flex-col items-center justify-center p-4`;
                      const icon = document.createElement("div");
                      icon.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" fill="none" viewBox="0 0 24 24" stroke="white" stroke-width="1.5"><path stroke-linecap="round" stroke-linejoin="round" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z"/></svg>`;
                      icon.className = "text-white";
                      div.appendChild(icon);
                      parent.appendChild(div);
                    }
                  }}
                />
                {/* Sale badge */}
                <div className="absolute top-2 left-2 rounded-full bg-red-500 px-2 py-0.5 text-[10px] font-bold text-white uppercase tracking-wider shadow-sm">
                  Sale
                </div>
                {promo.badge && (
                  <div className="absolute top-2 right-2 rounded-full bg-primary px-2 py-0.5 text-[10px] font-bold text-primary-foreground uppercase tracking-wider shadow-sm">
                    {promo.badge}
                  </div>
                )}
              </div>

              {/* Content */}
              <div className="flex flex-1 flex-col p-4">
                <h3 className="text-xs font-semibold text-card-foreground group-hover:text-primary transition-colors line-clamp-2 min-h-[2.5rem]">
                  {promo.title}
                </h3>
                <p className="mt-1.5 text-[10px] text-muted-foreground line-clamp-2 leading-relaxed">
                  {promo.description}
                </p>
                <div className="mt-3 flex items-center gap-2">
                  <span className="text-sm font-bold text-foreground">
                    ${promo.price.toFixed(2)}
                  </span>
                  <span className="text-xs text-muted-foreground line-through">
                    ${promo.originalPrice.toFixed(2)}
                  </span>
                  <span className="ml-auto text-[10px] font-bold text-emerald-600">
                    {Math.round((1 - promo.price / promo.originalPrice) * 100)}% off
                  </span>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-3 w-full text-xs group-hover:bg-primary group-hover:text-primary-foreground group-hover:border-primary transition-colors"
                  onClick={(e) => {
                    e.preventDefault();
                    window.open(promo.url, "_blank", "noopener,noreferrer");
                  }}
                >
                  Buy now
                </Button>
              </div>
            </a>
          ))}
        </div>

        {/* Affiliate disclaimer */}
        <p className="mt-8 text-center text-xs text-muted-foreground/60">
          Affiliate disclosure: We may earn a commission on purchases made through these links.
        </p>
      </div>
    </section>
  );
}
