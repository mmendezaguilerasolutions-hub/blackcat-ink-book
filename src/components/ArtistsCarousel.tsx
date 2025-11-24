import { useApprovedArtists } from '@/hooks/useApprovedArtists';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Card, CardContent } from '@/components/ui/card';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@/components/ui/carousel';
import { User } from 'lucide-react';
import Autoplay from 'embla-carousel-autoplay';

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
            align: "start",
            loop: true,
          }}
          plugins={[
            Autoplay({
              delay: 3000,
            }),
          ]}
          className="w-full max-w-5xl mx-auto"
        >
          <CarouselContent>
            {artists.map((artist) => (
              <CarouselItem key={artist.id} className="md:basis-1/3 lg:basis-1/4">
                <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
                  <CardContent className="p-6 flex flex-col items-center">
                    <Avatar className="h-32 w-32 mb-4 ring-4 ring-primary/10">
                      <AvatarImage src={artist.avatar_url} alt={artist.display_name} />
                      <AvatarFallback>
                        <User className="h-16 w-16 text-muted-foreground" />
                      </AvatarFallback>
                    </Avatar>
                    <h3 className="font-semibold text-lg text-center">
                      {artist.display_name}
                    </h3>
                  </CardContent>
                </Card>
              </CarouselItem>
            ))}
          </CarouselContent>
          <CarouselPrevious />
          <CarouselNext />
        </Carousel>
      </div>
    </section>
  );
}
