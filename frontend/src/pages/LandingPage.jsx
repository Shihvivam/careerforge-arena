import Navbar from "../components/layout/Navbar";
import Footer from "../components/layout/Footer";
import HeroSection from "../components/landing/HeroSection";
import FeaturesSection from "../components/landing/FeaturesSection";
import HowItWorks from "../components/landing/HowItWorks";
import CTASection from "../components/landing/CTASection";

const LandingPage = () => {
  return (
    <div className="min-h-screen bg-[#050a14] text-white font-sans antialiased">
      <Navbar />
      <main>
        <HeroSection />
        <FeaturesSection />
        <HowItWorks />
        <CTASection />
      </main>
      <Footer />
    </div>
  );
};

export default LandingPage;