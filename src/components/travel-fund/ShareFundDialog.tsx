import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { 
  Copy, 
  Share2, 
  Mail, 
  MessageSquare, 
  Facebook, 
  Twitter,
  QrCode,
  Check
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { TravelFund } from '@/lib/travelFundClient';

interface ShareFundDialogProps {
  fund: TravelFund;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const ShareFundDialog: React.FC<ShareFundDialogProps> = ({
  fund,
  open,
  onOpenChange
}) => {
  const { toast } = useToast();
  const [copied, setCopied] = useState<string | null>(null);

  const shareUrl = `${window.location.origin}/join-fund?code=${fund.fund_code}`;
  const shareText = `Join my travel fund "${fund.name}" and let's save together for our dream trip! 🌍✈️`;
  const emailSubject = `Join my travel fund: ${fund.name}`;
  const emailBody = `Hi!\n\nI've created a travel fund called "${fund.name}" and I'd love for you to join me!\n\n${fund.description ? `About this trip: ${fund.description}\n\n` : ''}Click here to join: ${shareUrl}\n\nLet's make this trip happen together!\n\nCheers! 🎉`;

  const copyToClipboard = async (text: string, type: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(type);
      setTimeout(() => setCopied(null), 2000);
      
      toast({
        title: "Copied!",
        description: `${type} copied to clipboard`,
        variant: "default"
      });
    } catch (err) {
      toast({
        title: "Copy failed",
        description: "Unable to copy to clipboard",
        variant: "destructive"
      });
    }
  };

  const shareViaAPI = () => {
    if (navigator.share) {
      navigator.share({
        title: `Join ${fund.name}`,
        text: shareText,
        url: shareUrl
      }).catch(console.error);
    } else {
      copyToClipboard(shareUrl, 'Link');
    }
  };

  const shareViaEmail = () => {
    const mailtoUrl = `mailto:?subject=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(emailBody)}`;
    window.open(mailtoUrl, '_blank');
  };

  const shareViaSMS = () => {
    const smsText = `${shareText}\n\n${shareUrl}`;
    const smsUrl = `sms:?body=${encodeURIComponent(smsText)}`;
    window.open(smsUrl, '_blank');
  };

  const shareViaFacebook = () => {
    const fbUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}&quote=${encodeURIComponent(shareText)}`;
    window.open(fbUrl, '_blank', 'width=600,height=400');
  };

  const shareViaTwitter = () => {
    const tweetText = `${shareText}\n\n${shareUrl}`;
    const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(tweetText)}`;
    window.open(twitterUrl, '_blank', 'width=600,height=400');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Share2 className="h-5 w-5" />
            Share Fund: {fund.name}
          </DialogTitle>
          <DialogDescription>
            Invite friends and family to join your travel fund
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Quick Share */}
          <div>
            <Label className="text-sm font-medium">Quick Share</Label>
            <div className="grid grid-cols-4 gap-2 mt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={shareViaAPI}
                className="flex flex-col gap-1 h-auto p-3"
              >
                <Share2 className="h-4 w-4" />
                <span className="text-xs">Share</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={shareViaEmail}
                className="flex flex-col gap-1 h-auto p-3"
              >
                <Mail className="h-4 w-4" />
                <span className="text-xs">Email</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={shareViaSMS}
                className="flex flex-col gap-1 h-auto p-3"
              >
                <MessageSquare className="h-4 w-4" />
                <span className="text-xs">SMS</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => copyToClipboard(shareUrl, 'Link')}
                className="flex flex-col gap-1 h-auto p-3"
              >
                {copied === 'Link' ? (
                  <Check className="h-4 w-4 text-green-500" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
                <span className="text-xs">Copy</span>
              </Button>
            </div>
          </div>

          <Separator />

          {/* Social Media */}
          <div>
            <Label className="text-sm font-medium">Social Media</Label>
            <div className="grid grid-cols-2 gap-2 mt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={shareViaFacebook}
                className="flex items-center gap-2"
              >
                <Facebook className="h-4 w-4" />
                Facebook
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={shareViaTwitter}
                className="flex items-center gap-2"
              >
                <Twitter className="h-4 w-4" />
                Twitter
              </Button>
            </div>
          </div>

          <Separator />

          {/* Copy Link */}
          <div>
            <Label className="text-sm font-medium">Share Link</Label>
            <div className="flex gap-2 mt-2">
              <Input
                readOnly
                value={shareUrl}
                className="text-xs"
              />
              <Button
                variant="outline"
                size="sm"
                onClick={() => copyToClipboard(shareUrl, 'Link')}
                className="shrink-0"
              >
                {copied === 'Link' ? (
                  <Check className="h-4 w-4 text-green-500" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>

          {/* Fund Code */}
          <div>
            <Label className="text-sm font-medium">Fund Code</Label>
            <div className="flex gap-2 mt-2">
              <Input
                readOnly
                value={fund.fund_code}
                className="font-mono text-center text-lg font-bold"
              />
              <Button
                variant="outline"
                size="sm"
                onClick={() => copyToClipboard(fund.fund_code, 'Fund Code')}
                className="shrink-0"
              >
                {copied === 'Fund Code' ? (
                  <Check className="h-4 w-4 text-green-500" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Share this code for others to manually join your fund
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};