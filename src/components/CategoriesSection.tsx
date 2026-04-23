import { useNavigate } from "@tanstack/react-router";

const categories = [
  { name: "Nutrition", icon: "🥗", count: 142 },
  { name: "Fitness", icon: "💪", count: 98 },
  { name: "Mental Health", icon: "🧠", count: 76 },
  { name: "Supplements", icon: "💊", count: 215 },
  { name: "Yoga & Meditation", icon: "🧘", count: 64 },
  { name: "Coaching", icon: "🎯", count: 53 },
  { name: "Skincare", icon: "✨", count: 87 },
  { name: "Sleep", icon: "😴", count: 41 },
];

export function CategoriesSection() {
  const navigate = useNavigate();

  const handleCategoryClick = (category: string) => {
    navigate({ to: "/products", search: { q: "", category, page: 1 } });
  };

  return (
    <section className="py-16 sm:py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h2 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            Browse by Category
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Find exactly what you need for your wellness journey
          </p>
        </div>

        <div className="mt-10 grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-4 lg:gap-4">
          {categories.map((cat) => (
            <button
              key={cat.name}
              onClick={() => handleCategoryClick(cat.name)}
              className="group flex flex-col items-center gap-3 rounded-xl border border-border bg-card p-5 shadow-soft transition-all duration-300 hover:-translate-y-0.5 hover:shadow-card"
            >
              <span className="text-3xl">{cat.icon}</span>
              <div className="text-center">
                <p className="text-sm font-semibold text-card-foreground group-hover:text-primary transition-colors">
                  {cat.name}
                </p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {cat.count} listings
                </p>
              </div>
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
