import { useState, useMemo } from "react";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format, addMinutes, parseISO, startOfToday } from "date-fns";
import { Loader2, Calendar as CalendarIcon, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";

interface Props {
  productId: number;
  vendorId: string;
  onSelect: (booking: { start_time: string; end_time: string } | null) => void;
}

export function BookingCalendar({ productId, vendorId, onSelect }: Props) {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(startOfToday());
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);

  // 1. Fetch Availability for this product
  const { data: availability, isLoading: loadingAvailability } = useQuery({
    queryKey: ["availability", productId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("service_availability")
        .select("*")
        .eq("product_id", productId);

      if (error) throw error;
      return (data || []) as any[];
    },
  });

  // 2. Fetch existing bookings for the selected date
  const { data: existingBookings, isLoading: loadingBookings } = useQuery({
    queryKey: ["bookings", productId, selectedDate?.toISOString()],
    queryFn: async () => {
      if (!selectedDate) return [] as any[];
      const start = new Date(selectedDate);
      start.setHours(0, 0, 0, 0);
      const end = new Date(selectedDate);
      end.setHours(23, 59, 59, 999);

      const { data, error } = await supabase
        .from("bookings")
        .select("start_time, end_time")
        .eq("product_id", productId)
        .gte("start_time", start.toISOString())
        .lte("start_time", end.toISOString())
        .neq("status", "cancelled");

      if (error) throw error;
      return (data || []) as any[];
    },
    enabled: !!selectedDate,
  });

  // Calculate available slots for the selected date
  const slots = useMemo(() => {
    if (!selectedDate || !availability) return [];

    const dayOfWeek = selectedDate.getDay();
    const dayAvail = availability.find((a) => a.day_of_week === dayOfWeek);

    if (!dayAvail) return [];

    const availableSlots: { start: Date; end: Date }[] = [];
    const [startH, startM] = dayAvail.start_time.split(":").map(Number);
    const [endH, endM] = dayAvail.end_time.split(":").map(Number);

    let current = new Date(selectedDate);
    current.setHours(startH, startM, 0, 0);

    const endTime = new Date(selectedDate);
    endTime.setHours(endH, endM, 0, 0);

    while (current < endTime) {
      const slotEnd = addMinutes(current, dayAvail.slot_duration || 60);

      // Check if slot is already booked
      const isBooked = existingBookings?.some((b) => {
        const bStart = parseISO(b.start_time);
        return bStart.getTime() === current.getTime();
      });

      // Also ensure slot is in the future
      if (!isBooked && current > new Date()) {
        availableSlots.push({ start: new Date(current), end: new Date(slotEnd) });
      }

      current = slotEnd;
    }

    return availableSlots;
  }, [selectedDate, availability, existingBookings]);

  const handleSlotSelect = (slot: { start: Date; end: Date }) => {
    const slotId = slot.start.toISOString();
    setSelectedSlot(slotId);
    onSelect({
      start_time: slot.start.toISOString(),
      end_time: slot.end.toISOString(),
    });
  };

  if (loadingAvailability) {
    return (
      <div className="flex h-48 items-center justify-center rounded-xl border border-dashed">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-2">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary shadow-sm ring-1 ring-primary/20">
          <CalendarIcon className="h-5 w-5" />
        </div>
        <div>
          <h3 className="text-xl font-bold text-foreground">Select Appointment</h3>
          <p className="text-sm text-muted-foreground">Pick a date and time that works for you</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-12 gap-8 lg:gap-12 items-start w-full">
        {/* Calendar Column */}
        <div className="lg:col-span-5 bg-card rounded-3xl border border-border/50 p-6 shadow-xl shadow-primary/5 ring-1 ring-border/50 flex justify-center">
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={(date) => {
              setSelectedDate(date);
              setSelectedSlot(null);
              onSelect(null);
            }}
            disabled={(date) =>
              date < startOfToday() || !availability?.some((a) => a.day_of_week === date.getDay())
            }
            className="w-full max-w-[350px] p-0"
            classNames={{
              day_selected:
                "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground rounded-xl shadow-lg shadow-primary/30 scale-110 transition-all",
              day_today: "bg-accent text-accent-foreground font-bold rounded-xl",
              day: "h-10 w-10 sm:h-12 sm:w-12 p-0 font-medium aria-selected:opacity-100 hover:bg-primary/10 hover:text-primary rounded-xl transition-all duration-200",
              head_cell:
                "text-muted-foreground font-bold text-[10px] uppercase tracking-widest pb-4",
              nav_button:
                "hover:bg-primary/10 hover:text-primary rounded-lg transition-colors border-none",
            }}
          />
        </div>

        {/* Slots Column */}
        <div className="lg:col-span-7 space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-primary" />
              <span className="font-bold text-lg">Available Times</span>
            </div>
            {selectedDate && (
              <Badge
                variant="secondary"
                className="px-3 py-1 rounded-full bg-primary/5 text-primary border-primary/10 font-semibold"
              >
                {format(selectedDate, "EEEE, MMMM do")}
              </Badge>
            )}
          </div>

          {loadingBookings ? (
            <div className="flex h-64 items-center justify-center bg-card rounded-3xl border border-border/50 shadow-inner">
              <div className="flex flex-col items-center gap-3">
                <Loader2 className="h-10 w-10 animate-spin text-primary/40" />
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
                  Finding slots...
                </p>
              </div>
            </div>
          ) : slots.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pr-2 max-h-[420px] overflow-y-auto custom-scrollbar pb-4">
              {slots.map((slot) => {
                const id = slot.start.toISOString();
                const isSelected = selectedSlot === id;
                return (
                  <motion.button
                    key={id}
                    whileHover={{ y: -2, scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handleSlotSelect(slot)}
                    className={cn(
                      "group relative h-20 flex flex-col items-center justify-center gap-1 rounded-2xl border-2 transition-all duration-300 overflow-hidden shadow-sm",
                      isSelected
                        ? "bg-primary border-primary text-primary-foreground shadow-xl shadow-primary/20 ring-4 ring-primary/10"
                        : "bg-card border-border/50 hover:border-primary/50 hover:bg-primary/5 text-foreground",
                    )}
                  >
                    <span
                      className={cn(
                        "text-base font-black tracking-tight",
                        isSelected ? "text-white" : "group-hover:text-primary",
                      )}
                    >
                      {format(slot.start, "h:mm")}
                    </span>
                    <span
                      className={cn(
                        "text-[10px] font-bold uppercase tracking-wider opacity-60",
                        isSelected ? "text-white/80" : "text-muted-foreground",
                      )}
                    >
                      {format(slot.start, "a")}
                    </span>
                    {isSelected && (
                      <motion.div
                        layoutId="active-slot"
                        className="absolute bottom-0 left-0 right-0 h-1 bg-white/30"
                      />
                    )}
                  </motion.button>
                );
              })}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-[340px] rounded-3xl bg-muted/20 border-2 border-dashed border-border/50 text-center p-12 transition-all hover:bg-muted/30">
              <div className="p-5 bg-background rounded-2xl mb-5 shadow-sm ring-1 ring-border/50">
                <Clock className="h-10 w-10 text-muted-foreground/20" />
              </div>
              <h4 className="text-lg font-bold text-foreground mb-2">No Open Slots</h4>
              <p className="text-sm font-medium text-muted-foreground max-w-[240px] leading-relaxed">
                {selectedDate
                  ? "The vendor hasn't set any availability for this date yet. Try checking another day!"
                  : "Pick a date on the left to see the professional's available time slots."}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
