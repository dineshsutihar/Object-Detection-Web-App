"use client";

import { motion } from "framer-motion";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";

const plans = [
  {
    name: "Starter",
    price: "$19",
    description: "Ideal for small projects and individual developers",
    features: [
      "Up to 500 detections/month",
      "3 custom models",
      "Support for images & videos only",
      "Basic user support",
      "99.5% uptime SLA",
    ],
  },
  {
    name: "Free",
    price: "$0",
    description: "Perfect for experimenting with basic features",
    features: [
      "Up to 100 detections/month",
      "1 custom model",
      "Support for images only",
      "Community support",
    ],
    popular: true,
  },
  {
    name: "Pro",
    price: "$79",
    description: "Best for growing teams and businesses",
    features: [
      "Up to 10,000 detections/month",
      "All custom models",
      "Support of images, videos, and live streams",
      "Priority support",
      "99.9% uptime SLA",
      "Team collaboration tools",
    ],
  },
];

export function Pricing() {
  return (
    <section id="pricing" className="py-20 bg-background">
      <div className="container px-4 mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold mb-4">
            Simple, Transparent Pricing
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Choose the perfect plan for your needs. All plans include core
            features with different usage limits.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {plans.map((plan, index) => (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              viewport={{ once: true }}
              className={`relative bg-card rounded-xl shadow-lg p-8 ${
                plan.popular
                  ? "border-2 border-primary"
                  : "border border-border"
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                  <span className="bg-primary text-primary-foreground text-sm font-medium px-3 py-1 rounded-full">
                    Most Popular
                  </span>
                </div>
              )}
              <div className="mb-6">
                <h3 className="text-2xl font-bold mb-2">{plan.name}</h3>
                <div className="flex items-baseline gap-1 mb-2">
                  <span className="text-4xl font-bold">{plan.price}</span>
                  {plan.price !== "Custom" && (
                    <span className="text-muted-foreground">/month</span>
                  )}
                </div>
                <p className="text-muted-foreground">{plan.description}</p>
              </div>
              <ul className="space-y-3 mb-6">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-center gap-2">
                    <Check className="w-5 h-5 text-primary" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
              <Button
                className="w-full"
                variant={plan.popular ? "default" : "outline"}
              >
                Get Started
              </Button>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
