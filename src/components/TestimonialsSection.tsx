const testimonials = [
  {
    name: "Sarah Mitchell",
    role: "Wellness Coach",
    content:
      "Lifestyle Medicine Gateway has transformed how I discover wellness products. The curated selection and trusted vendors make it my go-to marketplace.",
    rating: 5,
    avatar: "SM",
  },
  {
    name: "David Chen",
    role: "Fitness Instructor",
    content:
      "As a vendor, I've been able to reach a community that truly values quality health products. The platform is beautifully designed and easy to manage.",
    rating: 5,
    avatar: "DC",
  },
  {
    name: "Emily Rogers",
    role: "Nutritionist",
    content:
      "The articles and recipes section is a goldmine of evidence-based wellness content. I recommend this platform to all my clients.",
    rating: 5,
    avatar: "ER",
  },
  {
    name: "James Park",
    role: "Yoga Practitioner",
    content:
      "Finally a marketplace that understands lifestyle medicine. The product quality is consistently excellent and delivery is always smooth.",
    rating: 4,
    avatar: "JP",
  },
];

function StarRating({ count }: { count: number }) {
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <svg
          key={i}
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill={i < count ? "currentColor" : "none"}
          stroke="currentColor"
          strokeWidth="2"
          className={i < count ? "text-warm" : "text-border"}
        >
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
        </svg>
      ))}
    </div>
  );
}

export function TestimonialsSection() {
  return (
    <section className="py-16 sm:py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h2 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            Loved by Our Community
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            See what wellness enthusiasts are saying
          </p>
        </div>

        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {testimonials.map((t) => (
            <div
              key={t.name}
              className="relative rounded-xl border border-border bg-card p-6 shadow-soft transition-all duration-300 hover:shadow-card"
            >
              {/* Quote mark */}
              <svg
                className="absolute right-4 top-4 h-8 w-8 text-primary/10"
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h3.983v10h-9.983z" />
              </svg>
              <StarRating count={t.rating} />
              <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
                "{t.content}"
              </p>
              <div className="mt-5 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                  {t.avatar}
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">{t.name}</p>
                  <p className="text-xs text-muted-foreground">{t.role}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
