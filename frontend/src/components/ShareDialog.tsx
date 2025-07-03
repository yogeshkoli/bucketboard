'use client';

import { toast } from 'sonner';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { FileItem } from './FileList';
import { Copy, Check } from 'lucide-react';

interface ShareDialogProps {
  file: FileItem | null;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ShareDialog({ file, isOpen, onOpenChange }: ShareDialogProps) {
  const [expiry, setExpiry] = useState('3600'); // 1 hour in seconds
  const [generatedUrl, setGeneratedUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [isCopied, setIsCopied] = useState(false);

  const handleGenerateLink = async () => {
    if (!file) return;
    setIsLoading(true);
    setError('');
    setGeneratedUrl('');
    setIsCopied(false);

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/share/presigned-url`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key: file.key, expiresIn: expiry }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.details || 'Failed to generate link.');
      }
      const { url } = await res.json();
      setGeneratedUrl(url);
    } catch (e) {
      if (e instanceof Error) {
        setError(e.message);
      } else {
        toast.error("Failed to generate link.");
        setError('An unexpected error occurred.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyToClipboard = () => {
    navigator.clipboard.writeText(generatedUrl);
    setIsCopied(true);
    toast.success("Link copied to clipboard!");
    setTimeout(() => setIsCopied(false), 2000); // Reset after 2 seconds
  };

  const handleOpenChangeWithReset = (open: boolean) => {
    if (!open) {
      // Reset state when dialog closes
      setGeneratedUrl('');
      setError('');
      setIsCopied(false);
      setExpiry('3600');
    }
    onOpenChange(open);
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChangeWithReset}>
      <DialogContent className="sm:max-w-[525px]">
        <DialogHeader>
          <DialogTitle>Share {`"${file?.name}"`}</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="expiry" className="text-right">Expires in</Label>
            <Select value={expiry} onValueChange={setExpiry}>
              <SelectTrigger className="col-span-3"><SelectValue placeholder="Set expiry time" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="3600">1 Hour</SelectItem>
                <SelectItem value="86400">1 Day</SelectItem>
                <SelectItem value="604800">7 Days</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {generatedUrl && (
            <div className="relative col-span-4">
              <Input id="link" value={generatedUrl} readOnly />
              <Button size="icon" variant="ghost" className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7" onClick={handleCopyToClipboard}>
                {isCopied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>
          )}
          {error && <p className="text-sm text-destructive col-span-4">{error}</p>}
        </div>
        <DialogFooter>
          <Button onClick={handleGenerateLink} disabled={isLoading}>{isLoading ? 'Generating...' : 'Generate Link'}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}