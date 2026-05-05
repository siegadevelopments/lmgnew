import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  Plus,
  Pencil,
  Trash2,
  Eye,
  Image as ImageIcon,
  Link as LinkIcon,
  Mail,
  Settings2,
  Clock,
  Sparkles,
  X,
  CheckCircle2,
  Target,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Popup {
  id: string;
  title: string;
  content: string | null;
  image_url: string | null;
  cta_type: "url" | "email";
  cta_url: string | null;
  cta_button_text: string;
  is_active: boolean;
  display_delay: number;
}

export function AdminPopupsTab() {
  const [popups, setPopups] = useState<Popup[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingPopup, setEditingPopup] = useState<Popup | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<Partial<Popup>>({
    title: "",
    content: "",
    image_url: "",
    cta_type: "url",
    cta_url: "",
    cta_button_text: "Learn More",
    is_active: false,
    display_delay: 3000,
  });

  useEffect(() => {
    loadPopups();
  }, []);

  async function loadPopups() {
    setLoading(true);
    const { data, error } = await supabase
      .from("popups" as any)
      .select("*")
      .order("created_at", { ascending: false });
    if (error) toast.error("Failed to load popups");
    else setPopups(data || []);
    setLoading(false);
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      ...form,
      updated_at: new Date().toISOString(),
    };

    let error;
    if (editingPopup) {
      const { error: err } = await (supabase.from("popups") as any)
        .update(payload)
        .eq("id", editingPopup.id);
      error = err;
    } else {
      const { error: err } = await (supabase.from("popups") as any).insert([payload]);
      error = err;
    }

    if (error) toast.error(error.message);
    else {
      toast.success(editingPopup ? "Popup updated" : "Popup created");
      setShowForm(false);
      setEditingPopup(null);
      loadPopups();
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this popup?")) return;
    const { error } = await supabase
      .from("popups" as any)
      .delete()
      .eq("id", id);
    if (error) toast.error(error.message);
    else {
      toast.success("Popup deleted");
      loadPopups();
    }
  };

  const toggleActive = async (popup: Popup) => {
    // If activating, deactivate others first (only one active popup recommended)
    if (!popup.is_active) {
      await (supabase.from("popups") as any).update({ is_active: false }).neq("id", popup.id);
    }

    const { error } = await (supabase.from("popups") as any)
      .update({ is_active: !popup.is_active })
      .eq("id", popup.id);
    if (error) toast.error(error.message);
    else loadPopups();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-foreground">Site Popups</h2>
          <p className="text-sm text-muted-foreground">
            Create and manage marketing popups for your visitors.
          </p>
        </div>
        <Button
          onClick={() => {
            setShowForm(true);
            setEditingPopup(null);
            setForm({
              title: "",
              content: "",
              image_url: "",
              cta_type: "url",
              cta_url: "",
              cta_button_text: "Learn More",
              is_active: false,
              display_delay: 3000,
            });
          }}
          className="gap-2"
        >
          <Plus className="h-4 w-4" /> Create Popup
        </Button>
      </div>

      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingPopup ? "Edit Popup" : "New Marketing Popup"}</DialogTitle>
            <DialogDescription>
              Fill in the template below to configure your popup.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="grid gap-6 md:grid-cols-2 pt-4">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Popup Title</Label>
                <Input
                  required
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder="e.g. Special Spring Sale! 🌸"
                />
              </div>
              <div className="space-y-2">
                <Label>Image URL</Label>
                <Input
                  value={form.image_url || ""}
                  onChange={(e) => setForm({ ...form, image_url: e.target.value })}
                  placeholder="https://images.unsplash.com/..."
                />
                {form.image_url && (
                  <div className="mt-2 h-32 w-full rounded-lg overflow-hidden border border-border bg-muted">
                    <img src={form.image_url} alt="" className="h-full w-full object-cover" />
                  </div>
                )}
              </div>
              <div className="space-y-2">
                <Label>Content / Message</Label>
                <Textarea
                  rows={4}
                  value={form.content || ""}
                  onChange={(e) => setForm({ ...form, content: e.target.value })}
                  placeholder="Tell your visitors what this popup is about..."
                />
              </div>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Call to Action Type</Label>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant={form.cta_type === "url" ? "default" : "outline"}
                    className="flex-1 gap-2"
                    onClick={() => setForm({ ...form, cta_type: "url" })}
                  >
                    <LinkIcon className="h-4 w-4" /> Open URL
                  </Button>
                  <Button
                    type="button"
                    variant={form.cta_type === "email" ? "default" : "outline"}
                    className="flex-1 gap-2"
                    onClick={() => setForm({ ...form, cta_type: "email" })}
                  >
                    <Mail className="h-4 w-4" /> Email Signup
                  </Button>
                </div>
              </div>

              {form.cta_type === "url" && (
                <div className="space-y-2">
                  <Label>CTA URL</Label>
                  <Input
                    value={form.cta_url || ""}
                    onChange={(e) => setForm({ ...form, cta_url: e.target.value })}
                    placeholder="/shop or https://..."
                  />
                </div>
              )}

              <div className="space-y-2">
                <Label>Button Text</Label>
                <Input
                  value={form.cta_button_text}
                  onChange={(e) => setForm({ ...form, cta_button_text: e.target.value })}
                  placeholder="e.g. Shop Now"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Display Delay (ms)</Label>
                  <Input
                    type="number"
                    value={form.display_delay}
                    onChange={(e) => setForm({ ...form, display_delay: Number(e.target.value) })}
                  />
                </div>
                <div className="flex items-center justify-end gap-2 pt-8">
                  <Label className="cursor-pointer">Active</Label>
                  <Switch
                    checked={form.is_active}
                    onCheckedChange={(v) => setForm({ ...form, is_active: v })}
                  />
                </div>
              </div>

              <div className="flex gap-2 pt-4">
                <Button type="submit" className="flex-1 font-bold">
                  {editingPopup ? "Save Changes" : "Create Popup"}
                </Button>
                <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
                  Cancel
                </Button>
              </div>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <div className="grid gap-6 lg:grid-cols-4">
        <div className="lg:col-span-3 grid gap-4 sm:grid-cols-2">
          {popups.map((popup) => (
            <Card
              key={popup.id}
              className={cn(
                "overflow-hidden transition-all",
                popup.is_active ? "ring-2 ring-primary border-primary/20 shadow-md" : "opacity-75",
              )}
            >
              {popup.image_url && (
                <div className="h-40 w-full overflow-hidden bg-muted">
                  <img src={popup.image_url} alt="" className="h-full w-full object-cover" />
                </div>
              )}
              <CardContent className="p-4 space-y-4">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="font-bold text-sm line-clamp-1">{popup.title}</h3>
                    <Badge
                      variant="secondary"
                      className="mt-1 text-[10px] uppercase font-bold tracking-wider"
                    >
                      {popup.cta_type === "email" ? "Email Capture" : "Redirect Link"}
                    </Badge>
                  </div>
                  <Switch checked={popup.is_active} onCheckedChange={() => toggleActive(popup)} />
                </div>
                <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                  {popup.content || "No content description."}
                </p>
                <div className="flex items-center justify-between pt-2">
                  <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    {popup.display_delay}ms delay
                  </div>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => {
                        setEditingPopup(popup);
                        setForm(popup);
                        setShowForm(true);
                      }}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive"
                      onClick={() => handleDelete(popup.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
          {popups.length === 0 && !showForm && (
            <div className="col-span-full py-20 text-center space-y-4">
              <Settings2 className="h-12 w-12 mx-auto text-muted-foreground/20" />
              <h3 className="text-lg font-bold">No popups yet</h3>
              <p className="text-sm text-muted-foreground">
                Create your first marketing popup to engage your visitors.
              </p>
              <Button onClick={() => setShowForm(true)} variant="outline">
                <Plus className="h-4 w-4 mr-2" /> Create First Popup
              </Button>
            </div>
          )}
        </div>

        {/* Marketing Insights Sidebar */}
        <div className="space-y-4">
          <Card className="bg-primary/5 border-primary/10">
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2 text-primary">
                <Sparkles className="h-4 w-4" />
                <h3 className="text-sm font-bold uppercase tracking-wider">Conversion Tips</h3>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1">
                <p className="text-xs font-bold text-foreground">1. Use Social Proof</p>
                <p className="text-[10px] text-muted-foreground leading-relaxed">
                  "Join 5,000+ others" or "Trusted by experts" significantly boosts trust and
                  signups.
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-xs font-bold text-foreground">2. The "Power of Free"</p>
                <p className="text-[10px] text-muted-foreground leading-relaxed">
                  Offering a 10% discount or a "Welcome Gift" in exchange for an email is the #1
                  conversion driver.
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-xs font-bold text-foreground">3. High-Quality Visuals</p>
                <p className="text-[10px] text-muted-foreground leading-relaxed">
                  Use calming, high-resolution wellness imagery from Unsplash to set the mood.
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-xs font-bold text-foreground">4. Smart Delay</p>
                <p className="text-[10px] text-muted-foreground leading-relaxed">
                  Don't show popups instantly. A 5-8 second delay allows visitors to engage with
                  your content first.
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-dashed border-2 opacity-60">
            <CardContent className="p-4 py-8 text-center space-y-2">
              <Target className="h-6 w-6 mx-auto text-muted-foreground" />
              <p className="text-xs font-bold">Exit-Intent Coming Soon</p>
              <p className="text-[10px] text-muted-foreground">
                Trigger popups only when a user is about to leave your site.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
