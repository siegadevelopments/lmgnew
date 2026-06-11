import { Apple, Activity, Moon, HeartHandshake, Users, Leaf } from "lucide-react";

const pillars = [
  {
    title: "Healthy Eating",
    description: "Focusing on whole, plant-predominant foods to nourish the body and lower inflammation.",
    icon: <Apple className="w-8 h-8 text-sage-600" />,
  },
  {
    title: "Physical Activity",
    description: "Incorporating regular, enjoyable movement to strengthen muscles, bones, and heart.",
    icon: <Activity className="w-8 h-8 text-sage-600" />,
  },
  {
    title: "Restorative Sleep",
    description: "Prioritizing 7-9 hours of quality sleep for brain health, healing, and energy.",
    icon: <Moon className="w-8 h-8 text-sage-600" />,
  },
  {
    title: "Stress Management",
    description: "Learning healthy coping mechanisms and mindfulness to reduce chronic stress.",
    icon: <HeartHandshake className="w-8 h-8 text-sage-600" />,
  },
  {
    title: "Social Connection",
    description: "Building supportive relationships that improve emotional and physical longevity.",
    icon: <Users className="w-8 h-8 text-sage-600" />,
  },
  {
    title: "Healthy Lifestyle Choices",
    description: "Avoiding harmful substances and forming habits that support long-term wellbeing.",
    icon: <Leaf className="w-8 h-8 text-sage-600" />,
  },
];

export function LifestyleMedicinePillars() {
  return (
    <section className="py-20 bg-white">
      <div className="container mx-auto px-4">
        <div className="max-w-3xl mx-auto text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold font-playfair text-teal-900 mb-6">
            What Is Lifestyle Medicine?
          </h2>
          <p className="text-lg text-gray-600">
            Lifestyle Medicine is an evidence-based approach that helps prevent, manage, and sometimes reverse chronic diseases through healthy daily habits. Here are the six foundational pillars.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {pillars.map((pillar, i) => (
            <div
              key={i}
              className="p-8 rounded-2xl bg-slate-50 border border-slate-100 hover:shadow-lg transition-shadow duration-300 group"
            >
              <div className="w-16 h-16 rounded-xl bg-sage-100 flex items-center justify-center mb-6 group-hover:bg-teal-600 group-hover:text-white transition-colors duration-300">
                <div className="group-hover:text-white transition-colors duration-300">
                  {pillar.icon}
                </div>
              </div>
              <h3 className="text-xl font-semibold text-teal-900 mb-3">
                {pillar.title}
              </h3>
              <p className="text-gray-600 leading-relaxed">
                {pillar.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
