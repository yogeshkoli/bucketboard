import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
  } from "@/components/ui/table";
  import { File, Folder, FileArchive, FileImage, FileText, FileVideo, FileAudio, FileCode, ArrowUp } from "lucide-react";
  
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
  
  export function FileList({ items, onFolderClick, onNavigateUp, currentPrefix }: FileListProps) {
    if (!items || (items.folders.length === 0 && items.files.length === 0 && !currentPrefix)) {
      return (
        <div className="text-center py-10 text-muted-foreground">
          This folder is empty.
        </div>
      );
    }
  
    return (
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[40px]"></TableHead>
            <TableHead>Name</TableHead>
            <TableHead>Last Modified</TableHead>
            <TableHead className="text-right">Size</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
        {currentPrefix && (
            <TableRow onClick={onNavigateUp} className="cursor-pointer hover:bg-muted/50">
              <TableCell><ArrowUp className="h-5 w-5 text-muted-foreground" /></TableCell>
              <TableCell className="font-medium">..</TableCell>
              <TableCell>--</TableCell>
              <TableCell className="text-right">--</TableCell>
            </TableRow>
          )}
          {items.folders.map((folder) => (
            <TableRow key={folder.prefix} onClick={() => onFolderClick(folder.prefix)} className="cursor-pointer hover:bg-muted/50">
              <TableCell><Folder className="h-5 w-5 text-muted-foreground" /></TableCell>
              <TableCell className="font-medium">{folder.name}</TableCell>
              <TableCell>--</TableCell>
              <TableCell className="text-right">--</TableCell>
            </TableRow>
          ))}
          {items.files.map((file) => (
            <TableRow key={file.key}>
              <TableCell>{getFileIcon(file.name)}</TableCell>
              <TableCell>{file.name}</TableCell>
              <TableCell>{new Date(file.lastModified).toLocaleDateString()}</TableCell>
              <TableCell className="text-right">{formatBytes(file.size)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    );
  }
  