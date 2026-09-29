import type { Metadata } from 'next';
import {
  AmbientBackground,
  Nav,
  Hero,
  Marquee,
  FeatureTour,
  Personas,
  GettingStarted,
  Faq,
  Cta,
  Footer,
  MarketingMotion,
} from './landing';

const title = 'PhenoShop | Cannabis wholesale for growers and dispensaries';
const description = 'List wholesale cannabis products, request prices, and track orders in one place. For licensed growers and dispensaries.';

export const metadata: Metadata = {
  title,
  description,
  openGraph: { title, description, siteName: 'PhenoShop', type: 'website' },
  twitter: { title, description, card: 'summary_large_image' },
};

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-[#070908]">
      <MarketingMotion>
        <AmbientBackground />
        <Nav />
        <Hero />
        <Marquee />
        <FeatureTour />
        <Personas />
        <GettingStarted />
        <Faq />
        <Cta />
        <Footer />
      </MarketingMotion>
    </main>
  );
}
