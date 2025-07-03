'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter,
    DialogClose,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { FolderPlus } from 'lucide-react';

interface CreateFolderDialogProps {
    currentPrefix: string;
    onSuccess: () => void;
}

export function CreateFolderDialog({ currentPrefix, onSuccess }: CreateFolderDialogProps) {
    const [folderName, setFolderName] = useState('');
    const [error, setError] = useState('');
    const [isOpen, setIsOpen] = useState(false);

    const handleCreate = async () => {
        if (!folderName || folderName.includes('/')) {
            setError('Invalid folder name. Cannot be empty or contain slashes.');
            return;
        }
        setError('');

        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/folders`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ folderName, prefix: currentPrefix }),
            });

            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(errorData.details || 'Failed to create folder.');
            }

            onSuccess();
            setIsOpen(false);
            setFolderName('');
        } catch (e) {
            if (e instanceof Error) {
                setError(e.message);
            } else {
                setError('An unexpected error occurred.');
            }
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                <Button variant="outline"><FolderPlus className="mr-2 h-4 w-4" /> Create Folder</Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader><DialogTitle>Create New Folder</DialogTitle></DialogHeader>
                <div className="grid gap-4 py-4">
                    <Input id="name" placeholder="New folder name" value={folderName} onChange={(e) => setFolderName(e.target.value)} className="col-span-3" />
                    {error && <p className="text-sm text-destructive">{error}</p>}
                </div>
                <DialogFooter>
                    <DialogClose asChild><Button variant="ghost">Cancel</Button></DialogClose>
                    <Button onClick={handleCreate}>Create</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}