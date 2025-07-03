import { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import Image from "next/image";
import { File, Folder, FileArchive, FileImage, FileText, FileVideo, FileAudio, FileCode, ArrowUp, MoreHorizontal, Eye, Trash2, Pencil, Share2 } from "lucide-react";
import { Skeleton } from "./ui/skeleton";
import { RenameDialog } from "./RenameDialog";
import { ShareDialog } from "./ShareDialog";

// --- Type Definitions ---
export interface FileItem {
  key: string;
  name: string;
  lastModified: string;
  size: number;
}

export interface FolderItem {
  name: string;
  prefix: string;
}

export interface FileListData {
  folders: FolderItem[];
  files: FileItem[];
}

interface FileListProps {
  items: FileListData;
  onFolderClick: (prefix: string) => void;
  onNavigateUp: () => void;
  currentPrefix: string;
  onActionSuccess: () => void;
}

// Helper to format bytes into a readable string
const formatBytes = (bytes: number, decimals: number = 2): string => {
  if (!+bytes) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
};

// Helper to get an icon based on file extension
const getFileIcon = (fileName: string) => {
  const extension = fileName.split('.').pop()?.toLowerCase();
  switch (extension) {
    case 'jpg':
    case 'jpeg':
    case 'png':
    case 'gif':
    case 'svg':
      return <FileImage className="h-5 w-5 text-muted-foreground" />;
    case 'pdf':
      return <FileText className="h-5 w-5 text-muted-foreground" />;
    case 'zip':
    case 'rar':
    case '7z':
      return <FileArchive className="h-5 w-5 text-muted-foreground" />;
    case 'mp4':
    case 'mov':
    case 'avi':
      return <FileVideo className="h-5 w-5 text-muted-foreground" />;
    case 'mp3':
    case 'wav':
      return <FileAudio className="h-5 w-5 text-muted-foreground" />;
    case 'js': case 'jsx': case 'ts': case 'tsx': case 'html': case 'css':
      return <FileCode className="h-5 w-5 text-muted-foreground" />;
    default:
      return <File className="h-5 w-5 text-muted-foreground" />;
  }
};

export function FileList({ items, onFolderClick, onNavigateUp, currentPrefix, onActionSuccess }: FileListProps) {
  const [fileToDelete, setFileToDelete] = useState<FileItem | null>(null);
  const [itemToRename, setItemToRename] = useState<FileItem | FolderItem | null>(null);
  const [fileToShare, setFileToShare] = useState<FileItem | null>(null);
  const [previewFile, setPreviewFile] = useState<{ file: FileItem, url: string } | null>(null);
  const [isPreviewLoading, setIsPreviewLoading] = useState(false);

  const handleDelete = async () => {
    if (!fileToDelete) return;

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/files`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key: fileToDelete.key }),
      });

      if (!res.ok) {
        throw new Error('Failed to delete file.');
      }
      onActionSuccess();
    } catch (error) {
      console.error("Deletion failed:", error);
      // In a real app, you'd show a toast notification here
    } finally {
      setFileToDelete(null);
    }
  };

  const handlePreview = async (file: FileItem) => {
    setIsPreviewLoading(true);
    setPreviewFile({ file, url: '' }); // Open dialog immediately with loader
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/files/presigned-url`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key: file.key }),
      });
      if (!res.ok) throw new Error('Failed to get preview URL.');
      const { url } = await res.json();
      setPreviewFile({ file, url });
    } catch (error) {
      console.error("Preview failed:", error);
      setPreviewFile(null); // Close dialog on error
      // In a real app, you'd show a toast notification here
    } finally {
      setIsPreviewLoading(false);
    }
  };

  const isImage = (fileName: string) => /\.(jpe?g|png|gif|svg|webp)$/i.test(fileName);
  const isPDF = (fileName: string) => /\.pdf$/i.test(fileName);


  if (!items || (items.folders.length === 0 && items.files.length === 0 && !currentPrefix)) {
    return (
      <div className="text-center py-10 text-muted-foreground">
        This folder is empty.
      </div>
    );
  }

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[40px]"></TableHead>
            <TableHead>Name</TableHead>
            <TableHead>Last Modified</TableHead>
            <TableHead className="w-[120px] text-right">Size</TableHead>
            <TableHead className="w-[50px] text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {currentPrefix && (
            <TableRow onClick={onNavigateUp} className="cursor-pointer hover:bg-muted/50">
              <TableCell><ArrowUp className="h-5 w-5 text-muted-foreground" /></TableCell>
              <TableCell className="font-medium">..</TableCell>
              <TableCell>--</TableCell>
              <TableCell>--</TableCell>
              <TableCell className="text-right">--</TableCell>
            </TableRow>
          )}
          {items.folders.map((folder) => (
            <TableRow key={folder.prefix}>
              <TableCell><Folder className="h-5 w-5 text-muted-foreground" /></TableCell>
              <TableCell onClick={() => onFolderClick(folder.prefix)} className="font-medium cursor-pointer hover:underline">{folder.name}</TableCell>
              <TableCell>--</TableCell>
              <TableCell>--</TableCell>
              <TableCell className="text-right">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="h-8 w-8 p-0">
                      <span className="sr-only">Open menu</span>
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => setItemToRename(folder)}>
                      <Pencil className="mr-2 h-4 w-4" />
                      <span>Rename</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
          {items.files.map((file) => (
            <TableRow key={file.key}>
              <TableCell>{getFileIcon(file.name)}</TableCell>
              <TableCell>{file.name}</TableCell>
              <TableCell>{new Date(file.lastModified).toLocaleDateString()}</TableCell>
              <TableCell className="text-right">{formatBytes(file.size)}</TableCell>
              <TableCell className="text-right">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="h-8 w-8 p-0">
                      <span className="sr-only">Open menu</span>
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => handlePreview(file)}>
                      <Eye className="mr-2 h-4 w-4" />
                      <span>Preview</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setItemToRename(file)}>
                      <Pencil className="mr-2 h-4 w-4" />
                      <span>Rename</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setFileToShare(file)}>
                      <Share2 className="mr-2 h-4 w-4" />
                      <span>Share</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setFileToDelete(file)} className="text-destructive focus:text-destructive focus:bg-destructive/10">
                      <Trash2 className="mr-2 h-4 w-4" />
                      <span>Delete</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <AlertDialog open={!!fileToDelete} onOpenChange={(open) => !open && setFileToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the file
              <span className="font-bold"> {fileToDelete?.name}</span>.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={!!previewFile} onOpenChange={(open) => !open && setPreviewFile(null)}>
        <DialogContent className="max-w-4xl h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="truncate">{previewFile?.file.name}</DialogTitle>
          </DialogHeader>
          <div className="relative flex-1 flex items-center justify-center overflow-hidden">
            {isPreviewLoading ? (
              <Skeleton className="w-full h-full" />
            ) : (
              previewFile && (
                isImage(previewFile.file.name) ? (
                  <Image src={previewFile.url} alt={previewFile.file.name} fill style={{ objectFit: 'contain' }} />
                ) : isPDF(previewFile.file.name) ? (
                  <iframe src={previewFile.url} className="w-full h-full border-0" title={previewFile.file.name} />
                ) : (
                  <div className="text-center">
                    <p className="text-muted-foreground">No preview available for this file type.</p>
                    <Button asChild className="mt-4">
                      <a href={previewFile.url} download={previewFile.file.name}>Download File</a>
                    </Button>
                  </div>
                )
              )
            )}
          </div>
        </DialogContent>
      </Dialog>

      <RenameDialog
        item={itemToRename}
        isOpen={!!itemToRename}
        onOpenChange={(open) => !open && setItemToRename(null)}
        onSuccess={onActionSuccess}
        currentPrefix={currentPrefix}
      />

      <ShareDialog file={fileToShare} isOpen={!!fileToShare} onOpenChange={(open) => !open && setFileToShare(null)} />
    </>
  );
}
