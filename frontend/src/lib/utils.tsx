import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import { File, FileArchive, FileAudio, FileCode, FileImage, FileText, FileVideo, type LucideProps } from "lucide-react";
import React from "react";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Helper to format bytes into a readable string
export const formatBytes = (bytes: number, decimals: number = 2): string => {
  if (!+bytes) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
};

// Helper to get an icon based on file extension
export const getFileIcon = (fileName: string, props?: LucideProps): React.ReactElement => {
  const defaultClassName = "h-5 w-5 text-muted-foreground";
  const finalProps = { ...props, className: cn(defaultClassName, props?.className) };
  const extension = fileName.split('.').pop()?.toLowerCase();
  switch (extension) {
    case 'jpg':
    case 'jpeg':
    case 'png':
    case 'gif':
    case 'svg':
    case 'webp':
      return <FileImage {...finalProps} />;
    case 'pdf':
      return <FileText {...finalProps} />;
    case 'zip':
    case 'rar':
    case '7z':
      return <FileArchive {...finalProps} />;
    case 'mp4':
    case 'mov':
    case 'avi':
      return <FileVideo {...finalProps} />;
    case 'mp3':
    case 'wav':
      return <FileAudio {...finalProps} />;
    case 'js': case 'jsx': case 'ts': case 'tsx': case 'html': case 'css':
      return <FileCode {...finalProps} />;
    default:
      return <File {...finalProps} />;
  }
};

export const isImage = (fileName: string) => /\.(jpe?g|png|gif|svg|webp)$/i.test(fileName);
export const isPDF = (fileName: string) => /\.pdf$/i.test(fileName);