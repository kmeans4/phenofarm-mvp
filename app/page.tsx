import {
  AmbientBackground,
  Nav,
  Hero,
  Marquee,
  MoneyFlow,
  FeatureTour,
  Personas,
  SocialProof,
  Pricing,
  Faq,
  Cta,
  Footer,
} from './landing';

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-[#070908]">
      <AmbientBackground />
      <Nav />
      <Hero />
      <Marquee />
      <MoneyFlow />
      <FeatureTour />
      <Personas />
      <SocialProof />
      <Pricing />
      <Faq />
      <Cta />
      <Footer />
    </main>
  );
}
