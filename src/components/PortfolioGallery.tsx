import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { usePortfolioGallery, type PortfolioImage } from '@/hooks/usePortfolioGallery';
import { PortfolioLightbox } from '@/components/portfolio/PortfolioLightbox';

const PortfolioGallery = () => {

  // Portfolio data
  const { images, loading } = usePortfolioGallery();
  
  // Lightbox
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  
  // Lazy loading
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

  // Patrón fijo de 14 posiciones del mosaico
  const MOSAIC_PATTERN: ('large' | 'wide' | 'tall' | 'medium')[] = [
    'large',   // 0: 2x2
    'medium',  // 1: 1x1
    'tall',    // 2: 1x2
    'wide',    // 3: 2x1
    'medium',  // 4: 1x1
    'large',   // 5: 2x2
    'medium',  // 6: 1x1
    'tall',    // 7: 1x2
    'wide',    // 8: 2x1
    'medium',  // 9: 1x1
    'medium',  // 10: 1x1
    'large',   // 11: 2x2
    'tall',    // 12: 1x2
    'medium',  // 13: 1x1
  ];

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
    setLightboxIndex((prev) => (prev + 1) % images.length);
  };

  const prevImage = () => {
    setLightboxIndex((prev) => (prev - 1 + images.length) % images.length);
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
          <div className="text-center mb-8">
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-black mb-4">
              Nuestro <span className="text-accent">Portfolio</span>
            </h2>
            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
              Explora algunos de nuestros trabajos más destacados
            </p>
          </div>

          {images.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">
                Aún no hay trabajos en el portfolio
              </p>
            </div>
          ) : (
            <>
              {/* Mosaic Grid - exactamente 14 posiciones */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-8">
                {images.slice(0, 14).map((work, index) => {
                  // Cada imagen usa el tamaño fijo de su posición
                  const fixedSize = MOSAIC_PATTERN[index];
                  return (
                  <div
                    key={work.id}
                    className={`group relative overflow-hidden rounded-lg ${getSizeClasses(
                      fixedSize
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
                    aria-label={`Ver trabajo: ${work.style || 'desconocido'} por ${work.artist_name || 'artista'}`}
                  >
                    <img
                      ref={(el) => {
                        if (el && observerRef.current) {
                          observerRef.current.observe(el);
                        }
                      }}
                      data-src={work.image_url}
                      alt={`Tatuaje ${work.style || 'desconocido'} por ${work.artist_name || 'artista'}`}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-4">
                      <div>
                        <div className="text-sm font-semibold text-accent">
                          {work.style}
                        </div>
                        {work.artist_name && (
                          <div className="text-xs text-muted-foreground">
                            por {work.artist_name}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  );
                })}
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
          images={images as any}
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
