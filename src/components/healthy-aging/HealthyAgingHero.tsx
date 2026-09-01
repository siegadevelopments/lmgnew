import { CheckCircle, BookOpen, Leaf, ShoppingBag } from "lucide-react";
import { EmailCaptureForm } from "./EmailCaptureForm";
import Link from "next/link";

const benefits = [
  "Science-backed natural remedies for everyday wellness",
  "Anti-inflammatory nutrition & gut health strategies",
  "Sleep, stress, and energy optimization techniques",
  "Menopause support with evidence-based lifestyle medicine",
  "Curated Australian botanical skincare for healthy aging",
];

const stats = [
  { value: "120+", label: "Health Articles", icon: BookOpen },
  { value: "80+", label: "Natural Remedies", icon: Leaf },
  { value: "30+", label: "Botanical Products", icon: ShoppingBag },
];

export function HealthyAgingHero() {
  return (
    <section className="bg-sage-50 text-gray-900 py-16 md:py-24 lg:py-32 overflow-hidden relative">
      {/* Background Decorative Blob */}
      <div className="absolute top-0 left-0 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-teal-100/50 rounded-full blur-3xl -z-10" />
      <div className="absolute bottom-0 right-0 translate-x-1/3 translate-y-1/3 w-[500px] h-[500px] bg-cream-100/60 rounded-full blur-3xl -z-10" />

      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-8 items-center">
          <div className="space-y-8">
            <div className="inline-block px-4 py-1.5 rounded-full bg-teal-100 text-teal-800 text-sm font-semibold mb-2">
              Free Evidence-Based Guide
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold font-playfair leading-tight text-teal-900">
              Your Complete Healthy Aging Starter Kit
            </h1>
            <p className="text-lg md:text-xl text-gray-700 leading-relaxed max-w-xl">
              Take control of your long-term health with our free, evidence-based guide to lifestyle medicine — covering everything from nutrition and sleep to natural remedies and pro-aging skincare.
            </p>

            <ul className="space-y-3.5 pt-2">
              {benefits.map((benefit, i) => (
                <li key={i} className="flex items-start">
                  <CheckCircle className="w-5 h-5 text-teal-600 shrink-0 mr-3 mt-0.5" />
                  <span className="text-gray-800 text-base">{benefit}</span>
                </li>
              ))}
            </ul>

            {/* Stats row */}
            <div className="flex flex-wrap gap-6 pt-4">
              {stats.map((stat, i) => (
                <div key={i} className="flex items-center gap-3 bg-white/80 backdrop-blur px-4 py-3 rounded-xl border border-gray-100 shadow-sm">
                  <stat.icon className="w-5 h-5 text-teal-600" />
                  <div>
                    <div className="text-lg font-bold text-teal-900">{stat.value}</div>
                    <div className="text-xs text-gray-500">{stat.label}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white p-8 md:p-10 rounded-2xl shadow-xl shadow-teal-900/5 border border-gray-100 lg:ml-auto w-full max-w-md mx-auto lg:mx-0">
            <h3 className="text-2xl font-semibold text-center mb-2 text-teal-900">
              Download Your Free Guide
            </h3>
            <p className="text-sm text-gray-500 text-center mb-6">
              Instant access to our complete healthy aging resource library
            </p>
            <EmailCaptureForm buttonText="Get Instant Access" />
            <div className="mt-6 pt-6 border-t border-gray-100 text-center">
              <p className="text-sm text-gray-500 mb-3">
                Already exploring? Jump straight to our resources:
              </p>
              <div className="flex flex-wrap justify-center gap-2">
                <Link href="/articles" className="text-xs font-medium text-teal-700 bg-teal-50 px-3 py-1.5 rounded-full hover:bg-teal-100 transition-colors">
                  Articles
                </Link>
                <Link href="/natural-remedies" className="text-xs font-medium text-teal-700 bg-teal-50 px-3 py-1.5 rounded-full hover:bg-teal-100 transition-colors">
                  Natural Remedies
                </Link>
                <Link href="/recipes" className="text-xs font-medium text-teal-700 bg-teal-50 px-3 py-1.5 rounded-full hover:bg-teal-100 transition-colors">
                  Recipes
                </Link>
                <Link href="/products" className="text-xs font-medium text-teal-700 bg-teal-50 px-3 py-1.5 rounded-full hover:bg-teal-100 transition-colors">
                  Products
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
