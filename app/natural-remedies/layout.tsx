import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Natural Remedies — Herbal & Traditional Health Solutions',
  description: 'Explore evidence-informed natural remedies and herbal solutions for common health concerns. Traditional wisdom meets modern lifestyle medicine.',
  openGraph: {
    title: 'Natural Remedies | Lifestyle Medicine Gateway',
    description: 'Evidence-informed natural remedies and herbal health solutions.',
    url: 'https://www.lifestylemedicinegateway.com/natural-remedies',
  },
  alternates: { canonical: 'https://www.lifestylemedicinegateway.com/natural-remedies' },
};

export default function NaturalRemediesLayout({ children }: { children: React.ReactNode }) {
  return children;
}
