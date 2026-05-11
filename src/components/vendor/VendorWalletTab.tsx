import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { DollarSign, Clock, CheckCircle2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

interface VendorWalletTabProps {
  vendorId: string;
}

export function VendorWalletTab({ vendorId }: VendorWalletTabProps) {
  const [earnings, setEarnings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    pending: 0,
    paid: 0,
    total: 0,
    commissionRate: 10,
  });

  useEffect(() => {
    if (vendorId) {
      loadWalletData();
    }
  }, [vendorId]);

  const loadWalletData = async () => {
    try {
      setLoading(true);
      
      // Fetch Vendor Profile to get Commission Rate
      const { data: profile } = await supabase
        .from("vendor_profiles")
        .select("commission_rate")
        .eq("id", vendorId)
        .single();
        
      // Fetch Earnings
      const { data: earningsData, error: earningsError } = await supabase
        .from("vendor_earnings")
        .select(`
          *,
          orders(status, created_at)
        `)
        .eq("vendor_id", vendorId)
        .order("created_at", { ascending: false });

      if (earningsError) throw earningsError;

      const records = earningsData || [];
      setEarnings(records);

      // Calculate Stats
      const pending = records.filter(r => r.status === 'pending').reduce((sum, r) => sum + Number(r.amount), 0);
      const paid = records.filter(r => r.status === 'paid').reduce((sum, r) => sum + Number(r.amount), 0);

      setStats({
        pending,
        paid,
        total: pending + paid,
        commissionRate: profile?.commission_rate ?? 10,
      });

    } catch (err: any) {
      console.error("Error loading wallet data:", err);
      toast.error("Failed to load wallet data.");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-muted-foreground">Loading wallet data...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-1">
        <h2 className="text-2xl font-bold tracking-tight">Your Wallet & Earnings</h2>
        <p className="text-muted-foreground">
          Track your sales, pending payouts, and platform commissions. Your current commission rate is <strong>{stats.commissionRate}%</strong>.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="bg-emerald-500/10 border-emerald-500/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-emerald-700 text-sm uppercase tracking-widest flex items-center gap-2">
              <Clock className="h-4 w-4" /> Pending Payout
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-black text-emerald-600 flex items-center">
              <DollarSign className="h-8 w-8 -mr-1" />
              {stats.pending.toFixed(2)}
            </div>
            <p className="text-xs text-emerald-600/80 mt-1">Available for transfer</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-muted-foreground text-sm uppercase tracking-widest flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4" /> Lifetime Paid
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold flex items-center">
              <DollarSign className="h-6 w-6 -mr-1 text-muted-foreground" />
              {stats.paid.toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Successfully transferred to your bank</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-muted-foreground text-sm uppercase tracking-widest flex items-center gap-2">
              <DollarSign className="h-4 w-4" /> Lifetime Earnings
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold flex items-center">
              <DollarSign className="h-6 w-6 -mr-1 text-muted-foreground" />
              {stats.total.toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Total revenue after commissions</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Earnings History</CardTitle>
          <CardDescription>A complete log of every transaction and payout status.</CardDescription>
        </CardHeader>
        <CardContent>
          {earnings.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <AlertCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>You haven't made any sales yet.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Order ID</TableHead>
                  <TableHead>Platform Fee</TableHead>
                  <TableHead>Your Earnings</TableHead>
                  <TableHead className="text-right">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {earnings.map((record) => (
                  <TableRow key={record.id}>
                    <TableCell>
                      {new Date(record.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="font-mono text-xs">
                      {record.order_id?.substring(0, 8)}...
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      ${Number(record.platform_fee).toFixed(2)}
                    </TableCell>
                    <TableCell className="font-bold text-emerald-600">
                      +${Number(record.amount).toFixed(2)}
                    </TableCell>
                    <TableCell className="text-right">
                      {record.status === 'paid' ? (
                        <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20">
                          Paid
                        </Badge>
                      ) : (
                        <Badge variant="secondary">
                          Pending
                        </Badge>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <div className="bg-muted/30 p-6 rounded-xl text-center border">
        <h3 className="font-bold mb-2">How do I get paid?</h3>
        <p className="text-sm text-muted-foreground max-w-xl mx-auto">
          When your pending balance accumulates, the platform administrator will wire the funds directly to your bank account. Once the transfer is complete, your pending earnings will be marked as "Paid".
        </p>
      </div>
    </div>
  );
}
