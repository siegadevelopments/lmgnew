import { ArrowRight, BookOpen, Utensils, Zap, BedDouble, ShieldAlert, Heart } from "lucide-react";

const topics = [
  {
    title: "Nutrition & Gut Health",
    description: "Learn which healthy foods and supplements support your microbiome, reduce inflammation, and aid in weight management.",
    icon: <Utensils className="w-6 h-6 text-teal-600" />,
  },
  {
    title: "Movement & Disease Prevention",
    description: "Discover simple routines for heart health, diabetes prevention, and maintaining muscle mass.",
    icon: <Zap className="w-6 h-6 text-teal-600" />,
  },
  {
    title: "Sleep",
    description: "Master techniques for achieving deep, restorative sleep every night.",
    icon: <BedDouble className="w-6 h-6 text-teal-600" />,
  },
  {
    title: "Stress",
    description: "Implement daily habits that lower cortisol and protect your brain.",
    icon: <ShieldAlert className="w-6 h-6 text-teal-600" />,
  },
  {
    title: "Relationships",
    description: "Understand the powerful impact of social connection on longevity.",
    icon: <Heart className="w-6 h-6 text-teal-600" />,
  },
  {
    title: "Hormones & Menopause",
    description: "Navigate natural changes smoothly with targeted lifestyle medicine and healthy ageing practices.",
    icon: <BookOpen className="w-6 h-6 text-teal-600" />,
  },
];

export function WhatYouWillLearn() {
  return (
    <section className="py-20 bg-cream-50">
      <div className="container mx-auto px-4">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <h2 className="text-3xl md:text-4xl font-bold font-playfair text-teal-900 mb-4">
            What You'll Learn
          </h2>
          <p className="text-gray-600">
            Our free guide breaks down complex science into actionable, daily steps across these key areas.
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
              <p className="text-gray-600 flex-grow mb-4">{topic.description}</p>
              <button className="flex items-center text-teal-600 font-medium group-hover:text-teal-800 transition-colors mt-auto w-fit">
                Learn More <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
