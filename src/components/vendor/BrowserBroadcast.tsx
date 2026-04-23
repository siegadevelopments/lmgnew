import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Camera, CameraOff, Mic, MicOff, Settings, AlertCircle, Play, Square } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";

interface Props {
  isLive: boolean;
  onToggleLive: () => void;
  isUpdating: boolean;
}

export function BrowserBroadcast({ isLive, onToggleLive, isUpdating }: Props) {
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [isCameraOn, setIsCameraOn] = useState(false);
  const [isMicOn, setIsMicOn] = useState(true);
  const videoRef = useRef<HTMLVideoElement>(null);

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { width: 1280, height: 720, facingMode: "user" },
        audio: isMicOn
      });
      setStream(mediaStream);
      setIsCameraOn(true);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (err) {
      console.error("Error accessing camera:", err);
      toast.error("Could not access camera or microphone. Please check permissions.");
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
      setIsCameraOn(false);
    }
  };

  const toggleMic = () => {
    if (stream) {
      stream.getAudioTracks().forEach(track => {
        track.enabled = !isMicOn;
      });
      setIsMicOn(!isMicOn);
    }
  };

  useEffect(() => {
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [stream]);

  return (
    <div className="space-y-4">
      <div className="relative aspect-video bg-black rounded-2xl overflow-hidden border border-border shadow-elevated">
        {isCameraOn ? (
          <video 
            ref={videoRef} 
            autoPlay 
            playsInline 
            muted 
            className="w-full h-full object-cover mirror"
            style={{ transform: "scaleX(-1)" }}
          />
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-muted-foreground gap-4">
            <div className="h-20 w-20 rounded-full bg-muted flex items-center justify-center">
              <CameraOff className="h-10 w-10 opacity-20" />
            </div>
            <div className="text-center">
              <p className="font-bold">Camera is Off</p>
              <p className="text-sm">Enable your camera to start broadcasting from your browser.</p>
            </div>
            <Button onClick={startCamera} variant="outline">
              Enable Camera
            </Button>
          </div>
        )}

        {isLive && (
          <div className="absolute top-4 left-4">
            <Badge variant="destructive" className="animate-pulse px-3 py-1 text-xs font-bold">
              ● BROADCASTING LIVE
            </Badge>
          </div>
        )}

        {isCameraOn && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-black/60 backdrop-blur-md p-2 rounded-full border border-white/20">
            <Button 
              variant="ghost" 
              size="icon" 
              className={`rounded-full h-10 w-10 ${!isMicOn ? "text-destructive" : "text-white"}`}
              onClick={toggleMic}
            >
              {isMicOn ? <Mic className="h-5 w-5" /> : <MicOff className="h-5 w-5" />}
            </Button>
            <div className="w-px h-6 bg-white/20" />
            <Button 
              variant="ghost" 
              size="icon" 
              className="rounded-full h-10 w-10 text-white"
              onClick={stopCamera}
            >
              <CameraOff className="h-5 w-5" />
            </Button>
          </div>
        )}
      </div>

      <div className="flex flex-col gap-4">
        <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-primary shrink-0 mt-0.5" />
          <div className="text-sm">
            <p className="font-bold text-primary">Browser Broadcasting Mode</p>
            <p className="text-muted-foreground">
              You are streaming directly from your browser. For professional quality, overlays, and multi-cam setups, we still recommend using <strong>OBS Studio</strong> with your RTMP keys.
            </p>
          </div>
        </div>

        <Button 
          size="lg" 
          className="w-full font-bold h-14 text-lg shadow-lg" 
          variant={isLive ? "destructive" : "wellness"}
          disabled={!isCameraOn || isUpdating}
          onClick={onToggleLive}
        >
          {isUpdating ? (
            <RefreshCw className="mr-2 h-5 w-5 animate-spin" />
          ) : isLive ? (
            <Square className="mr-2 h-5 w-5 fill-current" />
          ) : (
            <Play className="mr-2 h-5 w-5 fill-current" />
          )}
          {isLive ? "Stop Broadcasting" : "Start Live Stream"}
        </Button>
      </div>
    </div>
  );
}

function RefreshCw(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
      <path d="M21 3v5h-5" />
      <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" />
      <path d="M3 21v-5h5" />
    </svg>
  );
}
