import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Radio, Video, Copy, ExternalLink, RefreshCw, Layout, Monitor } from "lucide-react";
import { toast } from "sonner";
import MuxPlayer from "@mux/mux-player-react";
import { BrowserBroadcast } from "./BrowserBroadcast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export function VendorLiveStream({ vendorId }: { vendorId: string }) {
  const [streamInfo, setStreamInfo] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [activeMode, setActiveMode] = useState<"browser" | "software">("software");

  useEffect(() => {
    loadStreamInfo();
  }, [vendorId]);

  async function loadStreamInfo() {
    setLoading(true);
    const { data, error } = await supabase
      .from("vendor_streams")
      .select("*")
      .eq("vendor_id", vendorId)
      .single();

    if (!error && data) {
      setStreamInfo(data);
    }
    setLoading(false);
  }

  async function toggleLiveStatus() {
    if (!streamInfo) return;
    
    setIsUpdating(true);
    const newStatus = !streamInfo.is_live;
    
    const { error } = await supabase
      .from("vendor_streams")
      .update({ is_live: newStatus, last_streamed_at: newStatus ? new Date().toISOString() : streamInfo.last_streamed_at })
      .eq("vendor_id", vendorId);

    if (error) {
      toast.error("Failed to update status");
    } else {
      setStreamInfo({ ...streamInfo, is_live: newStatus });
      toast.success(newStatus ? "You are now LIVE!" : "Stream ended");
      
      // Also update vendor_profiles for easy discovery
      await supabase
        .from("vendor_profiles")
        .update({ is_live: newStatus })
        .eq("id", vendorId);
    }
    setIsUpdating(false);
  }

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied!`);
  };

  if (loading) return <div className="flex justify-center p-10"><Loader2 className="animate-spin" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Live Streaming</h2>
          <p className="text-muted-foreground">Connect with your audience in real-time.</p>
        </div>
        <Button 
          variant={streamInfo?.is_live ? "destructive" : "default"}
          size="lg"
          className="font-bold"
          onClick={toggleLiveStatus}
          disabled={isUpdating || !streamInfo}
        >
          {isUpdating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Radio className="mr-2 h-4 w-4" />}
          {streamInfo?.is_live ? "End Stream" : "Go Live Now"}
        </Button>
      </div>

      <Tabs value={activeMode} onValueChange={(v) => setActiveMode(v as any)} className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-2 mb-6">
          <TabsTrigger value="software" className="flex items-center gap-2">
            <Monitor className="h-4 w-4" />
            Software Mode (OBS)
          </TabsTrigger>
          <TabsTrigger value="browser" className="flex items-center gap-2 text-primary font-bold">
            <Layout className="h-4 w-4" />
            Browser Mode (PWA)
          </TabsTrigger>
        </TabsList>

        <TabsContent value="software" className="space-y-6 mt-0">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Stream Preview</CardTitle>
                <CardDescription>
                  {streamInfo?.is_live ? (
                    <Badge variant="destructive" className="animate-pulse">LIVE</Badge>
                  ) : (
                    <Badge variant="secondary">OFFLINE</Badge>
                  )}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="aspect-video bg-black rounded-lg overflow-hidden flex items-center justify-center border border-border">
                  {streamInfo?.mux_playback_id ? (
                    <MuxPlayer
                      playbackId={streamInfo.mux_playback_id}
                      streamType="live"
                      autoPlay={false}
                      muted
                      className="w-full h-full"
                    />
                  ) : (
                    <div className="text-center text-muted-foreground p-6">
                      <Video className="h-12 w-12 mx-auto mb-4 opacity-20" />
                      <p>Configure your stream settings below to see a preview.</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Stream Settings</CardTitle>
                <CardDescription>Use these in OBS or your streaming software.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase text-muted-foreground">Server URL</label>
                  <div className="flex gap-2">
                    <Input readOnly value="rtmps://global-live.mux.com:443/app" className="bg-muted text-xs" />
                    <Button variant="ghost" size="icon" onClick={() => copyToClipboard("rtmps://global-live.mux.com:443/app", "Server URL")}>
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase text-muted-foreground">Stream Key</label>
                  <div className="flex gap-2">
                    <Input type="password" readOnly value={streamInfo?.mux_stream_key || "••••••••••••"} className="bg-muted text-xs" />
                    <Button variant="ghost" size="icon" onClick={() => copyToClipboard(streamInfo?.mux_stream_key || "", "Stream Key")}>
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <div className="pt-4 border-t border-border mt-4">
                  <h4 className="text-sm font-bold mb-2">How to stream:</h4>
                  <ol className="text-xs space-y-2 text-muted-foreground list-decimal pl-4">
                    <li>Download and install OBS Studio.</li>
                    <li>Go to Settings {">"} Stream.</li>
                    <li>Set Service to "Custom".</li>
                    <li>Paste the Server URL and Stream Key above.</li>
                    <li>Click "Start Streaming" in OBS.</li>
                    <li>Come back here and click "Go Live Now".</li>
                  </ol>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="browser" className="mt-0">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <BrowserBroadcast 
                isLive={streamInfo?.is_live} 
                isUpdating={isUpdating} 
                onToggleLive={toggleLiveStatus} 
              />
            </div>
            
            <Card className="h-fit">
              <CardHeader>
                <CardTitle>Tips for Mobile Live</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <p className="text-sm font-bold">Stable Connection</p>
                  <p className="text-xs text-muted-foreground">Use WiFi if possible for the best stream quality and to avoid data charges.</p>
                </div>
                <div className="space-y-2">
                  <p className="text-sm font-bold">Landscape Mode</p>
                  <p className="text-xs text-muted-foreground">Rotate your phone for a better viewing experience for your customers.</p>
                </div>
                <div className="space-y-2">
                  <p className="text-sm font-bold">Lighting</p>
                  <p className="text-xs text-muted-foreground">Ensure your face or products are well-lit for a professional look.</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {!streamInfo && (
        <Card className="border-primary bg-primary/5">
          <CardContent className="py-6 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-full bg-primary/20 flex items-center justify-center">
                <RefreshCw className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h4 className="font-bold">Setup Required</h4>
                <p className="text-sm text-muted-foreground">You haven't initialized your live stream yet.</p>
              </div>
            </div>
            <Button onClick={() => toast.info("Setup Mux account first to get keys!")}>
              Setup Now
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
