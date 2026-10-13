import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center px-4 py-16">
      <div className="max-w-md text-center">
        <h1 className="text-3xl font-bold text-foreground">Page not found</h1>
        <p className="mt-3 text-muted-foreground">
          That page may have moved. Try one of these instead.
        </p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Button asChild>
            <Link href="/products">Shop products</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/articles">Read articles</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/recipes">Browse recipes</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
