import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Star } from "lucide-react";

const testimonials = [
  {
    name: "Sarah M.",
    location: "Austin, TX",
    text: "This starter kit completely changed how I view aging. The sleep protocol alone gave me back the energy I thought I'd lost to menopause forever.",
  },
  {
    name: "David L.",
    location: "Denver, CO",
    text: "Evidence-based, clear, and actionable. I started the daily checklist a month ago and my joints feel better than they have in a decade.",
  },
  {
    name: "Elena R.",
    location: "Miami, FL",
    text: "Finally, a guide that doesn't just push supplements, but teaches real lifestyle medicine. I feel empowered to take control of my long-term health.",
  },
];

const faqs = [
  {
    question: "What is healthy aging?",
    answer: "Healthy aging is the process of developing and maintaining the functional ability that enables wellbeing in older age. It's about preserving physical, mental, and cognitive health through daily lifestyle choices rather than just treating diseases as they occur.",
  },
  {
    question: "What is lifestyle medicine?",
    answer: "Lifestyle medicine is a medical specialty that uses therapeutic lifestyle interventions as a primary modality to treat chronic conditions including cardiovascular disease, type 2 diabetes, and obesity. The six pillars are whole-food, plant-predominant eating, physical activity, restorative sleep, stress management, avoidance of risky substances, and positive social connections.",
  },
  {
    question: "Who is this guide for?",
    answer: "This guide is specifically designed for adults aged 35-70 (especially women navigating menopause and men focused on longevity) who want to proactively protect their health, energy, and mobility using proven scientific methods.",
  },
  {
    question: "Is the guide free?",
    answer: "Yes! The Healthy Aging Starter Kit is 100% free. We believe everyone should have access to high-quality, evidence-based health education.",
  },
  {
    question: "How often will I receive emails?",
    answer: "After receiving your free guide, you will get a helpful tip every 2-3 days during your first two weeks. After that, you'll join our weekly community newsletter.",
  },
  {
    question: "Can I unsubscribe anytime?",
    answer: "Absolutely. Every email we send includes a one-click unsubscribe link at the bottom. We respect your inbox and your privacy.",
  },
];

export function TestimonialsFAQSection() {
  return (
    <>
      {/* Testimonials */}
      <section className="py-20 bg-sage-50">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-3xl md:text-4xl font-bold font-playfair text-teal-900 mb-4">
              Join Thousands of Others
            </h2>
            <p className="text-gray-600">
              See what our community members have to say about taking control of their healthy aging journey.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {testimonials.map((t, i) => (
              <div key={i} className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 flex flex-col h-full">
                <div className="flex gap-1 text-yellow-400 mb-4">
                  {[...Array(5)].map((_, j) => (
                    <Star key={j} className="w-5 h-5 fill-current" />
                  ))}
                </div>
                <p className="text-gray-700 mb-6 flex-grow italic">"{t.text}"</p>
                <div>
                  <div className="font-semibold text-gray-900">{t.name}</div>
                  <div className="text-sm text-gray-500">{t.location}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold font-playfair text-teal-900 mb-10 text-center">
              Frequently Asked Questions
            </h2>
            
            <Accordion type="single" collapsible className="w-full">
              {faqs.map((faq, i) => (
                <AccordionItem key={i} value={`item-${i}`}>
                  <AccordionTrigger className="text-left text-lg font-semibold text-gray-900 hover:text-teal-700">
                    {faq.question}
                  </AccordionTrigger>
                  <AccordionContent className="text-gray-600 text-base leading-relaxed">
                    {faq.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </div>
      </section>
    </>
  );
}
