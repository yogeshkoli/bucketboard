import { useState, useEffect } from "react";
import { DndContext, DragOverlay, useDraggable, useDroppable, closestCenter, type DragEndEvent } from "@dnd-kit/core";
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
import { Checkbox } from "@/components/ui/checkbox";
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
  const [isBulkDeleteConfirmOpen, setIsBulkDeleteConfirmOpen] = useState(false);
  const [itemToRename, setItemToRename] = useState<FileItem | FolderItem | null>(null);
  const [fileToShare, setFileToShare] = useState<FileItem | null>(null);
  const [previewFile, setPreviewFile] = useState<{ file: FileItem, url: string } | null>(null);
  const [isPreviewLoading, setIsPreviewLoading] = useState(false);
  const [activeDragId, setActiveDragId] = useState<string | null>(null);
  const [selectedKeys, setSelectedKeys] = useState<Set<string>>(new Set());

  // Clear selection when the list of items changes (e.g., folder navigation)
  useEffect(() => {
    setSelectedKeys(new Set());
  }, [items]);

  const numFiles = items.files.length;
  const numSelected = selectedKeys.size;
  const activeFile = activeDragId ? items.files.find(f => f.key === activeDragId) : null;

  // Calculate parent prefix for the "navigate up" drop zone
  const lastSlashIndex = currentPrefix.slice(0, -1).lastIndexOf('/');
  const parentPrefix = lastSlashIndex === -1 ? '' : currentPrefix.slice(0, lastSlashIndex + 1);

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

  const handleBulkDelete = async () => {
    if (selectedKeys.size === 0) return;

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/files/bulk`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ keys: Array.from(selectedKeys) }),
      });

      if (!res.ok) {
        throw new Error('Failed to delete selected files.');
      }
      onActionSuccess();
    } catch (error) {
      console.error("Bulk deletion failed:", error);
      // In a real app, you'd show a toast notification here
    } finally {
      setIsBulkDeleteConfirmOpen(false);
    }
  };

  const handleSelectAll = (checked: boolean | 'indeterminate') => {
    if (checked) {
      const allFileKeys = new Set(items.files.map(f => f.key));
      setSelectedKeys(allFileKeys);
    } else {
      setSelectedKeys(new Set());
    }
  };

  const handleSelectRow = (key: string, checked: boolean) => {
    const newSelectedKeys = new Set(selectedKeys);
    if (checked) {
      newSelectedKeys.add(key);
    } else {
      newSelectedKeys.delete(key);
    }
    setSelectedKeys(newSelectedKeys);
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

  const handleDragEnd = async (event: DragEndEvent) => {
    setActiveDragId(null);
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const fileKey = active.id as string;
      const folderPrefix = over.id as string;
      const fileName = items.files.find(f => f.key === fileKey)?.name;

      if (!fileName) return;

      const oldKey = fileKey;
      const newKey = `${folderPrefix}${fileName}`;

      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/rename`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ oldKey, newKey, isFolder: false }),
        });

        if (!res.ok) {
          throw new Error('Failed to move file.');
        }
        onActionSuccess();
      } catch (error) {
        console.error("Move failed:", error);
        // In a real app, you'd show a toast notification here
      }
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
    <DndContext onDragStart={(e) => setActiveDragId(e.active.id as string)} onDragEnd={handleDragEnd} collisionDetection={closestCenter}>
      {numSelected > 0 && (
        <div className="flex items-center justify-between p-2 px-4 bg-muted/50 border-b">
          <span className="text-sm font-medium">{numSelected} selected</span>
          <Button variant="destructive" size="sm" onClick={() => setIsBulkDeleteConfirmOpen(true)}>
            <Trash2 className="mr-2 h-4 w-4" />
            Delete Selected
          </Button>
        </div>
      )}
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[60px] pl-4">
              <Checkbox checked={numSelected === numFiles && numFiles > 0 ? true : numSelected > 0 ? 'indeterminate' : false} onCheckedChange={handleSelectAll} disabled={numFiles === 0} />
            </TableHead>
            <TableHead className="w-[40px]"></TableHead>
            <TableHead>Name</TableHead>
            <TableHead>Last Modified</TableHead>
            <TableHead className="w-[120px] text-right">Size</TableHead>
            <TableHead className="w-[50px] text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {currentPrefix && (
            <NavigateUpRow onNavigateUp={onNavigateUp} parentPrefix={parentPrefix} />
          )}
          {items.folders.map((folder) => (
            <FolderRow key={folder.prefix} folder={folder} onFolderClick={onFolderClick} onRename={() => setItemToRename(folder)} />
          ))}
          {items.files.map((file) => (
            <FileRow key={file.key} file={file} isSelected={selectedKeys.has(file.key)} onSelectRow={handleSelectRow} onPreview={handlePreview} onRename={() => setItemToRename(file)} onShare={() => setFileToShare(file)} onDelete={() => setFileToDelete(file)} />
          ))}
        </TableBody>
      </Table>

      {/* Modals */}
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

      <AlertDialog open={isBulkDeleteConfirmOpen} onOpenChange={setIsBulkDeleteConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete {numSelected} selected file(s). This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleBulkDelete} className="bg-destructive hover:bg-destructive/90">Delete</AlertDialogAction>
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

      <DragOverlay>
        {activeFile ? (
          <Table className="bg-background shadow-lg rounded-lg w-full">
            <TableBody>
              <TableRow>
                <TableCell className="w-[60px] pl-4"><Checkbox checked={true} disabled /></TableCell>
                <TableCell className="w-[40px]">{getFileIcon(activeFile.name)}</TableCell>
                <TableCell>{activeFile.name}</TableCell>
                <TableCell>{new Date(activeFile.lastModified).toLocaleDateString()}</TableCell>
                <TableCell className="w-[120px] text-right">{formatBytes(activeFile.size)}</TableCell>
                <TableCell className="w-[50px] text-right"></TableCell>
              </TableRow>
            </TableBody>
          </Table>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}

// --- Draggable and Droppable Row Components ---

function FileRow({ file, isSelected, onSelectRow, onPreview, onRename, onShare, onDelete }: { file: FileItem, isSelected: boolean, onSelectRow: (key: string, checked: boolean) => void, onPreview: (file: FileItem) => void, onRename: () => void, onShare: () => void, onDelete: () => void }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: file.key,
  });

  const style = transform ? {
    transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
    opacity: isDragging ? 0.5 : 1,
  } : undefined;

  return (
    <TableRow ref={setNodeRef} style={style} {...attributes} data-state={isSelected && 'selected'}>
      <TableCell className="pl-4">
        <Checkbox checked={isSelected} onCheckedChange={(checked) => onSelectRow(file.key, !!checked)} />
      </TableCell>
      <TableCell>{getFileIcon(file.name)}</TableCell>
      <TableCell {...listeners} className="cursor-grab">{file.name}</TableCell>
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
            <DropdownMenuItem onClick={() => onPreview(file)}><Eye className="mr-2 h-4 w-4" /><span>Preview</span></DropdownMenuItem>
            <DropdownMenuItem onClick={onRename}><Pencil className="mr-2 h-4 w-4" /><span>Rename</span></DropdownMenuItem>
            <DropdownMenuItem onClick={onShare}><Share2 className="mr-2 h-4 w-4" /><span>Share</span></DropdownMenuItem>
            <DropdownMenuItem onClick={onDelete} className="text-destructive focus:text-destructive focus:bg-destructive/10"><Trash2 className="mr-2 h-4 w-4" /><span>Delete</span></DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </TableCell>
    </TableRow>
  );
}

