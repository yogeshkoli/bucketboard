'use client';

import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
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
import { Progress } from '@/components/ui/progress';
import { UploadCloud, File as FileIcon, CheckCircle2 } from 'lucide-react';

interface UploadableFile {
    file: File;
    progress: number;
    status: 'pending' | 'uploading' | 'success' | 'error';
}

interface UploadDialogProps {
    currentPrefix: string;
    onUploadSuccess: () => void;
}

export function UploadDialog({ currentPrefix, onUploadSuccess }: UploadDialogProps) {
    const [files, setFiles] = useState<UploadableFile[]>([]);
    const [uploadCompleted, setUploadCompleted] = useState(false);
    const [isOpen, setIsOpen] = useState(false);

    const onDrop = useCallback((acceptedFiles: File[]) => {
        const newFiles = acceptedFiles.map(file => ({ file, progress: 0, status: 'pending' } as UploadableFile));
        setFiles(newFiles);
        setUploadCompleted(false); // Reset on new files
    }, []);

    const handleOpenChange = (open: boolean) => {
        if (!open) {
            // Reset component state when dialog is closed
            setFiles([]);
            setUploadCompleted(false);
        }
        setIsOpen(open);
    };

    const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop, noClick: true });

    const handleUpload = async () => {
        if (files.length === 0) return;

        const uploadPromises = files.map(async (uploadableFile, index) => {
            try {
                // 1. Get pre-signed URL from our backend
                const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/upload/presigned-url`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        fileName: uploadableFile.file.name,
                        fileType: uploadableFile.file.type,
                        prefix: currentPrefix,
                    }),
                });

                if (!res.ok) throw new Error('Failed to get pre-signed URL.');
                const { url } = await res.json();

                // 2. Upload the file directly to S3 using the pre-signed URL
                const xhr = new XMLHttpRequest();
                xhr.open('PUT', url, true);
                xhr.setRequestHeader('Content-Type', uploadableFile.file.type);

                xhr.upload.onprogress = (event) => {
                    if (event.lengthComputable) {
                        const percentComplete = Math.round((event.loaded / event.total) * 100);
                        setFiles(prev => prev.map((f, i) => i === index ? { ...f, progress: percentComplete, status: 'uploading' } : f));
                    }
                };

                await new Promise<void>((resolve, reject) => {
                    xhr.onload = () => {
                        if (xhr.status >= 200 && xhr.status < 300) {
                            setFiles(prev => prev.map((f, i) => i === index ? { ...f, status: 'success' } : f));
                            resolve();
                        } else {
                            reject(new Error(`Upload failed with status: ${xhr.status}`));
                        }
                    };
                    xhr.onerror = () => {
                        setFiles(prev => prev.map((f, i) => i === index ? { ...f, status: 'error' } : f));
                        reject(new Error('Network error during upload.'));
                    };
                    xhr.send(uploadableFile.file);
                });
            } catch (error) {
                console.error('Upload failed:', error);
                setFiles(prev => prev.map((f, i) => i === index ? { ...f, status: 'error' } : f));
            }
        });

        await Promise.all(uploadPromises);
        setUploadCompleted(true);
        onUploadSuccess(); // Refresh the file list on the main page
    };

    return (
        <Dialog open={isOpen} onOpenChange={handleOpenChange}>
            <DialogTrigger asChild>
                <Button>
                    <UploadCloud className="mr-2 h-4 w-4" /> Upload Files
                </Button>
            </DialogTrigger>
            <DialogContent {...getRootProps()} className="sm:max-w-[425px] p-0">
                <input {...getInputProps()} />
                <DialogHeader className="p-6 pb-0">
                    <DialogTitle>Upload Files</DialogTitle>
                </DialogHeader>
                <div className={`m-6 mt-2 border-2 border-dashed rounded-lg p-10 text-center ${isDragActive ? 'border-primary bg-muted' : ''}`}>
                    <UploadCloud className="mx-auto h-12 w-12 text-muted-foreground" />
                    <p className="mt-2 text-sm text-muted-foreground">Drag & drop files here, or <label htmlFor="file-upload" className="text-primary font-medium cursor-pointer hover:underline">browse</label>.</p>
                    <input id="file-upload" type="file" multiple className="sr-only" onChange={(e) => onDrop(Array.from(e.target.files || []))} />
                </div>
                {files.length > 0 && (
                    <div className="px-6 max-h-48 overflow-y-auto">
                        {files.map((f) => (
                            <div key={f.file.name} className="flex items-center space-x-4 mb-4">
                                {f.status === 'success' ? <CheckCircle2 className="h-6 w-6 text-green-500" /> : <FileIcon className="h-6 w-6 text-muted-foreground" />}
                                <div className="flex-1">
                                    <p className="text-sm font-medium truncate">{f.file.name}</p>
                                    {f.status === 'uploading' && <Progress value={f.progress} className="h-2 mt-1" />}
                                    {f.status === 'error' && <p className="text-xs text-destructive">Upload failed</p>}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
                <DialogFooter className="p-6 pt-0">
                    {uploadCompleted ? (
                        <DialogClose asChild>
                            <Button>Done</Button>
                        </DialogClose>
                    ) : (
                        <Button onClick={handleUpload} disabled={files.length === 0 || files.some(f => f.status === 'uploading' || f.status === 'success')}>Upload</Button>
                    )}
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}