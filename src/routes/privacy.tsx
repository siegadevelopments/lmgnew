import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/privacy")({
  head: () => ({
    meta: [
      { title: "Privacy Policy | Lifestyle Medicine Gateway" },
      {
        name: "description",
        content: "Privacy Policy for Lifestyle Medicine Gateway and e-training group.",
      },
    ],
  }),
  component: PrivacyPage,
});

function PrivacyPage() {
  return (
    <div className="min-h-screen bg-background">
      <main className="mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="mb-12">
          <h1 className="text-4xl font-extrabold tracking-tight text-foreground sm:text-5xl">
            Privacy Policy
          </h1>
          <p className="mt-4 text-muted-foreground font-medium">Last updated: 05/03/2026</p>
        </div>

        <div className="prose prose-slate max-w-none text-foreground prose-headings:text-foreground prose-strong:text-foreground prose-a:text-primary">
          <p>
            This Privacy Policy describes how <strong>e-training group</strong> (the "Site", "we",
            "us", or "our") collects, uses, and discloses your personal information when you visit,
            use our services, or make a purchase from <strong>lifestylemedicinegateway.com</strong>{" "}
            (the "Site") or otherwise communicate with us (collectively, the "Services"). For
            purposes of this Privacy Policy, "you" and "your" means you as the user of the Services,
            whether you are a customer, website visitor, or another individual whose information we
            have collected pursuant to this Privacy Policy.
          </p>

          <p>
            Please read this Privacy Policy carefully. By using and accessing any of the Services,
            you agree to the collection, use, and disclosure of your information as described in
            this Privacy Policy. If you do not agree to this Privacy Policy, please do not use or
            access any of the Services.
          </p>

          <h2 className="text-2xl font-bold mt-10 mb-4">Changes to This Privacy Policy</h2>
          <p>
            We may update this Privacy Policy from time to time, including to reflect changes to our
            practices or for other operational, legal, or regulatory reasons. We will post the
            revised Privacy Policy on the Site, update the "Last updated" date and take any other
            steps required by applicable law.
          </p>

          <h2 className="text-2xl font-bold mt-10 mb-4">
            How We Collect and Use Your Personal Information
          </h2>
          <p>
            To provide the Services, we collect and have collected over the past 12 months personal
            information about you from a variety of sources, as set out below. The information that
            we collect and use varies depending on how you interact with us.
          </p>
          <p>
            In addition to the specific uses set out below, we may use information we collect about
            you to communicate with you, provide the Services, comply with any applicable legal
            obligations, enforce any applicable terms of service, and to protect or defend the
            Services, our rights, and the rights of our users or others.
          </p>

          <h2 className="text-2xl font-bold mt-10 mb-4">What Personal Information We Collect</h2>
          <p>
            The types of personal information we obtain about you depends on how you interact with
            our Site and use our Services. When we use the term "personal information", we are
            referring to information that identifies, relates to, describes or can be associated
            with you. The following sections describe the categories and specific types of personal
            information we collect.
          </p>

          <h3 className="text-xl font-bold mt-8 mb-3">Information We Collect Directly from You</h3>
          <p>Information that you directly submit to us through our Services may include:</p>
          <ul className="list-disc pl-6 space-y-2">
            <li>Basic contact details including your name, address, phone number, email.</li>
            <li>
              Order information including your name, billing address, shipping address, payment
              confirmation, email address, phone number.
            </li>
            <li>Account information including your username, password, security questions.</li>
            <li>
              Shopping information including the items you view, put in your cart or add to your
              wish list.
            </li>
            <li>
              Customer support information including the information you choose to include in
              communications with us, for example, when sending a message through the Services.
            </li>
          </ul>
          <p>
            Some features of the Services may require you to directly provide us with certain
            information about yourself. You may elect not to provide this information, but doing so
            may prevent you from using or accessing these features.
          </p>

          <h3 className="text-xl font-bold mt-8 mb-3">Information We Collect through Cookies</h3>
          <p>
            We also automatically collect certain information about your interaction with the
            Services ("Usage Data"). To do this, we may use cookies, pixels and similar technologies
            ("Cookies"). Usage Data may include information about how you access and use our Site
            and your account, including device information, browser information, information about
            your network connection, your IP address and other information regarding your
            interaction with the Services.
          </p>

          <h3 className="text-xl font-bold mt-8 mb-3">Information We Obtain from Third Parties</h3>
          <p>
            Finally, we may obtain information about you from third parties, including from vendors
            and service providers who may collect information on our behalf, such as:
          </p>
          <ul className="list-disc pl-6 space-y-2">
            <li>Companies who support our Site and Services.</li>
            <li>
              Our payment processors, who collect payment information (e.g., bank account, credit or
              debit card information, billing address) to process your payment in order to fulfill
              your orders and provide you with products or services you have requested, in order to
              perform our contract with you.
            </li>
            <li>
              When you visit our Site, open or click on emails we send you, or interact with our
              Services or advertisements, we, or third parties we work with, may automatically
              collect certain information using online tracking technologies such as pixels, web
              beacons, software developer kits, third-party libraries, and cookies.
            </li>
          </ul>
          <p>
            Any information we obtain from third parties will be treated in accordance with this
            Privacy Policy. We are not responsible or liable for the accuracy of the information
            provided to us by third parties and are not responsible for any third party's policies
            or practices. For more information, see the section below, Third Party Websites and
            Links.
          </p>

          <h2 className="text-2xl font-bold mt-10 mb-4">How We Use Your Personal Information</h2>
          <ul className="list-disc pl-6 space-y-4">
            <li>
              <strong>Providing Products and Services.</strong> We use your personal information to
              provide you with the Services in order to perform our contract with you, including to
              process your payments, fulfill your orders, to send notifications to you related to
              your account, purchases, returns, exchanges or other transactions, to create, maintain
              and otherwise manage your account, to arrange for shipping, facilitate any returns and
              exchanges and to enable you to post reviews.
            </li>
            <li>
              <strong>Marketing and Advertising.</strong> We use your personal information for
              marketing and promotional purposes, such as to send marketing, advertising and
              promotional communications by email, text message or postal mail, and to show you
              advertisements for products or services. This may include using your personal
              information to better tailor the Services and advertising on our Site and other
              websites.
            </li>
            <li>
              <strong>Security and Fraud Prevention.</strong> We use your personal information to
              detect, investigate or take action regarding possible fraudulent, illegal or malicious
              activity. If you choose to use the Services and register an account, you are
              responsible for keeping your account credentials safe. We highly recommend that you do
              not share your username, password, or other access details with anyone else. If you
              believe your account has been compromised, please contact us immediately.
            </li>
            <li>
              <strong>Communicating with you.</strong> We use your personal information to provide
              you with customer support and improve our Services. This is in our legitimate
              interests in order to be responsive to you, to provide effective services to you, and
              to maintain our business relationship with you.
            </li>
          </ul>

          <h2 className="text-2xl font-bold mt-10 mb-4">How We Disclose Personal Information</h2>
          <p>
            In certain circumstances, we may disclose your personal information to third parties for
            legitimate purposes subject to this Privacy Policy. Such circumstances may include:
          </p>
          <ul className="list-disc pl-6 space-y-2">
            <li>
              With vendors or other third parties who perform services on our behalf (e.g., IT
              management, payment processing, data analytics, customer support, cloud storage,
              fulfillment and shipping).
            </li>
            <li>
              With business and marketing partners, to provide services and advertise to you. Our
              business and marketing partners will use your information in accordance with their own
              privacy notices.
            </li>
            <li>
              When you direct, request us or otherwise consent to our disclosure of certain
              information to third parties, such as to ship your products or through your use of
              social media widgets or login integrations, with your consent.
            </li>
            <li>
              With our affiliates or otherwise within our corporate group, in our legitimate
              interests to run a successful business.
            </li>
            <li>
              In connection with a business transaction such as a merger or bankruptcy, to comply
              with any applicable legal obligations (including to respond to subpoenas, search
              warrants and similar requests), to enforce any applicable terms of service, and to
              protect or defend the Services, our rights, and the rights of our users or others.
            </li>
          </ul>

          <h2 className="text-2xl font-bold mt-10 mb-4">User Generated Content</h2>
          <p>
            The Services may enable you to post product reviews and other user-generated content. If
            you choose to submit user generated content to any public area of the Services, this
            content will be public and accessible by anyone.
          </p>
          <p>
            We do not control who will have access to the information that you choose to make
            available to others, and cannot ensure that parties who have access to such information
            will respect your privacy or keep it secure. We are not responsible for the privacy or
            security of any information that you make publicly available, or for the accuracy, use
            or misuse of any information that you disclose or receive from third parties.
          </p>

          <h2 className="text-2xl font-bold mt-10 mb-4">Third Party Websites and Links</h2>
          <p>
            Our Site may provide links to websites or other online platforms operated by third
            parties. If you follow links to sites not affiliated or controlled by us, you should
            review their privacy and security policies and other terms and conditions. We do not
            guarantee and are not responsible for the privacy or security of such sites, including
            the accuracy, completeness, or reliability of information found on these sites.
            Information you provide on public or semi-public venues, including information you share
            on third-party social networking platforms may also be viewable by other users of the
            Services and/or users of those third-party platforms without limitation as to its use by
            us or by a third party.
          </p>

          <h2 className="text-2xl font-bold mt-10 mb-4">Children's Data</h2>
          <p>
            The Services are not intended to be used by children, and we do not knowingly collect
            any personal information about children. If you are the parent or guardian of a child
            who has provided us with their personal information, you may contact us using the
            contact details set out below to request that it be deleted.
          </p>

          <h2 className="text-2xl font-bold mt-10 mb-4">
            Security and Retention of Your Information
          </h2>
          <p>
            Please be aware that no security measures are perfect or impenetrable, and we cannot
            guarantee "perfect security." In addition, any information you send to us may not be
            secure while in transit. We recommend that you do not use unsecure channels to
            communicate sensitive or confidential information to us.
          </p>
          <p>
            How long we retain your personal information depends on different factors, such as
            whether we need the information to maintain your account, to provide the Services,
            comply with legal obligations, resolve disputes or enforce other applicable contracts
            and policies.
          </p>

          <h2 className="text-2xl font-bold mt-10 mb-4">Your Rights and Choices</h2>
          <p>
            Depending on where you live, you may have some or all of the rights listed below in
            relation to your personal information. However, these rights are not absolute, may apply
            only in certain circumstances and, in certain cases, we may decline your request as
            permitted by law.
          </p>
          <ul className="list-disc pl-6 space-y-2">
            <li>Right to Access / Know.</li>
            <li>Right to Delete.</li>
            <li>Right to Correct.</li>
            <li>Right of Portability.</li>
            <li>Right to Opt out of Sale or Sharing or Targeted Advertising.</li>
            <li>
              Right to Limit and/or Opt out of Use and Disclosure of Sensitive Personal Information.
            </li>
            <li>Restriction of Processing.</li>
            <li>Withdrawal of Consent.</li>
          </ul>

          <h2 className="text-2xl font-bold mt-10 mb-4">Contact</h2>
          <p>
            Should you have any questions about our privacy practices or this Privacy Policy, or if
            you would like to exercise any of the rights available to you, please email us at{" "}
            <strong>info@lifestylemedicinegateway.com</strong> or contact us at:
          </p>
          <p className="font-bold">102 Rymer Ave SAFETY BEACH, Melbourne, VIC, 3936, Australia.</p>
        </div>
      </main>
    </div>
  );
}
