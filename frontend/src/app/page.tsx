'use client';

import { useState, useEffect } from 'react';
import { FileList, type FileListData } from '@/components/file-list';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Terminal } from 'lucide-react';

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

  useEffect(() => {
    const fetchFiles = async () => {
      setLoading(true);
      setError(null);
      try {
        // Use the environment variable for the API URL
        const apiUrl = `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/files`;
        const res = await fetch(apiUrl);

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
    };

    fetchFiles();
  }, []);

  return (
    <main className="container mx-auto p-4">
      <div className="border rounded-lg">
        <div className="p-4 border-b">
          <h1 className="text-xl font-semibold">BucketBoard</h1>
          <p className="text-sm text-muted-foreground">
            Browsing: {process.env.NEXT_PUBLIC_AWS_BUCKET_NAME || 'your-bucket'}
          </p>
        </div>
        {loading && <FileListSkeleton />}
        {error && (
          <Alert variant="destructive" className="m-4">
            <Terminal className="h-4 w-4" />
            <AlertTitle>Error Fetching Files</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        {data && <FileList items={data} />}
      </div>
    </main>
  );
}

