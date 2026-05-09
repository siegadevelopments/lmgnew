import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Contact Us — Lifestyle Medicine Gateway',
  description: 'Get in touch with the Lifestyle Medicine Gateway team. We\'re here to help with questions about products, services, vendor partnerships, and more.',
  openGraph: {
    title: 'Contact Us | Lifestyle Medicine Gateway',
    description: 'Reach out to the Lifestyle Medicine Gateway team.',
    url: 'https://www.lifestylemedicinegateway.com/contact',
  },
  alternates: { canonical: 'https://www.lifestylemedicinegateway.com/contact' },
};

export default function ContactLayout({ children }: { children: React.ReactNode }) {
  return children;
}
