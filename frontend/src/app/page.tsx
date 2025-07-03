'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { FileList, type FileListData } from '@/components/FileList';
import { UploadDialog } from '@/components/UploadDialog';
import { CreateFolderDialog } from '@/components/CreateFolderDialog';
import { BreadcrumbNav } from '@/components/BreadcrumbNav';
import { ThemeToggle } from '@/components/ThemeToggle';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Terminal, Search } from 'lucide-react';

const FileListSkeleton = () => (
  <div className="p-4 space-y-4">
    <div className="grid grid-cols-[40px_1fr_150px_100px] items-center gap-4">
      <Skeleton className="h-5 w-5" />
      <Skeleton className="h-4 w-[250px]" />
      <Skeleton className="h-4 w-[120px]" />
      <Skeleton className="h-4 w-[80px]" />
    </div>
    <div className="grid grid-cols-[40px_1fr_150px_100px] items-center gap-4">
      <Skeleton className="h-5 w-5" />
      <Skeleton className="h-4 w-[200px]" />
      <Skeleton className="h-4 w-[120px]" />
      <Skeleton className="h-4 w-[80px]" />
    </div>
    <div className="grid grid-cols-[40px_1fr_150px_100px] items-center gap-4">
      <Skeleton className="h-5 w-5" />
      <Skeleton className="h-4 w-[300px]" />
      <Skeleton className="h-4 w-[120px]" />
      <Skeleton className="h-4 w-[80px]" />
    </div>
  </div>
);

export default function HomePage() {
  const [data, setData] = useState<FileListData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [prefix, setPrefix] = useState(''); // To manage the current "folder"
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('all');

  const fetchFiles = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // Use the environment variable for the API URL
      const url = new URL(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/files`);
      if (prefix) {
        url.searchParams.append('prefix', prefix);
      }
      const res = await fetch(url.toString());

      if (!res.ok) {
        const errorData = await res.json().catch(() => null); // Gracefully handle non-JSON responses
        throw new Error(errorData?.details || `Request failed with status: ${res.status}`);
      }
      const result = await res.json(); // This will now be { folders: [], files: [] }
      setData(result);
    } catch (e) {
      if (e instanceof Error) {
        setError(e.message);
      } else {
        setError('An unexpected error occurred.');
      }
    } finally {
      setLoading(false);
    }
  }, [prefix]); // Re-run fetchFiles when the prefix changes

  useEffect(() => {
    fetchFiles();
  }, [fetchFiles]);

  const filteredData = useMemo(() => {
    if (!data) return null;

    const lowerCaseQuery = searchQuery.toLowerCase();

    const files = data.files.filter((file) => {
        const extension = file.name.split('.').pop()?.toLowerCase() || '';

        const imageExt = ['jpg', 'jpeg', 'png', 'gif', 'svg', 'webp'];
        const docExt = ['pdf', 'doc', 'docx', 'txt', 'md'];
        const videoExt = ['mp4', 'mov', 'avi', 'mkv'];
        const audioExt = ['mp3', 'wav'];
        const archiveExt = ['zip', 'rar', '7z'];
        const codeExt = ['js', 'jsx', 'ts', 'tsx', 'html', 'css'];
        const allKnownExt = [...imageExt, ...docExt, ...videoExt, ...audioExt, ...archiveExt, ...codeExt];

        const typeMatch =
            filterType === 'all' ||
            (filterType === 'images' && imageExt.includes(extension)) ||
            (filterType === 'documents' && docExt.includes(extension)) ||
            (filterType === 'videos' && videoExt.includes(extension)) ||
            (filterType === 'audio' && audioExt.includes(extension)) ||
            (filterType === 'archives' && archiveExt.includes(extension)) ||
            (filterType === 'code' && codeExt.includes(extension)) ||
            (filterType === 'other' && !allKnownExt.includes(extension));

        const nameMatch = file.name.toLowerCase().includes(lowerCaseQuery);

        return typeMatch && nameMatch;
    });

    // Only show folders if no type filter is active and they match the search query.
    const folders =
      filterType === 'all'
        ? data.folders.filter(folder =>
            folder.name.toLowerCase().includes(lowerCaseQuery)
          )
        : [];

    return { folders, files };
  }, [data, searchQuery, filterType]);

  const handleFolderClick = (newPrefix: string) => {
    setPrefix(newPrefix);
  };

  const handleNavigateUp = () => {
    // Find the last '/' and slice the string up to that point
    // e.g., 'folder1/folder2/' -> 'folder1/'
    // e.g., 'folder1/' -> ''
    const lastSlashIndex = prefix.slice(0, -1).lastIndexOf('/');
    const newPrefix = lastSlashIndex === -1 ? '' : prefix.slice(0, lastSlashIndex + 1);
    setPrefix(newPrefix);
  };

  return (
    <main className="container mx-auto p-4">
      <div className="border rounded-lg">
        <div className="flex items-center justify-between p-4 border-b">
          <div>
            <h1 className="text-xl font-semibold mb-2">BucketBoard</h1>
            <BreadcrumbNav prefix={prefix} onNavigate={setPrefix} />
          </div>
          <div className="flex items-center gap-3">
            <CreateFolderDialog currentPrefix={prefix} onSuccess={fetchFiles} />
            <UploadDialog currentPrefix={prefix} onUploadSuccess={fetchFiles} />
            <ThemeToggle />
          </div>
        </div>
        <div className="p-4 border-b">
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="images">Images</SelectItem>
                <SelectItem value="documents">Documents</SelectItem>
                <SelectItem value="videos">Videos</SelectItem>
                <SelectItem value="audio">Audio</SelectItem>
                <SelectItem value="archives">Archives</SelectItem>
                <SelectItem value="code">Code</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        {loading && <FileListSkeleton />}
        {error && (
          <Alert variant="destructive" className="m-4">
            <Terminal className="h-4 w-4" />
            <AlertTitle>Error Fetching Files</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        {filteredData && (
          <FileList
            items={filteredData}
            onFolderClick={handleFolderClick}
            onNavigateUp={handleNavigateUp}
            currentPrefix={prefix}
            onDeleteSuccess={fetchFiles}
          />
        )}
      </div>
    </main>
  );
}
