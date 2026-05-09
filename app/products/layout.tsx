import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Wellness Products — Shop Health Supplements, Organic & Natural Goods',
  description: 'Browse our curated collection of wellness products including supplements, organic foods, essential oils, skincare, and health equipment from trusted Australian vendors.',
  openGraph: {
    title: 'Wellness Products | Lifestyle Medicine Gateway',
    description: 'Browse our curated collection of wellness products from trusted Australian vendors.',
    url: 'https://www.lifestylemedicinegateway.com/products',
  },
  alternates: {
    canonical: 'https://www.lifestylemedicinegateway.com/products',
  },
};

export default function ProductsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
