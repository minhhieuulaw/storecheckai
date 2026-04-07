import { Navbar } from "@/components/Navbar";
import { Hero } from "@/components/Hero";
import { ThreatHook } from "@/components/ThreatHook";
import { Benefits } from "@/components/Benefits";
import { HowItWorks } from "@/components/HowItWorks";
import { SampleReport } from "@/components/SampleReport";
import { Pricing } from "@/components/Pricing";
import { FAQ } from "@/components/FAQ";
import { Footer } from "@/components/Footer";
import { SocialProofPopup } from "@/components/SocialProofPopup";

export default function Home() {
  return (
    <>
      <Navbar />
      <SocialProofPopup />
      <main>
        <Hero />
        <ThreatHook />
        <Benefits />
        <HowItWorks />
        <SampleReport />
        <Pricing />
        <FAQ />
      </main>
      <Footer />
    </>
  );
}
