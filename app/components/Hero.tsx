import { Button } from "@/components/ui/button";
import Link from "next/link";
import { WavyBackground } from "../../components/ui/wavy-background";

export default function Hero() {
  return (
    <section className="py-20 bg-gradient-to-r from-primary/20 to-secondary/20 h-screen flex items-center justify-center">
      <div className="container mx-auto text-center">
        <WavyBackground className="max-w-4xl mx-auto pb-40 ">
          <p className="text-2xl md:text-4xl lg:text-8xl text-white font-bold inter-var text-center">
            Detect Objects in Images
          </p>
          <p className="text-base md:text-2xl mt-4 text-white font-normal inter-var text-center mb-20">
            Harness the power of AI to identify and locate objects in your
            images with ease and accuracy.
          </p>
          <Button size="lg" variant="secondary" asChild>
            <Link href="/detect">Try Object Detection</Link>
          </Button>
        </WavyBackground>
      </div>
    </section>
  );
}
