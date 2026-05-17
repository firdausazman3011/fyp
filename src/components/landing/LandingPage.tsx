import {
  Header,
  HeroSection,
  FeaturesSection,
  StatsSection,
  CTASection,
  Footer,
} from "@/components/landing";

export default function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">
        <HeroSection />
        <StatsSection />
        <section id="features">
          <FeaturesSection />
        </section>
        <CTASection />
      </main>
      <Footer />
    </div>
  );
}