function NavigateUpRow({ onNavigateUp, parentPrefix }: { onNavigateUp: () => void, parentPrefix: string }) {
  const { isOver, setNodeRef } = useDroppable({
    id: parentPrefix,
  });

  return (
    <TableRow ref={setNodeRef} onClick={onNavigateUp} className={`cursor-pointer hover:bg-muted/50 ${isOver ? 'bg-primary/10' : ''}`}>
      <TableCell></TableCell>
      <TableCell><ArrowUp className="h-5 w-5 text-muted-foreground" /></TableCell>
      <TableCell className="font-medium">..</TableCell>
      <TableCell>--</TableCell>
      <TableCell>--</TableCell>
      <TableCell className="text-right">--</TableCell>
    </TableRow>
  );
}

function FolderRow({ folder, onFolderClick, onRename }: { folder: FolderItem, onFolderClick: (prefix: string) => void, onRename: () => void }) {
  const { isOver, setNodeRef } = useDroppable({
    id: folder.prefix,
  });

  return (
    <TableRow ref={setNodeRef} className={isOver ? 'bg-primary/10' : ''}>
      <TableCell></TableCell>
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
            <DropdownMenuItem onClick={onRename}><Pencil className="mr-2 h-4 w-4" /><span>Rename</span></DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </TableCell>
    </TableRow>
  );
}
