import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Star } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@/components/ui/carousel';
import Autoplay from 'embla-carousel-autoplay';

interface Review {
  id: string;
  client_name: string;
  review_text: string;
  rating: number;
  created_at: string;
}

const ClientReviews = () => {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchReviews = async () => {
      try {
        const { data, error } = await supabase
          .from('client_reviews')
          .select('*')
          .eq('is_active', true)
          .order('created_at', { ascending: false });

        if (error) throw error;
        setReviews(data || []);
      } catch (error) {
        console.error('Error fetching reviews:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchReviews();
  }, []);

  if (loading) {
    return (
      <section className="py-20 bg-secondary/20">
        <div className="container mx-auto px-4">
          <div className="text-center">
            <div className="animate-pulse">Cargando reseñas...</div>
          </div>
        </div>
      </section>
    );
  }

  if (reviews.length === 0) {
    return null;
  }

  return (
    <section className="py-20 bg-secondary/20">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            Opiniones de Nuestros Clientes
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Descubre lo que dicen quienes ya han confiado en nosotros
          </p>
        </div>

        <Carousel
          opts={{
            align: "center",
            loop: true,
          }}
          plugins={[
            Autoplay({
              delay: 4000,
              stopOnInteraction: true,
            }),
          ]}
          className="w-full max-w-6xl mx-auto"
        >
          <CarouselContent className="-ml-2 md:-ml-4">
            {reviews.map((review) => (
              <CarouselItem key={review.id} className="pl-2 md:pl-4 basis-full md:basis-1/2 lg:basis-1/3">
                <div className="p-1">
                  <Card className="border-0 bg-card/50 backdrop-blur-sm shadow-lg hover:shadow-2xl transition-all duration-300 hover:scale-105 overflow-hidden group h-full">
                    <CardContent className="p-6 flex flex-col h-full">
                      <div className="flex items-center gap-1 mb-4">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className={`w-5 h-5 transition-colors ${
                              i < review.rating
                                ? 'fill-yellow-400 text-yellow-400'
                                : 'text-muted-foreground'
                            }`}
                          />
                        ))}
                      </div>
                      <p className="text-foreground mb-4 italic flex-grow">
                        "{review.review_text}"
                      </p>
                      <p className="text-sm font-semibold text-primary group-hover:text-primary/80 transition-colors">
                        {review.client_name}
                      </p>
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
};

export default ClientReviews;
