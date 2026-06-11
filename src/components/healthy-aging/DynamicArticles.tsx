import { supabase } from "@/integrations/supabase/client";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
const fallbackArticles = [
  {
    id: "1",
    title: "How to Build a Morning Routine for Healthy Aging",
    category: "Healthy Aging",
    excerpt: "Discover the 3 morning habits scientifically proven to regulate circadian rhythm and optimize daytime energy.",
    image_url: "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?auto=format&fit=crop&q=80&w=600",
    slug: "morning-routine-healthy-aging",
  },
  {
    id: "2",
    title: "Navigating Menopause with Lifestyle Medicine",
    category: "Menopause",
    excerpt: "Evidence-based strategies to manage hot flashes, brain fog, and sleep disruptions naturally.",
    image_url: "https://images.unsplash.com/photo-1512411032398-7c8a666991c2?auto=format&fit=crop&q=80&w=600",
    slug: "navigating-menopause-lifestyle-medicine",
  },
  {
    id: "3",
    title: "The Mediterranean Diet and Cognitive Longevity",
    category: "Nutrition",
    excerpt: "How olive oil, leafy greens, and omega-3s protect your brain against cognitive decline.",
    image_url: "https://images.unsplash.com/photo-1498837167922-c779afa0fc11?auto=format&fit=crop&q=80&w=600",
    slug: "mediterranean-diet-cognitive-longevity",
  },
];

export async function DynamicArticles() {
  let articles = [];
  
  try {
    const { data, error } = await supabase
      .from("articles") // Adjust table name as needed
      .select("*")
      .in("category_name", ["Healthy Aging", "Menopause", "Lifestyle Medicine", "Nutrition", "Sleep"])
      .order("created_at", { ascending: false })
      .limit(3);
      
    if (!error && data && data.length > 0) {
      articles = data;
    } else {
      articles = fallbackArticles;
    }
  } catch (error) {
    articles = fallbackArticles;
  }

  return (
    <section className="py-20 bg-white">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row justify-between items-end mb-12 max-w-6xl mx-auto">
          <div className="max-w-2xl">
            <h2 className="text-3xl md:text-4xl font-bold font-playfair text-teal-900 mb-4">
              Latest from the Blog
            </h2>
            <p className="text-gray-600">
              Read our latest evidence-based articles on healthy aging, nutrition, and longevity.
            </p>
          </div>
          <Link href="/blog" className="hidden md:flex items-center text-teal-700 font-semibold hover:text-teal-900">
            View All Articles <ArrowRight className="w-4 h-4 ml-2" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {articles.map((article) => (
            <article key={article.id} className="group cursor-pointer">
              <div className="relative h-64 w-full mb-6 overflow-hidden rounded-2xl">
                <Image
                  src={article.image_url}
                  alt={article.title}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-500"
                />
              </div>
              <div className="text-sm font-semibold text-teal-600 mb-2 uppercase tracking-wide">
                {article.category_name || article.category}
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3 group-hover:text-teal-700 transition-colors">
                <Link href={`/blog/${article.slug}`}>
                  {article.title}
                </Link>
              </h3>
              <p className="text-gray-600 mb-4 line-clamp-3">
                {article.excerpt}
              </p>
              <Link href={`/blog/${article.slug}`} className="inline-flex items-center text-teal-700 font-medium group-hover:underline underline-offset-4">
                Read More <ArrowRight className="w-4 h-4 ml-1" />
              </Link>
            </article>
          ))}
        </div>
        
        <div className="mt-10 text-center md:hidden">
          <Link href="/blog" className="inline-flex items-center text-teal-700 font-semibold hover:text-teal-900">
            View All Articles <ArrowRight className="w-4 h-4 ml-2" />
          </Link>
        </div>
      </div>
    </section>
  );
}
