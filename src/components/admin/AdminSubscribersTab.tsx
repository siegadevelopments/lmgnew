import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { 
  Mail, 
  Download, 
  Trash2, 
  Search, 
  Loader2, 
  Calendar,
  UserPlus,
  ArrowUpDown
} from "lucide-react";

interface Subscriber {
  id: string;
  email: string;
  created_at: string;
}

export function AdminSubscribersTab() {
  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  useEffect(() => {
    loadSubscribers();
  }, [sortOrder]);

  async function loadSubscribers() {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("newsletter_subscribers")
        .select("*")
        .order("created_at", { ascending: sortOrder === "asc" });

      if (error) throw error;
      setSubscribers(data || []);
    } catch (err: any) {
      toast.error(err.message || "Failed to load subscribers");
    } finally {
      setLoading(false);
    }
  }

  const filteredSubscribers = subscribers.filter(s => 
    s.email.toLowerCase().includes(search.toLowerCase())
  );

  const handleExportCSV = () => {
    if (subscribers.length === 0) return;
    
    const headers = ["ID", "Email", "Subscribed At"];
    const rows = subscribers.map(s => [
      s.id,
      s.email,
      new Date(s.created_at).toLocaleString()
    ]);
    
    const csvContent = [
      headers.join(","),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(","))
    ].join("\n");
    
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `lmg_subscribers_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Subscribers exported to CSV");
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to remove this subscriber?")) return;
    
    try {
      const { error } = await supabase
        .from("newsletter_subscribers")
        .delete()
        .eq("id", id);
        
      if (error) throw error;
      
      setSubscribers(prev => prev.filter(s => s.id !== id));
      toast.success("Subscriber removed");
    } catch (err: any) {
      toast.error(err.message || "Failed to delete subscriber");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight">Newsletter Subscribers</h2>
          <p className="text-sm text-muted-foreground">Manage your mailing list and export data.</p>
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Button variant="outline" size="sm" onClick={handleExportCSV} className="gap-2">
            <Download className="h-4 w-4" /> Export CSV
          </Button>
          <Badge variant="secondary" className="px-3 py-1 font-bold">
            {subscribers.length} Total
          </Badge>
        </div>
      </div>

      <Card className="border-border/50">
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row items-center gap-4">
            <div className="relative flex-1 w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Search emails..." 
                className="pl-9"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <Button 
              variant="ghost" 
              size="sm" 
              className="gap-2 shrink-0"
              onClick={() => setSortOrder(prev => prev === "asc" ? "desc" : "asc")}
            >
              <ArrowUpDown className="h-4 w-4" />
              {sortOrder === "asc" ? "Oldest First" : "Newest First"}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12 gap-4">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground animate-pulse">Loading subscriber list...</p>
            </div>
          ) : filteredSubscribers.length === 0 ? (
            <div className="py-20 text-center">
              <UserPlus className="h-12 w-12 mx-auto text-muted-foreground/20 mb-4" />
              <h3 className="text-lg font-bold">No subscribers found</h3>
              <p className="text-sm text-muted-foreground">Try a different search or wait for new signups.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-muted-foreground">
                    <th className="text-left py-3 px-4 font-semibold">Email Address</th>
                    <th className="text-left py-3 px-4 font-semibold">Joined Date</th>
                    <th className="text-right py-3 px-4 font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredSubscribers.map((s) => (
                    <tr key={s.id} className="border-b border-border/50 hover:bg-muted/30 transition-colors group">
                      <td className="py-3 px-4 font-medium flex items-center gap-3">
                        <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                          <Mail className="h-4 w-4" />
                        </div>
                        {s.email}
                      </td>
                      <td className="py-3 px-4 text-muted-foreground">
                        <div className="flex items-center gap-1.5">
                          <Calendar className="h-3.5 w-3.5" />
                          {new Date(s.created_at).toLocaleDateString("en-AU", {
                            day: "numeric",
                            month: "short",
                            year: "numeric"
                          })}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8 text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={() => handleDelete(s.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
