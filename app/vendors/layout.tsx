import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Our Wellness Partners — Trusted Health & Wellness Vendors',
  description: 'Meet our approved wellness vendors and health practitioners. Browse trusted brands offering supplements, organic products, coaching, and professional health services.',
  openGraph: {
    title: 'Wellness Vendors | Lifestyle Medicine Gateway',
    description: 'Trusted wellness brands and health practitioners on our marketplace.',
    url: 'https://www.lifestylemedicinegateway.com/vendors',
  },
  alternates: { canonical: 'https://www.lifestylemedicinegateway.com/vendors' },
};

export default function VendorsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
