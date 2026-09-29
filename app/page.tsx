import { getAuthSession } from '@/lib/auth-helpers';
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
const description =
  'List wholesale cannabis products, request prices, and track orders in one place. For licensed growers and dispensaries.';

export const metadata: Metadata = {
  title,
  description,
  openGraph: { title, description, siteName: 'PhenoShop', type: 'website' },
  twitter: { title, description, card: 'summary_large_image' },
};

export default async function LandingPage() {
  const signedIn = Boolean(await getAuthSession());
  return (
    <div className="min-h-screen bg-[#070908]">
      <a className="pf-skip-link" href="#main-content">
        Skip to content
      </a>
      <MarketingMotion>
        <AmbientBackground />
        <Nav signedIn={signedIn} />
        <main id="main-content" tabIndex={-1}>
          <Hero signedIn={signedIn} />
          <Marquee />
          <FeatureTour />
          <Personas signedIn={signedIn} />
          <GettingStarted signedIn={signedIn} />
          <Faq />
          <Cta signedIn={signedIn} />
        </main>
        <Footer signedIn={signedIn} />
      </MarketingMotion>
    </div>
  );
}
