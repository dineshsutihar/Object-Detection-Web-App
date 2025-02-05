import {
  Eye,
  Zap,
  Lock,
  BarChart,
  ShieldCheck,
  Cpu,
  Code,
  Layers,
  Sparkle,
  Globe,
} from "lucide-react";

const features = [
  {
    icon: <Eye />,
    title: "Accurate Detection",
    description:
      "Our AI model precisely identifies and locates objects in images.",
  },
  {
    icon: <Zap />,
    title: "Fast Processing",
    description:
      "Get results in seconds, no matter the complexity of the image.",
  },
  {
    icon: <Lock />,
    title: "Secure & Private",
    description:
      "Your images are processed securely and never stored without permission.",
  },
  {
    icon: <BarChart />,
    title: "Detailed Analytics",
    description:
      "Receive comprehensive data about detected objects and their positions.",
  },
  {
    icon: <ShieldCheck />,
    title: "Robust Security",
    description: "Enterprise-grade encryption ensures your data stays safe.",
  },
  {
    icon: <Cpu />,
    title: "AI-Powered",
    description: "Leveraging deep learning for smarter object detection.",
  },
  {
    icon: <Code />,
    title: "Developer Friendly",
    description: "Easy-to-integrate API for seamless functionality.",
  },
  {
    icon: <Layers />,
    title: "Multi-Format Support",
    description:
      "Supports various image formats including PNG, JPEG, and more.",
  },
  {
    icon: <Sparkle />,
    title: "Continuous Improvement",
    description: "Regular updates improve accuracy and performance over time.",
  },
  {
    icon: <Globe />,
    title: "Global Accessibility",
    description: "Available worldwide with optimized latency.",
  },
];

export default function Features() {
  return (
    <section
      id="features"
      className="py-20 bg-gradient-to-b from-gray-900 to-black text-white flex items-center justify-center"
    >
      <div className="container mx-auto px-6">
        <h2 className="text-4xl font-bold text-center mb-12 text-primary">
          Why Choose ObjectDetect?
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 ">
          {features.map((feature, index) => (
            <div
              key={index}
              className="bg-gray-800 p-6 rounded-xl shadow-md border border-gray-700 hover:border-primary transition duration-300"
            >
              <div className="mb-4 flex items-center justify-center text-primary text-4xl">
                {feature.icon}
              </div>
              <h3 className="text-xl font-semibold mb-2 text-gray-100">
                {feature.title}
              </h3>
              <p className="text-gray-400">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
