"use client";

import { Label } from "@/components/ui/label";
import { WELLNESS_CATEGORY_OPTIONS } from "@/lib/wellness-categories";

/**
 * Picks the /categories/[slug] pages a product appears on (products.wellness_categories).
 * `value` semantics match the column: null = not reviewed yet (the site keyword-matches it),
 * [] = reviewed, in no category, otherwise the chosen slugs.
 */
export function WellnessCategoryPicker({
  value,
  onChange,
}: {
  value: string[] | null;
  onChange: (next: string[] | null) => void;
}) {
  const selected = value ?? [];
  const none = Array.isArray(value) && value.length === 0;

  const toggle = (slug: string) =>
    onChange(selected.includes(slug) ? selected.filter((s) => s !== slug) : [...selected, slug]);

  return (
    <div className="space-y-2 sm:col-span-2">
      <Label>Wellness Categories</Label>
      <p className="text-xs text-muted-foreground">
        Choose the category pages this product should appear on. Pick only categories it genuinely fits.
        {value === null && " Not set yet: the site is guessing from the product text."}
      </p>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
        {WELLNESS_CATEGORY_OPTIONS.map((c) => (
          <label key={c.slug} className="flex items-center gap-2 text-sm cursor-pointer">
            <input
              type="checkbox"
              className="h-4 w-4 accent-primary"
              checked={selected.includes(c.slug)}
              onChange={() => toggle(c.slug)}
            />
            {c.name}
          </label>
        ))}
        <label className="flex items-center gap-2 text-sm cursor-pointer text-muted-foreground">
          <input
            type="checkbox"
            className="h-4 w-4 accent-primary"
            checked={none}
            onChange={() => onChange(none ? null : [])}
          />
          Not a wellness product
        </label>
      </div>
    </div>
  );
}
