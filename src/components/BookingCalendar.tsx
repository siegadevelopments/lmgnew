import { useState, useMemo } from "react";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format, addMinutes, parseISO, startOfToday } from "date-fns";
import { Loader2, Calendar as CalendarIcon, Clock } from "lucide-react";
import { cn } from "@/lib/utils";

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
      return data || [];
    }
  });

  // 2. Fetch existing bookings for the selected date
  const { data: existingBookings, isLoading: loadingBookings } = useQuery({
    queryKey: ["bookings", productId, selectedDate?.toISOString()],
    queryFn: async () => {
      if (!selectedDate) return [];
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
      return data || [];
    },
    enabled: !!selectedDate
  });

  // Calculate available slots for the selected date
  const slots = useMemo(() => {
    if (!selectedDate || !availability) return [];
    
    const dayOfWeek = selectedDate.getDay();
    const dayAvail = availability.find(a => a.day_of_week === dayOfWeek);
    
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
      const isBooked = existingBookings?.some(b => {
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
      end_time: slot.end.toISOString()
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
    <Card className="border-border/50 overflow-hidden shadow-md bg-card/50 backdrop-blur-sm">
      <CardHeader className="bg-wellness-muted/30 pb-4 border-b border-border/50">
        <CardTitle className="text-xl flex items-center gap-3 text-foreground">
          <div className="p-2 bg-primary/10 rounded-lg">
            <CalendarIcon className="h-5 w-5 text-primary" />
          </div>
          Select Date & Time
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        <div className="flex flex-col lg:flex-row gap-10">
          <div className="flex-shrink-0 flex justify-center lg:justify-start">
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={(date) => {
                setSelectedDate(date);
                setSelectedSlot(null);
                onSelect(null);
              }}
              disabled={(date) => date < startOfToday() || !availability?.some(a => a.day_of_week === date.getDay())}
              className="rounded-xl border border-border/50 shadow-inner bg-background p-4"
            />
          </div>

          <div className="flex-1 space-y-6">
            <div className="flex items-center justify-between">
              <h4 className="font-bold flex items-center gap-2 text-foreground text-lg">
                <Clock className="h-5 w-5 text-primary" />
                Available Slots
              </h4>
              {selectedDate && (
                <div className="px-3 py-1 bg-primary/10 text-primary rounded-full text-xs font-semibold">
                  {format(selectedDate, "EEEE, MMMM do")}
                </div>
              )}
            </div>
            
            {(loadingBookings) ? (
               <div className="flex h-64 items-center justify-center">
                 <Loader2 className="h-8 w-8 animate-spin text-primary/30" />
               </div>
            ) : slots.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3 max-h-[400px] overflow-y-auto pr-3 custom-scrollbar">
                {slots.map((slot) => {
                  const id = slot.start.toISOString();
                  return (
                    <Button
                      key={id}
                      variant={selectedSlot === id ? "default" : "outline"}
                      onClick={() => handleSlotSelect(slot)}
                      className={cn(
                        "h-14 flex flex-col items-center justify-center gap-0.5 rounded-xl transition-all duration-300",
                        selectedSlot === id 
                          ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20 scale-105" 
                          : "hover:border-primary/50 hover:bg-primary/5 border-border/50"
                      )}
                    >
                      <span className="text-sm font-bold">{format(slot.start, "h:mm a")}</span>
                      <span className="text-[10px] opacity-70">Available</span>
                    </Button>
                  );
                })}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-64 rounded-2xl bg-muted/30 border-2 border-dashed border-border/50 text-center p-8">
                <div className="p-4 bg-background rounded-full mb-4 shadow-sm">
                  <Clock className="h-8 w-8 text-muted-foreground/30" />
                </div>
                <p className="text-sm font-medium text-muted-foreground max-w-[200px]">
                  {selectedDate 
                    ? "No available slots for this date. Please try another day." 
                    : "Please select a date on the calendar to see available times."}
                </p>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
