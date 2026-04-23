import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/terms")({
  head: () => ({
    meta: [
      { title: "Terms of Service — Lifestyle Medicine Gateway" },
    ],
  }),
  component: TermsPage,
});

function TermsPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">Terms of Service</h1>
      
      <div className="mt-8 prose prose-green max-w-none text-foreground">
        <p>Last updated: {new Date().toLocaleDateString()}</p>

        <h2>Acceptance of Terms</h2>
        <p>
          By accessing and using Lifestyle Medicine Gateway, you accept and agree to be bound 
          by the terms and provision of this agreement.
        </p>

        <h2>Use License</h2>
        <p>
          Permission is granted to temporarily use Lifestyle Medicine Gateway for personal, 
          non-commercial transitory viewing only.
        </p>

        <h2>Vendor Terms</h2>
        <p>Vendors on our platform agree to:</p>
        <ul>
          <li>Provide accurate product information</li>
          <li>Ship orders in a timely manner</li>
          <li>Maintain fair pricing</li>
          <li>Comply with all applicable laws</li>
        </ul>

        <h2>Disclaimer</h2>
        <p>
          The information on this website is provided for general informational purposes only. 
          We make no representations or warranties of any kind about the completeness, accuracy, 
          or reliability of the information.
        </p>

        <h2>Contact Us</h2>
        <p>If you have questions about these Terms, please contact us at legal@lifestylemedicinegateway.com</p>
      </div>
    </div>
  );
}