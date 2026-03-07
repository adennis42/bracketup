'use client';

import { useEffect, useRef } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Copy, Check, Share2 } from 'lucide-react';
import { useState } from 'react';

interface ShareSheetProps {
  open: boolean;
  onClose: () => void;
  shareCode: string;
  tournamentName: string;
}

export default function ShareSheet({ open, onClose, shareCode, tournamentName }: ShareSheetProps) {
  const [copied, setCopied] = useState(false);
  const [qrUrl, setQrUrl] = useState<string>('');
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const viewUrl =
    typeof window !== 'undefined'
      ? `${window.location.origin}/view/${shareCode}`
      : `/view/${shareCode}`;

  // Generate QR code via canvas
  useEffect(() => {
    if (!open) return;

    const generateQr = async () => {
      try {
        const QRCode = (await import('qrcode')).default;
        const url = await QRCode.toDataURL(viewUrl, {
          width: 240,
          margin: 2,
          color: { dark: '#ffffff', light: '#1f2937' },
        });
        setQrUrl(url);
      } catch (e) {
        console.error('QR generation failed', e);
      }
    };
    generateQr();
  }, [open, viewUrl]);

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(viewUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback — select input text
    }
  };

  const nativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: tournamentName,
          text: `Follow along at ${tournamentName}`,
          url: viewUrl,
        });
      } catch {
        // User cancelled
      }
    }
  };

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent side="bottom" className="bg-gray-900 border-t border-gray-700 text-white rounded-t-2xl pb-8">
        <SheetHeader className="mb-6">
          <SheetTitle className="text-white text-lg">Share Tournament</SheetTitle>
          <p className="text-gray-400 text-sm">
            Participants can scan or use the link to view live standings, their teammate, and next match.
          </p>
        </SheetHeader>

        <div className="space-y-6">
          {/* QR Code */}
          <div className="flex justify-center">
            {qrUrl ? (
              <div className="bg-gray-800 p-4 rounded-2xl">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={qrUrl} alt="QR Code" className="w-48 h-48" />
              </div>
            ) : (
              <div className="w-56 h-56 bg-gray-800 rounded-2xl animate-pulse" />
            )}
          </div>

          {/* Share code */}
          <div className="text-center">
            <p className="text-gray-500 text-xs uppercase tracking-wider mb-1">Share Code</p>
            <p className="text-3xl font-bold text-white tracking-widest">{shareCode}</p>
          </div>

          {/* Link + copy */}
          <div className="flex items-center gap-2 bg-gray-800 rounded-xl px-4 py-3">
            <p className="text-gray-400 text-sm truncate flex-1">{viewUrl}</p>
            <Button
              variant="ghost"
              size="sm"
              onClick={copyLink}
              className="shrink-0 text-gray-400 hover:text-white p-1"
            >
              {copied ? (
                <Check className="w-4 h-4 text-emerald-400" />
              ) : (
                <Copy className="w-4 h-4" />
              )}
            </Button>
          </div>

          {/* Native share button (mobile) */}
          {typeof navigator !== 'undefined' && 'share' in navigator && (
            <Button
              onClick={nativeShare}
              className="w-full h-12 bg-violet-600 hover:bg-violet-500 text-white rounded-xl font-semibold"
            >
              <Share2 className="w-4 h-4 mr-2" />
              Share Link
            </Button>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
