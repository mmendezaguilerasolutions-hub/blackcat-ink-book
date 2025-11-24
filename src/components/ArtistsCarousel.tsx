import { useApprovedArtists } from '@/hooks/useApprovedArtists';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Card, CardContent } from '@/components/ui/card';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@/components/ui/carousel';
import { User } from 'lucide-react';
import Autoplay from 'embla-carousel-autoplay';
import { AspectRatio } from '@/components/ui/aspect-ratio';

export function ArtistsCarousel() {
  const { artists, loading } = useApprovedArtists();

  if (loading) {
    return (
      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          </div>
        </div>
      </section>
    );
  }

  if (artists.length === 0) {
    return null;
  }

  return (
    <section id="artists" className="py-16 bg-muted/30">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Nuestros Artistas
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Conoce al talentoso equipo de artistas que dan vida a tus ideas
          </p>
        </div>

        <Carousel
          opts={{
            align: "center",
            loop: true,
          }}
          plugins={[
            Autoplay({
              delay: 3000,
              stopOnInteraction: true,
            }),
          ]}
          className="w-full max-w-6xl mx-auto"
        >
          <CarouselContent className="-ml-2 md:-ml-4">
            {artists.map((artist) => (
              <CarouselItem key={artist.id} className="pl-2 md:pl-4 basis-1/2 md:basis-1/3 lg:basis-1/4">
                <div className="p-1">
                  <Card className="border-0 bg-card/50 backdrop-blur-sm shadow-lg hover:shadow-2xl transition-all duration-300 hover:scale-105 overflow-hidden group">
                    <CardContent className="p-4">
                      <AspectRatio ratio={1 / 1} className="mb-3 overflow-hidden rounded-lg">
                        <Avatar className="h-full w-full rounded-lg ring-2 ring-primary/20 group-hover:ring-primary/40 transition-all duration-300">
                          <AvatarImage 
                            src={artist.avatar_url} 
                            alt={artist.display_name}
                            className="object-cover w-full h-full group-hover:scale-110 transition-transform duration-300"
                          />
                          <AvatarFallback className="rounded-lg bg-muted">
                            <User className="h-12 w-12 text-muted-foreground" />
                          </AvatarFallback>
                        </Avatar>
                      </AspectRatio>
                      <h3 className="font-semibold text-base text-center text-foreground group-hover:text-primary transition-colors">
                        {artist.display_name}
                      </h3>
                    </CardContent>
                  </Card>
                </div>
              </CarouselItem>
            ))}
          </CarouselContent>
          <CarouselPrevious className="left-0 md:-left-12" />
          <CarouselNext className="right-0 md:-right-12" />
        </Carousel>
      </div>
    </section>
  );
}
