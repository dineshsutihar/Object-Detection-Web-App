"use client";
import React, { useState, useCallback } from "react";
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
import { toast as sonnerToast } from "sonner";

interface TrainApiResponse {
  success: boolean;
  message?: string;
  saved_count?: number;
  label?: string;
  saved_relative_paths?: string[];
  errors?: Array<{ filename: string; error: string }>;
  error?: string;
  detail?: any;
}

export function TrainTab() {
  const [trainFiles, setTrainFiles] = useState<File[]>([]);
  const [objectLabel, setObjectLabel] = useState<string>("");
  const [trainLoading, setTrainLoading] = useState<boolean>(false);

  const onDropTrain = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles && acceptedFiles.length > 0) {
      setTrainFiles((prevFiles) => [...prevFiles, ...acceptedFiles]);
      sonnerToast.info(`Added ${acceptedFiles.length} file(s) for training.`);
    } else {
      sonnerToast.error("No valid files selected.");
    }
  }, []);

  const handleTrainSubmit = async () => {
    if (trainFiles.length === 0) {
      sonnerToast.error("Please select one or more image files.");
      return;
    }
    if (!objectLabel.trim()) {
      sonnerToast.error("Please enter a name (label) for the object.");
      return;
    }

    setTrainLoading(true);
    const formData = new FormData();
    formData.append("label", objectLabel.trim());
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
          description: `${result.saved_count ?? 0} files saved for label '${
            result.label
          }'.`,
        });
        setTrainFiles([]);
        setObjectLabel("");
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
    <Card>
      <CardHeader>
        <CardTitle>Train Model (Upload Data)</CardTitle>
        <CardDescription>
          Upload multiple images of the *same object* and provide a name (label)
          to prepare data for future model training.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Label Input */}
        <div className="space-y-1">
          <Label htmlFor="object-label">Object Name (Label)</Label>
          <Input
            id="object-label"
            type="text"
            value={objectLabel}
            onChange={(e) => setObjectLabel(e.target.value)}
            placeholder="e.g., cat, specific_widget_model"
            required
            disabled={trainLoading}
          />
        </div>

        {/* Dropzone */}
        <div
          {...getTrainRootProps()}
          className={`p-6 border-2 border-dashed rounded-md text-center cursor-pointer hover:border-primary ${
            isTrainDragActive ? "border-primary bg-primary/10" : "border-muted"
          }`}
        >
          <input {...getTrainInputProps()} />
          <p>Drag 'n' drop images here, or click to select multiple</p>
        </div>

        {/* File List */}
        {trainFiles.length > 0 && (
          <div className="mt-4">
            <h4 className="font-semibold mb-2 text-sm">
              Files Queued ({trainFiles.length}):
            </h4>
            <ul className="max-h-40 overflow-y-auto text-xs space-y-1 border rounded-md p-2">
              {trainFiles.map((file, index) => (
                <li key={index} className="flex justify-between items-center">
                  <span>{file.name}</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeTrainFile(index)}
                    className="h-6 w-6 p-0 text-destructive hover:bg-destructive/10"
                    disabled={trainLoading}
                  >
                    ×
                  </Button>
                </li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
      <CardFooter>
        <Button
          onClick={handleTrainSubmit}
          disabled={
            trainFiles.length === 0 || !objectLabel.trim() || trainLoading
          }
          className="w-full"
        >
          {trainLoading
            ? "Uploading..."
            : `Upload Data for Label: ${objectLabel.trim() || "..."}`}
        </Button>
      </CardFooter>
    </Card>
  );
}
