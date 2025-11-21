import { Button } from "@/components/ui/button";

const PortfolioGallery = () => {
  // Mock data - En producción vendrá de Supabase
  const portfolioItems = [
    { id: 1, image: "https://images.unsplash.com/photo-1590246814883-57c511ad084c?w=800&q=80", artist: "Alex Rivera", style: "Realismo", size: "large" },
    { id: 2, image: "https://images.unsplash.com/photo-1611501275019-9b5cda994e8d?w=800&q=80", artist: "Luna García", style: "Traditional", size: "tall" },
    { id: 3, image: "https://images.unsplash.com/photo-1598371839696-5c5bb00bdc28?w=800&q=80", artist: "Marco Rossi", style: "Geométrico", size: "medium" },
    { id: 4, image: "https://images.unsplash.com/photo-1565058534926-7cfef96f4855?w=800&q=80", artist: "Sofía Chen", style: "Japonés", size: "wide" },
    { id: 5, image: "https://images.unsplash.com/photo-1611501275019-9b5cda994e8d?w=800&q=80", artist: "Diego Morales", style: "Blackwork", size: "medium" },
    { id: 6, image: "https://images.unsplash.com/photo-1590246814883-57c511ad084c?w=800&q=80", artist: "Emma Wilson", style: "Watercolor", size: "tall" },
    { id: 7, image: "https://images.unsplash.com/photo-1598371839696-5c5bb00bdc28?w=800&q=80", artist: "Alex Rivera", style: "Minimalista", size: "medium" },
    { id: 8, image: "https://images.unsplash.com/photo-1565058534926-7cfef96f4855?w=800&q=80", artist: "Luna García", style: "Neo-Traditional", size: "medium" },
  ];

  const getSizeClasses = (size: string) => {
    switch (size) {
      case "large":
        return "col-span-2 row-span-2";
      case "tall":
        return "row-span-2";
      case "wide":
        return "col-span-2";
      default:
        return "";
    }
  };

  return (
    <section id="portfolio" className="section">
      <div className="container">
        <div className="text-center mb-12">
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-black mb-4">
            Nuestro <span className="text-accent">Portfolio</span>
          </h2>
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
            Explora algunos de nuestros trabajos más destacados
          </p>
        </div>

        {/* Mosaic Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-8">
          {portfolioItems.map((item) => (
            <div
              key={item.id}
              className={`group relative overflow-hidden rounded-lg ${getSizeClasses(item.size)} cursor-pointer`}
            >
              <img
                src={item.image}
                alt={`Tatuaje ${item.style} por ${item.artist}`}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-4">
                <div>
                  <div className="text-sm font-semibold text-accent">{item.style}</div>
                  <div className="text-xs text-muted-foreground">por {item.artist}</div>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="text-center">
          <Button variant="outline" size="lg" className="border-accent text-accent hover:bg-accent hover:text-accent-foreground">
            Ver Más Trabajos
          </Button>
        </div>
      </div>
    </section>
  );
};

export default PortfolioGallery;
