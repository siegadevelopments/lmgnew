import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, Mail } from "lucide-react";

interface UserEditDialogProps {
  user: any;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function UserEditDialog({ user, isOpen, onClose, onSuccess }: UserEditDialogProps) {
  const [loading, setLoading] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);
  const [email, setEmail] = useState(user?.email || "");

  const handleUpdateEmail = async () => {
    if (!email || email === user.email) return;
    setLoading(true);

    try {
      const { error } = await (supabase as any).rpc("admin_update_user_email", {
        target_user_id: user.id,
        new_email: email
      });

      if (error) throw error;

      toast.success("User email updated successfully");
      onSuccess();
      onClose();
    } catch (error: any) {
      console.error("Error updating user:", error);
      toast.error(error.message || "Failed to update user. Make sure the 'admin-api' function is deployed.");
    } finally {
      setLoading(false);
    }
  };

  const handleSendReset = async () => {
    if (!email) {
      toast.error("Please provide an email address first.");
      return;
    }
    setResetLoading(true);
    const resetUrl = window.location.origin.includes("localhost") 
      ? "https://lmgnew.vercel.app/login?type=recovery"
      : `${window.location.origin}/login?type=recovery`;

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: resetUrl,
      });

      if (error) throw error;

      toast.success(`Password reset email sent to ${email}`);
    } catch (error: any) {
      console.error("Error sending reset:", error);
      toast.error(error.message || "Failed to send reset email");
    } finally {
      setResetLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Manage User: {user?.full_name || "Guest"}</DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div className="grid gap-2">
            <Label htmlFor="email">Email Address</Label>
            <div className="flex gap-2">
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="user@example.com"
              />
              <Button onClick={handleUpdateEmail} disabled={loading || email === user.email}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Update
              </Button>
            </div>
            <p className="text-[10px] text-muted-foreground italic">Note: Changing email requires the 'admin-api' edge function.</p>
          </div>

          <Separator />

          <div className="space-y-3">
            <Label>Security Actions</Label>
            <Button 
              variant="outline" 
              className="w-full justify-start" 
              onClick={handleSendReset}
              disabled={resetLoading || !email}
            >
              {resetLoading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Mail className="mr-2 h-4 w-4 text-muted-foreground" />
              )}
              Send Password Reset Email
            </Button>
            <p className="text-[10px] text-muted-foreground">This will send an official Supabase recovery email to the user.</p>
          </div>

          <Separator />

          <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-4 space-y-3">
            <Label className="text-destructive font-bold">Danger Zone</Label>
            <Button 
              variant="destructive" 
              className="w-full" 
              onClick={async () => {
                if (window.confirm(`Are you absolutely sure you want to PERMANENTLY delete the account for ${user.full_name}? This cannot be undone.`)) {
                  setLoading(true);
                  try {
                    const { error } = await (supabase as any).rpc("admin_delete_user", {
                      target_user_id: user.id
                    });
                    if (error) throw error;
                    toast.success("Account deleted successfully");
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
              Delete Account Permanently
            </Button>
            <p className="text-[10px] text-destructive/70">Warning: This will remove the user from the authentication system and all their profile data.</p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function Separator() {
  return <div className="h-px w-full bg-border" />;
}
