import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/refund-policy")({
  head: () => ({
    meta: [
      { title: "Refund Policy — Lifestyle Medicine Gateway" },
      {
        name: "description",
        content:
          "Review our refund and return policies for products purchased through Lifestyle Medicine Gateway.",
      },
    ],
  }),
  component: RefundPolicyPage,
});

function RefundPolicyPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
        Refund &amp; Return Policy
      </h1>
      <p className="mt-4 text-muted-foreground">
        Last updated: April 2026
      </p>

      <div className="mt-10 space-y-8 text-sm leading-relaxed text-muted-foreground">
        <section>
          <h2 className="text-lg font-semibold text-foreground">
            Overview
          </h2>
          <p className="mt-3">
            At Lifestyle Medicine Gateway, we want you to be completely
            satisfied with your purchase. This Refund &amp; Return Policy
            outlines the conditions under which you may request a return or
            refund for products purchased through our marketplace.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground">
            Eligibility for Returns
          </h2>
          <ul className="mt-3 list-disc space-y-2 pl-5">
            <li>
              Products may be returned within <strong>30 days</strong> of the
              delivery date.
            </li>
            <li>
              Items must be unused, in their original packaging, and in the
              same condition as received.
            </li>
            <li>
              Perishable goods (supplements with broken seals, opened food
              items) cannot be returned unless they arrive damaged or
              defective.
            </li>
            <li>
              Digital products, gift cards, and downloadable content are
              non-refundable.
            </li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground">
            How to Request a Return
          </h2>
          <ol className="mt-3 list-decimal space-y-2 pl-5">
            <li>
              Log in to your account and visit your{" "}
              <Link
                to="/profile"
                className="text-primary underline underline-offset-2 hover:text-primary/80"
              >
                order history
              </Link>.
            </li>
            <li>
              Select the order containing the item you wish to return.
            </li>
            <li>
              Contact the vendor directly through the order details or via
              our{" "}
              <Link
                to="/contact"
                className="text-primary underline underline-offset-2 hover:text-primary/80"
              >
                Contact page
              </Link>.
            </li>
            <li>
              The vendor will provide return instructions and a return
              shipping address.
            </li>
          </ol>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground">
            Refund Process
          </h2>
          <p className="mt-3">
            Once your return is received and inspected by the vendor, you
            will be notified of the approval or rejection of your refund. If
            approved, your refund will be processed within{" "}
            <strong>5–10 business days</strong> to your original payment
            method.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground">
            Damaged or Defective Items
          </h2>
          <p className="mt-3">
            If you receive a damaged or defective product, please contact
            us within <strong>48 hours</strong> of delivery with photos of
            the damage. We will coordinate with the vendor to arrange a
            replacement or full refund at no additional cost to you.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground">
            Shipping Costs
          </h2>
          <p className="mt-3">
            Return shipping costs are the responsibility of the buyer unless
            the item was received damaged, defective, or was sent in error.
            Original shipping charges are non-refundable except in cases of
            vendor error.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground">
            Vendor-Specific Policies
          </h2>
          <p className="mt-3">
            Individual vendors on our platform may have additional or
            modified return policies. Please check the specific product
            listing for vendor-specific terms before purchasing.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground">
            Contact Us
          </h2>
          <p className="mt-3">
            If you have questions about our refund policy, please reach out
            through our{" "}
            <Link
              to="/contact"
              className="text-primary underline underline-offset-2 hover:text-primary/80"
            >
              Contact page
            </Link>{" "}
            or email us at{" "}
            <a
              href="mailto:support@lifestylemedicinegateway.com"
              className="text-primary underline underline-offset-2 hover:text-primary/80"
            >
              support@lifestylemedicinegateway.com
            </a>.
          </p>
        </section>
      </div>
    </div>
  );
}
