"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Calendar, Clock, User, Phone, Mail, RefreshCw, CheckCircle2, XCircle, Loader2 } from "lucide-react";
import { format, parseISO } from "date-fns";

interface Booking {
  id: string;
  customer_id: string;
  product_id: number;
  vendor_id: string;
  start_time: string;
  end_time: string;
  status: "pending" | "confirmed" | "cancelled" | "completed";
  created_at: string;
  customer?: {
    full_name: string | null;
    email: string | null;
    phone: string | null;
  };
  product?: {
    title: string;
    price: number;
  };
}

interface Props {
  vendorId: string;
}

const statusConfig = {
  pending:   { label: "Pending",   className: "bg-amber-100 text-amber-700 border-amber-200"  },
  confirmed: { label: "Confirmed", className: "bg-blue-100 text-blue-700 border-blue-200"     },
  completed: { label: "Completed", className: "bg-green-100 text-green-700 border-green-200"  },
  cancelled: { label: "Cancelled", className: "bg-red-100 text-red-700 border-red-200"        },
};

export function BookingsTab({ vendorId }: Props) {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const fetchBookings = async () => {
    setLoading(true);
    try {
      const { data, error } = await (supabase
        .from("bookings")
        .select(`
          *,
          customer:profiles!bookings_customer_id_fkey(full_name, email, phone),
          product:products!bookings_product_id_fkey(title, price)
        `)
        .eq("vendor_id", vendorId)
        .order("start_time", { ascending: false }) as any);

      if (error) {
        // Fallback: try without joins if FK aliases aren't set
        const { data: fallback, error: fbError } = await (supabase
          .from("bookings")
          .select("*")
          .eq("vendor_id", vendorId)
          .order("start_time", { ascending: false }) as any);

        if (fbError) throw fbError;
        setBookings(fallback || []);
      } else {
        setBookings(data || []);
      }
    } catch (err: any) {
      console.error("Error fetching bookings:", err);
      toast.error("Failed to load bookings");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, [vendorId]);

  const updateStatus = async (id: string, status: string) => {
    setUpdatingId(id);
    const { error } = await (supabase.from("bookings") as any)
      .update({ status })
      .eq("id", id);

    if (error) {
      toast.error("Failed to update: " + error.message);
    } else {
      toast.success(`Booking marked as ${status}`);
      setBookings((prev) =>
        prev.map((b) => (b.id === id ? { ...b, status: status as any } : b))
      );
    }
    setUpdatingId(null);
  };

  if (loading) {
    return (
      <div className="flex h-48 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (bookings.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center gap-3 py-16 text-center">
          <div className="p-4 bg-primary/5 rounded-2xl">
            <Calendar className="h-10 w-10 text-primary/40" />
          </div>
          <h3 className="text-lg font-bold">No bookings yet</h3>
          <p className="text-sm text-muted-foreground max-w-xs">
            When customers book your services, their appointments will appear here.
          </p>
          <Button variant="outline" size="sm" onClick={fetchBookings} className="mt-2">
            <RefreshCw className="mr-2 h-4 w-4" /> Refresh
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {bookings.length} booking{bookings.length !== 1 ? "s" : ""} total
        </p>
        <Button variant="outline" size="sm" onClick={fetchBookings}>
          <RefreshCw className="mr-2 h-4 w-4" /> Refresh
        </Button>
      </div>

      {bookings.map((booking) => {
        const start = parseISO(booking.start_time);
        const end = parseISO(booking.end_time);
        const statusInfo = statusConfig[booking.status] ?? statusConfig.pending;
        const isUpdating = updatingId === booking.id;

        return (
          <Card key={booking.id} className="overflow-hidden border-border/50">
            <div className="flex flex-col md:flex-row">
              {/* Date/Time accent column */}
              <div className="flex-shrink-0 flex flex-col items-center justify-center p-6 bg-primary/5 border-r border-border/50 min-w-[160px] gap-2">
                <div className="flex items-center gap-1.5 text-primary">
                  <Calendar className="h-4 w-4" />
                  <span className="text-sm font-bold">{format(start, "EEE, MMM d")}</span>
                </div>
                <div className="flex items-center gap-1.5 text-muted-foreground">
                  <Clock className="h-4 w-4" />
                  <span className="text-sm">{format(start, "h:mm a")} – {format(end, "h:mm a")}</span>
                </div>
                <span
                  className={cn(
                    "mt-2 text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full border",
                    statusInfo.className
                  )}
                >
                  {statusInfo.label}
                </span>
              </div>

              {/* Content */}
              <div className="flex-1 p-6">
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div>
                    <h3 className="font-bold text-lg leading-tight">
                      {booking.product?.title ?? `Service #${booking.product_id}`}
                    </h3>
                    {booking.product?.price && (
                      <p className="text-sm text-primary font-semibold mt-0.5">
                        ${booking.product.price.toFixed(2)}
                      </p>
                    )}
                  </div>
                  <p className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground">
                    {format(parseISO(booking.created_at ?? booking.start_time), "MMM d, yyyy")}
                  </p>
                </div>

                {/* Customer info */}
                <div className="mt-4 grid sm:grid-cols-3 gap-3 p-4 rounded-xl bg-muted/30 border border-border/50">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                    <span className="text-sm font-medium truncate">
                      {booking.customer?.full_name ?? "Guest"}
                    </span>
                  </div>
                  {booking.customer?.email && (
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                      <span className="text-sm truncate">{booking.customer.email}</span>
                    </div>
                  )}
                  {booking.customer?.phone && (
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                      <span className="text-sm">{booking.customer.phone}</span>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="mt-4 flex flex-wrap gap-2">
                  {booking.status === "pending" && (
                    <>
                      <Button
                        size="sm"
                        onClick={() => updateStatus(booking.id, "confirmed")}
                        disabled={isUpdating}
                        className="gap-1.5"
                      >
                        {isUpdating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CheckCircle2 className="h-3.5 w-3.5" />}
                        Confirm Appointment
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => updateStatus(booking.id, "cancelled")}
                        disabled={isUpdating}
                        className="gap-1.5 text-destructive hover:bg-destructive/5"
                      >
                        <XCircle className="h-3.5 w-3.5" />
                        Cancel
                      </Button>
                    </>
                  )}
                  {booking.status === "confirmed" && (
                    <>
                      <Button
                        size="sm"
                        onClick={() => updateStatus(booking.id, "completed")}
                        disabled={isUpdating}
                        className="gap-1.5"
                      >
                        {isUpdating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CheckCircle2 className="h-3.5 w-3.5" />}
                        Mark Completed
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => updateStatus(booking.id, "cancelled")}
                        disabled={isUpdating}
                        className="gap-1.5 text-destructive hover:bg-destructive/5"
                      >
                        <XCircle className="h-3.5 w-3.5" />
                        Cancel
                      </Button>
                    </>
                  )}
                  {(booking.status === "completed" || booking.status === "cancelled") && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => updateStatus(booking.id, "pending")}
                      disabled={isUpdating}
                      className="text-xs text-muted-foreground"
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
