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

  // New state for additional webcam controls
  const [isCameraOn, setIsCameraOn] = useState(true);
  const [facingMode, setFacingMode] = useState<"user" | "environment">("user");

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

  // Trigger the hidden file input by clicking the drop zone.
  function handleClickDropZone() {
    fileInputRef.current?.click();
  }

  // Clear the uploaded image and reset the file.
  function handleClearImage() {
    setFile(null);
    setImage(null);
  }

  // Functions for webcam controls.
  function handleStopCamera() {
    setIsCameraOn(false);
  }

  function handleStartCamera() {
    setIsCameraOn(true);
  }

  function handleSwitchCamera() {
    setFacingMode((prevMode) => (prevMode === "user" ? "environment" : "user"));
  }

  return (
    <div className="container mx-auto px-4 py-8 my-20">
      {/* Center the two sections with horizontal gap */}
      <div className="flex flex-col md:flex-row justify-center gap-8">
        {/* Left Side - Preview & Mode Switch */}
        <div className="md:w-[45%]">
          {/* Preview Section with 4:3 aspect ratio */}
          <div
            className="relative w-full max-w-[600px] aspect-[4/3] border-2 border-dashed border-primary/50 rounded-lg overflow-hidden flex items-center justify-center cursor-pointer"
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                const uploadedFile = e.dataTransfer.files[0];
                setFile(uploadedFile);
                setImage(URL.createObjectURL(uploadedFile));
              }
            }}
            onClick={!comWebcam ? handleClickDropZone : undefined}
          >
            {comWebcam ? (
              isCameraOn ? (
                <Webcam
                  key={facingMode} // force remount when facingMode changes
                  audio={false}
                  screenshotFormat="image/jpeg"
                  className="w-full h-full object-cover"
                  videoConstraints={{ facingMode }}
                  onUserMediaError={(error) =>
                    console.error("Webcam error:", error)
                  }
                />
              ) : (
                <div className="w-full h-full bg-black flex items-center justify-center">
                  <span className="text-white">Camera is off</span>
                </div>
              )
            ) : image ? (
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
              <span className="text-gray-400">
                Drag and drop or click here to upload image
              </span>
            )}
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleImageUpload}
            className="hidden"
          />

          {/* Mode switch and webcam control buttons below the preview */}
          <div className="mt-4 flex gap-2 items-center">
            {comWebcam ? (
              <>
                <Button variant="outline" onClick={() => setComWebcam(false)}>
                  Switch to Image Mode
                </Button>
                {isCameraOn ? (
                  <Button variant="outline" onClick={handleStopCamera}>
                    Stop Camera
                  </Button>
                ) : (
                  <Button variant="outline" onClick={handleStartCamera}>
                    Start Camera
                  </Button>
                )}
                <Button variant="outline" onClick={handleSwitchCamera}>
                  Switch Camera Source
                </Button>
              </>
            ) : (
              <Button variant="outline" onClick={() => setComWebcam(true)}>
                Switch to Webcam Mode
              </Button>
            )}
          </div>
        </div>

        {/* Right Side - Detection Results & Controls */}
        <div className="md:w-[40%] bg-gray-800 p-6 rounded-xl h-fit">
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
          {/* Detect Control */}
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
          </div>
        </div>
      </div>
    </div>
  );
}