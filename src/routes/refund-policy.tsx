import { createFileRoute } from "@tanstack/react-router";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";

export const Route = createFileRoute("/refund-policy")({
  head: () => ({
    meta: [
      { title: "Refund & Return Policy | Lifestyle Medicine Gateway" },
      { name: "description", content: "Review our return and refund policy for e-training group and lifestylemedicinegateway.com." },
    ],
  }),
  component: RefundPolicyPage,
});

function RefundPolicyPage() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="mb-12 text-center">
          <h1 className="text-4xl font-extrabold tracking-tight text-foreground sm:text-5xl">Refund & Return Policy</h1>
          <p className="mt-4 text-muted-foreground font-medium">Last updated: 05/03/2026</p>
        </div>
        
        <div className="prose prose-slate max-w-none text-foreground prose-headings:text-foreground prose-strong:text-foreground prose-a:text-primary space-y-10">
          <section>
            <h2 className="text-2xl font-bold border-b pb-2 mb-4">Returns</h2>
            <p>
              We have a <strong>30-day return policy</strong>, which means you have 30 days after receiving your item to request a return.
            </p>
            <p>
              To be eligible for a return, your item must be in the same condition that you received it, unworn or unused, with tags, and in its original packaging. You'll also need the receipt or proof of purchase.
            </p>
            <p>
              To start a return, you can contact us at <strong>orders@lifestylemedicinegateway.com</strong>. Please note that returns will need to be sent back to the distributing business or company.
            </p>
            <p>
              If your return is accepted, the distributing business will contact you with instructions on how and where to send your package. Items sent back without first requesting a return will not be accepted. Please note that if your country of residence is not Australia, shipping your goods may take longer than expected and at your cost if specified by the distributing business.
            </p>
            <p>
              You can always contact us for any return questions at <strong>info@lifestylemedicinegateway.com</strong>.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold border-b pb-2 mb-4">Damages and Issues</h2>
            <p>
              Please inspect your order upon receipt and contact us immediately if the item is defective, damaged, or if you receive the wrong item, so that we may evaluate the issue and make it right.
            </p>
            <p>
              Certain types of items cannot be returned, like perishable goods (such as food, flowers, or plants), custom products (such as special orders or personalized items), and personal care goods (such as beauty products). We also do not accept returns for hazardous materials, flammable liquids, or gases. Please get in touch if you have questions or concerns about your specific item.
            </p>
            <p className="font-semibold text-destructive">
              Unfortunately, we cannot accept returns on sale items or gift cards.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold border-b pb-2 mb-4">Exchanges</h2>
            <p>
              The fastest way to ensure you get what you want is to return the item you have once you have contacted us, and once the return is accepted, make a separate purchase for the new item.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold border-b pb-2 mb-4">European Union 3-Day Cooling Off Period</h2>
            <p>
              Notwithstanding the above, if merchandise is being shipped into the European Union, you have the right to cancel or return your order within 3 days for any reason and without justification. As above, your item must be in the same condition that you received it, unworn or unused, with tags, and in its original packaging. You’ll also need the receipt or proof of purchase.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold border-b pb-2 mb-4">Refunds</h2>
            <p>
              We will notify you once the distributing business has received and inspected your return to let you know if the refund was approved or not. If approved, you’ll be automatically refunded on your original payment method within <strong>10 business days</strong>. Please remember it can take some time for your bank or credit card company to process and post the refund too.
            </p>
            <p>
              If more than 15 business days have passed since we’ve approved your return, please contact us at <strong>info@lifestylemedicinegateway.com</strong>.
            </p>
          </section>
        </div>
      </main>
      <Footer />
    </div>
  );
}
