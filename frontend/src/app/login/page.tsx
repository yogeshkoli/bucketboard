'use client';

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Github, Chrome } from "lucide-react";
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const router = useRouter();

  return (
    <main className="flex items-center justify-center h-screen bg-gray-100 dark:bg-gray-900">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">Login to BucketBoard</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button className="w-full" onClick={() => router.push(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/auth/google`)}>
            <Chrome className="mr-2 h-5 w-5" />
            Login with Google
          </Button>
          <Button className="w-full" onClick={() => router.push(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/auth/github`)}>
            <Github className="mr-2 h-5 w-5" />
            Login with GitHub
          </Button>
        </CardContent>
      </Card>
    </main>
  );
}
