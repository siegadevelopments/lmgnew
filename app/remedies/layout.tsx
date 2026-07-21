import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Remedies — Quick Titles & Health Indications | Lifestyle Medicine Gateway",
  description: "Browse targeted natural remedies and holistic health solutions organized by benefit and title.",
  openGraph: {
    title: "Remedies | Lifestyle Medicine Gateway",
    description: "Browse targeted natural remedies and holistic health solutions organized by benefit and title.",
  },
};

export default function RemediesLayout({ children }: { children: React.ReactNode }) {
  return children;
}
