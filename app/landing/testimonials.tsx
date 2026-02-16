'use client';

import { motion, useInView } from 'framer-motion';
import { useRef, useState, useEffect } from 'react';
import { Star, ChevronLeft, ChevronRight, Quote } from 'lucide-react';

const testimonials = [
  {
    quote: "PhenoFarm cut our costs by 60% and the platform is incredibly intuitive. Best decision we made for our dispensary.",
    author: "Sarah Chen",
    role: "Owner",
    company: "Green Mountain Dispensary",
    rating: 5,
  },
  {
    quote: "As a small grower, getting my products in front of dispensaries used to be a nightmare. PhenoFarm changed everything.",
    author: "Marcus Johnson",
    role: "Founder",
    company: "Valley Green Farms",
    rating: 5,
  },
  {
    quote: "The verification process gives us confidence in every partner. We've built relationships that will last for years.",
    author: "Emily Rodriguez",
    role: "Procurement Manager",
    company: "CannaCo Dispensaries",
    rating: 5,
  },
  {
    quote: "Saved $50K in the first year alone compared to our old platform. The features are actually better too.",
    author: "David Kim",
    role: "Operations Director",
    company: "Elevate Wellness",
    rating: 5,
  },
];

const logos = [
  'Green Mountain', 'Valley Green', 'CannaCo', 'Elevate', 'Pure Grow', 'Herb House'
];

export function Testimonials() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, amount: 0.3 });
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % testimonials.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const goToSlide = (index: number) => {
    setCurrentIndex(index);
  };

  const goToPrev = () => {
    setCurrentIndex((prev) => (prev - 1 + testimonials.length) % testimonials.length);
  };

  const goToNext = () => {
    setCurrentIndex((prev) => (prev + 1) % testimonials.length);
  };

  return (
    <section ref={ref} className="py-24 md:py-32 bg-gray-900 relative overflow-hidden min-h-[600px]">
      <div className="max-w-7xl mx-auto px-6">
        <motion.div
          layout="position"
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-4">
            Trusted by Industry Leaders
          </h2>
          <p className="text-gray-300 text-lg max-w-2xl mx-auto">
            Join hundreds of businesses transforming their wholesale operations.
          </p>
        </motion.div>

        {/* Testimonial Carousel */}
        <div className="relative max-w-4xl mx-auto mb-20">
          <div className="overflow-hidden min-h-[300px]">
            {testimonials.map((testimonial, index) => (
              <motion.div
                key={index}
                layout="position"
                initial={{ opacity: 0, x: 50 }}
                animate={{ 
                  opacity: index === currentIndex ? 1 : 0,
                  x: index === currentIndex ? 0 : 50,
                }}
                transition={{ duration: 0.5 }}
                className={`text-center px-4 absolute inset-0 ${
                  index === currentIndex ? 'relative' : 'pointer-events-none invisible'
                }`}
                style={{ 
                  position: index === currentIndex ? 'relative' : 'absolute',
                  visibility: index === currentIndex ? 'visible' : 'hidden'
                }}
              >
                <Quote className="w-16 h-16 text-green-500/30 mx-auto mb-6" />
                <blockquote className="text-xl sm:text-2xl md:text-3xl font-medium text-white mb-8 leading-relaxed">
                  &ldquo;{testimonial.quote}&rdquo;
                </blockquote>
                <div className="flex items-center justify-center gap-1 mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <div className="text-white font-semibold">{testimonial.author}</div>
                <div className="text-gray-300 text-sm">{testimonial.role}, {testimonial.company}</div>
              </motion.div>
            ))}
          </div>

          {/* Navigation Arrows */}
          <button
            onClick={goToPrev}
            className="absolute left-0 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors z-10"
            aria-label="Previous testimonial"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
          <button
            onClick={goToNext}
            className="absolute right-0 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors z-10"
            aria-label="Next testimonial"
          >
            <ChevronRight className="w-6 h-6" />
          </button>

          {/* Dots */}
          <div className="flex justify-center gap-2 mt-8">
            {testimonials.map((_, index) => (
              <button
                key={index}
                onClick={() => goToSlide(index)}
                className={`w-2 h-2 rounded-full transition-all ${
                  index === currentIndex 
                    ? 'bg-green-500 w-8' 
                    : 'bg-gray-600 hover:bg-gray-500'
                }`}
                aria-label={`Go to testimonial ${index + 1}`}
              />
            ))}
          </div>
        </div>

        {/* Logo Strip */}
        <motion.div
          layout="position"
          initial={{ opacity: 0 }}
          animate={isInView ? { opacity: 1 } : {}}
          transition={{ duration: 0.6, delay: 0.4 }}
        >
          <p className="text-center text-gray-500 text-sm mb-8">TRUSTED BY BUSINESSES LIKE</p>
          <div className="flex flex-wrap justify-center items-center gap-8 md:gap-16">
            {logos.map((logo, index) => (
              <motion.div
                key={logo}
                layout="position"
                initial={{ opacity: 0.4 }}
                whileHover={{ opacity: 1 }}
                className="text-xl md:text-2xl font-bold text-gray-500 hover:text-green-400 transition-colors cursor-default"
              >
                {logo}
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
