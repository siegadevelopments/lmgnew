import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { toast } from "sonner";
import { CheckCircle2, DollarSign, Wallet } from "lucide-react";

export function AdminPayoutsTab() {
  const [vendors, setVendors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadPayouts();
  }, []);

  const loadPayouts = async () => {
    try {
      setLoading(true);
      setError(null);
      // Fetch all vendors
      const { data: vendorsData, error: vendorsError } = await (supabase as any)
        .from("vendor_profiles")
        .select("id, store_name, representative_name");
        
      if (vendorsError) throw vendorsError;

      // Fetch pending earnings grouped by vendor
      const { data: earningsData, error: earningsError } = await (supabase as any)
        .from("vendor_earnings")
        .select("vendor_id, amount")
        .eq("status", "pending");

      if (earningsError) {
        if (earningsError.code === "PGRST116" || earningsError.message?.includes("relation") || earningsError.message?.includes("does not exist")) {
           console.warn("vendor_earnings table missing.");
           setError("Database setup required. Please contact support or run the commission setup script.");
           setLoading(false);
           return;
        }
        throw earningsError;
      }

      const vendorsWithBalances = (vendorsData || []).map((vendor: any) => {
        const vendorEarnings = (earningsData || []).filter((e: any) => e.vendor_id === vendor.id);
        const totalPending = vendorEarnings.reduce((sum: number, e: any) => sum + Number(e.amount), 0);
        return {
          ...vendor,
          pendingBalance: totalPending,
        };
      }).filter(v => v.pendingBalance > 0);

      setVendors(vendorsWithBalances.sort((a, b) => b.pendingBalance - a.pendingBalance));
    } catch (err: any) {
      console.error("Error loading payouts:", err);
      setError(err.message || "Failed to load payout data");
    } finally {
      setLoading(false);
    }
  };

  const markAsPaid = async (vendorId: string) => {
    if (!confirm("Are you sure you want to mark all pending earnings for this vendor as Paid? Please ensure you have transferred the funds to their bank account.")) {
      return;
    }
    
    setProcessingId(vendorId);
    try {
      const { error } = await (supabase as any)
        .from("vendor_earnings")
        .update({ status: 'paid' })
        .eq("vendor_id", vendorId)
        .eq("status", "pending");

      if (error) throw error;
      
      toast.success("Vendor earnings marked as paid!");
      loadPayouts();
    } catch (err: any) {
      console.error("Error updating payout status:", err);
      toast.error("Failed to mark as paid");
    } finally {
      setProcessingId(null);
    }
  };

  if (loading) {
    return <div className="p-8 text-center">Loading payout data...</div>;
  }

  if (error) {
    return (
      <Card className="border-destructive/20 bg-destructive/5 m-6">
        <CardHeader>
          <CardTitle className="text-destructive flex items-center gap-2">
            <Wallet className="h-5 w-5" />
            Payout System Error
          </CardTitle>
          <CardDescription>{error}</CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={loadPayouts} variant="outline" size="sm">
            Retry Loading
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <h2 className="text-2xl font-bold tracking-tight">Vendor Payouts</h2>
        <p className="text-muted-foreground">
          Manage pending balances for your vendors. When you transfer money to a vendor's bank account, click "Mark as Paid" to clear their balance here.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {vendors.map((vendor) => (
          <Card key={vendor.id} className="relative overflow-hidden">
            <CardHeader className="pb-2 border-b bg-muted/20">
              <CardTitle className="text-lg flex justify-between items-center">
                <span className="truncate pr-2">{vendor.store_name}</span>
                <Wallet className="h-5 w-5 text-muted-foreground shrink-0" />
              </CardTitle>
              <CardDescription>
                {vendor.representative_name || "No rep name"}
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="flex flex-col items-center justify-center py-4 space-y-2">
                <span className="text-sm text-muted-foreground uppercase tracking-widest font-bold">Pending Balance</span>
                <span className="text-4xl font-black text-emerald-600 flex items-center">
                  <DollarSign className="h-8 w-8 -mr-1 opacity-80" />
                  {vendor.pendingBalance.toFixed(2)}
                </span>
              </div>
              
              <Button 
                onClick={() => markAsPaid(vendor.id)}
                disabled={processingId === vendor.id}
                className="w-full mt-4 h-12"
              >
                {processingId === vendor.id ? "Processing..." : (
                  <>
                    <CheckCircle2 className="mr-2 h-4 w-4" />
                    Mark as Paid
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        ))}

        {vendors.length === 0 && (
          <div className="col-span-full py-12 text-center border-2 border-dashed rounded-xl bg-muted/10">
            <CheckCircle2 className="mx-auto h-12 w-12 text-emerald-500 mb-4 opacity-50" />
            <h3 className="text-lg font-bold">All caught up!</h3>
            <p className="text-muted-foreground mt-1">There are no pending vendor payouts.</p>
          </div>
        )}
      </div>
    </div>
  );
}
