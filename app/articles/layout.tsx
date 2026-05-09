import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Health Articles & Wellness Tips — Evidence-Based Lifestyle Medicine',
  description: 'Read expert articles on nutrition, mental health, fitness, and preventive care. Evidence-based wellness tips from qualified health practitioners.',
  openGraph: {
    title: 'Health Articles | Lifestyle Medicine Gateway',
    description: 'Evidence-based health articles and wellness tips from qualified practitioners.',
    url: 'https://www.lifestylemedicinegateway.com/articles',
  },
  alternates: {
    canonical: 'https://www.lifestylemedicinegateway.com/articles',
  },
};

export default function ArticlesLayout({ children }: { children: React.ReactNode }) {
  return children;
}
