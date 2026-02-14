import {
  HeroSection,
  ProblemSolution,
  Features,
  HowItWorks,
  Testimonials,
  Pricing,
  CTASection,
  Footer,
} from './landing';

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-gray-950">
      <HeroSection />
      <ProblemSolution />
      <Features />
      <HowItWorks />
      <Testimonials />
      <Pricing />
      <CTASection />
      <Footer />
    </main>
  );
}
