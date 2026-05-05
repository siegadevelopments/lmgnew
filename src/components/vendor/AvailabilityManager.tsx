import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, Plus, Trash2, Clock } from "lucide-react";

interface Availability {
  id: string;
  vendor_id: string;
  product_id: number;
  day_of_week: number;
  start_time: string;
  end_time: string;
  slot_duration: number;
}

interface Props {
  productId: number;
  vendorId: string;
  onClose: () => void;
}

const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export function AvailabilityManager({ productId, vendorId, onClose }: Props) {
  const [availabilities, setAvailabilities] = useState<Availability[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // New slot form state
  const [dayOfWeek, setDayOfWeek] = useState<number>(1);
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("17:00");
  const [slotDuration, setSlotDuration] = useState(60);

  useEffect(() => {
    loadAvailability();
  }, [productId]);

  async function loadAvailability() {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("service_availability")
        .select("*")
        .eq("product_id", productId)
        .order("day_of_week", { ascending: true });

      if (error) throw error;
      setAvailabilities(data || []);
    } catch (err: any) {
      toast.error("Failed to load availability: " + err.message);
    } finally {
      setLoading(false);
    }
  }

  const handleAddSlot = async () => {
    if (startTime >= endTime) {
      return toast.error("Start time must be before end time");
    }

    try {
      setSaving(true);
      const { data, error } = await supabase
        .from("service_availability")
        .insert({
          vendor_id: vendorId,
          product_id: productId,
          day_of_week: dayOfWeek,
          start_time: startTime,
          end_time: endTime,
          slot_duration: slotDuration,
        } as any)
        .select()
        .single();

      if (error) throw error;

      setAvailabilities(
        [...availabilities, data as Availability].sort((a, b) => a.day_of_week - b.day_of_week),
      );
      toast.success("Availability slot added");
    } catch (err: any) {
      toast.error("Failed to add slot: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteSlot = async (id: string) => {
    try {
      const { error } = await supabase.from("service_availability").delete().eq("id", id);

      if (error) throw error;
      setAvailabilities(availabilities.filter((a) => a.id !== id));
      toast.success("Slot removed");
    } catch (err: any) {
      toast.error("Failed to remove slot: " + err.message);
    }
  };

  if (loading) {
    return (
      <div className="flex h-48 items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <Card className="border-primary/20 bg-primary/5 shadow-sm mt-4 animate-in fade-in slide-in-from-top-2">
      <CardHeader className="flex flex-row items-start justify-between pb-2">
        <div>
          <CardTitle className="text-lg flex items-center gap-2">
            <Clock className="h-5 w-5 text-primary" />
            Manage Availability
          </CardTitle>
          <CardDescription>
            Set the days and times you are available for this service.
          </CardDescription>
        </div>
        <Button variant="ghost" size="sm" onClick={onClose}>
          Close
        </Button>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Add New Slot Form */}
        <div className="grid grid-cols-1 sm:grid-cols-5 gap-3 items-end p-4 bg-background rounded-lg border border-border">
          <div className="space-y-1.5 sm:col-span-1">
            <Label className="text-xs uppercase font-bold text-muted-foreground">Day</Label>
            <select
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
              value={dayOfWeek}
              onChange={(e) => setDayOfWeek(Number(e.target.value))}
            >
              {DAYS.map((day, index) => (
                <option key={index} value={index}>
                  {day}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5 sm:col-span-1">
            <Label className="text-xs uppercase font-bold text-muted-foreground">Start</Label>
            <Input
              type="time"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              className="h-9"
            />
          </div>

          <div className="space-y-1.5 sm:col-span-1">
            <Label className="text-xs uppercase font-bold text-muted-foreground">End</Label>
            <Input
              type="time"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              className="h-9"
            />
          </div>

          <div className="space-y-1.5 sm:col-span-1">
            <Label
              className="text-xs uppercase font-bold text-muted-foreground"
              title="Duration per booking (minutes)"
            >
              Duration (m)
            </Label>
            <Input
              type="number"
              value={slotDuration}
              onChange={(e) => setSlotDuration(Number(e.target.value))}
              className="h-9"
            />
          </div>

          <div className="sm:col-span-1">
            <Button onClick={handleAddSlot} disabled={saving} className="w-full h-9">
              {saving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  <Plus className="h-4 w-4 mr-1" /> Add
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Existing Slots */}
        <div className="space-y-3">
          <h4 className="text-sm font-bold text-foreground">Current Schedule</h4>
          {availabilities.length === 0 ? (
            <p className="text-sm text-muted-foreground italic p-4 text-center border border-dashed rounded-lg bg-background/50">
              No availability set yet. Add your working hours above.
            </p>
          ) : (
            <div className="grid gap-2">
              {availabilities.map((slot) => (
                <div
                  key={slot.id}
                  className="flex items-center justify-between p-3 rounded-md bg-background border border-border/50 shadow-sm"
                >
                  <div className="flex items-center gap-4">
                    <span className="font-semibold text-primary w-24">
                      {DAYS[slot.day_of_week]}
                    </span>
                    <span className="text-sm font-medium">
                      {slot.start_time.slice(0, 5)} - {slot.end_time.slice(0, 5)}
                    </span>
                    <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                      {slot.slot_duration} min slots
                    </span>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDeleteSlot(slot.id)}
                    className="h-8 w-8 text-muted-foreground hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
