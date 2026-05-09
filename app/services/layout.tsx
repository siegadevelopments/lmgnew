import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Professional Wellness Services — Coaching, Consultations & Holistic Health',
  description: 'Book professional wellness services including health coaching, yoga sessions, reiki healing, nutritional consultations, and holistic health services from qualified practitioners.',
  openGraph: {
    title: 'Wellness Services | Lifestyle Medicine Gateway',
    description: 'Book professional wellness and health services from qualified practitioners.',
    url: 'https://www.lifestylemedicinegateway.com/services',
  },
  alternates: { canonical: 'https://www.lifestylemedicinegateway.com/services' },
};

export default function ServicesLayout({ children }: { children: React.ReactNode }) {
  return children;
}
