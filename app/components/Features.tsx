import { Eye, Zap, Lock, BarChart } from "lucide-react"

const features = [
  {
    icon: <Eye className="h-8 w-8 text-primary" />,
    title: "Accurate Detection",
    description: "Our AI model precisely identifies and locates objects in images.",
  },
  {
    icon: <Zap className="h-8 w-8 text-primary" />,
    title: "Fast Processing",
    description: "Get results in seconds, no matter the complexity of the image.",
  },
  {
    icon: <Lock className="h-8 w-8 text-primary" />,
    title: "Secure & Private",
    description: "Your images are processed securely and never stored without permission.",
  },
  {
    icon: <BarChart className="h-8 w-8 text-primary" />,
    title: "Detailed Analytics",
    description: "Receive comprehensive data about detected objects and their positions.",
  },
]

export default function Features() {
  return (
    <section id="features" className="py-20 bg-card/50">
      <div className="container mx-auto">
        <h2 className="text-3xl font-bold text-center mb-12 text-primary">Why Choose ObjectDetect?</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((feature, index) => (
            <div
              key={index}
              className="bg-card p-6 rounded-lg shadow-lg border border-primary/20 hover:border-primary/50 transition-colors"
            >
              <div className="mb-4">{feature.icon}</div>
              <h3 className="text-xl font-semibold mb-2 text-secondary">{feature.title}</h3>
              <p className="text-gray-400">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

