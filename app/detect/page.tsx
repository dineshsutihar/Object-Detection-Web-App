"use client"; // This directive is necessary for using hooks

import React, { useState, useCallback, useEffect, useRef } from "react";
import Head from "next/head";
import { useDropzone } from "react-dropzone";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Toaster } from "@/components/ui/sonner";
import { toast as sonnerToast } from "sonner";

// Interfaces matching the structure of the *Next.js* API route responses
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

interface TrainApiResponse {
  success: boolean;
  message?: string;
  saved_count?: number;
  saved_filenames?: string[];
  errors?: Array<{ filename: string; error: string }>;
  error?: string;
  detail?: any;
}

export default function DetectPage() {
  const [detectFile, setDetectFile] = useState<File | null>(null);
  const [detectPreviewUrl, setDetectPreviewUrl] = useState<string | null>(null);
  const [detectionResults, setDetectionResults] = useState<Detection[] | null>(
    null
  );
  const [detectLoading, setDetectLoading] = useState<boolean>(false);
  const canvasRef = useRef<HTMLCanvasElement>(null); // For drawing boxes

  const [trainFiles, setTrainFiles] = useState<File[]>([]);
  const [trainLoading, setTrainLoading] = useState<boolean>(false);

  const { toast } = useToast(); // Initialize shadcn toast

  // --- Cleanup Preview URL ---
  useEffect(() => {
    return () => {
      if (detectPreviewUrl) {
        URL.revokeObjectURL(detectPreviewUrl);
      }
    };
  }, [detectPreviewUrl]);

  // --- Draw Bounding Boxes ---
  useEffect(() => {
    if (detectionResults && detectPreviewUrl && canvasRef.current) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext("2d");
      const img = new Image();

      img.onload = () => {
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0);

        // Draw boxes
        detectionResults.forEach((det) => {
          const [xmin, ymin, xmax, ymax] = det.bbox_normalized;
          const x = xmin * canvas.width;
          const y = ymin * canvas.height;
          const width = (xmax - xmin) * canvas.width;
          const height = (ymax - ymin) * canvas.height;

          // Draw rectangle
          ctx.strokeStyle = "red";
          ctx.lineWidth = 2;
          ctx.strokeRect(x, y, width, height);

          // Draw label background
          ctx.fillStyle = "red";
          const text = `${det.class_name} (${det.confidence.toFixed(2)})`;
          const textWidth = ctx.measureText(text).width;
          ctx.fillRect(x, y - 18, textWidth + 8, 18);

          // Draw label text
          ctx.fillStyle = "white";
          ctx.font = "14px Arial";
          ctx.fillText(text, x + 4, y - 4);
        });
      };
      img.onerror = () => {
        console.error("Failed to load image preview for drawing boxes.");
        // Optionally clear canvas if image fails to load
        if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
      };
      img.src = detectPreviewUrl;
    } else if (canvasRef.current) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext("2d");
      if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
  }, [detectionResults, detectPreviewUrl]);

  // --- Handlers for Detection ---
  const onDropDetect = useCallback(
    (acceptedFiles: File[]) => {
      if (acceptedFiles && acceptedFiles.length > 0) {
        const file = acceptedFiles[0];
        setDetectFile(file);
        setDetectionResults(null);
        if (detectPreviewUrl) {
          URL.revokeObjectURL(detectPreviewUrl);
        }
        setDetectPreviewUrl(URL.createObjectURL(file));
        sonnerToast.info(`Selected file: ${file.name}`);
      } else {
        sonnerToast.error("Invalid file type or selection cancelled.");
      }
    },
    [detectPreviewUrl]
  );

  const handleDetectSubmit = async () => {
    if (!detectFile) {
      sonnerToast.error("Please select an image file first.");
      return;
    }

    setDetectLoading(true);
    setDetectionResults(null);
    const formData = new FormData();
    formData.append("image", detectFile);

    try {
      const response = await fetch("/api/detect", {
        method: "POST",
        body: formData,
      });

      const result: DetectApiResponse = await response.json();

      if (response.ok && result.success) {
        setDetectionResults(result.detections || []);
        sonnerToast.success(
          `Detection complete for ${result.filename}. Found ${
            result.detections?.length ?? 0
          } objects.`
        );
      } else {
        console.error("Detection API Error:", result);
        sonnerToast.error(
          `Detection failed: ${result.error || response.statusText}`,
          {
            description: result.detail
              ? `Details: ${JSON.stringify(result.detail)}`
              : undefined,
          }
        );
        setDetectionResults(null);
      }
    } catch (error: any) {
      console.error("Fetch error during detection:", error);
      sonnerToast.error(`Network or server error: ${error.message}`);
      setDetectionResults(null); // Clear results on fetch error
    } finally {
      setDetectLoading(false);
    }
  };

  // --- Handlers for Training ---
  const onDropTrain = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles && acceptedFiles.length > 0) {
      setTrainFiles((prevFiles) => [...prevFiles, ...acceptedFiles]);
      sonnerToast.info(`Added ${acceptedFiles.length} file(s) for training.`);
    } else {
      sonnerToast.error("No valid files selected or selection cancelled.");
    }
  }, []);

  const handleTrainSubmit = async () => {
    if (trainFiles.length === 0) {
      sonnerToast.error("Please select one or more image files for training.");
      return;
    }

    setTrainLoading(true);
    const formData = new FormData();
    trainFiles.forEach((file) => {
      formData.append("images", file);
    });

    try {
      const response = await fetch("/api/train", {
        method: "POST",
        body: formData,
      });

      const result: TrainApiResponse = await response.json();

      if (response.ok && result.success) {
        sonnerToast.success(result.message || "Files uploaded successfully.", {
          description: `${result.saved_count ?? 0} files saved. ${
            result.errors?.length ?? 0 > 0
              ? `${result.errors?.length} errors occurred.`
              : ""
          }`,
        });
        setTrainFiles([]);
      } else {
        console.error("Training Upload API Error:", result);
        sonnerToast.error(
          `Upload failed: ${result.error || response.statusText}`,
          {
            description: result.detail
              ? `Details: ${JSON.stringify(result.detail)}`
              : undefined,
          }
        );
      }

      if (result.errors && result.errors.length > 0) {
        console.warn("Partial upload errors:", result.errors);
        result.errors.forEach((err) =>
          sonnerToast.warning(`Error uploading ${err.filename}: ${err.error}`)
        );
      }
    } catch (error: any) {
      console.error("Fetch error during training upload:", error);
      sonnerToast.error(`Network or server error: ${error.message}`);
    } finally {
      setTrainLoading(false);
    }
  };

  const removeTrainFile = (indexToRemove: number) => {
    setTrainFiles((prevFiles) =>
      prevFiles.filter((_, index) => index !== indexToRemove)
    );
  };

  // --- Dropzone Setup ---
  const {
    getRootProps: getDetectRootProps,
    getInputProps: getDetectInputProps,
    isDragActive: isDetectDragActive,
  } = useDropzone({
    onDrop: onDropDetect,
    accept: { "image/*": [".jpeg", ".png", ".jpg", ".webp", ".bmp"] },
    multiple: false,
  });

  const {
    getRootProps: getTrainRootProps,
    getInputProps: getTrainInputProps,
    isDragActive: isTrainDragActive,
  } = useDropzone({
    onDrop: onDropTrain,
    accept: { "image/*": [".jpeg", ".png", ".jpg", ".webp", ".bmp"] },
    multiple: true,
  });

  return (
    <>
      <Head>
        <title>YOLO Object Detection & Training Upload</title>
        <meta
          name="description"
          content="Upload images for YOLO detection or training"
        />
      </Head>
      {/* Toaster for notifications */}
      <Toaster richColors position="top-right" />
      <div className="container mx-auto p-4 md:p-8">
        <h1 className="text-3xl md:text-4xl font-bold text-center mb-8">
          YOLO Object Detector
        </h1>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* --- Detection Section --- */}
          <Card>
            <CardHeader>
              <CardTitle>1. Detect Objects</CardTitle>
              <CardDescription>
                Upload a single image to detect objects using YOLO.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div
                {...getDetectRootProps()}
                className={`p-6 border-2 border-dashed rounded-md text-center cursor-pointer hover:border-primary ${
                  isDetectDragActive
                    ? "border-primary bg-primary/10"
                    : "border-gray-300 dark:border-gray-700"
                }`}
              >
                <input {...getDetectInputProps()} />
                {isDetectDragActive ? (
                  <p>Drop the image here ...</p>
                ) : (
                  <p>Drag 'n' drop an image here, or click to select</p>
                )}
                <p className="text-xs text-muted-foreground mt-1">
                  Supports: JPG, PNG, WEBP, BMP
                </p>
              </div>

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
                    alt="Preview for detection"
                    className="max-w-full h-auto block"
                  />
                  {/* Canvas overlay for bounding boxes */}
                  <canvas
                    ref={canvasRef}
                    className="absolute top-0 left-0 w-full h-full"
                  />
                </div>
              )}

              {detectionResults && detectionResults.length > 0 && (
                <div className="mt-4">
                  <h4 className="font-semibold mb-2">Detection Results:</h4>
                  <ul className="list-disc list-inside text-sm space-y-1">
                    {detectionResults.map((det, index) => (
                      <li key={index}>
                        {det.class_name} ({(det.confidence * 100).toFixed(1)}%)
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {detectionResults !== null && detectionResults.length === 0 && (
                <p className="mt-4 text-sm text-muted-foreground">
                  No objects detected.
                </p>
              )}
            </CardContent>
            <CardFooter>
              <Button
                onClick={handleDetectSubmit}
                disabled={!detectFile || detectLoading}
                className="w-full"
              >
                {detectLoading ? (
                  <>
                    <svg
                      className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    Detecting...
                  </>
                ) : (
                  "Detect Objects"
                )}
              </Button>
            </CardFooter>
          </Card>

          {/* --- Training Upload Section --- */}
          <Card>
            <CardHeader>
              <CardTitle>2. Upload for Training</CardTitle>
              <CardDescription>
                Upload multiple images to be used for future model training.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div
                {...getTrainRootProps()}
                className={`p-6 border-2 border-dashed rounded-md text-center cursor-pointer hover:border-primary ${
                  isTrainDragActive
                    ? "border-primary bg-primary/10"
                    : "border-gray-300 dark:border-gray-700"
                }`}
              >
                <input {...getTrainInputProps()} />
                {isTrainDragActive ? (
                  <p>Drop the images here ...</p>
                ) : (
                  <p>Drag 'n' drop images here, or click to select multiple</p>
                )}
                <p className="text-xs text-muted-foreground mt-1">
                  Supports: JPG, PNG, WEBP, BMP
                </p>
              </div>

              {trainFiles.length > 0 && (
                <div className="mt-4">
                  <h4 className="font-semibold mb-2 text-sm">
                    Files Queued for Upload ({trainFiles.length}):
                  </h4>
                  <ul className="max-h-40 overflow-y-auto text-xs space-y-1 border rounded-md p-2">
                    {trainFiles.map((file, index) => (
                      <li
                        key={index}
                        className="flex justify-between items-center"
                      >
                        <span>
                          {file.name} ({(file.size / 1024).toFixed(1)} KB)
                        </span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeTrainFile(index)}
                          className="h-6 w-6 p-0 text-red-500 hover:bg-red-100"
                        >
                          × {/* Simple X */}
                        </Button>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <p className="text-xs text-muted-foreground mt-2 italic">
                Note: This uploads images to the server's designated folder.
                Actual model re-training is a separate process.
              </p>
            </CardContent>
            <CardFooter>
              <Button
                onClick={handleTrainSubmit}
                disabled={trainFiles.length === 0 || trainLoading}
                className="w-full"
              >
                {trainLoading ? (
                  <>
                    <svg
                      className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    Uploading...
                  </>
                ) : (
                  `Upload ${trainFiles.length} File(s)`
                )}
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    </>
  );
}
