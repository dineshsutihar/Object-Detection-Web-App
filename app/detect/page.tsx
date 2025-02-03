"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2 } from "lucide-react";
import Image from "next/image";
import { useEffect, useRef } from "react";
import Webcam from "react-webcam";

export default function DetectPage() {
  const [image, setImage] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<any[] | null>(null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFile(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setImage(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;

    setLoading(true);
    setResults(null);

    const formData = new FormData();
    formData.append("image", file);

    try {
      // Replace with your actual API endpoint
      const response = await fetch("/api/detect", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Detection failed");
      }

      const data = await response.json();
      setResults(data.results);
    } catch (error) {
      console.error("Error:", error);
      // Handle error (e.g., show error message to user)
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8 text-primary">Object Detection</h1>
      <form onSubmit={handleSubmit} className="mb-8">
        <div className="flex items-center space-x-4">
          <Input
            type="file"
            accept="image/*"
            onChange={handleImageUpload}
            className="flex-grow bg-card text-gray-300"
          />
          <Button type="submit" disabled={!file || loading} variant="secondary">
            {loading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              "Detect"
            )}
          </Button>
        </div>
      </form>

      {image && (
        <div className="mb-8">
          <h2 className="text-2xl font-semibold mb-4 text-secondary">
            Uploaded Image
          </h2>
          <div className="relative w-full h-[400px] border border-primary/50 rounded-lg overflow-hidden">
            <Image
              src={image || "/placeholder.svg"}
              alt="Uploaded image"
              fill
              style={{ objectFit: "contain" }}
            />
          </div>
        </div>
      )}
      <div className="mb-8"></div>
      <h2 className="text-2xl font-semibold mb-4 text-secondary">Webcam</h2>
      <div className="relative w-full h-[400px] border border-primary/50 rounded-lg overflow-hidden">
        <Webcam
          audio={false}
          screenshotFormat="image/jpeg"
          className="w-full h-full object-cover"
          onUserMediaError={(error) => console.error("Webcam error:", error)}
        />
      </div>

      {results && (
        <div>
          <h2 className="text-2xl font-semibold mb-4 text-secondary">
            Detection Results
          </h2>
          <ul className="list-disc pl-5 text-gray-300">
            {results.map((result, index) => (
              <li key={index} className="mb-2">
                <span className="text-primary">{result.label}:</span>{" "}
                {(result.confidence * 100).toFixed(2)}% confidence
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
