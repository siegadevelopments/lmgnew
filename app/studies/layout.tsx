import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Scientific Studies — Research in Lifestyle Medicine',
  description: 'Curated summaries of peer-reviewed research in lifestyle medicine, nutrition science, and preventive healthcare. Stay informed with the latest evidence.',
  openGraph: {
    title: 'Scientific Studies | Lifestyle Medicine Gateway',
    description: 'Peer-reviewed research summaries in lifestyle medicine and nutrition.',
    url: 'https://www.lifestylemedicinegateway.com/studies',
  },
  alternates: { canonical: 'https://www.lifestylemedicinegateway.com/studies' },
};

export default function StudiesLayout({ children }: { children: React.ReactNode }) {
  return children;
}
