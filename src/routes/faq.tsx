import { createFileRoute } from "@tanstack/react-router";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

export const Route = createFileRoute("/faq")({
  head: () => ({
    meta: [
      { title: "FAQ — Lifestyle Medicine Gateway" },
      { name: "description", content: "Frequently asked questions about Lifestyle Medicine Gateway" },
    ],
  }),
  component: FAQPage,
});

function FAQPage() {
  const faqs = [
    {
      question: "How do I become a vendor?",
      answer: "Click the 'Become a Vendor' button in the header and complete the registration form. You'll need to provide your business information and agree to our vendor terms.",
    },
    {
      question: "Is my personal information secure?",
      answer: "Yes, we take data security seriously. We use industry-standard encryption and follow best practices to protect your information. See our Privacy Policy for details.",
    },
    {
      question: "How do I track my order?",
      answer: "Once your order ships, you'll receive a tracking number via email. You can also view your order history in your account dashboard.",
    },
    {
      question: "What is your return policy?",
      answer: "Return policies vary by vendor. Each product page shows the specific return policy for that item. Contact the vendor directly for return requests.",
    },
    {
      question: "How can I contact customer support?",
      answer: "You can reach us through the Contact page, by email at support@lifestylemedicinegateway.com, or through the help widget on the site.",
    },
    {
      question: "Do you offer wholesale pricing?",
      answer: "Some vendors offer wholesale pricing. Contact individual vendors directly to inquire about bulk orders.",
    },
  ];

  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">Frequently Asked Questions</h1>
      <p className="mt-4 text-muted-foreground">
        Find answers to common questions about Lifestyle Medicine Gateway.
      </p>

      <Accordion type="single" collapsible className="mt-8">
        {faqs.map((faq, index) => (
          <AccordionItem key={index} value={`item-${index}`}>
            <AccordionTrigger className="text-left">{faq.question}</AccordionTrigger>
            <AccordionContent className="text-muted-foreground">{faq.answer}</AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>

      <div className="mt-12 rounded-lg bg-card p-6 text-center">
        <h3 className="text-lg font-semibold">Still have questions?</h3>
        <p className="mt-2 text-muted-foreground">Can't find what you're looking for?</p>
        <a href="/contact" className="mt-4 inline-block rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90">
          Contact Us
        </a>
      </div>
    </div>
  );
}