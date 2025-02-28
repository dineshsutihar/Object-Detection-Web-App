// src/components/history-tab.tsx
"use client";
import React, { useState, useEffect, useCallback } from "react";
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
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { toast as sonnerToast } from "sonner";
import { format } from "date-fns";
import Image from "next/image";
import { useRouter } from "next/navigation";
import Cookies from "js-cookie";

interface LogEntry {
  _id: string;
  timestamp: string;
  type: "detection" | "training_upload";
  status: string;
  detectionSource?: "upload" | "live_frame";
  originalFilename?: string;
  detectionResults?: Array<{ class_name: string; confidence: number }>;
  trainingLabel?: string;
  trainingFileCount?: number;
  trainingOriginalFilenames?: string[];
  imageData?: string | string[];
  errorMessage?: string;
}

interface HistoryApiResponse {
  success: boolean;
  logs?: LogEntry[];
  error?: string;
  detail?: any;
}

const ITEMS_PER_PAGE = 10;

export function HistoryTab() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState<number>(0);
  const [hasMore, setHasMore] = useState<boolean>(true);
  const Router = useRouter();

  const fetchHistory = useCallback(async (page: number) => {
    setIsLoading(true);
    setError(null);
    const skip = page * ITEMS_PER_PAGE;
    const token = Cookies.get("token");
    if (!token) {
      setError("Unauthorized. Please log in.");
      sonnerToast.error("Unauthorized. Please log in.");
      Router.push("/api/login");
      return;
    }

    try {
      const response = await fetch(
        `/api/history?limit=${ITEMS_PER_PAGE}&skip=${skip}`,
        {
          headers: {
            ...(token && { Authorization: `Bearer ${token}` }),
          },
        }
      );
      if (response.status === 401) {
        throw new Error("Unauthorized. Please log in.");
      }

      const result: HistoryApiResponse = await response.json();

      if (response.ok && result.success && result.logs) {
        setLogs((prevLogs) => {
          const newLogs = result.logs || [];
          const existingIds = new Set(prevLogs.map((l) => l._id));
          const uniqueNewLogs = newLogs.filter((l) => !existingIds.has(l._id));
          return page === 0 ? newLogs : [...prevLogs, ...uniqueNewLogs];
        });
        setHasMore(result.logs.length === ITEMS_PER_PAGE);
        if (page === 0 && result.logs.length === 0) {
          sonnerToast.info("No history records found.");
        }
      } else {
        console.error("History Fetch Error:", result);
        const errorMsg = `Failed to fetch history: ${
          result.error || response.statusText || "Unknown error"
        }`;
        setError(errorMsg);
        sonnerToast.error(errorMsg);
        setHasMore(false);
      }
    } catch (fetchError: any) {
      console.error("Fetch error getting history:", fetchError);
      const errorMsg = `Network error fetching history: ${fetchError.message}`;
      setError(errorMsg);
      sonnerToast.error(errorMsg);
      setHasMore(false);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchHistory(0);
  }, [fetchHistory]);

  const loadMore = () => {
    if (!isLoading && hasMore) {
      const nextPage = currentPage + 1;
      setCurrentPage(nextPage);
      fetchHistory(nextPage);
    }
  };

  const refreshHistory = () => {
    setCurrentPage(0);
    setLogs([]);
    setHasMore(true);
    fetchHistory(0);
    sonnerToast.info("Refreshing history...");
  };

  const renderLogDetails = (log: LogEntry) => {
    try {
      if (log.type === "detection") {
        const detectedItems = log.detectionResults?.length
          ? log.detectionResults
              .map(
                (d) => `${d.class_name} (${(d.confidence * 100).toFixed(0)}%)`
              )
              .join(", ")
          : "None";
        const sourceInfo = log.detectionSource
          ? `${log.detectionSource === "upload" ? "Upload" : "Live Frame"}${
              log.originalFilename ? ` (${log.originalFilename})` : ""
            }`
          : "Unknown Source";
        return `${sourceInfo}. Detected: ${detectedItems}`;
      } else if (log.type === "training_upload") {
        return `Label: ${log.trainingLabel || "N/A"}. Files: ${
          log.trainingFileCount ?? "N/A"
        }.`;
      }
      return "Unknown log type";
    } catch (e) {
      console.error("Error rendering log details:", e, log);
      return "Error rendering details";
    }
  };

  const renderLogImage = (log: LogEntry) => {
    let imageDataUri: string | undefined;

    if (typeof log.imageData === "string") {
      imageDataUri = log.imageData;
    } else if (
      Array.isArray(log.imageData) &&
      log.imageData.length > 0 &&
      typeof log.imageData[0] === "string"
    ) {
      imageDataUri = log.imageData[0];
    }

    if (imageDataUri && imageDataUri.startsWith("data:image")) {
      return (
        <img
          src={imageDataUri}
          alt={
            log.type === "detection"
              ? log.originalFilename || "Detection"
              : `Training: ${log.trainingLabel || "N/A"}`
          }
          className="h-12 w-auto object-contain rounded"
          loading="lazy"
        />
      );
    }
    return (
      <div className="h-12 w-16 bg-muted rounded flex items-center justify-center text-xs text-muted-foreground">
        No Img
      </div>
    );
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle>History Log</CardTitle>
          <Button
            variant="outline"
            size="sm"
            onClick={refreshHistory}
            disabled={isLoading}
          >
            {isLoading ? "Refreshing..." : "Refresh"}
          </Button>
        </div>
        <CardDescription>
          Recent detection and training upload events for your account.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {error && <p className="text-destructive text-center mb-4">{error}</p>}
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[80px]">Image</TableHead>
              <TableHead className="w-[150px]">Timestamp</TableHead>
              <TableHead className="w-[100px]">Type</TableHead>
              <TableHead>Details</TableHead>
              <TableHead className="text-right w-[100px]">Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading && logs.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center">
                  Loading history...
                </TableCell>
              </TableRow>
            )}
            {!isLoading && logs.length === 0 && !error && (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center">
                  No history records found. Upload images or use live detection!
                </TableCell>
              </TableRow>
            )}
            {logs.map((log) => (
              <TableRow key={log._id}>
                <TableCell>{renderLogImage(log)}</TableCell>
                <TableCell className="font-medium text-xs whitespace-nowrap">
                  {format(new Date(log.timestamp), "yyyy-MM-dd HH:mm:ss")}
                </TableCell>
                <TableCell className="capitalize text-xs">
                  {log.type === "training_upload" ? "Train Upload" : log.type}
                </TableCell>
                <TableCell className="text-xs">
                  {renderLogDetails(log)}
                </TableCell>
                <TableCell
                  className={`text-right text-xs capitalize font-semibold ${
                    log.status === "success"
                      ? "text-green-600"
                      : log.status === "pending"
                      ? "text-yellow-600"
                      : log.status === "processing"
                      ? "text-blue-600"
                      : log.status === "failure"
                      ? "text-destructive"
                      : "text-orange-500"
                  }`}
                >
                  {log.status.replace("_", " ")}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        {hasMore && (
          <div className="text-center mt-6">
            <Button variant="outline" onClick={loadMore} disabled={isLoading}>
              {isLoading ? "Loading..." : "Load More"}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
