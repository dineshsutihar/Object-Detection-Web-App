"use client";
import Head from "next/head";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Toaster } from "@/components/ui/sonner"; // Sonner toaster

import { DetectTab } from "@/components/detect-tab";
import { TrainTab } from "@/components/train-tab";
import { HistoryTab } from "@/components/history-tab";

export default function DetectPageContainer() {
  return (
    <>
      <Head>
        <title>YOLO Object Detection & Training</title>
        <meta
          name="description"
          content="Detect objects, upload training data, and view history."
        />
      </Head>
      <Toaster richColors position="top-right" />{" "}
      {/* Position Sonner Toaster */}
      <div className="container mx-auto p-4 md:p-8">
        <h1 className="text-3xl md:text-4xl font-bold text-center mb-8">
          YOLO Application
        </h1>

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
