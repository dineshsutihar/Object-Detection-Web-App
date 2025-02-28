"use client";
import React, { useState, useCallback, useEffect, useRef } from "react";
import { useDropzone } from "react-dropzone";
import Webcam from "react-webcam";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { toast } from "sonner";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import Cookies from "js-cookie";
import { Image as NewImg } from "lucide-react";
import { useRouter } from "next/navigation";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "./ui/table";

interface Detection {
  bbox_normalized: [number, number, number, number];
  class_id: number;
  class_name: string;
  confidence: number;
}
interface DetectApiResponse {
  success: boolean;
  filename?: string;
  detections?: Detection[];
  error?: string;
  detail?: any;
}

const FRAME_PROCESS_INTERVAL = 750;

export function DetectTab() {
  const [detectFile, setDetectFile] = useState<File | null>(null);
  const [detectPreviewUrl, setDetectPreviewUrl] = useState<string | null>(null);
  const [detectionResults, setDetectionResults] = useState<Detection[] | null>(
    null
  );
  const [detectLoading, setDetectLoading] = useState<boolean>(false);
  const [isLiveMode, setIsLiveMode] = useState<boolean>(false);

  const webcamRef = useRef<Webcam>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const router = useRouter();

  useEffect(() => {
    return () => {
      if (detectPreviewUrl) URL.revokeObjectURL(detectPreviewUrl);
    };
  }, [detectPreviewUrl]);

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  useEffect(() => {
    if (!isLiveMode && intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
      setDetectLoading(false);
      setDetectionResults(null);
    }

    setDetectFile(null);
    setDetectPreviewUrl(null);
    setDetectionResults(null);
    clearCanvas();
  }, [isLiveMode]);

  const drawBoxes = useCallback(
    (
      results: Detection[],
      sourceElement: HTMLImageElement | HTMLVideoElement
    ) => {
      const canvas = canvasRef.current;
      const ctx = canvas?.getContext("2d");
      if (!canvas || !ctx) return;

      const sourceWidth =
        sourceElement instanceof HTMLImageElement
          ? sourceElement.naturalWidth
          : sourceElement.videoWidth;
      const sourceHeight =
        sourceElement instanceof HTMLImageElement
          ? sourceElement.naturalHeight
          : sourceElement.videoHeight;

      canvas.width = sourceWidth;
      canvas.height = sourceHeight;

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      if (sourceElement instanceof HTMLImageElement) {
        ctx.drawImage(sourceElement, 0, 0, canvas.width, canvas.height);
      }

      results.forEach((det) => {
        const [xmin, ymin, xmax, ymax] = det.bbox_normalized;
        const x = xmin * canvas.width;
        const y = ymin * canvas.height;
        const width = (xmax - xmin) * canvas.width;
        const height = (ymax - ymin) * canvas.height;

        ctx.strokeStyle = "rgba(255, 0, 0, 0.8)";
        ctx.lineWidth = 2;
        ctx.strokeRect(x, y, width, height);

        ctx.fillStyle = "rgba(255, 0, 0, 0.8)";
        const text = `${det.class_name} (${(det.confidence * 100).toFixed(
          0
        )}%)`;
        ctx.font = "18px Arial";
        const textWidth = ctx.measureText(text).width;
        ctx.fillRect(x, y - 18 > 0 ? y - 18 : y, textWidth + 8, 18);

        ctx.fillStyle = "white";
        ctx.fillText(text, x + 4, y - 4 > 0 ? y - 4 : y + 14);
      });
    },
    []
  );

  useEffect(() => {
    if (
      !isLiveMode &&
      detectionResults &&
      detectPreviewUrl &&
      canvasRef.current
    ) {
      const img = new Image();
      img.onload = () => drawBoxes(detectionResults, img);
      img.onerror = () =>
        console.error("Failed to load image preview for drawing.");
      img.src = detectPreviewUrl;
    } else if (!isLiveMode) {
      clearCanvas();
    }
  }, [detectionResults, detectPreviewUrl, isLiveMode, drawBoxes]);

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (canvas && ctx) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
  };
  const onDropDetect = useCallback(
    (acceptedFiles: File[]) => {
      if (isLiveMode) return;
      if (acceptedFiles && acceptedFiles.length > 0) {
        const file = acceptedFiles[0];
        setDetectFile(file);
        setDetectionResults(null);
        if (detectPreviewUrl) URL.revokeObjectURL(detectPreviewUrl);
        setDetectPreviewUrl(URL.createObjectURL(file));
        toast.info(`Selected file: ${file.name}`);
      } else {
        toast.error("Invalid file type.");
      }
    },
    [detectPreviewUrl, isLiveMode]
  );

  const getAuthToken = () => {
    const token = Cookies.get("token") || null;
    if (token === null) {
      router.push("/auth/login");
      return;
    }
    return token;
  };

  const handleDetectSubmit = async () => {
    if (isLiveMode) return;
    if (!detectFile) {
      toast.error("Please select an image file first.");
      return;
    }

    setDetectLoading(true);
    setDetectionResults(null);
    const formData = new FormData();
    formData.append("image", detectFile);
    const token = getAuthToken();

    try {
      const response = await fetch("/api/detect", {
        method: "POST",
        body: formData,
        headers: {
          ...(token && { Authorization: `Bearer ${token}` }),
        },
      });
      const result: DetectApiResponse = await response.json();
      if (response.ok && result.success) {
        setDetectionResults(result.detections || []);
        toast.success(
          `Detection complete. Found ${result.detections?.length ?? 0} objects.`
        );
      } else {
        console.error("Detection API Error:", result);
        toast.error(`Detection failed: ${result.error || response.statusText}`);
        setDetectionResults(null);
      }
    } catch (error: any) {
      console.error("Fetch error during detection:", error);
      toast.error(`Network or server error: ${error.message}`);
      setDetectionResults(null);
    } finally {
      setDetectLoading(false);
    }
  };

  const captureAndProcessFrame = useCallback(async () => {
    if (!webcamRef.current || !isLiveMode) return;
    const imageSrc = webcamRef.current.getScreenshot();
    if (!imageSrc) {
      return;
    }

    if (detectLoading) return;

    setDetectLoading(true);

    const formData = new FormData();
    const base64Data = imageSrc.split(",")[1];
    formData.append("imageData", base64Data);

    try {
      const response = await fetch("/api/detect-frame", {
        method: "POST",
        body: formData,
      });
      const result: DetectApiResponse = await response.json();

      if (response.ok && result.success) {
        setDetectionResults(result.detections || []);
        if (webcamRef.current?.video) {
          drawBoxes(result.detections || [], webcamRef.current.video);
        }
      } else {
        toast.error(
          `Frame detection failed: ${result.error || response.statusText}`
        );
        console.warn(
          `Frame detection failed: ${result.error || response.statusText}`
        );
      }
    } catch (error: any) {
      console.error("Fetch error during frame detection:", error);
      toast.error(`Network or server error: ${error.message}`);
    } finally {
      setDetectLoading(false);
    }
  }, [isLiveMode, drawBoxes, detectLoading]);

  useEffect(() => {
    if (isLiveMode) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      intervalRef.current = setInterval(
        captureAndProcessFrame,
        FRAME_PROCESS_INTERVAL
      );
      console.log("Live detection started.");
    } else if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
      console.log("Live detection stopped.");
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
        console.log(
          "Live detection interval cleared on unmount/effect cleanup."
        );
      }
    };
  }, [isLiveMode, captureAndProcessFrame]);

  const {
    getRootProps: getDetectRootProps,
    getInputProps: getDetectInputProps,
    isDragActive: isDetectDragActive,
  } = useDropzone({
    onDrop: onDropDetect,
    accept: { "image/*": [".jpeg", ".png", ".jpg", ".webp", ".bmp"] },
    multiple: false,
    disabled: isLiveMode,
  });

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle>Detect Objects</CardTitle>
          <div className="flex items-center space-x-2">
            <Label htmlFor="live-mode-switch">Live Camera</Label>
            <Switch
              id="live-mode-switch"
              checked={isLiveMode}
              onCheckedChange={setIsLiveMode}
            />
          </div>
        </div>
        <CardDescription>
          {isLiveMode
            ? "Detect objects using your webcam in real-time."
            : "Upload a single image to detect objects using YOLO."}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {isLiveMode ? (
          <div className="relative w-full aspect-video border rounded-md overflow-hidden bg-muted">
            <Webcam
              audio={false}
              ref={webcamRef}
              screenshotFormat="image/jpeg"
              className="absolute top-0 left-0 w-full h-full object-contain"
              videoConstraints={{ facingMode: "environment" }}
            />

            <canvas
              ref={canvasRef}
              className="absolute top-0 left-0 w-full h-full pointer-events-none" // Overlay exactly
            />
            {detectLoading && (
              <div className="absolute bottom-2 right-2 bg-primary/80 text-primary-foreground text-xs px-2 py-1 rounded animate-pulse">
                Processing...
              </div>
            )}
          </div>
        ) : (
          <>
            <div
              {...getDetectRootProps()}
              className={`p-6 border-2 border-dashed rounded-md text-center cursor-pointer hover:border-primary ${
                isDetectDragActive
                  ? "border-primary bg-primary/10"
                  : "border-muted"
              } ${isLiveMode ? "opacity-50 cursor-not-allowed" : ""}`}
            >
              <input {...getDetectInputProps()} disabled={isLiveMode} />
              <p className="flex justify-center align-middle gap-4">
                <NewImg />
                Drag and drop image, or click to select
              </p>
            </div>

            {/* Layout is splitted into 2 parts here */}
            <section className="lg:flex lg:gap-5">
              <section className="lg:shrink-0 lg:grow-0 lg:w-[50%]">
                {detectFile && (
                  <div className="mt-4 text-sm">
                    Selected:{" "}
                    <span className="font-medium">{detectFile.name}</span>
                  </div>
                )}
                {detectPreviewUrl && (
                  <div className="mt-4 border rounded-md overflow-hidden relative">
                    <img
                      src={detectPreviewUrl}
                      alt="Preview"
                      className="max-w-full max-h-screen block"
                    />

                    <canvas
                      ref={canvasRef}
                      className="absolute top-0 left-0 max-w-full max-h-screen pointer-events-none"
                    />
                  </div>
                )}
              </section>

              <section className="lg:shrink-0 lg:grow-0 lg:w-[50%]">
                {detectionResults && detectionResults.length > 0 && (
                  <div className="mt-4 pt-6 border-t">
                    <h4 className="font-semibold mb-2">Detection Results:</h4>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="text-left">S.N.</TableHead>
                          <TableHead className="text-left">Class ID</TableHead>
                          <TableHead className="text-left">
                            Object Class Name
                          </TableHead>
                          <TableHead>Accuracy(Percentage)</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {detectionResults.map((det, index) => (
                          <TableRow key={index}>
                            <TableCell>{index + 1}</TableCell>
                            <TableCell>{det.class_id}</TableCell>
                            <TableCell>{det.class_name}</TableCell>
                            <TableCell>
                              {(det.confidence * 100).toFixed(2)}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}

                {detectionResults !== null && detectionResults.length === 0 && (
                  <div className="mt-4">
                    <p className="text-sm text-muted-foreground">
                      No objects detected.
                    </p>
                  </div>
                )}
              </section>
            </section>
          </>
        )}
      </CardContent>
      {!isLiveMode && (
        <CardFooter>
          <Button
            onClick={handleDetectSubmit}
            disabled={!detectFile || detectLoading}
            className="w-full"
          >
            {detectLoading ? "Detecting..." : "Detect Objects"}
          </Button>
        </CardFooter>
      )}
    </Card>
  );
}
