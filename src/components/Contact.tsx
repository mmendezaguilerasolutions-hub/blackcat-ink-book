import { useState } from "react";
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

const contactSchema = z.object({
  name: z.string().min(2, "El nombre debe tener al menos 2 caracteres"),
  phone: z.string().min(9, "El teléfono debe tener al menos 9 dígitos"),
  email: z.string().email("Email inválido"),
  artist: z.string().min(1, "Selecciona un artista"),
  service: z.string().min(1, "Selecciona un servicio"),
  date: z.date({ required_error: "Selecciona una fecha" }),
  message: z.string().optional(),
});

type ContactFormData = z.infer<typeof contactSchema>;

const Contact = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { register, handleSubmit, formState: { errors }, setValue, watch } = useForm<ContactFormData>({
    resolver: zodResolver(contactSchema),
  });

  const selectedDate = watch("date");

  const onSubmit = async (data: ContactFormData) => {
    setIsSubmitting(true);
    try {
      // Aquí irá la llamada a Supabase Edge Function
      console.log("Form data:", data);
      toast.success("¡Solicitud enviada! Te contactaremos pronto.");
    } catch (error) {
      toast.error("Error al enviar la solicitud");
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
              <Select onValueChange={(value) => setValue("artist", value)}>
                <SelectTrigger className={errors.artist ? "border-destructive" : ""}>
                  <SelectValue placeholder="Selecciona un artista" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="alex">Alex Rivera</SelectItem>
                  <SelectItem value="luna">Luna García</SelectItem>
                  <SelectItem value="marco">Marco Rossi</SelectItem>
                </SelectContent>
              </Select>
              {errors.artist && (
                <p className="text-sm text-destructive">{errors.artist.message}</p>
              )}
            </div>

            {/* Service */}
            <div className="space-y-2">
              <Label htmlFor="service">Servicio *</Label>
              <Select onValueChange={(value) => setValue("service", value)}>
                <SelectTrigger className={errors.service ? "border-destructive" : ""}>
                  <SelectValue placeholder="Tipo de tatuaje" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="small">Tatuaje Pequeño</SelectItem>
                  <SelectItem value="medium">Tatuaje Mediano</SelectItem>
                  <SelectItem value="large">Tatuaje Grande</SelectItem>
                  <SelectItem value="cover">Cover-up</SelectItem>
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
                  onSelect={(date) => date && setValue("date", date)}
                  disabled={(date) => date < new Date()}
                  locale={es}
                />
              </PopoverContent>
            </Popover>
            {errors.date && (
              <p className="text-sm text-destructive">{errors.date.message}</p>
            )}
          </div>

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
            disabled={isSubmitting}
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
