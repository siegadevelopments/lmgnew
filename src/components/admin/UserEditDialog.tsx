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
      // We call our Edge Function
      const { data, error } = await supabase.functions.invoke("admin-api", {
        body: { 
          action: "update-user", 
          params: { id: user.id, email: email } 
        },
      });

      if (error) throw error;
      if (data.error) throw new Error(data.error);

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
    setResetLoading(true);
    try {
      // Use the built-in client method for password reset
      const { error } = await supabase.auth.resetPasswordForEmail(user.email, {
        redirectTo: `${window.location.origin}/login?type=recovery`,
      });

      if (error) throw error;

      toast.success(`Password reset email sent to ${user.email}`);
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
              disabled={resetLoading}
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
