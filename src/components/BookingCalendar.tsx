import { useState, useMemo } from "react";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format, addMinutes, parseISO, startOfToday } from "date-fns";
import { Loader2, Calendar as CalendarIcon, Clock } from "lucide-react";

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
    <Card className="border-border/50 overflow-hidden shadow-sm">
      <CardHeader className="bg-primary/5 pb-4">
        <CardTitle className="text-lg flex items-center gap-2">
          <CalendarIcon className="h-5 w-5 text-primary" />
          Select Date & Time
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4 sm:p-6">
        <div className="flex flex-col md:flex-row gap-8">
          <div className="flex-shrink-0">
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={(date) => {
                setSelectedDate(date);
                setSelectedSlot(null);
                onSelect(null);
              }}
              disabled={(date) => date < startOfToday() || !availability?.some(a => a.day_of_week === date.getDay())}
              className="rounded-md border shadow-sm"
            />
          </div>

          <div className="flex-1 space-y-4">
            <h4 className="font-semibold flex items-center gap-2 text-foreground">
              <Clock className="h-4 w-4 text-primary" />
              Available Slots
              {selectedDate && <span className="text-xs font-normal text-muted-foreground ml-auto">{format(selectedDate, "EEE, MMM do")}</span>}
            </h4>
            
            {(loadingBookings) ? (
               <div className="flex h-32 items-center justify-center"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
            ) : slots.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                {slots.map((slot) => {
                  const id = slot.start.toISOString();
                  return (
                    <Button
                      key={id}
                      variant={selectedSlot === id ? "default" : "outline"}
                      size="sm"
                      onClick={() => handleSlotSelect(slot)}
                      className="text-xs py-5 transition-all duration-200"
                    >
                      {format(slot.start, "h:mm a")}
                    </Button>
                  );
                })}
              </div>
            ) : (
              <div className="flex h-32 items-center justify-center rounded-lg bg-muted/50 text-center p-4">
                <p className="text-sm text-muted-foreground italic">
                  {selectedDate 
                    ? "No available slots for this date." 
                    : "Please select a date on the calendar."}
                </p>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
