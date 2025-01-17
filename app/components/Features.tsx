"use client";

import { motion } from "framer-motion";
import {
  Activity,
  Brain,
  Camera,
  Puzzle,
  Code2,
  Eye,
  Lock,
  Zap,
} from "lucide-react";

const features = [
  {
    icon: Eye,
    title: "Real-time Detection",
    description:
      "Detect objects in real-time with up to 99% accuracy using our advanced AI models.",
  },
  {
    icon: Brain,
    title: "Smart Learning",
    description:
      "Our AI continuously learns and improves from new data, ensuring better results over time.",
  },
  {
    icon: Camera,
    title: "Multi-source Support",
    description:
      "Works with images, videos, live camera feeds, and CCTV systems seamlessly.",
  },
  {
    icon: Zap,
    title: "Lightning Fast",
    description:
      "Process up to 60 frames per second with our optimized inference engine.",
  },
  {
    icon: Puzzle,
    title: "Google Model Integration",
    description:
      "Leverage the power of Google's pre-trained models for enhanced accuracy.",
  },
  {
    icon: Lock,
    title: "Enterprise Security",
    description:
      "Bank-grade encryption and security measures to protect your data.",
  },
  {
    icon: Code2,
    title: "Developer Friendly",
    description:
      "Comprehensive API and SDKs for all major programming languages.",
  },
  {
    icon: Activity,
    title: "Analytics Dashboard",
    description:
      "Real-time insights and analytics about detected objects and patterns.",
  },
];

export default function Features() {
  return (
    <section id="features" className="py-20 bg-secondary/50 mx-auto px-5">
      <div className="container mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold mb-4">Powerful Features</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Our cutting-edge object detection platform combines advanced AI with
            powerful features to deliver exceptional results.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              viewport={{ once: true }}
              className="bg-card p-6 rounded-xl shadow-lg hover:shadow-xl transition-shadow"
            >
              <feature.icon className="w-12 h-12 text-primary mb-4" />
              <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
              <p className="text-muted-foreground text-sm">
                {feature.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
