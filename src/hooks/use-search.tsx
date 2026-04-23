import { useState, useCallback } from "react";
import { useNavigate } from "@tanstack/react-router";

export function useSearch() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");

  const handleSearch = useCallback(
    (query?: string) => {
      const q = query || searchQuery;
      if (!q.trim()) return;

      // Navigate to products with search query
      navigate({
        to: "/products",
        search: { q, page: 1, category: "" },
      });
    },
    [navigate, searchQuery]
  );

  const handleCategoryClick = useCallback(
    (category: string) => {
      navigate({
        to: "/products",
        search: { q: "", page: 1, category },
      });
    },
    [navigate]
  );

  return {
    searchQuery,
    setSearchQuery,
    handleSearch,
    handleCategoryClick,
  };
}