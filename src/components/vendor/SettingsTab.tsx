import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { uploadMedia } from "@/lib/upload";

interface VendorProfile {
  id: string; store_name: string; store_description: string | null;
  store_logo_url: string | null; website: string | null; is_approved: boolean;
}

interface Props {
  profile: VendorProfile;
  setProfile: React.Dispatch<React.SetStateAction<VendorProfile | null>>;
  userId: string;
}

export function SettingsTab({ profile, setProfile, userId }: Props) {
  const [submitting, setSubmitting] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [msg, setMsg] = useState("");

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    await (supabase.from("vendor_profiles") as any).update({
      store_name: profile.store_name, store_description: profile.store_description,
      store_logo_url: profile.store_logo_url, website: profile.website,
    }).eq("id", userId);
    setSubmitting(false);
    setMsg("Settings saved!");
    setTimeout(() => setMsg(""), 3000);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Store & Profile Settings</CardTitle>
        <CardDescription>Update your public store appearance and profile.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSave} className="grid sm:grid-cols-2 gap-4 max-w-2xl">
          <div className="space-y-2 sm:col-span-2">
            <Label>Store Name</Label>
            <Input value={profile.store_name} onChange={e => setProfile({ ...profile, store_name: e.target.value })} />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label>Description</Label>
            <Textarea rows={3} value={profile.store_description || ""} onChange={e => setProfile({ ...profile, store_description: e.target.value })} placeholder="Tell customers about your brand" />
          </div>
          <div className="space-y-2">
            <Label>Logo</Label>
            <div className="flex gap-2">
              <Input value={profile.store_logo_url || ""} onChange={e => setProfile({ ...profile, store_logo_url: e.target.value })} className="flex-1" />
              <label className="shrink-0">
                <Button type="button" variant="secondary" asChild disabled={uploading}><span>{uploading ? "..." : "Upload"}</span></Button>
                <input type="file" className="hidden" accept="image/*" onChange={async e => {
                  if (e.target.files?.[0]) { setUploading(true); const url = await uploadMedia(e.target.files[0], `stores/${userId}`); if (url) setProfile({ ...profile, store_logo_url: url }); setUploading(false); }
                }} />
              </label>
            </div>
          </div>
          <div className="space-y-2">
            <Label>Website (optional)</Label>
            <Input value={profile.website || ""} onChange={e => setProfile({ ...profile, website: e.target.value })} placeholder="https://" />
          </div>
          <div className="flex items-center gap-3 sm:col-span-2 mt-2">
            <Button type="submit" disabled={submitting}>{submitting ? "Saving..." : "Save Settings"}</Button>
            {msg && <span className="text-sm text-primary font-medium">{msg}</span>}
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
