import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Healthy Recipes — Nutritious Meals for Lifestyle Medicine',
  description: 'Discover healthy, delicious recipes aligned with lifestyle medicine principles. Plant-based, whole food recipes for optimal health and wellbeing.',
  openGraph: {
    title: 'Healthy Recipes | Lifestyle Medicine Gateway',
    description: 'Nutritious, delicious recipes aligned with lifestyle medicine principles.',
    url: 'https://www.lifestylemedicinegateway.com/recipes',
  },
  alternates: {
    canonical: 'https://www.lifestylemedicinegateway.com/recipes',
  },
};

export default function RecipesLayout({ children }: { children: React.ReactNode }) {
  return children;
}
