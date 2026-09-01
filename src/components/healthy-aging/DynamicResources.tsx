import Image from "next/image";
import Link from "next/link";
import { ShoppingBag, ArrowRight } from "lucide-react";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

// Real products from the store as fallback
const fallbackProducts = [
  {
    id: "715",
    title: "Australian Botanicals Pro-Aging Treatment Concentrate Serum",
    category: "Serum",
    excerpt: "Fortified with B3, B5 and Hyaluronic Acid — a potent blend of Australian native botanicals designed to support skin renewal and radiance.",
    image_url: "https://media.lifestylemedicinegateway.com/foundersformula/fortified-australian-botanicals-pro-aging-treatment-concentrate-serum-1787529234338.jpg",
    slug: "fortified-australian-botanicals-pro-aging-treatment-concentrate-serum",
    price: 185,
  },
  {
    id: "719",
    title: "Wild-Harvested Kakadu Plum Vitamin C Serum",
    category: "Serum",
    excerpt: "Harnessing nature's richest source of Vitamin C from the Australian Kakadu Plum to brighten, protect, and revitalise your skin.",
    image_url: "https://media.lifestylemedicinegateway.com/foundersformula/wild-harvested-australian-kakadu-plum-vitamin-c-serum-1787529240110.jpg",
    slug: "wild-harvested-australian-kakadu-plum-vitamin-c-serum",
    price: 134,
  },
  {
    id: "703",
    title: "Snake Vine Super Anti-Oxidant Pro-Aging Moisturiser",
    category: "Moisturiser",
    excerpt: "A luxurious moisturiser powered by the Australian Snake Vine — packed with super antioxidants for visibly smoother, firmer skin.",
    image_url: "https://media.lifestylemedicinegateway.com/foundersformula/australian-snake-vine-super-anti-oxidant-moisturiser-1787529217043.jpg",
    slug: "australian-snake-vine-super-anti-oxidant-moisturiser",
    price: 125,
  },
  {
    id: "717",
    title: "CALM Tasmanian Mountain Pepper Berry Serum",
    category: "Serum",
    excerpt: "A calming serum infused with Tasmanian Mountain Pepper Berry to soothe sensitivity, reduce redness, and restore skin comfort.",
    image_url: "https://media.lifestylemedicinegateway.com/foundersformula/calm-1787529237774.jpg",
    slug: "calm",
    price: 109,
  },
  {
    id: "707",
    title: "Wild Rosella Hydrating Moisturiser",
    category: "Moisturiser",
    excerpt: "Deep, lasting hydration powered by the Australian Wild Rosella flower — rich in natural antioxidants for a healthy, dewy complexion.",
    image_url: "https://media.lifestylemedicinegateway.com/foundersformula/wild-rosella-moisturiser-1787529222919.jpg",
    slug: "wild-rosella-moisturiser",
    price: 76,
  },
  {
    id: "711",
    title: "Australian Native River Mint Eye Serum",
    category: "Serum",
    excerpt: "A cooling, revitalising eye serum featuring Australian River Mint to reduce puffiness and refresh tired eyes.",
    image_url: "https://media.lifestylemedicinegateway.com/foundersformula/native-river-mint-cooling-eye-serum-1787529228780.jpg",
    slug: "native-river-mint-cooling-eye-serum",
    price: 61,
  },
];

export async function DynamicResources() {
  let products = fallbackProducts;

  try {
    const { data, error } = await (supabaseAdmin.from("products" as any) as any)
      .select("id, title, slug, excerpt, category, price, image_url")
      .eq("status", "published")
      .order("created_at", { ascending: false })
      .limit(6);

    if (!error && data && data.length >= 3) {
      products = data.map((p: any) => ({
        id: String(p.id),
        title: p.title,
        category: p.category || "Wellness",
        excerpt: p.excerpt || `Premium ${p.category?.toLowerCase() || 'wellness'} product — crafted with Australian native botanicals.`,
        image_url: p.image_url || "",
        slug: p.slug,
        price: Number(p.price) || 0,
      }));
    }
  } catch (err) {
    // Use fallback
  }

  return (
    <section className="py-20 bg-cream-50">
      <div className="container mx-auto px-4">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <div className="inline-block px-3 py-1 rounded-full bg-teal-50 text-teal-700 text-sm font-semibold mb-4">
            Curated for You
          </div>
          <h2 className="text-3xl md:text-4xl font-bold font-playfair text-teal-900 mb-4">
            Support Your Healthy Aging Journey
          </h2>
          <p className="text-gray-600">
            Australian botanical skincare and wellness products from our marketplace — crafted with native ingredients that nourish, protect, and rejuvenate.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {products.slice(0, 6).map((product) => (
            <div key={product.id} className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100 flex flex-col group">
              <Link href={`/products/${product.slug}`} className="block relative h-56 w-full overflow-hidden">
                {product.image_url ? (
                  <Image
                    src={product.image_url}
                    alt={product.title}
                    fill
                    unoptimized
                    className="object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-teal-50 to-sage-50" />
                )}
                <div className="absolute top-4 left-4 bg-white/90 backdrop-blur text-teal-800 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                  {product.category}
                </div>
              </Link>
              
              <div className="p-6 flex flex-col flex-grow">
                <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2 group-hover:text-teal-700 transition-colors">
                  <Link href={`/products/${product.slug}`}>
                    {product.title}
                  </Link>
                </h3>
                <p className="text-gray-600 mb-4 flex-grow line-clamp-2 text-sm">
                  {product.excerpt}
                </p>
                
                <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                  {product.price > 0 && (
                    <span className="text-xl font-bold text-teal-900">
                      ${product.price.toFixed(2)}
                    </span>
                  )}
                  <Link
                    href={`/products/${product.slug}`}
                    className="inline-flex items-center gap-2 py-2.5 px-5 bg-teal-700 text-white hover:bg-teal-800 font-semibold rounded-lg transition-colors text-sm"
                  >
                    <ShoppingBag className="w-4 h-4" /> View Product
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="text-center mt-12">
          <Link
            href="/products"
            className="inline-flex items-center gap-2 py-3 px-8 bg-white text-teal-700 hover:bg-teal-50 font-semibold rounded-full transition-colors border-2 border-teal-200 hover:border-teal-300"
          >
            Browse All Products <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}
