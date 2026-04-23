import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface Props { totalSales: number; }

export function WithdrawTab({ totalSales }: Props) {
  const [amount, setAmount] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
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
          <div className="rounded-xl border border-primary/30 bg-primary/5 p-6 text-center">
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
              <Label>Amount to Withdraw</Label>
              <Input
                type="number" step="0.01" min="10" max={totalSales}
                required value={amount} onChange={e => setAmount(e.target.value)}
                placeholder="Enter amount..."
              />
              <p className="text-xs text-muted-foreground">Minimum withdrawal: $10.00</p>
            </div>
            <div className="space-y-2">
              <Label>PayPal Email</Label>
              <Input type="email" required placeholder="your@paypal.com" />
            </div>
            <Button type="submit" disabled={!amount || parseFloat(amount) < 10}>Request Withdrawal</Button>
          </form>
        )}
      </CardContent>
    </Card>
  );
}
