'use client'

import React, { useState } from "react";
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
        <svg className="h-4 w-4 fill-current" viewBox="0 0 24 24">
          <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
        </svg>
      ),
      color: "bg-[#1877F2] text-white hover:bg-[#1877F2]/90",
      href: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`,
    },
    {
      name: "Instagram",
      icon: (
        <svg className="h-4 w-4 fill-current" viewBox="0 0 24 24">
          <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
        </svg>
      ),
      color: "bg-gradient-to-tr from-[#f09433] via-[#dc2743] to-[#bc1888] text-white hover:opacity-90",
      href: `https://www.instagram.com/`,
    },
    {
      name: "Pinterest",
      icon: (
        <svg className="h-4 w-4 fill-current" viewBox="0 0 24 24">
          <path d="M12 0C5.373 0 0 5.372 0 12c0 5.084 3.163 9.426 7.627 11.174-.105-.949-.2-2.405.042-3.441.218-.937 1.407-5.965 1.407-5.965s-.359-.719-.359-1.782c0-1.668.967-2.914 2.171-2.914 1.023 0 1.518.769 1.518 1.69 0 1.029-.655 2.568-.994 3.995-.283 1.194.599 2.169 1.777 2.169 2.133 0 3.772-2.249 3.772-5.495 0-2.873-2.064-4.882-5.012-4.882-3.414 0-5.418 2.561-5.418 5.207 0 1.031.397 2.138.893 2.738a.36.36 0 0 1 .083.345c-.091.377-.293 1.192-.333 1.36-.053.22-.174.267-.402.161-1.499-.698-2.436-2.889-2.436-4.649 0-3.785 2.75-7.262 7.929-7.262 4.163 0 7.398 2.967 7.398 6.931 0 4.136-2.607 7.464-6.227 7.464-1.216 0-2.359-.631-2.75-1.378l-.748 2.853c-.271 1.043-1.002 2.35-1.492 3.146C9.57 23.812 10.763 24 12 24c6.627 0 12-5.373 12-12 0-6.628-5.373-12-12-12z" />
        </svg>
      ),
      color: "bg-[#E60023] text-white hover:bg-[#E60023]/90",
      href: `https://pinterest.com/pin/create/button/?url=${encodeURIComponent(shareUrl)}&description=${encodeURIComponent(title)}`,
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
      <PopoverTrigger asChild>
        {React.isValidElement(children) 
          ? React.cloneElement(children as React.ReactElement<any>, {
              onClick: (e: React.MouseEvent) => {
                e.stopPropagation();
                e.preventDefault();
                setOpen((prev) => !prev);
                // Call original onClick if it exists
                if ((children as any).props.onClick) {
                  (children as any).props.onClick(e);
                }
              }
            })
          : children
        }
      </PopoverTrigger>
      <PopoverContent 
        className="w-80 p-4 border border-border bg-card text-card-foreground shadow-md rounded-xl z-50 animate-in fade-in slide-in-from-bottom-2 duration-200"
        onClick={(e) => {
          e.stopPropagation();
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
