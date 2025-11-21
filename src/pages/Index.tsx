import NavBar from "@/components/NavBar";
import Hero from "@/components/Hero";
import Statistics from "@/components/Statistics";
import PortfolioGallery from "@/components/PortfolioGallery";
import About from "@/components/About";
import Contact from "@/components/Contact";
import Footer from "@/components/Footer";

const Index = () => {
  return (
    <div className="min-h-screen">
      <NavBar />
      <Hero />
      <Statistics />
      <PortfolioGallery />
      <About />
      <Contact />
      <Footer />
    </div>
  );
};

export default Index;
