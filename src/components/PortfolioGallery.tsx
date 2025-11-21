import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { usePortfolioWorks } from '@/hooks/usePortfolioWorks';
import { PortfolioLightbox } from '@/components/portfolio/PortfolioLightbox';

const PortfolioGallery = () => {
  const { works, loading } = usePortfolioWorks();
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [loadedImages, setLoadedImages] = useState<Set<string>>(new Set());
  const observerRef = useRef<IntersectionObserver | null>(null);

  useEffect(() => {
    // Intersection Observer para lazy loading
    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const img = entry.target as HTMLImageElement;
            const src = img.dataset.src;
            if (src && !loadedImages.has(src)) {
              img.src = src;
              setLoadedImages((prev) => new Set(prev).add(src));
              observerRef.current?.unobserve(img);
            }
          }
        });
      },
      { rootMargin: '50px' }
    );

    return () => {
      observerRef.current?.disconnect();
    };
  }, [loadedImages]);

  const getSizeClasses = (size: string) => {
    switch (size) {
      case 'large':
        return 'col-span-2 row-span-2';
      case 'tall':
        return 'row-span-2';
      case 'wide':
        return 'col-span-2';
      default:
        return '';
    }
  };

  const openLightbox = (index: number) => {
    setLightboxIndex(index);
    setLightboxOpen(true);
  };

  const closeLightbox = () => {
    setLightboxOpen(false);
  };

  const nextImage = () => {
    setLightboxIndex((prev) => (prev + 1) % works.length);
  };

  const prevImage = () => {
    setLightboxIndex((prev) => (prev - 1 + works.length) % works.length);
  };

  const scrollToContact = () => {
    const contactSection = document.getElementById('contact');
    if (contactSection) {
      contactSection.scrollIntoView({ behavior: 'smooth' });
    }
  };

  if (loading) {
    return (
      <section id="portfolio" className="section">
        <div className="container">
          <div className="text-center mb-12">
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-black mb-4">
              Nuestro <span className="text-accent">Portfolio</span>
            </h2>
          </div>

          {/* Loading Skeleton */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-8">
            {[...Array(8)].map((_, i) => (
              <div
                key={i}
                className={`bg-muted/20 rounded-lg animate-pulse ${
                  i === 0 ? 'col-span-2 row-span-2' : ''
                }`}
                style={{ minHeight: i === 0 ? '360px' : '180px' }}
              />
            ))}
          </div>
        </div>
      </section>
    );
  }

  return (
    <>
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

          {works.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">
                Aún no hay trabajos en el portfolio
              </p>
            </div>
          ) : (
            <>
              {/* Mosaic Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-8">
                {works.map((work, index) => (
                  <div
                    key={work.id}
                    className={`group relative overflow-hidden rounded-lg ${getSizeClasses(
                      work.size
                    )} cursor-pointer animate-fade-in`}
                    style={{ animationDelay: `${index * 50}ms` }}
                    onClick={() => openLightbox(index)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        openLightbox(index);
                      }
                    }}
                    tabIndex={0}
                    role="button"
                    aria-label={`Ver trabajo: ${work.style} por ${work.artist?.display_name}`}
                  >
                    <img
                      ref={(el) => {
                        if (el && observerRef.current) {
                          observerRef.current.observe(el);
                        }
                      }}
                      data-src={work.image_url}
                      alt={`Tatuaje ${work.style} por ${work.artist?.display_name}`}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-4">
                      <div>
                        <div className="text-sm font-semibold text-accent">
                          {work.style}
                        </div>
                        {work.artist && (
                          <div className="text-xs text-muted-foreground">
                            por {work.artist.display_name}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="text-center">
                <Button
                  variant="outline"
                  size="lg"
                  className="border-accent text-accent hover:bg-accent hover:text-accent-foreground"
                  onClick={scrollToContact}
                >
                  Reserva tu Cita
                </Button>
              </div>
            </>
          )}
        </div>
      </section>

      {/* Lightbox */}
      {lightboxOpen && (
        <PortfolioLightbox
          images={works}
          currentIndex={lightboxIndex}
          onClose={closeLightbox}
          onNext={nextImage}
          onPrev={prevImage}
        />
      )}
    </>
  );
};

export default PortfolioGallery;
