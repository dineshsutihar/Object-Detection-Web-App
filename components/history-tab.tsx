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

interface LogEntry {
  _id: string;
  timestamp: string; // ISO String date
  type: "detection" | "training_upload";
  status: string;
  source_filename?: string;
  source_type?: "upload" | "live_frame";
  detections?: Array<{ class_name: string; confidence: number }>;
  label?: string;
  uploaded_filenames?: string[];
  saved_relative_paths?: string[];
  file_count?: number;
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

  const fetchHistory = useCallback(async (page: number) => {
    setIsLoading(true);
    setError(null);
    const skip = page * ITEMS_PER_PAGE;

    try {
      const response = await fetch(
        `/api/history?limit=${ITEMS_PER_PAGE}&skip=${skip}`
      );
      const result: HistoryApiResponse = await response.json();

      if (response.ok && result.success && result.logs) {
        setLogs((prevLogs) => {
          const newLogs = result.logs || [];
          return page === 0 ? newLogs : [...prevLogs, ...newLogs];
        });
        setHasMore(result.logs.length === ITEMS_PER_PAGE);
        if (page === 0 && result.logs.length === 0) {
          sonnerToast.info("No history records found.");
        }
      } else {
        console.error("History Fetch Error:", result);
        const errorMsg = `Failed to fetch history: ${
          result.error || response.statusText
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
    if (log.type === "detection") {
      const detected =
        log.detections
          ?.map((d) => `${d.class_name} (${(d.confidence * 100).toFixed(0)}%)`)
          .join(", ") || "None";
      return `Source: ${log.source_type} ${
        log.source_filename ? `(${log.source_filename})` : ""
      }. Detected: ${detected}`;
    } else if (log.type === "training_upload") {
      return `Label: ${log.label}. Files: ${log.file_count ?? 0}. Status: ${
        log.status
      }.`;
    }
    return "Unknown log type";
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
          Recent detection and training upload events.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {error && <p className="text-destructive text-center mb-4">{error}</p>}
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[150px]">Timestamp</TableHead>
              <TableHead className="w-[100px]">Type</TableHead>
              <TableHead>Details</TableHead>
              <TableHead className="text-right w-[80px]">Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading && logs.length === 0 && (
              <TableRow>
                <TableCell colSpan={4} className="h-24 text-center">
                  Loading history...
                </TableCell>
              </TableRow>
            )}
            {!isLoading && logs.length === 0 && !error && (
              <TableRow>
                <TableCell colSpan={4} className="h-24 text-center">
                  No history records found.
                </TableCell>
              </TableRow>
            )}
            {logs.map((log) => (
              <TableRow key={log._id}>
                <TableCell className="font-medium text-xs">
                  {format(new Date(log.timestamp), "yyyy-MM-dd HH:mm:ss")}{" "}
                </TableCell>
                <TableCell className="capitalize text-xs">
                  {log.type.replace("_", " ")}
                </TableCell>
                <TableCell className="text-xs">
                  {renderLogDetails(log)}
                </TableCell>
                <TableCell
                  className={`text-right text-xs capitalize font-medium ${
                    log.status === "success"
                      ? "text-green-600"
                      : log.status === "failure"
                      ? "text-destructive"
                      : "text-orange-500"
                  }`}
                >
                  {log.status}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        {hasMore && (
          <div className="text-center mt-4">
            <Button variant="outline" onClick={loadMore} disabled={isLoading}>
              {isLoading ? "Loading..." : "Load More"}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
