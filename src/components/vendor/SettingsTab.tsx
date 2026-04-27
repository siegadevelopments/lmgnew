import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { uploadMedia } from "@/lib/upload";
import { Instagram, Facebook, Twitter, Globe, Info, Settings2 } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

import { VendorProfile } from "@/routes/vendor";

interface Props {
  profile: VendorProfile;
  setProfile: React.Dispatch<React.SetStateAction<VendorProfile | null>>;
  userId: string;
}

export function SettingsTab({ profile, setProfile, userId }: Props) {
  const [submitting, setSubmitting] = useState(false);
  const [uploading, setUploading] = useState(false);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const { error } = await (supabase.from("vendor_profiles") as any).update({
        store_name: profile.store_name, 
        store_description: profile.store_description,
        store_logo_url: profile.store_logo_url, 
        store_banner_url: profile.store_banner_url,
        website: profile.website,
        instagram: profile.instagram,
        facebook: profile.facebook,
        twitter: profile.twitter,
        store_categories: profile.store_categories || [],
        ai_enabled: profile.ai_enabled || false,
        ai_instructions: profile.ai_instructions || "",
        updated_at: new Date().toISOString()
      }).eq("id", userId);

      if (error) throw error;
      toast.success("Settings saved successfully!");
    } catch (err: any) {
      toast.error(err.message || "Failed to save settings");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card className="border-border/50">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Settings2 className="h-5 w-5 text-primary" />
            <CardTitle>Store Identity</CardTitle>
          </div>
          <CardDescription>Update your public store appearance and profile.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSave} className="space-y-6 max-w-2xl">
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-2 sm:col-span-2">
                <Label>Store Name</Label>
                <Input value={profile.store_name} onChange={e => setProfile({ ...profile, store_name: e.target.value })} />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label>Description</Label>
                <Textarea rows={3} value={profile.store_description || ""} onChange={e => setProfile({ ...profile, store_description: e.target.value })} placeholder="Tell customers about your brand" />
              </div>
              <div className="space-y-2">
                <Label>Logo URL</Label>
                <div className="flex gap-2">
                  <Input value={profile.store_logo_url || ""} onChange={e => setProfile({ ...profile, store_logo_url: e.target.value })} className="flex-1" />
                  <label className="shrink-0">
                    <Button type="button" variant="secondary" asChild disabled={uploading}><span>{uploading ? "..." : "Upload"}</span></Button>
                    <input type="file" className="hidden" accept="image/*" onChange={async e => {
                      if (e.target.files?.[0]) { setUploading(true); const url = await uploadMedia(e.target.files[0], `stores/${userId}/logo`); if (url) setProfile({ ...profile, store_logo_url: url }); setUploading(false); }
                    }} />
                  </label>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Banner URL</Label>
                <div className="flex gap-2">
                  <Input value={profile.store_banner_url || ""} onChange={e => setProfile({ ...profile, store_banner_url: e.target.value })} className="flex-1" />
                  <label className="shrink-0">
                    <Button type="button" variant="secondary" asChild disabled={uploading}><span>{uploading ? "..." : "Upload"}</span></Button>
                    <input type="file" className="hidden" accept="image/*" onChange={async e => {
                      if (e.target.files?.[0]) { setUploading(true); const url = await uploadMedia(e.target.files[0], `stores/${userId}/banner`); if (url) setProfile({ ...profile, store_banner_url: url }); setUploading(false); }
                    }} />
                  </label>
                </div>
              </div>
            </div>

            <div className="space-y-4 pt-4 border-t border-border">
              <h4 className="text-sm font-bold flex items-center gap-2">
                <Globe className="h-4 w-4 text-muted-foreground" />
                Online Presence
              </h4>
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-xs uppercase text-muted-foreground">Website</Label>
                  <div className="relative">
                    <Globe className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input className="pl-10" value={profile.website || ""} onChange={e => setProfile({ ...profile, website: e.target.value })} placeholder="https://yourstore.com" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs uppercase text-muted-foreground">Instagram</Label>
                  <div className="relative">
                    <Instagram className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input className="pl-10" value={profile.instagram || ""} onChange={e => setProfile({ ...profile, instagram: e.target.value })} placeholder="https://instagram.com/username" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs uppercase text-muted-foreground">Facebook</Label>
                  <div className="relative">
                    <Facebook className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input className="pl-10" value={profile.facebook || ""} onChange={e => setProfile({ ...profile, facebook: e.target.value })} placeholder="https://facebook.com/page" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs uppercase text-muted-foreground">Twitter / X</Label>
                  <div className="relative">
                    <Twitter className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input className="pl-10" value={profile.twitter || ""} onChange={e => setProfile({ ...profile, twitter: e.target.value })} placeholder="https://twitter.com/handle" />
                  </div>
                </div>
              </div>
            </div>
            
            <div className="space-y-3 pt-4 border-t border-border">
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-base font-bold flex items-center gap-2">
                    AI Chatbot Assistant
                    <Badge variant="outline" className="text-[10px] uppercase font-black bg-primary/5">New</Badge>
                  </Label>
                  <CardDescription>Automatically answer customer questions when you are offline.</CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <input 
                    type="checkbox" 
                    id="ai-toggle"
                    checked={profile.ai_enabled || false}
                    onChange={e => setProfile({ ...profile, ai_enabled: e.target.checked })}
                    className="w-4 h-4 text-primary rounded border-border focus:ring-primary"
                  />
                  <Label htmlFor="ai-toggle" className="text-sm font-medium cursor-pointer">Enable AI</Label>
                </div>
              </div>
              
              {profile.ai_enabled && (
                <div className="space-y-2 mt-2 animate-in fade-in slide-in-from-top-1 duration-300">
                  <Label className="text-xs uppercase tracking-wider text-muted-foreground">Bot Instructions / Knowledge Base</Label>
                  <Textarea 
                    rows={4} 
                    value={profile.ai_instructions || ""} 
                    onChange={e => setProfile({ ...profile, ai_instructions: e.target.value })} 
                    placeholder="Example: You are an expert in organic skin care. We offer free shipping on orders over $50. Our store hours are 9am-5pm." 
                    className="text-sm border-primary/20 focus:border-primary"
                  />
                  <p className="text-[10px] text-muted-foreground italic flex items-start gap-1">
                    <Info className="h-3 w-3 mt-0.5" />
                    Tip: Provide specific details about your products, shipping, and FAQs to help the AI answer accurately.
                  </p>
                </div>
              )}
            </div>

            <div className="space-y-3 pt-4 border-t border-border">
              <Label className="text-base font-bold">Store Navigation Categories</Label>
              <CardDescription>Add custom categories that will appear as tabs on your store profile page.</CardDescription>
              <div className="flex flex-wrap gap-2 mb-2">
                {(profile.store_categories || []).map((cat, idx) => (
                  <div key={idx} className="bg-primary/10 text-primary px-3 py-1 rounded-full text-xs font-bold flex items-center gap-2 group border border-primary/20">
                    {cat}
                    <button 
                      type="button" 
                      onClick={() => {
                        const newCats = [...(profile.store_categories || [])];
                        newCats.splice(idx, 1);
                        setProfile({ ...profile, store_categories: newCats });
                      }}
                      className="hover:text-destructive"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
              <div className="flex gap-2">
                <Input 
                  id="new-cat"
                  placeholder="Add a category (e.g. Skin Care)" 
                  className="max-w-xs" 
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      const val = e.currentTarget.value.trim();
                      if (val && !(profile.store_categories || []).includes(val)) {
                        setProfile({ ...profile, store_categories: [...(profile.store_categories || []), val] });
                        e.currentTarget.value = "";
                      }
                    }
                  }}
                />
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => {
                    const input = document.getElementById('new-cat') as HTMLInputElement;
                    const val = input.value.trim();
                    if (val && !(profile.store_categories || []).includes(val)) {
                      setProfile({ ...profile, store_categories: [...(profile.store_categories || []), val] });
                      input.value = "";
                    }
                  }}
                >
                  Add
                </Button>
              </div>
            </div>
            <div className="flex items-center gap-3 pt-4">
              <Button type="submit" disabled={submitting} className="min-w-[150px]">
                {submitting ? "Saving..." : "Save Settings"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}


function Badge({ children, variant, className }: any) {
  return (
    <span className={cn(
      "px-2 py-0.5 rounded-full text-[10px] font-bold",
      variant === "outline" ? "border border-border text-muted-foreground" : "bg-primary text-primary-foreground",
      className
    )}>
      {children}
    </span>
  );
}
