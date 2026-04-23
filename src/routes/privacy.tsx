import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/privacy")({
  head: () => ({
    meta: [
      { title: "Privacy Policy — Lifestyle Medicine Gateway" },
    ],
  }),
  component: PrivacyPage,
});

function PrivacyPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">Privacy Policy</h1>
      
      <div className="mt-8 prose prose-green max-w-none text-foreground">
        <p>Last updated: {new Date().toLocaleDateString()}</p>

        <h2>Introduction</h2>
        <p>
          At Lifestyle Medicine Gateway, we take your privacy seriously. This Privacy Policy explains 
          how we collect, use, disclose, and safeguard your information when you use our platform.
        </p>

        <h2>Information We Collect</h2>
        <p>We may collect personal information that you voluntarily provide to us when you:</p>
        <ul>
          <li>Register an account</li>
          <li>Make a purchase</li>
          <li>Contact us</li>
          <li>Subscribe to our newsletter</li>
        </ul>

        <h2>How We Use Your Information</h2>
        <p>We use the information we collect to:</p>
        <ul>
          <li>Provide and improve our services</li>
          <li>Process your transactions</li>
          <li>Send you marketing communications (with your consent)</li>
          <li>Respond to your inquiries</li>
        </ul>

        <h2>Contact Us</h2>
        <p>If you have questions about this Privacy Policy, please contact us at privacy@lifestylemedicinegateway.com</p>
      </div>
    </div>
  );
}