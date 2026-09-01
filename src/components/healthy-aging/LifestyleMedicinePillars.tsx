import Link from "next/link";
import { Apple, Activity, Moon, HeartHandshake, Users, Leaf, ArrowRight } from "lucide-react";

const pillars = [
  {
    title: "Healthy Eating",
    description: "Focusing on whole, plant-predominant foods to nourish the body and lower inflammation. Explore our anti-inflammatory recipes and nutrition guides.",
    icon: <Apple className="w-8 h-8 text-sage-600" />,
    href: "/recipes",
    linkLabel: "View Healthy Recipes",
  },
  {
    title: "Physical Activity",
    description: "Incorporating regular, enjoyable movement to strengthen muscles, bones, and heart — with practical routines for every fitness level.",
    icon: <Activity className="w-8 h-8 text-sage-600" />,
    href: "/articles",
    linkLabel: "Read Movement Guides",
  },
  {
    title: "Restorative Sleep",
    description: "Prioritizing 7-9 hours of quality sleep for brain health, healing, and energy. Find natural remedies for restless legs and insomnia.",
    icon: <Moon className="w-8 h-8 text-sage-600" />,
    href: "/natural-remedies",
    linkLabel: "Explore Sleep Support",
  },
  {
    title: "Stress Management",
    description: "Learning healthy coping mechanisms and mindfulness to reduce chronic stress and protect cognitive function as you age.",
    icon: <HeartHandshake className="w-8 h-8 text-sage-600" />,
    href: "/natural-remedies",
    linkLabel: "Browse Stress Remedies",
  },
  {
    title: "Social Connection",
    description: "Building supportive relationships that improve emotional and physical longevity — community is medicine.",
    icon: <Users className="w-8 h-8 text-sage-600" />,
    href: "/articles",
    linkLabel: "Read Wellbeing Articles",
  },
  {
    title: "Healthy Lifestyle Choices",
    description: "Avoiding harmful substances and forming habits that support long-term wellbeing, from skincare to supplementation.",
    icon: <Leaf className="w-8 h-8 text-sage-600" />,
    href: "/products",
    linkLabel: "Shop Natural Products",
  },
];

export function LifestyleMedicinePillars() {
  return (
    <section className="py-20 bg-white">
      <div className="container mx-auto px-4">
        <div className="max-w-3xl mx-auto text-center mb-16">
          <div className="inline-block px-3 py-1 rounded-full bg-sage-50 text-sage-700 text-sm font-semibold mb-4">
            The Foundation
          </div>
          <h2 className="text-3xl md:text-4xl font-bold font-playfair text-teal-900 mb-6">
            The 6 Pillars of Lifestyle Medicine
          </h2>
          <p className="text-lg text-gray-600">
            Lifestyle Medicine is an evidence-based approach that helps prevent, manage, and sometimes reverse chronic diseases through healthy daily habits. Our platform covers every pillar.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {pillars.map((pillar, i) => (
            <div
              key={i}
              className="p-8 rounded-2xl bg-slate-50 border border-slate-100 hover:shadow-lg transition-shadow duration-300 group flex flex-col"
            >
              <div className="w-16 h-16 rounded-xl bg-sage-100 flex items-center justify-center mb-6 group-hover:bg-teal-600 group-hover:text-white transition-colors duration-300">
                <div className="group-hover:text-white transition-colors duration-300">
                  {pillar.icon}
                </div>
              </div>
              <h3 className="text-xl font-semibold text-teal-900 mb-3">
                {pillar.title}
              </h3>
              <p className="text-gray-600 leading-relaxed flex-grow mb-4">
                {pillar.description}
              </p>
              <Link
                href={pillar.href}
                className="inline-flex items-center text-teal-600 font-medium text-sm hover:text-teal-800 transition-colors w-fit"
              >
                {pillar.linkLabel} <ArrowRight className="w-3.5 h-3.5 ml-1" />
              </Link>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
