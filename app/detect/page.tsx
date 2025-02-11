"use client";

import { ChangeEvent, useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import Image from "next/image";
import Webcam from "react-webcam";

export default function DetectPage() {
  const [image, setImage] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<any[] | null>(null);
  const [comWebcam, setComWebcam] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Hardcoded sample results for demonstration
  const sampleResults = [
    { label: "Person", confidence: 0.98 },
    { label: "Chair", confidence: 0.85 },
    { label: "Laptop", confidence: 0.92 },
    { label: "Coffee Cup", confidence: 0.78 },
  ];

  // Use detected results if available; otherwise use sample results.
  const displayResults = results || sampleResults;

  // Trigger object detection when clicking the detect button.
  async function handleDetect(): Promise<void> {
    if (!file) return;
    setLoading(true);
    // Object detection logic here (e.g., call your backend or ML model)
    // For now, we use a hardcoded sample output.
    setResults(sampleResults);
    setLoading(false);
  }

  // Handle file upload and display an image preview.
  function handleImageUpload(event: ChangeEvent<HTMLInputElement>): void {
    const uploadedFile = event.target.files?.[0];
    if (!uploadedFile) return;

    setFile(uploadedFile);
    const imageUrl = URL.createObjectURL(uploadedFile);
    setImage(imageUrl);
  }

  function handleClickDropZone() {
    fileInputRef.current?.click();
  }

  // Clear the uploaded image and reset file.
  function handleClearImage() {
    setFile(null);
    setImage(null);
  }

  return (
    <div className="container mx-auto px-4 py-8 my-20">
      <div className="flex flex-col md:flex-row gap-8">
        {/* Left Side - Image/Video Content */}
        <div className="md:w-2/3 relative">
          {comWebcam ? (
            <div className="relative w-full h-[500px] border border-primary/50 rounded-lg overflow-hidden">
              <Webcam
                audio={false}
                screenshotFormat="image/jpeg"
                className="w-full h-full object-cover"
                onUserMediaError={(error) =>
                  console.error("Webcam error:", error)
                }
              />
            </div>
          ) : (
            <div
              className="relative w-full h-[500px] border-2 border-dashed border-primary/50 rounded-lg overflow-hidden flex items-center justify-center cursor-pointer"
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                  const uploadedFile = e.dataTransfer.files[0];
                  setFile(uploadedFile);
                  setImage(URL.createObjectURL(uploadedFile));
                }
              }}
              onClick={handleClickDropZone}
            >
              {image ? (
                <>
                  <Image
                    src={image}
                    alt="Uploaded image"
                    fill
                    style={{ objectFit: "contain" }}
                  />
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleClearImage();
                    }}
                    className="absolute top-2 right-2 bg-gray-800 text-white rounded-full p-1 hover:bg-gray-700"
                  >
                    ✕
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  onClick={handleClickDropZone}
                  className="text-gray-400 bg-transparent border-none text-lg underline"
                >
                  Drag and drop or click here to upload image
                </button>
              )}
            </div>
          )}
          <input
            ref={fileInputRef}
            id="hiddenFileInput"
            type="file"
            accept="image/*"
            onChange={handleImageUpload}
            className="hidden"
          />
        </div>

        {/* Right Side - Details and Controls */}
        <div className="md:w-1/3 bg-gray-800 p-6 rounded-xl h-fit">
          <h2 className="text-2xl font-semibold mb-6 text-secondary">
            Detection Results
          </h2>

          {/* Stats Summary */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="bg-gray-700 p-4 rounded-lg">
              <p className="text-gray-400">Objects Detected</p>
              <p className="text-2xl font-bold text-primary">
                {displayResults.length}
              </p>
            </div>
            <div className="bg-gray-700 p-4 rounded-lg">
              <p className="text-gray-400">Processing Time</p>
              <p className="text-2xl font-bold text-primary">0.8s</p>
            </div>
          </div>

          {/* Results List */}
          <div className="space-y-4">
            {displayResults.map((result, index) => (
              <div
                key={index}
                className="bg-gray-700/50 p-4 rounded-lg flex justify-between items-center"
              >
                <span className="text-gray-200">{result.label}</span>
                <span className="text-primary font-semibold">
                  {(result.confidence * 100).toFixed(1)}%
                </span>
              </div>
            ))}
          </div>

          {/* Controls: Detect and Toggle Webcam */}
          <div className="flex flex-col gap-4 mt-6">
            <Button
              onClick={handleDetect}
              disabled={!file || loading}
              variant="secondary"
            >
              {loading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                "Detect"
              )}
            </Button>
            <Button
              className="w-full"
              variant="outline"
              onClick={() => setComWebcam(!comWebcam)}
            >
              {comWebcam ? "Switch to Upload" : "Switch to Webcam"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
