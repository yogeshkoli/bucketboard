'use client';

import { toast } from 'sonner';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { FileItem, FolderItem } from './FileList';

interface RenameDialogProps {
  item: FileItem | FolderItem | null;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  currentPrefix: string;
}

export function RenameDialog({ item, isOpen, onOpenChange, onSuccess, currentPrefix }: RenameDialogProps) {
  const [newName, setNewName] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (item) {
      setNewName(item.name);
    }
  }, [item]);

  const handleRename = async () => {
    if (!item || !newName || newName.includes('/')) {
      setError('Invalid name. Cannot be empty or contain slashes.');
      return;
    }
    setError('');

    const isFolder = 'prefix' in item;
    const oldKey = isFolder ? item.prefix : item.key;
    const newKey = isFolder ? `${currentPrefix}${newName}/` : `${currentPrefix}${newName}`;

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/rename`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ oldKey, newKey, isFolder }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.details || 'Failed to rename.');
      }

      onSuccess();
      toast.success(`Item renamed to "${newName}"`);
      onOpenChange(false);
    } catch (e) {
      if (e instanceof Error) {
        setError(e.message);
      } else {
        toast.error("Rename failed.");
        setError('An unexpected error occurred.');
      }
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader><DialogTitle>Rename { 'prefix' in (item || {}) ? 'Folder' : 'File' }</DialogTitle></DialogHeader>
        <div className="grid gap-4 py-4">
          <Input id="name" value={newName} onChange={(e) => setNewName(e.target.value)} className="col-span-3" />
          {error && <p className="text-sm text-destructive">{error}</p>}
        </div>
        <DialogFooter>
          <DialogClose asChild><Button variant="ghost">Cancel</Button></DialogClose>
          <Button onClick={handleRename}>Rename</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}