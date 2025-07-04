'use client';

import { useState, useEffect, useCallback, useMemo, Suspense } from 'react';
import { FileList, type FileListData, type FileItem } from '@/components/FileList';
import { UploadDialog } from '@/components/UploadDialog';
import { CreateFolderDialog } from '@/components/CreateFolderDialog';
import { BreadcrumbNav } from '@/components/BreadcrumbNav';
import { ThemeToggle } from '@/components/ThemeToggle';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { Logo } from '@/components/Logo';
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
import { Terminal, Search, BarChart2 } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

import { PropertiesPanel } from '@/components/PropertiesPanel';

const FileListSkeleton = () => (
  <div className="p-4 space-y-4">
    <div className="grid grid-cols-[60px_40px_1fr_150px_120px_50px] items-center gap-4">
      <Skeleton className="h-5 w-5" />
      <Skeleton className="h-5 w-5" />
      <Skeleton className="h-4 w-[250px]" />
      <Skeleton className="h-4 w-[120px]" />
      <Skeleton className="h-4 w-[80px]" />
      <Skeleton className="h-4 w-5" />
    </div>
    <div className="grid grid-cols-[60px_40px_1fr_150px_120px_50px] items-center gap-4">
      <Skeleton className="h-5 w-5" />
      <Skeleton className="h-5 w-5" />
      <Skeleton className="h-4 w-[200px]" />
      <Skeleton className="h-4 w-[120px]" />
      <Skeleton className="h-4 w-[80px]" />
      <Skeleton className="h-4 w-5" />
    </div>
    <div className="grid grid-cols-[60px_40px_1fr_150px_120px_50px] items-center gap-4">
      <Skeleton className="h-5 w-5" />
      <Skeleton className="h-5 w-5" />
      <Skeleton className="h-4 w-[300px]" />
      <Skeleton className="h-4 w-[120px]" />
      <Skeleton className="h-4 w-[80px]" />
      <Skeleton className="h-4 w-5" />
    </div>
  </div>
);

const PageSkeleton = () => (
  <main className="container mx-auto p-4 h-screen flex flex-col">
    <div className="flex flex-1 overflow-hidden">
      <div className="border rounded-lg flex-1 flex flex-col">
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center gap-3">
            <Skeleton className="h-12 w-12 rounded-lg" />
            <div>
              <Skeleton className="h-6 w-32 mb-2" />
              <Skeleton className="h-4 w-48" />
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Skeleton className="h-10 w-10" />
            <Skeleton className="h-10 w-36" />
            <Skeleton className="h-10 w-36" />
            <Skeleton className="h-10 w-10" />
          </div>
        </div>
        <div className="p-4 border-b">
          <div className="flex items-center gap-4">
            <Skeleton className="h-10 flex-1" />
            <Skeleton className="h-10 w-[180px]" />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto">
          <FileListSkeleton />
        </div>
      </div>
    </div>
  </main>
);

function BucketBrowser() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [data, setData] = useState<FileListData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [prefix, setPrefix] = useState(() => searchParams.get('prefix') || '');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [selectedFile, setSelectedFile] = useState<FileItem | null>(null);

  // This effect syncs the prefix state to the URL query parameters.
  useEffect(() => {
    const params = new URLSearchParams(searchParams.toString());
    if (prefix) {
      params.set('prefix', prefix);
    } else {
      params.delete('prefix');
    }
    // Use router.replace to update the URL without adding to browser history
    router.replace(`${pathname}?${params.toString()}`);
  }, [prefix, pathname, router, searchParams]);

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
    setSelectedFile(null);
  };

  const handleNavigateUp = () => {
    const lastSlashIndex = prefix.slice(0, -1).lastIndexOf('/');
    const newPrefix = lastSlashIndex === -1 ? '' : prefix.slice(0, lastSlashIndex + 1);
    setPrefix(newPrefix);
    setSelectedFile(null);
  };

  return (
    <div className="container mx-auto p-4 h-screen flex flex-col">
      <div className="flex flex-1 overflow-hidden">
        <div className="border rounded-lg flex-1 flex flex-col">
          <div className="flex items-center justify-between p-4 border-b">
            <div className="flex items-center gap-3">
              <Logo />
              <div>
                <h1 className="text-xl font-semibold mb-1">BucketBoard</h1>
                <BreadcrumbNav prefix={prefix} onNavigate={setPrefix} />
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Button asChild variant="outline" size="icon">
                <Link href="/dashboard"><BarChart2 className="h-4 w-4" /></Link>
              </Button>
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
          <div className="flex-1 overflow-y-auto">
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
                onActionSuccess={fetchFiles}
                onFileSelect={setSelectedFile}
                selectedFileKey={selectedFile?.key || null}
              />
            )}
          </div>
        </div>
        {selectedFile && 
          <PropertiesPanel 
            file={selectedFile} 
            onClose={() => setSelectedFile(null)} 
            onActionSuccess={fetchFiles} 
          />
        }
      </div>
    </div>
  );
}

export default function HomePage() {
  return (
    // Wrapping the component that uses searchParams in a Suspense boundary
    <Suspense fallback={<PageSkeleton />}>
      <BucketBrowser />
    </Suspense>
  );
}
