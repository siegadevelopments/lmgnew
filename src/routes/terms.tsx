import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/terms")({
  head: () => ({
    meta: [
      { title: "Terms of Service | Lifestyle Medicine Gateway" },
      {
        name: "description",
        content: "Terms of Service for Lifestyle Medicine Gateway and e-training group.",
      },
    ],
  }),
  component: TermsPage,
});

function TermsPage() {
  return (
    <div className="min-h-screen bg-background">
      <main className="mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="mb-12">
          <h1 className="text-4xl font-extrabold tracking-tight text-foreground sm:text-5xl">
            Terms of Service
          </h1>
          <p className="mt-4 text-muted-foreground font-medium">Last updated: 05/03/2026</p>
        </div>

        <div className="prose prose-slate max-w-none text-foreground prose-headings:text-foreground prose-strong:text-foreground prose-a:text-primary">
          <h2 className="text-2xl font-bold mt-10 mb-4 uppercase tracking-wider">Overview</h2>
          <p>
            This website is operated by <strong>E-training group</strong>. Throughout the site, the
            terms “we”, “us” and “our” refer to E-training group. E-training group offers this
            website, including all information, tools and Services available from this site to you,
            the user, conditioned upon your acceptance of all terms, conditions, policies and
            notices stated here.
          </p>

          <p>
            By visiting our site and/ or purchasing something from us, you engage in our “Service”
            and agree to be bound by the following terms and conditions (“Terms of Service”,
            “Terms”), including those additional terms and conditions and policies referenced herein
            and/or available by hyperlink. These Terms of Service apply to all users of the site,
            including without limitation users who are browsers, vendors, customers, merchants, and/
            or contributors of content.
          </p>

          <p>
            Please read these Terms of Service carefully before accessing or using our website. By
            accessing or using any part of the site, you agree to be bound by these Terms of
            Service. If you do not agree to all the terms and conditions of this agreement, then you
            may not access the website or use any Services.
          </p>

          <p>
            Any new features or tools which are added to the current store shall also be subject to
            the Terms of Service. You can review the most current version of the Terms of Service at
            any time on this page. We reserve the right to update, change or replace any part of
            these Terms of Service by posting updates and/or changes to our website. It is your
            responsibility to check this page periodically for changes.
          </p>

          <p>
            Our store is created by <strong>Apprising Creatives</strong>. They provide us with the
            online e-commerce platform that allows us to sell our products and Services to you.
          </p>

          <section className="mt-12">
            <h2 className="text-2xl font-bold mb-6">SECTION 1 - ONLINE STORE TERMS</h2>
            <p>
              By agreeing to these Terms of Service, you represent that you are at least the age of
              majority in your state or province of residence and or you have given us your consent
              to allow any of your minor dependents to use this site.
            </p>
            <p>
              You may not use our products for any illegal or unauthorized purpose nor may you, in
              the use of the Service, violate any laws in your jurisdiction (including but not
              limited to copyright laws).
            </p>
            <p>
              A breach or violation of any of the Terms will result in an immediate termination of
              your Services.
            </p>
          </section>

          <section className="mt-12">
            <h2 className="text-2xl font-bold mb-6">SECTION 2 - GENERAL CONDITIONS</h2>
            <p>We reserve the right to refuse service to anyone for any reason at any time.</p>
            <p>
              You understand that your content (not including credit card information), may be
              transferred unencrypted and involve (a) transmissions over various networks; and (b)
              changes to conform and adapt to technical requirements of connecting networks or
              devices. Credit card information is always encrypted during transfer over networks.
            </p>
            <p>
              You agree not to reproduce, duplicate, copy, sell, resell or exploit any portion of
              the Service without express written permission by us.
            </p>
          </section>

          <section className="mt-12">
            <h2 className="text-2xl font-bold mb-6">
              SECTION 3 - ACCURACY AND TIMELINESS OF INFORMATION
            </h2>
            <p>
              We are not responsible if information made available on this site is not accurate,
              complete or current. The material on this site is provided for general information
              only and should not be relied upon as the sole basis for making decisions. Any
              reliance on the material on this site is at your own risk.
            </p>
          </section>

          <section className="mt-12">
            <h2 className="text-2xl font-bold mb-6">
              SECTION 4 - MODIFICATIONS TO THE SERVICE AND PRICES
            </h2>
            <p>
              Prices for our products are subject to change without notice. We reserve the right at
              any time to modify or discontinue the Service without notice at any time.
            </p>
          </section>

          <section className="mt-12">
            <h2 className="text-2xl font-bold mb-6">SECTION 5 - PRODUCTS OR SERVICES</h2>
            <p>
              Certain products or Services may be available exclusively online through the website.
              These products or Services may have limited quantities and are subject to return or
              exchange only according to our{" "}
              <Link to="/refund-policy" className="underline">
                Return Policy
              </Link>
              .
            </p>
            <p>
              We have made every effort to display as accurately as possible the colors and images
              of our products. We cannot guarantee that your computer monitor's display of any color
              will be accurate.
            </p>
          </section>

          <section className="mt-12">
            <h2 className="text-2xl font-bold mb-6">
              SECTION 6 - ACCURACY OF BILLING AND ACCOUNT INFORMATION
            </h2>
            <p>
              We reserve the right to refuse any order you place with us. We may, in our sole
              discretion, limit or cancel quantities purchased per person, per household or per
              order. In the event that we make a change to or cancel an order, we may attempt to
              notify you by contacting the e-mail and/or billing address/phone number provided at
              the time the order was made.
            </p>
          </section>

          <section className="mt-12">
            <h2 className="text-2xl font-bold mb-6">SECTION 8 - THIRD-PARTY LINKS</h2>
            <p>
              Certain content, products and Services available via our Service may include materials
              from third-parties. Third-party links on this site may direct you to third-party
              websites that are not affiliated with us. We are not responsible for examining or
              evaluating the content or accuracy.
            </p>
          </section>

          <section className="mt-12">
            <h2 className="text-2xl font-bold mb-6">SECTION 9 - USER COMMENTS AND FEEDBACK</h2>
            <p>
              If you send creative ideas, suggestions, or other materials, you agree that we may, at
              any time, without restriction, edit, copy, publish, distribute, and otherwise use in
              any medium any comments that you forward to us.
            </p>
          </section>

          <section className="mt-12">
            <h2 className="text-2xl font-bold mb-6">SECTION 10 - PERSONAL INFORMATION</h2>
            <p>
              Your submission of personal information through the store is governed by our{" "}
              <Link to="/privacy" className="underline">
                Privacy Policy
              </Link>
              .
            </p>
          </section>

          <section className="mt-12">
            <h2 className="text-2xl font-bold mb-6">SECTION 12 - PROHIBITED USES</h2>
            <p>
              You are prohibited from using the site or its content: (a) for any unlawful purpose;
              (b) to solicit others to perform or participate in any unlawful acts; (c) to violate
              any regulations, rules, or laws; (d) to infringe upon or violate our intellectual
              property rights; (e) to harass, abuse, or discriminate; (f) to submit false or
              misleading information; (g) to upload viruses or malicious code.
            </p>
          </section>

          <section className="mt-12 text-muted-foreground border-t pt-10">
            <h2 className="text-2xl font-bold mb-6 text-foreground">SECTION 18 - GOVERNING LAW</h2>
            <p>
              These Terms of Service and any separate agreements whereby we provide you Services
              shall be governed by and construed in accordance with the laws of{" "}
              <strong>Australia</strong>.
            </p>
          </section>

          <section className="mt-12">
            <h2 className="text-2xl font-bold mb-6">SECTION 20 - CONTACT INFORMATION</h2>
            <p>
              Questions about the Terms of Service should be sent to us at{" "}
              <strong>info@lifestylemedicinegateway.com</strong>.
            </p>
          </section>
        </div>
      </main>
    </div>
  );
}
