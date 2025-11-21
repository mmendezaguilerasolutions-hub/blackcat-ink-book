import { Button } from "@/components/ui/button";
import { ChevronDown } from "lucide-react";
import heroImage from "@/assets/hero-bg.jpg";
import logo from "@/assets/logo.png";

const Hero = () => {
  const scrollToContact = () => {
    document.getElementById("contact")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Background Image */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url(${heroImage})` }}
      >
        <div className="absolute inset-0 bg-gradient-to-b from-background/95 via-background/80 to-background"></div>
      </div>

      {/* Content */}
      <div className="container relative z-10 text-center">
        <div className="flex flex-col items-center gap-8 animate-in fade-in slide-in-from-bottom-4 duration-1000">
          {/* Logo */}
          <img 
            src={logo} 
            alt="Black Cat Tattoo Studio" 
            className="w-32 h-32 md:w-48 md:h-48 object-contain drop-shadow-2xl"
          />

          {/* Title */}
          <h1 className="text-5xl md:text-7xl lg:text-8xl font-black text-balance tracking-tight">
            BLACK CAT
            <br />
            <span className="text-accent">TATTOO STUDIO</span>
          </h1>

          {/* Subtitle */}
          <p className="text-lg md:text-xl lg:text-2xl text-muted-foreground max-w-2xl text-balance">
            Arte sobre piel en el corazón de Barcelona
          </p>

          {/* CTA */}
          <Button 
            size="lg" 
            className="text-lg px-8 py-6 bg-accent hover:bg-accent/90 text-accent-foreground font-bold shadow-lg hover:shadow-xl transition-all duration-300"
            onClick={scrollToContact}
          >
            Reserva tu Cita
          </Button>
        </div>
      </div>

      {/* Scroll Indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
        <ChevronDown className="w-8 h-8 text-muted-foreground" />
      </div>
    </section>
  );
};

export default Hero;
