"use client";

import { useEffect, useState } from "react";
import { Phone } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { fetchMyProfile } from "@/lib/profile-reads";
import { normalisePhone, PHONE_HELP } from "@/lib/phone";

// The vendor's business phone lives on their own profile (profiles.phone), which only they and
// admins can read. "prompt" shows on the dashboard only while the number is missing;
// "settings" is the always-visible field in Store Settings.
export function VendorPhoneField({ userId, mode }: { userId: string; mode: "prompt" | "settings" }) {
  const [loaded, setLoaded] = useState(false);
  const [saved, setSaved] = useState<string | null>(null);
  const [value, setValue] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetchMyProfile()
      .then((p) => {
        if (cancelled) return;
        const phone = normalisePhone(p?.phone);
        setSaved(phone);
        setValue(phone ?? "");
      })
      .catch(() => {})
      .finally(() => !cancelled && setLoaded(true));
    return () => {
      cancelled = true;
    };
  }, [userId]);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    const phone = normalisePhone(value);
    if (!phone) {
      toast.error(PHONE_HELP);
      return;
    }
    setSaving(true);
    const { error } = await (supabase.from("profiles") as any).update({ phone }).eq("id", userId);
    setSaving(false);
    if (error) {
      toast.error("Couldn't save your phone number. Please try again.");
      return;
    }
    setSaved(phone);
    setValue(phone);
    toast.success("Phone number saved");
  };

  if (!loaded || (mode === "prompt" && saved)) return null;

  const form = (
    <form onSubmit={save} className="flex flex-col gap-2 sm:flex-row sm:items-end">
      <div className="flex-1 space-y-1">
        <Label htmlFor={`vendor-phone-${mode}`}>Business phone</Label>
        <Input
          id={`vendor-phone-${mode}`}
          type="tel"
          inputMode="tel"
          autoComplete="tel"
          placeholder="0412 345 678"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          required
        />
      </div>
      <Button type="submit" disabled={saving}>
        {saving ? "Saving..." : "Save"}
      </Button>
    </form>
  );

  if (mode === "prompt") {
    return (
      <Card className="mb-6 border-amber-300 bg-amber-50 dark:border-amber-700 dark:bg-amber-950/30">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Phone className="h-5 w-5 text-amber-600" />
            <CardTitle className="text-base">Add your business phone number</CardTitle>
          </div>
          <CardDescription>
            We use it to reach you quickly about orders, bookings and promotions. It isn't shown to customers.
          </CardDescription>
        </CardHeader>
        <CardContent>{form}</CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-border/50">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Phone className="h-5 w-5 text-primary" />
          <CardTitle>Contact phone</CardTitle>
        </div>
        <CardDescription>How Lifestyle Medicine Gateway contacts you. It isn't shown to customers.</CardDescription>
      </CardHeader>
      <CardContent className="max-w-2xl">{form}</CardContent>
    </Card>
  );
}
