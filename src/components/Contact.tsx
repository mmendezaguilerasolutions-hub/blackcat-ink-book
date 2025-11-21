import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { CalendarIcon, Send } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAvailableSlots } from "@/hooks/useAvailableSlots";

const contactSchema = z.object({
  name: z.string().min(2, "El nombre debe tener al menos 2 caracteres"),
  phone: z.string().min(9, "El teléfono debe tener al menos 9 dígitos"),
  email: z.string().email("Email inválido"),
  artist: z.string().min(1, "Selecciona un artista"),
  service: z.string().min(1, "Selecciona un servicio"),
  date: z.date({ required_error: "Selecciona una fecha" }),
  time: z.string().min(1, "Selecciona un horario"),
  message: z.string().optional(),
});

type ContactFormData = z.infer<typeof contactSchema>;

interface Artist {
  id: string;
  display_name: string;
}

interface Service {
  id: string;
  name: string;
  duration_minutes: number;
}

const Contact = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [artists, setArtists] = useState<Artist[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const { slots, loading: slotsLoading, fetchAvailableSlots } = useAvailableSlots();

  const { register, handleSubmit, formState: { errors }, setValue, watch } = useForm<ContactFormData>({
    resolver: zodResolver(contactSchema),
  });

  const selectedDate = watch("date");
  const selectedArtist = watch("artist");
  const selectedService = watch("service");

  // Cargar artistas activos
  useEffect(() => {
    const loadArtists = async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, display_name')
        .eq('is_active', true)
        .order('display_name');

      if (data && !error) {
        setArtists(data);
      }
    };

    loadArtists();
  }, []);

  // Cargar servicios del artista seleccionado
  useEffect(() => {
    if (!selectedArtist) {
      setServices([]);
      return;
    }

    const loadServices = async () => {
      const { data, error } = await supabase
        .from('artist_services')
        .select('id, name, duration_minutes')
        .eq('artist_id', selectedArtist)
        .eq('is_active', true)
        .order('name');

      if (data && !error) {
        setServices(data);
      }
    };

    loadServices();
  }, [selectedArtist]);

  // Cargar slots disponibles cuando se selecciona fecha y servicio
  useEffect(() => {
    if (selectedArtist && selectedDate && selectedService) {
      const service = services.find(s => s.id === selectedService);
      if (service) {
        const dateStr = format(selectedDate, 'yyyy-MM-dd');
        fetchAvailableSlots(selectedArtist, dateStr, service.duration_minutes);
      }
    }
  }, [selectedArtist, selectedDate, selectedService, services]);

  const onSubmit = async (data: ContactFormData) => {
    setIsSubmitting(true);
    try {
      const service = services.find(s => s.id === data.service);
      if (!service) {
        toast.error("Servicio no encontrado");
        return;
      }

      // Calcular end_time basado en la duración del servicio
      const [hours, minutes] = data.time.split(':').map(Number);
      const startDate = new Date();
      startDate.setHours(hours, minutes, 0, 0);
      const endDate = new Date(startDate.getTime() + service.duration_minutes * 60000);
      const endTime = format(endDate, 'HH:mm');

      const { error } = await supabase
        .from('appointments')
        .insert([{
          artist_id: data.artist,
          service_id: data.service,
          client_name: data.name,
          client_email: data.email,
          client_phone: data.phone,
          date: format(data.date, 'yyyy-MM-dd'),
          start_time: data.time,
          end_time: endTime,
          notes: data.message || null,
          status: 'pending',
        }]);

      if (error) throw error;

      toast.success("¡Solicitud enviada! Te contactaremos pronto.");
      
      // Reset form
      setValue('artist', '');
      setValue('service', '');
      setValue('date', undefined as any);
      setValue('time', '');
      setValue('message', '');
    } catch (error: any) {
      console.error('Error submitting:', error);
      toast.error(error.message || "Error al enviar la solicitud");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section id="contact" className="section">
      <div className="container max-w-4xl">
        <div className="text-center mb-12">
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-black mb-4">
            Reserva tu <span className="text-accent">Cita</span>
          </h2>
          <p className="text-lg md:text-xl text-muted-foreground">
            Completa el formulario y nos pondremos en contacto contigo
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 bg-card p-8 rounded-lg">
          <div className="grid md:grid-cols-2 gap-6">
            {/* Name */}
            <div className="space-y-2">
              <Label htmlFor="name">Nombre *</Label>
              <Input
                id="name"
                placeholder="Tu nombre"
                {...register("name")}
                className={errors.name ? "border-destructive" : ""}
              />
              {errors.name && (
                <p className="text-sm text-destructive">{errors.name.message}</p>
              )}
            </div>

            {/* Phone */}
            <div className="space-y-2">
              <Label htmlFor="phone">Teléfono *</Label>
              <Input
                id="phone"
                type="tel"
                placeholder="Tu teléfono"
                {...register("phone")}
                className={errors.phone ? "border-destructive" : ""}
              />
              {errors.phone && (
                <p className="text-sm text-destructive">{errors.phone.message}</p>
              )}
            </div>
          </div>

          {/* Email */}
          <div className="space-y-2">
            <Label htmlFor="email">Email *</Label>
            <Input
              id="email"
              type="email"
              placeholder="tu@email.com"
              {...register("email")}
              className={errors.email ? "border-destructive" : ""}
            />
            {errors.email && (
              <p className="text-sm text-destructive">{errors.email.message}</p>
            )}
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {/* Artist */}
            <div className="space-y-2">
              <Label htmlFor="artist">Artista *</Label>
              <Select onValueChange={(value) => {
                setValue("artist", value);
                setValue("service", "");
                setValue("date", undefined as any);
                setValue("time", "");
              }}>
                <SelectTrigger className={errors.artist ? "border-destructive" : ""}>
                  <SelectValue placeholder="Selecciona un artista" />
                </SelectTrigger>
                <SelectContent>
                  {artists.map((artist) => (
                    <SelectItem key={artist.id} value={artist.id}>
                      {artist.display_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.artist && (
                <p className="text-sm text-destructive">{errors.artist.message}</p>
              )}
            </div>

            {/* Service */}
            <div className="space-y-2">
              <Label htmlFor="service">Servicio *</Label>
              <Select 
                onValueChange={(value) => {
                  setValue("service", value);
                  setValue("date", undefined as any);
                  setValue("time", "");
                }}
                disabled={!selectedArtist}
              >
                <SelectTrigger className={errors.service ? "border-destructive" : ""}>
                  <SelectValue placeholder={
                    !selectedArtist 
                      ? "Primero selecciona un artista" 
                      : services.length === 0
                      ? "No hay servicios disponibles"
                      : "Selecciona un servicio"
                  } />
                </SelectTrigger>
                <SelectContent>
                  {services.map((service) => (
                    <SelectItem key={service.id} value={service.id}>
                      {service.name} ({service.duration_minutes} min)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.service && (
                <p className="text-sm text-destructive">{errors.service.message}</p>
              )}
            </div>
          </div>

          {/* Date */}
          <div className="space-y-2">
            <Label>Fecha Preferida *</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  disabled={!selectedService}
                  className={`w-full justify-start text-left font-normal ${
                    errors.date ? "border-destructive" : ""
                  }`}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {selectedDate ? format(selectedDate, "PPP", { locale: es }) : "Selecciona una fecha"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={(date) => {
                    if (date) {
                      setValue("date", date);
                      setValue("time", "");
                    }
                  }}
                  disabled={(date) => date < new Date()}
                  locale={es}
                />
              </PopoverContent>
            </Popover>
            {errors.date && (
              <p className="text-sm text-destructive">{errors.date.message}</p>
            )}
          </div>

          {/* Time Slots */}
          {selectedDate && selectedService && (
            <div className="space-y-2">
              <Label>Horario Disponible *</Label>
              {slotsLoading ? (
                <p className="text-sm text-muted-foreground">Cargando horarios...</p>
              ) : slots.length === 0 ? (
                <p className="text-sm text-destructive">No hay horarios disponibles para esta fecha</p>
              ) : (
                <Select onValueChange={(value) => setValue("time", value)}>
                  <SelectTrigger className={errors.time ? "border-destructive" : ""}>
                    <SelectValue placeholder="Selecciona un horario" />
                  </SelectTrigger>
                  <SelectContent>
                    {slots.map((slot, index) => (
                      <SelectItem key={index} value={slot.start_time}>
                        {slot.start_time} - {slot.end_time}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
              {errors.time && (
                <p className="text-sm text-destructive">{errors.time.message}</p>
              )}
            </div>
          )}

          {/* Message */}
          <div className="space-y-2">
            <Label htmlFor="message">Mensaje (Opcional)</Label>
            <Textarea
              id="message"
              placeholder="Cuéntanos sobre tu idea de tatuaje..."
              rows={4}
              {...register("message")}
            />
          </div>

          <Button
            type="submit"
            size="lg"
            className="w-full bg-accent hover:bg-accent/90 text-accent-foreground font-bold"
            disabled={isSubmitting || !selectedArtist || !selectedService || !selectedDate || !watch("time")}
          >
            {isSubmitting ? (
              "Enviando..."
            ) : (
              <>
                <Send className="mr-2 h-5 w-5" />
                Enviar Solicitud
              </>
            )}
          </Button>
        </form>
      </div>
    </section>
  );
};

export default Contact;
