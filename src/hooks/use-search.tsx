import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";

export function useSearch() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");

  const handleSearch = useCallback(
    (query?: string) => {
      const q = query || searchQuery;
      if (!q.trim()) return;

      // Navigate to products with search query
      router.push(`/products?q=${encodeURIComponent(q)}&page=1`);
    },
    [router, searchQuery],
  );

  const handleCategoryClick = useCallback(
    (category: string) => {
      router.push(`/products?category=${encodeURIComponent(category)}&page=1`);
    },
    [router],
  );

  return {
    searchQuery,
    setSearchQuery,
    handleSearch,
    handleCategoryClick,
  };
}
