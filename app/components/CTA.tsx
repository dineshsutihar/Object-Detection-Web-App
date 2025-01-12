"use client";

import { motion } from "framer-motion";
import { ArrowRight, Brain } from "lucide-react";
import { Button } from "@/components/ui/button";

export function CTA() {
  return (
    <section className="py-20 bg-gradient-to-b from-background to-secondary/20">
      <div className="container px-4 mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          viewport={{ once: true }}
          className="bg-card border rounded-2xl p-8 md:p-12 text-center md:text-left md:flex items-center justify-between gap-8"
        >
          <div className="mb-8 md:mb-0">
            <div className="flex items-center justify-center md:justify-start gap-2 mb-4">
              <Brain className="w-8 h-8 text-primary" />
              <span className="text-2xl font-bold">ObjectAI</span>
            </div>
            <h2 className="text-3xl font-bold mb-4">
              Ready to Transform Your Object Detection?
            </h2>
            <p className="text-muted-foreground max-w-2xl">
              Experience the power of AI-driven object detection technology.
              Start detecting objects in real-time with this modern web
              application.
            </p>
          </div>
          <Button size="lg" className="gap-2">
            Start For Free Now
            <ArrowRight className="w-5 h-5" />
          </Button>
        </motion.div>
      </div>
    </section>
  );
}
