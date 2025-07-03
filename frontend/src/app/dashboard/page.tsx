import { AnalyticsDashboard } from "@/components/AnalyticsDashboard";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

export default function DashboardPage() {
  return (
    <main className="container mx-auto p-4 sm:p-6 lg:p-8">
      <div className="flex items-center mb-6">
        <Button asChild variant="outline" size="icon" className="mr-4">
          <Link href="/"><ArrowLeft className="h-4 w-4" /></Link>
        </Button>
        <h1 className="text-2xl font-bold">Storage Analytics</h1>
      </div>
      <AnalyticsDashboard />
    </main>
  );
}
