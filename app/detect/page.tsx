"use client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { DetectTab } from "@/components/detect-tab";
import { TrainTab } from "@/components/train-tab";
import { HistoryTab } from "@/components/history-tab";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function DetectPageContainer() {
  const router = useRouter();
  useEffect(() => {
    const checkAuth = async () => {
      const res = await fetch("/api/auth/check");
      const data = await res.json();
      console.log("Auth check response:", data);
      if (!data.authenticated) {
        router.push("/auth/login");
      }
    };

    checkAuth();
  }, []);
  return (
    <>
      <div className="container mx-auto p-4 md:p-8">
        <Tabs defaultValue="detect" className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-6">
            <TabsTrigger value="detect">Detect</TabsTrigger>
            <TabsTrigger value="train">Train Model (Data)</TabsTrigger>
            <TabsTrigger value="history">History</TabsTrigger>
          </TabsList>

          <TabsContent value="detect">
            <DetectTab />
          </TabsContent>

          <TabsContent value="train">
            <TrainTab />
          </TabsContent>

          <TabsContent value="history">
            <HistoryTab />
          </TabsContent>
        </Tabs>
      </div>
    </>
  );
}
