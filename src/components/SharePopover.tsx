'use client'

import { useState } from "react";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Check, Copy, Mail } from "lucide-react";
import { toast } from "sonner";
import { decodeEntities } from "@/lib/utils";

interface SharePopoverProps {
  video: {
    id: string;
    title: string;
    description?: string | null;
  };
  children: React.ReactNode;
}

export function SharePopover({ video, children }: SharePopoverProps) {
  const [copied, setCopied] = useState(false);
  const [open, setOpen] = useState(false);

  const title = decodeEntities(video.title || "Educational Video");
  const description = decodeEntities(video.description || "").replace(/<\/?[^>]+(>|$)/g, "");
  
  // Safe window location
  const shareUrl = typeof window !== "undefined" 
    ? `${window.location.origin}/videos?v=${video.id}` 
    : "";

  const handleCopy = async (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    if (!shareUrl) return;

    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      toast.success("Link copied to clipboard!");
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      // Fallback
      const textArea = document.createElement("textarea");
      textArea.value = shareUrl;
      document.body.appendChild(textArea);
      textArea.select();
      try {
        document.execCommand("copy");
        setCopied(true);
        toast.success("Link copied to clipboard!");
        setTimeout(() => setCopied(false), 2000);
      } catch (e) {
        toast.error("Failed to copy link");
      }
      document.body.removeChild(textArea);
    }
  };

  const socialShares = [
    {
      name: "Facebook",
      icon: (
        <svg className="h-5 w-5 fill-current" viewBox="0 0 24 24">
          <path d="M22 12c0-5.52-4.48-10-10-10S2 6.48 2 12c0 4.84 3.44 8.87 8 9.8V15H8v-3h2V9.5C10 7.57 11.57 6 13.5 6H16v3h-2c-.55 0-1 .45-1 1v2h3v3h-3v6.95c4.56-.93 8-4.96 8-9.75z" />
        </svg>
      ),
      color: "bg-[#1877F2] text-white hover:bg-[#1877F2]/90",
      href: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`,
    },
    {
      name: "Twitter",
      icon: (
        <svg className="h-4 w-4 fill-current" viewBox="0 0 24 24">
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
        </svg>
      ),
      color: "bg-black text-white hover:bg-black/90",
      href: `https://twitter.com/intent/tweet?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(title)}`,
    },
    {
      name: "WhatsApp",
      icon: (
        <svg className="h-5 w-5 fill-current" viewBox="0 0 24 24">
          <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.514 2.266 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.502-5.731-1.456L0 24zm6.59-4.846c1.6.95 3.188 1.449 4.825 1.451 5.436 0 9.86-4.37 9.864-9.799.002-2.63-1.023-5.101-2.885-6.966a9.9 9.9 0 00-6.98-2.779C6.182 1.06 1.757 5.43 1.754 10.86c-.001 1.674.454 3.305 1.319 4.733l-.992 3.626 3.71-.973.016.009zm10.741-7.234c-.29-.145-1.716-.848-1.98-.942-.266-.096-.459-.145-.653.145-.193.29-.747.942-.916 1.135-.168.193-.337.218-.627.072-2.825-1.413-3.83-2.033-4.57-3.32-.196-.338-.02-.52.151-.715.155-.176.337-.387.507-.58.168-.194.225-.33.337-.55.113-.22.056-.411-.028-.556-.084-.145-.747-1.802-1.024-2.47-.27-.648-.545-.56-.747-.57-.193-.01-.415-.01-.637-.01s-.58.083-.883.412c-.302.33-1.155 1.129-1.155 2.75 0 1.62 1.182 3.19 1.346 3.412.164.22 2.325 3.551 5.632 4.98.787.34 1.4.542 1.88.697.79.25 1.512.215 2.08.13.634-.094 1.717-.7 1.958-1.378.24-.678.24-1.258.169-1.378-.071-.12-.266-.193-.556-.339z" />
        </svg>
      ),
      color: "bg-[#25D366] text-white hover:bg-[#25D366]/90",
      href: `https://api.whatsapp.com/send?text=${encodeURIComponent(title + " " + shareUrl)}`,
    },
    {
      name: "LinkedIn",
      icon: (
        <svg className="h-4 w-4 fill-current" viewBox="0 0 24 24">
          <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.779-1.75-1.75s.784-1.75 1.75-1.75 1.75.779 1.75 1.75-.784 1.75-1.75 1.75zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
        </svg>
      ),
      color: "bg-[#0A66C2] text-white hover:bg-[#0A66C2]/90",
      href: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`,
    },
    {
      name: "Email",
      icon: <Mail className="h-4 w-4" />,
      color: "bg-neutral-500 text-white hover:bg-neutral-600",
      href: `mailto:?subject=${encodeURIComponent(title)}&body=${encodeURIComponent(description + "\n\n" + shareUrl)}`,
    },
  ];

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild onClick={(e) => {
        e.stopPropagation();
        e.preventDefault();
      }}>
        {children}
      </PopoverTrigger>
      <PopoverContent 
        className="w-80 p-4 border border-border bg-card text-card-foreground shadow-md rounded-xl z-50 animate-in fade-in slide-in-from-bottom-2 duration-200"
        onClick={(e) => {
          e.stopPropagation();
          e.preventDefault();
        }}
      >
        <div className="space-y-4">
          <div className="flex flex-col space-y-1">
            <h4 className="font-bold text-sm leading-none">Share video</h4>
            <p className="text-xs text-muted-foreground line-clamp-1">{title}</p>
          </div>
          
          <div className="flex items-center justify-between gap-2 py-1">
            {socialShares.map((share) => (
              <a
                key={share.name}
                href={share.href}
                target="_blank"
                rel="noopener noreferrer"
                className={`flex h-9 w-9 items-center justify-center rounded-full transition-transform hover:scale-110 active:scale-95 ${share.color}`}
                title={`Share on ${share.name}`}
              >
                {share.icon}
              </a>
            ))}
          </div>

          <div className="space-y-1.5 border-t border-border/50 pt-3">
            <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              Video Link
            </label>
            <div className="flex gap-1.5">
              <Input
                readOnly
                value={shareUrl}
                className="h-8 text-xs bg-muted/30 border-border select-all focus-visible:ring-0 focus-visible:ring-offset-0"
              />
              <Button
                size="sm"
                onClick={handleCopy}
                className="h-8 px-2.5 flex items-center gap-1 text-xs shrink-0 bg-primary text-primary-foreground hover:bg-primary/90"
              >
                {copied ? (
                  <>
                    <Check className="h-3 w-3" /> Copied
                  </>
                ) : (
                  <>
                    <Copy className="h-3 w-3" /> Copy
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
