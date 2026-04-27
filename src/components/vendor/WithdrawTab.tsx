import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

interface Props { 
  totalSales: number; 
  vendorId?: string;
}

export function WithdrawTab({ totalSales, vendorId }: Props) {
  const [amount, setAmount] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!vendorId) {
      toast.error("Vendor ID not found. Please refresh.");
      return;
    }

    setLoading(true);
    const formData = new FormData(e.currentTarget as HTMLFormElement);
    const paypalEmail = formData.get("paypal_email") as string;
    
    try {
      const { error } = await (supabase.from("vendor_withdrawals") as any).insert({
        vendor_id: vendorId,
        amount: parseFloat(amount),
        paypal_email: paypalEmail,
        status: 'pending'
      });

      if (error) {
        // If the table doesn't exist yet, we'll fall back to showing a message
        if (error.code === 'PGRST116' || error.message.includes('relation "public.vendor_withdrawals" does not exist')) {
          console.error("Table vendor_withdrawals missing:", error);
          toast.error("Database table missing. Please contact admin to run migrations.");
        } else {
          toast.error(error.message);
        }
      } else {
        setSubmitted(true);
        toast.success("Withdrawal request submitted!");
      }
    } catch (err: any) {
      toast.error(err.message || "An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Withdraw Funds</CardTitle>
        <CardDescription>Request a payout of your available earnings.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="rounded-xl bg-wellness-muted p-6 mb-6">
          <p className="text-sm text-muted-foreground">Available Balance</p>
          <p className="text-4xl font-bold text-primary mt-1">${totalSales.toFixed(2)}</p>
          <p className="text-xs text-muted-foreground mt-2">Platform commission (10%) is deducted at payout.</p>
        </div>

        {submitted ? (
          <div className="rounded-xl border border-primary/30 bg-primary/5 p-6 text-center animate-in fade-in zoom-in duration-300">
            <div className="text-3xl mb-2">✅</div>
            <h3 className="font-semibold text-foreground">Withdrawal Request Submitted</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Your request for <strong>${parseFloat(amount || "0").toFixed(2)}</strong> has been submitted. Payouts are processed within 3-5 business days.
            </p>
            <Button variant="outline" className="mt-4" onClick={() => { setSubmitted(false); setAmount(""); }}>New Request</Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="max-w-sm space-y-4">
            <div className="space-y-2">
              <Label htmlFor="amount">Amount to Withdraw</Label>
              <Input
                id="amount"
                name="amount"
                type="number" step="0.01" min="10" max={totalSales}
                required value={amount} onChange={e => setAmount(e.target.value)}
                placeholder="Enter amount..."
              />
              <p className="text-xs text-muted-foreground">Minimum withdrawal: $10.00</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="paypal_email">PayPal Email</Label>
              <Input 
                id="paypal_email"
                name="paypal_email"
                type="email" 
                required 
                placeholder="your@paypal.com" 
              />
            </div>
            <Button type="submit" disabled={loading || !amount || parseFloat(amount) < 10} className="w-full">
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {loading ? "Submitting..." : "Request Withdrawal"}
            </Button>
          </form>
        )}
      </CardContent>
    </Card>
  );
}
