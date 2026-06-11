import { CheckCircle } from "lucide-react";
import { EmailCaptureForm } from "./EmailCaptureForm";

const benefits = [
  "Improve daily energy",
  "Support healthy aging",
  "Sleep better",
  "Reduce stress",
  "Build healthier habits",
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
              Healthy Aging Starter Kit
            </h1>
            <p className="text-lg md:text-xl text-gray-700 leading-relaxed max-w-xl">
              Discover evidence-based lifestyle medicine strategies that can help improve energy, sleep, mobility, and long-term wellbeing.
            </p>

            <ul className="space-y-4 pt-2">
              {benefits.map((benefit, i) => (
                <li key={i} className="flex items-start">
                  <CheckCircle className="w-6 h-6 text-teal-600 shrink-0 mr-3 mt-0.5" />
                  <span className="text-gray-800 text-lg">{benefit}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="bg-white p-8 md:p-10 rounded-2xl shadow-xl shadow-teal-900/5 border border-gray-100 lg:ml-auto w-full max-w-md mx-auto lg:mx-0">
            <h3 className="text-2xl font-semibold text-center mb-6 text-teal-900">
              Download Your Free Guide
            </h3>
            <EmailCaptureForm buttonText="Get Instant Access" />
            <div className="mt-6 pt-6 border-t border-gray-100 text-center">
              <p className="text-sm text-gray-500">
                Join our community of over 10,000 members prioritizing their long-term health.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
