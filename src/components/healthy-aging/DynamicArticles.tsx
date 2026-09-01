import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

// Curated fallback articles from the real database
const fallbackArticles = [
  {
    id: "122",
    title: "7 Natural Ways to Support Your Immune System",
    category_name: "General",
    excerpt: "Give your immune system the natural support it deserves. Discover 7 science-backed ways to nurture your wellbeing every day.",
    image_url: "https://media.lifestylemedicinegateway.com/ai-thumbnails/1786924496914.jpeg",
    slug: "7-natural-ways-to-support-your-immune-system-7068",
  },
  {
    id: "114",
    title: "Brain Fog",
    category_name: "Natural Remedies",
    excerpt: "Is brain fog clouding your clarity? Discover gentle, natural ways to support your mind through menopause, from Lion's Mane to hydration.",
    image_url: "https://media.lifestylemedicinegateway.com/ai-thumbnails/1784877660537.jpeg",
    slug: "brain-fog-1795",
  },
  {
    id: "121",
    title: "Leafy Greens for the Heart",
    category_name: "General",
    excerpt: "Curious why leafy greens are a heart hero? Discover how these everyday veggies naturally support healthy blood flow and keep your ticker happy.",
    image_url: "https://media.lifestylemedicinegateway.com/admin_uploads/1786510094465_mel-elias-e2ZNgrXmZgM-unsplash.jpg",
    slug: "leafy-greens-for-the-heart-7183",
  },
  {
    id: "120",
    title: "Why Green Foods Deserve a Place on Your Plate",
    category_name: "General",
    excerpt: "Discover how the goodness of green foods can naturally support your energy, cells, and overall health through menopause and beyond.",
    image_url: "https://media.lifestylemedicinegateway.com/admin_uploads/1785747741142_Gemini_Generated_Image_cg9dkucg9dkucg9d.png",
    slug: "why-green-foods-deserve-a-place-on-your-plate-2169",
  },
  {
    id: "118",
    title: "Restless Legs",
    category_name: "Natural Remedies",
    excerpt: "Restless legs bothering you during menopause? Explore supportive options, from homeopathic remedies to nutritional insights, for more peaceful nights.",
    image_url: "https://media.lifestylemedicinegateway.com/admin_uploads/1784877916759_kyle-kranz-ss1YP57gLbM-unsplash.jpg",
    slug: "restless-legs-4407",
  },
  {
    id: "119",
    title: "How to Support Your Health Naturally Without Spending a Fortune",
    category_name: "General",
    excerpt: "Health needn't break the bank! Discover simple, natural ways to support your wellbeing through menopause without spending a fortune.",
    image_url: "https://media.lifestylemedicinegateway.com/admin_uploads/1785746329786_health-bank.png",
    slug: "how-to-support-your-health-naturally-without-spending-a-fortune-9839",
  },
];

export async function DynamicArticles() {
  let articles = fallbackArticles;

  try {
    const { data, error } = await (supabaseAdmin.from("articles" as any) as any)
      .select("id, title, slug, excerpt, category_name, image_url")
      .eq("status", "published")
      .order("created_at", { ascending: false })
      .limit(6);

    if (!error && data && data.length >= 3) {
      articles = data.map((a: any) => ({
        id: String(a.id),
        title: a.title,
        category_name: a.category_name || "Articles",
        excerpt: a.excerpt || "",
        image_url: a.image_url || "",
        slug: a.slug,
      }));
    }
  } catch (err) {
    // Use fallback
  }

  return (
    <section className="py-20 bg-white">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row justify-between items-end mb-12 max-w-6xl mx-auto">
          <div className="max-w-2xl">
            <div className="inline-block px-3 py-1 rounded-full bg-teal-50 text-teal-700 text-sm font-semibold mb-4">
              From Our Library
            </div>
            <h2 className="text-3xl md:text-4xl font-bold font-playfair text-teal-900 mb-4">
              Evidence-Based Health Guides
            </h2>
            <p className="text-gray-600">
              Explore our growing collection of articles on natural remedies, nutrition, and lifestyle medicine — all backed by research.
            </p>
          </div>
          <Link href="/articles" className="hidden md:flex items-center text-teal-700 font-semibold hover:text-teal-900 transition-colors">
            Browse All Articles <ArrowRight className="w-4 h-4 ml-2" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {articles.slice(0, 6).map((article) => (
            <article key={article.id} className="group cursor-pointer">
              <Link href={`/articles/${article.slug}`} className="block">
                <div className="relative h-56 w-full mb-5 overflow-hidden rounded-2xl">
                  {article.image_url ? (
                    <Image
                      src={article.image_url}
                      alt={article.title}
                      fill
                      unoptimized
                      className="object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-teal-100 to-sage-100" />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                </div>
              </Link>
              <div className="text-xs font-bold text-teal-600 mb-2 uppercase tracking-wider">
                {article.category_name}
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-teal-700 transition-colors line-clamp-2">
                <Link href={`/articles/${article.slug}`}>
                  {article.title}
                </Link>
              </h3>
              <p className="text-gray-600 mb-4 line-clamp-2 text-sm">
                {article.excerpt}
              </p>
              <Link href={`/articles/${article.slug}`} className="inline-flex items-center text-teal-700 font-medium text-sm group-hover:underline underline-offset-4">
                Read Article <ArrowRight className="w-3.5 h-3.5 ml-1" />
              </Link>
            </article>
          ))}
        </div>
        
        <div className="mt-10 text-center md:hidden">
          <Link href="/articles" className="inline-flex items-center text-teal-700 font-semibold hover:text-teal-900">
            Browse All Articles <ArrowRight className="w-4 h-4 ml-2" />
          </Link>
        </div>
      </div>
    </section>
  );
}
