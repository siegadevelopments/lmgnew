import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Educational Wellness Videos — Health & Lifestyle Medicine',
  description: 'Watch educational wellness videos from health practitioners covering nutrition, exercise, mindfulness, product demonstrations, and lifestyle medicine topics.',
  openGraph: {
    title: 'Wellness Videos | Lifestyle Medicine Gateway',
    description: 'Educational wellness videos from health practitioners and vendors.',
    url: 'https://www.lifestylemedicinegateway.com/videos',
  },
  alternates: { canonical: 'https://www.lifestylemedicinegateway.com/videos' },
};

export default function VideosLayout({ children }: { children: React.ReactNode }) {
  return children;
}
