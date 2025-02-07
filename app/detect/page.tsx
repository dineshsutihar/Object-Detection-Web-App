"use client";

import { ChangeEvent, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2 } from "lucide-react";
import Image from "next/image";
import { useEffect, useRef, FormEvent } from "react";
import Webcam from "react-webcam";

export default function DetectPage() {
  const [image, setImage] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<any[] | null>(null);
  const [comWebcam, setComWebcam] = useState(false);


  function handleSubmit(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault();
    if (!file) return;
    setLoading(true);
    // object detection logic here
    setResults(sampleResults);
    setLoading(false);
  }

  function handleImageUpload(event: ChangeEvent<HTMLInputElement>): void {
    const file = event.target.files?.[0];
    if (!file) return;

    setFile(file);
    const imageUrl = URL.createObjectURL(file);
    setImage(imageUrl);
  }

  return (
    <div className="container mx-auto px-4 py-8 my-20">
      <div className="flex flex-col md:flex-row gap-8">
        {/* Left Side - Image/Video Content to be viewed */}
        <div className="md:w-2/3">
          <form onSubmit={handleSubmit} className="mb-8">
            <div className="flex items-center space-x-4">
              <Input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="flex-grow bg-card text-gray-300"
              />
              <Button
                type="submit"
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
          </form>

          <div className="relative w-full h-[500px] border border-primary/50 rounded-lg overflow-hidden">
            {comWebcam ? (
              <Webcam
                audio={false}
                screenshotFormat="image/jpeg"
                className="w-full h-full object-cover"
                onUserMediaError={(error) =>
                  console.error("Webcam error:", error)
                }
              />
            ) : (
              <Image
                src={image || "/placeholder.svg"}
                alt="Uploaded image"
                fill
                style={{ objectFit: "contain" }}
              />
            )}
          </div>
        </div>

        {/* Right Side - Details and Results to be viewed later will update using backend and model */}
        <div className="md:w-1/3 bg-gray-800 p-6 rounded-xl h-fit">
          <h2 className="text-2xl font-semibold mb-6 text-secondary">
            Detection Results
          </h2>

          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="bg-gray-700 p-4 rounded-lg">
              <p className="text-gray-400">Objects Detected</p>
              <p className="text-2xl font-bold text-primary">
                {sampleResults.length}
              </p>
            </div>
            <div className="bg-gray-700 p-4 rounded-lg">
              <p className="text-gray-400">Processing Time</p>
              <p className="text-2xl font-bold text-primary">0.8s</p>
            </div>
          </div>

          <div className="space-y-4">
            {sampleResults.map((result, index) => (
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

          {/* Toggle Camera and Image*/}
          <Button
            className="w-full mt-6"
            variant="outline"
            onClick={() => setComWebcam(!comWebcam)}
          >
            {comWebcam ? "Switch to Upload" : "Switch to Webcam"}
          </Button>
        </div>
      </div>
    </div>
  );
}
