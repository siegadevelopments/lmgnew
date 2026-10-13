import { ChevronDown } from "lucide-react";

// Server-rendered FAQ list built on native <details>/<summary>. The Radix Accordion it replaces
// never renders closed panels, so FAQ answers were absent from the server HTML that search engines
// and AI crawlers read. <details> keeps every answer in the markup while still collapsing visually,
// needs no client JavaScript, and is keyboard- and screen-reader-accessible by default.
export function FaqList({
  faqs,
  triggerClassName = "text-left text-sm font-semibold text-foreground hover:text-primary py-4",
}: {
  faqs: { question: string; answer: string }[];
  triggerClassName?: string;
}) {
  return (
    <div className="space-y-3">
      {faqs.map((faq, i) => (
        <details key={i} className="group rounded-xl border border-border bg-card px-5 shadow-soft">
          <summary
            className={`flex cursor-pointer list-none items-center justify-between transition-all hover:underline [&::-webkit-details-marker]:hidden ${triggerClassName}`}
          >
            <h3 className="flex-1">{faq.question}</h3>
            <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200 group-open:rotate-180" />
          </summary>
          <div className="pb-4 pt-0 text-sm leading-relaxed text-muted-foreground">{faq.answer}</div>
        </details>
      ))}
    </div>
  );
}
