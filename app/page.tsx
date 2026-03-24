import { Navbar } from "@/components/Navbar";
import { Hero } from "@/components/Hero";
import { Benefits } from "@/components/Benefits";
import { HowItWorks } from "@/components/HowItWorks";
import { SampleReport } from "@/components/SampleReport";
import { Pricing } from "@/components/Pricing";
import { FAQ } from "@/components/FAQ";
import { Footer } from "@/components/Footer";

export default function Home() {
  return (
    <>
      <Navbar />
      <main>
        <Hero />
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
