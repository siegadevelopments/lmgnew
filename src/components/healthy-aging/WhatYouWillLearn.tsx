import Link from "next/link";
import { ArrowRight, Utensils, Zap, BedDouble, ShieldAlert, Heart, BookOpen } from "lucide-react";

const topics = [
  {
    title: "Nutrition & Gut Health",
    description: "Anti-inflammatory foods, microbiome support, and Mediterranean diet guides to nourish your body from the inside out.",
    icon: <Utensils className="w-6 h-6 text-teal-600" />,
    href: "/articles",
    linkLabel: "Read Our Nutrition Guides",
  },
  {
    title: "Movement & Disease Prevention",
    description: "Simple routines for heart health, diabetes prevention, and maintaining muscle mass at every age.",
    icon: <Zap className="w-6 h-6 text-teal-600" />,
    href: "/articles",
    linkLabel: "Explore Movement Articles",
  },
  {
    title: "Restorative Sleep",
    description: "Evidence-based techniques for deep sleep — from restless legs solutions to circadian rhythm optimization.",
    icon: <BedDouble className="w-6 h-6 text-teal-600" />,
    href: "/natural-remedies",
    linkLabel: "View Sleep Remedies",
  },
  {
    title: "Stress & Brain Health",
    description: "Natural strategies to lower cortisol, clear brain fog, and protect cognitive function as you age.",
    icon: <ShieldAlert className="w-6 h-6 text-teal-600" />,
    href: "/natural-remedies",
    linkLabel: "Browse Natural Remedies",
  },
  {
    title: "Social Connection & Longevity",
    description: "Understand the powerful impact of community, relationships, and purpose on physical and emotional longevity.",
    icon: <Heart className="w-6 h-6 text-teal-600" />,
    href: "/articles",
    linkLabel: "Read Wellbeing Articles",
  },
  {
    title: "Menopause & Hormonal Health",
    description: "Navigate natural changes with targeted lifestyle medicine — from hot flashes and sleep disruptions to energy and mood.",
    icon: <BookOpen className="w-6 h-6 text-teal-600" />,
    href: "/natural-remedies",
    linkLabel: "Explore Menopause Support",
  },
];

export function WhatYouWillLearn() {
  return (
    <section className="py-20 bg-cream-50">
      <div className="container mx-auto px-4">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <div className="inline-block px-3 py-1 rounded-full bg-teal-50 text-teal-700 text-sm font-semibold mb-4">
            Inside Your Free Guide
          </div>
          <h2 className="text-3xl md:text-4xl font-bold font-playfair text-teal-900 mb-4">
            What You&apos;ll Learn
          </h2>
          <p className="text-gray-600">
            Our free guide breaks down complex science into actionable, daily steps across these key areas — with links to our full resource library.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {topics.map((topic, index) => (
            <div 
              key={index} 
              className="group bg-white p-6 rounded-2xl shadow-sm hover:shadow-md transition-all border border-gray-100 flex flex-col h-full"
            >
              <div className="w-12 h-12 bg-teal-50 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                {topic.icon}
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">{topic.title}</h3>
              <p className="text-gray-600 flex-grow mb-4 text-sm">{topic.description}</p>
              <Link 
                href={topic.href} 
                className="flex items-center text-teal-600 font-medium group-hover:text-teal-800 transition-colors mt-auto w-fit text-sm"
              >
                {topic.linkLabel} <ArrowRight className="w-3.5 h-3.5 ml-1 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
