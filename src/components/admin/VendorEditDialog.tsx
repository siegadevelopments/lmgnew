import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, Mail } from "lucide-react";

interface VendorEditDialogProps {
  vendor: any;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function VendorEditDialog({ vendor, isOpen, onClose, onSuccess }: VendorEditDialogProps) {
  const [loading, setLoading] = useState(false);
  const [emailLoading, setEmailLoading] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);
  const [email, setEmail] = useState(vendor?.email || "");
  const [formData, setFormData] = useState({
    store_name: vendor?.store_name || "",
    store_description: vendor?.store_description || "",
    store_logo_url: vendor?.store_logo_url || "",
    store_banner_url: vendor?.store_banner_url || "",
    website: vendor?.website || "",
    instagram: vendor?.instagram || "",
    facebook: vendor?.facebook || "",
    twitter: vendor?.twitter || "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleUpdateEmail = async () => {
    if (!email || email === vendor.email) return;
    setEmailLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke("admin-api", {
        body: { 
          action: "update-user", 
          params: { id: vendor.id, email: email } 
        },
      });

      if (error) throw error;
      if (data.error) throw new Error(data.error);

      toast.success("Vendor email updated successfully");
      onSuccess();
    } catch (error: any) {
      console.error("Error updating vendor email:", error);
      toast.error(error.message || "Failed to update vendor email.");
    } finally {
      setEmailLoading(false);
    }
  };

  const handleSendReset = async () => {
    setResetLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(vendor.email, {
        redirectTo: `${window.location.origin}/login?type=recovery`,
      });

      if (error) throw error;
      toast.success(`Password reset email sent to ${vendor.email}`);
    } catch (error: any) {
      console.error("Error sending reset:", error);
      toast.error(error.message || "Failed to send reset email");
    } finally {
      setResetLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase
        .from("vendor_profiles")
        .update({
          ...formData,
          updated_at: new Date().toISOString(),
        })
        .eq("id", vendor.id);

      if (error) throw error;

      toast.success("Vendor updated successfully");
      onSuccess();
      onClose();
    } catch (error: any) {
      console.error("Error updating vendor:", error);
      toast.error(error.message || "Failed to update vendor");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Vendor: {vendor?.store_name}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 py-4">
          <div className="space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Store Details</h3>
            <div className="grid gap-2">
              <Label htmlFor="store_name">Store Name</Label>
              <Input
                id="store_name"
                name="store_name"
                value={formData.store_name}
                onChange={handleChange}
                required
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="store_description">Description</Label>
              <Textarea
                id="store_description"
                name="store_description"
                value={formData.store_description}
                onChange={handleChange}
                rows={4}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="store_logo_url">Logo URL</Label>
                <Input
                  id="store_logo_url"
                  name="store_logo_url"
                  value={formData.store_logo_url}
                  onChange={handleChange}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="store_banner_url">Banner URL</Label>
                <Input
                  id="store_banner_url"
                  name="store_banner_url"
                  value={formData.store_banner_url}
                  onChange={handleChange}
                />
              </div>
            </div>
          </div>

          <Separator />

          <div className="space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Social & Web</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="website">Website</Label>
                <Input
                  id="website"
                  name="website"
                  value={formData.website}
                  onChange={handleChange}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="instagram">Instagram</Label>
                <Input
                  id="instagram"
                  name="instagram"
                  value={formData.instagram}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="facebook">Facebook</Label>
                <Input
                  id="facebook"
                  name="facebook"
                  value={formData.facebook}
                  onChange={handleChange}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="twitter">Twitter</Label>
                <Input
                  id="twitter"
                  name="twitter"
                  value={formData.twitter}
                  onChange={handleChange}
                />
              </div>
            </div>
          </div>

          <Separator />

          <div className="space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-wider text-primary">Account & Security</h3>
            <div className="grid gap-2">
              <Label htmlFor="email">Login Email</Label>
              <div className="flex gap-2">
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="vendor@example.com"
                />
                <Button 
                  type="button" 
                  variant="secondary"
                  onClick={handleUpdateEmail} 
                  disabled={emailLoading || email === (vendor.email || "")}
                >
                  {emailLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Update Email
                </Button>
              </div>
            </div>

            <Button 
              type="button" 
              variant="outline" 
              className="w-full justify-start"
              onClick={handleSendReset}
              disabled={resetLoading}
            >
              {resetLoading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Mail className="mr-2 h-4 w-4 text-muted-foreground" />
              )}
              Send Password Reset Email
            </Button>
          </div>

          <Separator />

          <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-4 space-y-3">
            <Label className="text-destructive font-bold">Danger Zone</Label>
            <Button 
              type="button"
              variant="destructive" 
              className="w-full" 
              onClick={async () => {
                if (window.confirm(`Are you absolutely sure you want to PERMANENTLY delete the vendor account for ${vendor.store_name}? This cannot be undone.`)) {
                  setLoading(true);
                  try {
                    const { error } = await supabase.functions.invoke("admin-api", {
                      body: { action: "delete-user", params: { id: vendor.id } },
                    });
                    if (error) throw error;
                    toast.success("Vendor account deleted successfully");
                    onSuccess();
                    onClose();
                  } catch (err: any) {
                    toast.error(err.message || "Failed to delete account");
                  } finally {
                    setLoading(false);
                  }
                }
              }}
              disabled={loading}
            >
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Delete Vendor Permanently
            </Button>
          </div>

          <DialogFooter className="pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Store Changes
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function Separator() {
  return <div className="h-px w-full bg-border" />;
}
