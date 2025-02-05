export default function Testimonials() {
  return (
    <section id="testimonials" className="py-20 bg-background">
      <div className="container mx-auto">
        <h2 className="text-4xl font-bold text-center mb-12 text-primary">
          What Our Users Say
        </h2>
        <div className="relative flex w-full flex-col items-center justify-center overflow-hidden">
          <Marquee pauseOnHover className="[--duration:20s]">
            {firstRow.map((review) => (
              <ReviewCard key={review.username} {...review} />
            ))}
          </Marquee>
          <Marquee reverse pauseOnHover className="[--duration:20s]">
            {secondRow.map((review) => (
              <ReviewCard key={review.username} {...review} />
            ))}
          </Marquee>
          <div className="pointer-events-none absolute inset-y-0 left-0 w-1/4 bg-gradient-to-r from-background"></div>
          <div className="pointer-events-none absolute inset-y-0 right-0 w-1/4 bg-gradient-to-l from-background"></div>
        </div>
      </div>
    </section>
  );
}

import { cn } from "@/lib/utils";
import { Marquee } from "@/components/magicui/marquee";

const testimonials = [
  {
    name: "Jane",
    username: "@jane",
    body: "ObjectDetect has revolutionized our image analysis process. It's incredibly accurate and fast.",
    img: "https://avatar.vercel.sh/jane?size=100",
  },
  {
    name: "John",
    username: "@john",
    body: "The ease of use and powerful features make ObjectDetect a game-changer in our research projects.",
    img: "https://avatar.vercel.sh/john?size=100",
  },
  {
    name: "Emily",
    username: "@emily",
    body: "We've seen a 40% increase in efficiency since implementing ObjectDetect in our workflow.",
    img: "https://avatar.vercel.sh/emily?size=100",
  },
  {
    name: "Michael",
    username: "@michael",
    body: "ObjectDetect's real-time processing capabilities have given our team a huge competitive advantage.",
    img: "https://avatar.vercel.sh/michael?size=100",
  },
  {
    name: "Sophia",
    username: "@sophia",
    body: "With ObjectDetect, we reduced image processing time by half while maintaining top-tier accuracy.",
    img: "https://avatar.vercel.sh/sophia?size=100",
  },
  {
    name: "Daniel",
    username: "@daniel",
    body: "Security and privacy are top-notch. We trust ObjectDetect to handle sensitive image data.",
    img: "https://avatar.vercel.sh/daniel?size=100",
  },
  {
    name: "Alice",
    username: "@alice",
    body: "ObjectDetect has significantly improved our fraud detection system.",
    img: "https://avatar.vercel.sh/alice?size=100",
  },
  {
    name: "Robert",
    username: "@robert",
    body: "The accuracy of ObjectDetect in real-time video analysis is outstanding!",
    img: "https://avatar.vercel.sh/robert?size=100",
  },
  {
    name: "Oliver",
    username: "@oliver",
    body: "I was skeptical at first, but ObjectDetect exceeded all expectations.",
    img: "https://avatar.vercel.sh/oliver?size=100",
  },
  {
    name: "Emma",
    username: "@emma",
    body: "Our medical imaging department has greatly benefited from ObjectDetect's precision.",
    img: "https://avatar.vercel.sh/emma?size=100",
  },
  {
    name: "Liam",
    username: "@liam",
    body: "Using ObjectDetect has streamlined our autonomous vehicle project.",
    img: "https://avatar.vercel.sh/liam?size=100",
  },
];

const firstRow = testimonials.slice(0, testimonials.length / 2);
const secondRow = testimonials.slice(testimonials.length / 2);

const ReviewCard = ({
  img,
  name,
  username,
  body,
}: {
  img: string;
  name: string;
  username: string;
  body: string;
}) => {
  return (
    <figure
      className={cn(
        "relative h-full w-64 cursor-pointer overflow-hidden rounded-xl border p-4 lg:w-[400px]",
        // light styles
        "border-gray-950/[.1] bg-gray-950/[.01] hover:bg-gray-950/[.05]",
        // dark styles
        "dark:border-gray-50/[.1] dark:bg-gray-50/[.10] dark:hover:bg-gray-50/[.15]"
      )}
    >
      <div className="flex flex-row items-center gap-2">
        <img className="rounded-full" width="32" height="32" alt="" src={img} />
        <div className="flex flex-col">
          <figcaption className="text-sm font-medium dark:text-white">
            {name}
          </figcaption>
          <p className="text-xs font-medium dark:text-white/40">{username}</p>
        </div>
      </div>
      <blockquote className="mt-2 text-sm">{body}</blockquote>
    </figure>
  );
};
