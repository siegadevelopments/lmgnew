import { Link, useNavigate } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { ShoppingCart } from "lucide-react";
import { useCart } from "@/hooks/use-cart";
import { useAuth } from "@/hooks/use-auth";
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
    variants?: any[];
  };
  className?: string;
}

export function ProductCard({ product, className }: ProductCardProps) {
  const { addItem } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!user) {
      toast("Please register first", {
        description: "You need an account to add items to your cart.",
        action: {
          label: "Register",
          onClick: () => navigate({ to: "/signup", search: { redirect: window.location.pathname } })
        }
      });
      return;
    }
    
    const baseVariant = product.variants && product.variants.length > 0 ? product.variants[0] : null;
    
    addItem({
      id: baseVariant ? `${product.id}-${baseVariant.id}` : product.id,
      product_id: product.id,
      variant_id: baseVariant?.id,
      name: product.title,
      variant_name: baseVariant?.title,
      price: baseVariant ? baseVariant.price : product.price,
      image: product.image_url || undefined,
      slug: product.slug,
      vendor_id: (product as any).vendor_id
    });
    
    toast.success(`${product.title} added to cart`, {
      description: "You can view your items in the cart.",
    });
  };

  return (
    <Link
      to="/products/$slug"
      params={{ slug: product.slug }}
      className={cn(
        "group flex flex-col overflow-hidden bg-card transition-all hover:shadow-lg border border-border/50 hover:border-primary/30 relative",
        className
      )}
    >
      <div className="relative aspect-square overflow-hidden bg-muted">
        {product.image_url ? (
          <img
            src={product.image_url}
            alt={product.title}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-muted-foreground bg-muted/50">
             <ShoppingCart className="h-10 w-10 opacity-10" />
          </div>
        )}
        
        {/* Shopee-style "Preferred" or "Wellness" Badge */}
        <div className="absolute top-2 left-0 z-10">
          <div className="bg-primary px-1.5 py-0.5 text-[9px] font-bold text-white rounded-r-sm shadow-sm uppercase tracking-tighter">
            Wellness
          </div>
        </div>
      </div>
      
      <div className="flex flex-1 flex-col p-2.5">
        <h3 className="text-sm font-medium text-foreground line-clamp-2 h-10 group-hover:text-primary transition-colors leading-snug">
          {product.title}
        </h3>
        
        <div className="mt-2 flex flex-col gap-1">
          <div className="flex items-baseline gap-1">
            <span className="text-xs text-primary font-bold">$</span>
            <span className="text-lg font-bold text-primary">{Number(product.price).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
          </div>
          
          <div className="flex items-center justify-between mt-1">
             <div className="flex items-center gap-1">
                <div className="flex text-[10px] text-amber-500">
                   {"★★★★★".split("").map((s, i) => <span key={i}>{s}</span>)}
                </div>
                <span className="text-[10px] text-muted-foreground">(12)</span>
             </div>
             <span className="text-[10px] text-muted-foreground">8.2k sold</span>
          </div>

          <div className="mt-2 pt-2 border-t border-border/50 flex items-center justify-between text-[10px] text-muted-foreground">
             <span className="truncate max-w-[80px]">{(product as any).vendor_profiles?.store_name || "LMG Store"}</span>
             <span className="shrink-0">Australia</span>
          </div>
        </div>
      </div>

      {/* Shopee-style hover action */}
      <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none flex items-end justify-center pb-20">
         <div 
           className="bg-primary text-white px-3 py-1.5 rounded-full text-xs font-bold shadow-xl translate-y-4 group-hover:translate-y-0 transition-transform pointer-events-auto cursor-pointer" 
           onClick={(e) => {
             if (product.variants && product.variants.length > 1) {
               // Let the Link handle navigation
             } else {
               handleAddToCart(e);
             }
           }}
         >
            {product.variants && product.variants.length > 1 ? "Select Options" : "Quick Add"}
         </div>
      </div>
    </Link>
  );
}
