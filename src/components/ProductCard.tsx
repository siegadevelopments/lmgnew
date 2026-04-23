import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { ShoppingCart } from "lucide-react";
import { useCart } from "@/hooks/use-cart";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface ProductCardProps {
  product: {
    id: number;
    title: string;
    price: number;
    image_url?: string | null;
    slug: string;
    category?: string;
  };
  className?: string;
}

export function ProductCard({ product, className }: ProductCardProps) {
  const { addItem } = useCart();

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    addItem({
      id: product.id,
      name: product.title,
      price: product.price,
      image: product.image_url || undefined,
      slug: product.slug,
    });
    
    toast.success(`${product.title} added to cart`, {
      description: "You can view your items in the cart.",
      action: {
        label: "View Cart",
        onClick: () => {
          // Trigger cart sheet or navigate
          const cartBtn = document.querySelector('[aria-label="Open Cart"]') as HTMLButtonElement;
          if (cartBtn) cartBtn.click();
        }
      }
    });
  };

  return (
    <Link
      to="/products/$slug"
      params={{ slug: product.slug }}
      className={cn(
        "group flex flex-col overflow-hidden rounded-xl bg-card shadow-sm transition-all hover:shadow-card hover:-translate-y-1 border border-border/50",
        className
      )}
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-muted">
        {product.image_url ? (
          <img
            src={product.image_url}
            alt={product.title}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-muted-foreground bg-muted/50">
            <svg className="h-10 w-10 opacity-30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
        )}
        
        {/* Quick Add Overlay */}
        <div className="absolute inset-0 flex items-center justify-center bg-black/5 opacity-0 transition-opacity group-hover:opacity-100">
           <Button 
            size="sm" 
            className="translate-y-4 transition-transform group-hover:translate-y-0 shadow-lg"
            onClick={handleAddToCart}
           >
            <ShoppingCart className="mr-2 h-4 w-4" />
            Add to Cart
           </Button>
        </div>
      </div>
      
      <div className="flex flex-1 flex-col p-5">
        <h3 className="text-base font-bold text-foreground line-clamp-1 group-hover:text-primary transition-colors">
          {product.title}
        </h3>
        {product.category && (
          <p className="text-[10px] uppercase tracking-widest text-muted-foreground mt-1">{product.category}</p>
        )}
        <div className="mt-auto pt-4 flex items-center justify-between">
          <p className="text-lg font-black text-primary">${Number(product.price).toFixed(2)}</p>
          <div className="md:hidden">
            <Button size="icon" variant="ghost" className="h-8 w-8 text-primary" onClick={handleAddToCart}>
              <ShoppingCart className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </Link>
  );
}
