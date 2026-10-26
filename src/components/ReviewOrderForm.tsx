"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type Item = { productId: number; name: string; image: string | null };

function Stars({ value, onChange, label }: { value: number; onChange: (v: number) => void; label: string }) {
  return (
    <div role="radiogroup" aria-label={label} className="flex gap-1">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          role="radio"
          aria-checked={value === n}
          aria-label={`${n} star${n > 1 ? "s" : ""}`}
          onClick={() => onChange(n)}
          className={`text-3xl leading-none transition-colors ${n <= value ? "text-amber-500" : "text-muted-foreground/30 hover:text-amber-300"}`}
        >
          ★
        </button>
      ))}
    </div>
  );
}

function ItemReview({ token, item, defaultName, done: initiallyDone }: { token: string; item: Item; defaultName: string; done: boolean }) {
  const [rating, setRating] = useState(0);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [name, setName] = useState(defaultName);
  const [state, setState] = useState<"idle" | "saving" | "done">(initiallyDone ? "done" : "idle");
  const [error, setError] = useState("");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rating) return setError("Please choose a star rating.");
    setState("saving");
    setError("");
    const res = await fetch("/api/reviews", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, product_id: item.productId, rating, title, content, name }),
    }).catch(() => null);
    const data = await res?.json().catch(() => ({}));
    if (res?.ok) setState("done");
    else {
      setState("idle");
      setError(data?.error || "We couldn't save your review. Please try again.");
    }
  };

  return (
    <div className="rounded-xl border border-border p-5">
      <div className="flex items-center gap-4">
        {item.image && <img src={item.image} alt="" className="h-16 w-16 rounded-lg object-cover" />}
        <h2 className="font-semibold text-foreground">{item.name}</h2>
      </div>
      {state === "done" ? (
        <p className="mt-4 text-sm font-medium text-primary">Thanks, your review has been saved.</p>
      ) : (
        <form onSubmit={submit} className="mt-4 space-y-3">
          <Stars value={rating} onChange={setRating} label={`Rating for ${item.name}`} />
          <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Headline (optional)" maxLength={100} />
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="What did you like or not like? (optional)"
            maxLength={2000}
            rows={4}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          />
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Name to show (e.g. Sam T.)" maxLength={60} />
          {error && <p className="text-sm text-destructive">{error}</p>}
          <Button type="submit" disabled={state === "saving"}>
            {state === "saving" ? "Saving…" : "Submit review"}
          </Button>
        </form>
      )}
    </div>
  );
}

export function ReviewOrderForm({ token, items, defaultName, alreadyReviewed }: { token: string; items: Item[]; defaultName: string; alreadyReviewed: number[] }) {
  return (
    <div className="mt-8 space-y-6">
      {items.map((item) => (
        <ItemReview key={item.productId} token={token} item={item} defaultName={defaultName} done={alreadyReviewed.includes(item.productId)} />
      ))}
    </div>
  );
}
