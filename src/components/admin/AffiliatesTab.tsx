import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Plus, Pencil, Trash2, ExternalLink, Store, GripVertical } from "lucide-react";
import { toast } from "sonner";

interface AffiliateStore {
  id: string;
  name: string;
  description: string | null;
  logo_url: string | null;
  affiliate_url: string;
  is_active: boolean;
  sort_order: number;
}

const emptyForm: Omit<AffiliateStore, "id"> = {
  name: "",
  description: "",
  logo_url: "",
  affiliate_url: "",
  is_active: true,
  sort_order: 0,
};

export function AffiliatesTab() {
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<AffiliateStore | null>(null);
  const [form, setForm] = useState<Omit<AffiliateStore, "id">>(emptyForm);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const { data: affiliates = [], isLoading } = useQuery({
    queryKey: ["admin_affiliate_stores"],
    queryFn: async () => {
      const { data, error } = await (supabase
        .from("affiliate_stores" as any) as any)
        .select("*")
        .order("sort_order", { ascending: true });
      if (error) throw error;
      return data as AffiliateStore[];
    },
  });

  const openCreate = () => {
    setEditTarget(null);
    setForm({ ...emptyForm, sort_order: (affiliates.length + 1) * 10 });
    setDialogOpen(true);
  };

  const openEdit = (store: AffiliateStore) => {
    setEditTarget(store);
    setForm({
      name: store.name,
      description: store.description || "",
      logo_url: store.logo_url || "",
      affiliate_url: store.affiliate_url,
      is_active: store.is_active,
      sort_order: store.sort_order,
    });
    setDialogOpen(true);
  };

  const save = useMutation({
    mutationFn: async () => {
      const payload = {
        name: form.name.trim(),
        description: form.description?.trim() || null,
        logo_url: form.logo_url?.trim() || null,
        affiliate_url: form.affiliate_url.trim(),
        is_active: form.is_active,
        sort_order: Number(form.sort_order) || 0,
        updated_at: new Date().toISOString(),
      };

      if (editTarget) {
        const { error } = await (supabase
          .from("affiliate_stores" as any) as any)
          .update(payload)
          .eq("id", editTarget.id);
        if (error) throw error;
      } else {
        const { error } = await (supabase
          .from("affiliate_stores" as any) as any)
          .insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin_affiliate_stores"] });
      queryClient.invalidateQueries({ queryKey: ["affiliate_stores"] });
      setDialogOpen(false);
      toast.success(editTarget ? "Affiliate updated" : "Affiliate added");
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to save affiliate");
    },
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase
        .from("affiliate_stores" as any) as any)
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin_affiliate_stores"] });
      queryClient.invalidateQueries({ queryKey: ["affiliate_stores"] });
      setDeleteConfirm(null);
      toast.success("Affiliate deleted");
    },
    onError: (err: any) => toast.error(err.message),
  });

  const toggleActive = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await (supabase
        .from("affiliate_stores" as any) as any)
        .update({ is_active, updated_at: new Date().toISOString() })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin_affiliate_stores"] });
      queryClient.invalidateQueries({ queryKey: ["affiliate_stores"] });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.affiliate_url.trim()) {
      toast.error("Name and affiliate URL are required");
      return;
    }
    save.mutate();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold">Affiliate Stores</h2>
          <p className="text-sm text-muted-foreground">
            Manage affiliate partners displayed on the public Affiliates page.
          </p>
        </div>
        <Button onClick={openCreate} className="gap-2">
          <Plus className="h-4 w-4" /> Add Affiliate
        </Button>
      </div>

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-48 rounded-xl bg-muted animate-pulse" />
          ))}
        </div>
      ) : affiliates.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Store className="h-10 w-10 text-muted-foreground/30 mb-3" />
            <p className="text-muted-foreground text-sm">No affiliate stores yet.</p>
            <Button variant="outline" className="mt-4 gap-2" onClick={openCreate}>
              <Plus className="h-4 w-4" /> Add your first affiliate
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {affiliates.map((store) => (
            <Card key={store.id} className={`overflow-hidden transition-all ${!store.is_active ? "opacity-60" : ""}`}>
              {/* Logo preview */}
              <div className="flex items-center justify-center bg-muted/50 border-b border-border/50 p-6 min-h-[120px]">
                {store.logo_url ? (
                  <img
                    src={store.logo_url}
                    alt={store.name}
                    className="max-h-14 max-w-[160px] object-contain"
                    onError={(e) => {
                      (e.target as HTMLImageElement).replaceWith(
                        Object.assign(document.createElement("div"), {
                          className: "text-sm text-muted-foreground",
                          textContent: store.name
                        })
                      );
                    }}
                  />
                ) : (
                  <Store className="h-10 w-10 text-muted-foreground/30" />
                )}
              </div>

              <CardContent className="p-4 space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <CardTitle className="text-sm font-bold">{store.name}</CardTitle>
                    {store.description && (
                      <CardDescription className="text-xs mt-1 line-clamp-2">
                        {store.description}
                      </CardDescription>
                    )}
                  </div>
                  <Badge variant={store.is_active ? "default" : "secondary"} className="text-[10px] shrink-0">
                    {store.is_active ? "Active" : "Hidden"}
                  </Badge>
                </div>

                <a
                  href={store.affiliate_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-xs text-primary hover:underline truncate"
                >
                  <ExternalLink className="h-3 w-3 shrink-0" />
                  {store.affiliate_url}
                </a>

                <div className="flex gap-2 pt-1">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 h-8 text-xs"
                    onClick={() => openEdit(store)}
                  >
                    <Pencil className="h-3 w-3 mr-1" /> Edit
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 text-xs"
                    onClick={() => toggleActive.mutate({ id: store.id, is_active: !store.is_active })}
                  >
                    {store.is_active ? "Hide" : "Show"}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 text-xs text-destructive hover:bg-destructive hover:text-destructive-foreground"
                    onClick={() => setDeleteConfirm(store.id)}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>{editTarget ? "Edit Affiliate" : "Add Affiliate Store"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label>Company Name *</Label>
              <Input
                value={form.name}
                onChange={e => setForm({ ...form, name: e.target.value })}
                placeholder="e.g. Youngevity"
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label>Affiliate URL *</Label>
              <Input
                value={form.affiliate_url}
                onChange={e => setForm({ ...form, affiliate_url: e.target.value })}
                placeholder="https://yourpartner.com/ref=lmg"
                type="url"
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label>Logo URL</Label>
              <Input
                value={form.logo_url || ""}
                onChange={e => setForm({ ...form, logo_url: e.target.value })}
                placeholder="https://example.com/logo.png"
              />
              {form.logo_url && (
                <div className="mt-2 flex items-center justify-center bg-muted rounded-lg p-4 h-20">
                  <img
                    src={form.logo_url}
                    alt="Preview"
                    className="max-h-12 max-w-[180px] object-contain"
                    onError={(e) => { (e.target as HTMLImageElement).src = ""; }}
                  />
                </div>
              )}
            </div>

            <div className="space-y-1.5">
              <Label>Description</Label>
              <Textarea
                value={form.description || ""}
                onChange={e => setForm({ ...form, description: e.target.value })}
                placeholder="Brief description of this affiliate and their offerings..."
                rows={3}
              />
            </div>

            <div className="flex gap-4">
              <div className="flex-1 space-y-1.5">
                <Label>Sort Order</Label>
                <Input
                  type="number"
                  value={form.sort_order}
                  onChange={e => setForm({ ...form, sort_order: Number(e.target.value) })}
                  min={0}
                />
              </div>
              <div className="flex items-end pb-0.5">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.is_active}
                    onChange={e => setForm({ ...form, is_active: e.target.checked })}
                    className="w-4 h-4 rounded"
                  />
                  <span className="text-sm font-medium">Active (visible publicly)</span>
                </label>
              </div>
            </div>

            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={save.isPending}>
                {save.isPending ? "Saving..." : editTarget ? "Save Changes" : "Add Affiliate"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirm Dialog */}
      <Dialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <DialogContent className="sm:max-w-[380px]">
          <DialogHeader>
            <DialogTitle>Delete Affiliate?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            This will permanently remove this affiliate store from the public page. This action cannot be undone.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteConfirm(null)}>Cancel</Button>
            <Button
              variant="destructive"
              disabled={remove.isPending}
              onClick={() => deleteConfirm && remove.mutate(deleteConfirm)}
            >
              {remove.isPending ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
