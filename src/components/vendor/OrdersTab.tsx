import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface OrderItem { 
  id: string; 
  order_id: string; 
  product_id: number; 
  product_name: string; 
  price: number; 
  quantity: number; 
  created_at: string;
  status: string;
  tracking_number: string | null;
  orders?: {
    first_name: string;
    last_name: string;
    email: string;
    phone: string | null;
    address: string;
    city: string;
    state: string;
    zip: string;
  }
}

interface Props {
  orderItems: OrderItem[];
  onUpdate: () => void;
}

export function OrdersTab({ orderItems, onUpdate }: Props) {
  const updateOrderItem = async (id: string, payload: any) => {
    const { error } = await (supabase
      .from("order_items") as any)
      .update(payload)
      .eq("id", id);
    
    if (error) {
      console.error("Error updating order item:", error);
      toast.error("Failed to update: " + error.message);
    } else {
      onUpdate();
      toast.success("Status updated successfully!");
    }
  };

  if (orderItems.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-muted-foreground">
          No orders yet.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {orderItems.map(item => {
        const params = new URLSearchParams(window.location.search);
        const isHighlighted = params.get('orderId') === item.order_id;
        
        return (
          <Card 
            key={item.id} 
            id={`order-${item.order_id}`} 
            className={cn(
              "overflow-hidden border-border/50 transition-all duration-500",
              isHighlighted ? "border-primary ring-1 ring-primary shadow-lg scale-[1.02]" : ""
            )}
          >
            <div className="flex flex-col md:flex-row">
              <div className="flex-1 p-6">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-[10px] uppercase font-black tracking-widest text-muted-foreground">
                    Order ID: {item.order_id.slice(0, 8)}
                  </span>
                  <span className={cn(
                    "text-[10px] uppercase font-bold px-2 py-1 rounded-full",
                    item.status === 'shipped' ? "bg-green-100 text-green-700" : 
                    item.status === 'delivered' ? "bg-blue-100 text-blue-700" : 
                    "bg-amber-100 text-amber-700"
                  )}>
                    {item.status}
                  </span>
                </div>
                <h3 className="text-lg font-bold mb-1">{item.product_name}</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Quantity: {item.quantity} • Price: ${(item.price * item.quantity).toFixed(2)}
                </p>
                
                <div className="grid gap-4 sm:grid-cols-2 p-4 rounded-lg bg-muted/30 border border-border/50">
                  <div>
                    <p className="text-[10px] uppercase font-bold text-muted-foreground mb-1">Customer</p>
                    <p className="text-sm font-medium">{item.orders?.first_name} {item.orders?.last_name}</p>
                    <p className="text-xs text-muted-foreground">{item.orders?.email}</p>
                    <p className="text-xs text-muted-foreground">{item.orders?.phone}</p>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase font-bold text-muted-foreground mb-1">Shipping Address</p>
                    <p className="text-xs leading-relaxed">
                      {item.orders?.address}<br />
                      {item.orders?.city}, {item.orders?.state} {item.orders?.zip}
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="w-full md:w-72 bg-muted/10 border-t md:border-t-0 md:border-l border-border/50 p-6 flex flex-col justify-center gap-4">
                <div className="space-y-2">
                  <Label className="text-xs">Tracking Number</Label>
                  <Input 
                    placeholder="Add tracking #" 
                    defaultValue={item.tracking_number || ""}
                    onBlur={(e) => {
                      if (e.target.value !== item.tracking_number) {
                        updateOrderItem(item.id, { tracking_number: e.target.value });
                      }
                    }}
                  />
                </div>
                <div className="space-y-2">
                  {item.status !== 'delivered' && (
                    <Button 
                      className="w-full" 
                      variant={item.status === 'shipped' ? "outline" : "default"}
                      onClick={() => {
                        const nextStatus = item.status === 'shipped' ? 'delivered' : 'shipped';
                        updateOrderItem(item.id, { status: nextStatus });
                      }}
                    >
                      {item.status === 'shipped' ? "Mark as Delivered" : "Mark as Shipped"}
                    </Button>
                  )}
                  
                  {item.status === 'delivered' && (
                    <Button className="w-full" variant="secondary" disabled>
                      Order Delivered ✅
                    </Button>
                  )}
                  
                  {(item.status === 'shipped' || item.status === 'delivered') && (
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="w-full text-xs text-muted-foreground"
                      onClick={() => updateOrderItem(item.id, { status: 'pending' })}
                    >
                      Reset to Pending
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </Card>
        );
      })}
    </div>
  );
}
