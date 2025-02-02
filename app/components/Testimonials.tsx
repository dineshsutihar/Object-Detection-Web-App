const testimonials = [
  {
    quote: "ObjectDetect has revolutionized our image analysis process. It's incredibly accurate and fast.",
    author: "Jane Doe",
    company: "Tech Innovators Inc.",
  },
  {
    quote: "The ease of use and powerful features make ObjectDetect a game-changer in our research projects.",
    author: "John Smith",
    company: "Global Research Ltd.",
  },
  {
    quote: "We've seen a 40% increase in efficiency since implementing ObjectDetect in our workflow.",
    author: "Emily Brown",
    company: "AI Solutions",
  },
]

export default function Testimonials() {
  return (
    <section id="testimonials" className="py-20 bg-background">
      <div className="container mx-auto">
        <h2 className="text-3xl font-bold text-center mb-12 text-primary">What Our Users Say</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {testimonials.map((testimonial, index) => (
            <div
              key={index}
              className="bg-card p-6 rounded-lg shadow-lg border border-secondary/20 hover:border-secondary/50 transition-colors"
            >
              <p className="text-gray-300 mb-4">"{testimonial.quote}"</p>
              <p className="font-semibold text-secondary">{testimonial.author}</p>
              <p className="text-sm text-gray-400">{testimonial.company}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

