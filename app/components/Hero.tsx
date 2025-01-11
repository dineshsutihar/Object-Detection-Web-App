"use client";

import { motion } from "framer-motion";
import { Camera, Code2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BackgroundScene } from "./background-scene";

export default function Hero() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-background to-secondary/20 pt-16 pb-32 h-dvh">
      <BackgroundScene />
      <div className="container px-4 relative mx-auto flex flex-col items-center justify-center h-full">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="flex flex-col items-center text-center mb-12"
        >
          <h1 className="text-5xl md:text-7xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary via-indigo-500 to-primary mb-6 animate-gradient">
            Next-Gen Object Detection
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mb-8">
            Harness the power of AI to detect and analyze objects in real-time.
            Built with cutting-edge technology for unparalleled accuracy and
            speed.
          </p>
          <div className="flex gap-4">
            <Button size="lg" className="gap-2">
              <Camera className="w-5 h-5" />
              Try Demo
            </Button>
            <Button size="lg" variant="outline" className="gap-2">
              <Code2 className="w-5 h-5" />
              Documentation
            </Button>
          </div>
        </motion.div>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-8 mt-16"
        >
          {[
            { label: "Accuracy", value: "99.9%" },
            { label: "Processing Speed", value: "60 FPS" },
            { label: "Supported Formats", value: "15+" },
            { label: "Active Users", value: "10K+" },
          ].map((stat, index) => (
            <div key={index} className="text-center">
              <div className="text-3xl font-bold text-primary mb-2">
                {stat.value}
              </div>
              <div className="text-sm text-muted-foreground">{stat.label}</div>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
