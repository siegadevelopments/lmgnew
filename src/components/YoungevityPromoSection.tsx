import { Button } from "@/components/ui/button";

const promos = [
  {
    id: 1,
    title: "Anti-Aging Healthy Body Pak™ 2.0",
    image: "https://lifestylemedicinegateway.com/wp-content/uploads/2026/03/anti-aging-pak.jpg",
    price: 227.59,
    originalPrice: 284.89,
    url: "https://etraininggroup.youngevity.com/au_en/anti-aging-healthy-body-pak-2-0.html",
  },
  {
    id: 2,
    title: "Healthy Body Bone and Joint Pak™ 2.0",
    image: "https://lifestylemedicinegateway.com/wp-content/uploads/2026/03/bone-joint-pak.jpg",
    price: 257.84,
    originalPrice: 322.29,
    url: "https://etraininggroup.youngevity.com/au_en/healthy-body-bone-and-joint-pak-2-0.html",
  },
  {
    id: 3,
    title: "Healthy Body Brain and Heart Pak™ 2.0",
    image: "https://lifestylemedicinegateway.com/wp-content/uploads/2026/03/brain-heart-pak.jpg",
    price: 266.09,
    originalPrice: 333.29,
    url: "https://etraininggroup.youngevity.com/au_en/healthy-body-brain-and-heart-pak-2-0.html",
  },
  {
    id: 4,
    title: "Healthy Body Digestion Pak™ 2.0",
    image: "https://lifestylemedicinegateway.com/wp-content/uploads/2026/03/digestion-pak.jpg",
    price: 245.08,
    originalPrice: 306.89,
    url: "https://etraininggroup.youngevity.com/au_en/healthy-body-digestion-pak-2-0.html",
  },
  {
    id: 5,
    title: "Healthy Body Start Pak 2.0 Liquid Osteo",
    image: "https://lifestylemedicinegateway.com/wp-content/uploads/2026/03/start-pak.jpg",
    price: 184.36,
    originalPrice: 230.99,
    url: "https://etraininggroup.youngevity.com/au_en/healthy-body-start-pak-2-0-liquid-osteo.html",
  },
];

export function YoungevityPromoSection() {
  return (
    <section className="bg-background py-16 sm:py-20 border-t border-border">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-10 text-center">
          <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Get 20% off on your youngevity orders when registered
          </h2>
          <Button
            variant="wellness"
            className="mt-6"
            onClick={() => window.open("https://etraininggroup.youngevity.com/au_en/join/process/", "_blank")}
          >
            Register now!
          </Button>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-5">
          {promos.map((promo) => (
            <div
              key={promo.id}
              className="group flex flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-soft transition-all duration-300 hover:-translate-y-1 hover:shadow-card"
            >
              <div className="relative aspect-square overflow-hidden bg-muted">
                <img
                  src={promo.image}
                  alt={promo.title}
                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=800&q=80";
                  }}
                />
                <div className="absolute top-2 left-2 rounded-full bg-red-500 px-2 py-1 text-[10px] font-bold text-white uppercase tracking-wider">
                  Sale
                </div>
              </div>
              <div className="flex flex-1 flex-col p-4">
                <h3 className="text-xs font-medium text-card-foreground group-hover:text-primary transition-colors line-clamp-2 min-h-[2.5rem]">
                  {promo.title}
                </h3>
                <div className="mt-2 flex items-center gap-2">
                  <span className="text-sm font-bold text-foreground">
                    ${promo.price.toFixed(2)}
                  </span>
                  <span className="text-xs text-muted-foreground line-through">
                    ${promo.originalPrice.toFixed(2)}
                  </span>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-4 w-full text-xs"
                  onClick={() => window.open(promo.url, "_blank")}
                >
                  Buy now
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
