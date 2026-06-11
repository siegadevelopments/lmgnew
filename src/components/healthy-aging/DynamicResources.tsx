import { createClient } from "@supabase/supabase-js";
import Image from "next/image";
import Link from "next/link";
import { ExternalLink } from "lucide-react";

// Initialize SSR-safe public Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
const supabase = createClient(supabaseUrl || "https://placeholder.supabase.co", supabaseAnonKey || "placeholder", {
  auth: { persistSession: false }
});
// Fallback data in case DB is not set up or empty
const fallbackResources = [
  {
    id: "1",
    title: "Premium Sleep Tracking Ring",
    category: "Sleep",
    description: "Monitor your resting heart rate, HRV, and sleep stages accurately to optimize your restorative rest.",
    image_url: "https://images.unsplash.com/photo-1557825835-70d97c4aa567?auto=format&fit=crop&q=80&w=600",
    affiliate_url: "#",
  },
  {
    id: "2",
    title: "Organic Ashwagandha Extract",
    category: "Stress Management",
    description: "Evidence-based adaptogen that helps modulate cortisol levels and promote a sense of calm.",
    image_url: "https://images.unsplash.com/photo-1611078485741-2ab0922841e4?auto=format&fit=crop&q=80&w=600",
    affiliate_url: "#",
  },
  {
    id: "3",
    title: "Mediterranean Diet Cookbook",
    category: "Nutrition",
    description: "Over 100 anti-inflammatory recipes designed to support healthy aging and cardiovascular health.",
    image_url: "https://images.unsplash.com/photo-1490645935967-10de6ba17061?auto=format&fit=crop&q=80&w=600",
    affiliate_url: "#",
  },
];

export async function DynamicResources() {
  let resources: any[] = [];
  
  try {
    const { data, error } = await supabase
      .from("products") // Changed to match project schema (from queries.ts: products instead of resources)
      .select("*")
      .eq("status", "published")
      .limit(3);
      
    if (!error && data && data.length > 0) {
      resources = data;
    } else {
      resources = fallbackResources;
    }
  } catch (error) {
    resources = fallbackResources;
  }

  return (
    <section className="py-20 bg-cream-50">
      <div className="container mx-auto px-4">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <h2 className="text-3xl md:text-4xl font-bold font-playfair text-teal-900 mb-4">
            Recommended Healthy Aging Resources
          </h2>
          <p className="text-gray-600">
            Carefully curated, evidence-based tools and resources to support your lifestyle medicine journey.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {resources.map((resource) => (
            <div key={resource.id} className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-shadow border border-gray-100 flex flex-col">
              <div className="relative h-56 w-full">
                <Image
                  src={resource.image_url}
                  alt={resource.title}
                  fill
                  className="object-cover"
                />
                <div className="absolute top-4 left-4 bg-white/90 backdrop-blur text-teal-800 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                  {resource.category}
                </div>
              </div>
              
              <div className="p-6 flex flex-col flex-grow">
                <h3 className="text-xl font-semibold text-gray-900 mb-3 line-clamp-2">
                  {resource.title}
                </h3>
                <p className="text-gray-600 mb-6 flex-grow line-clamp-3">
                  {resource.description}
                </p>
                
                <Link
                  href={resource.affiliate_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-teal-50 text-teal-700 hover:bg-teal-100 font-semibold rounded-lg transition-colors"
                >
                  View Resource <ExternalLink className="w-4 h-4" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
