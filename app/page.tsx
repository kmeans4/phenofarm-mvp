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
  MarketingMotion,
} from './landing';

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-[#070908]">
      <MarketingMotion>
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
      </MarketingMotion>
    </main>
  );
}
