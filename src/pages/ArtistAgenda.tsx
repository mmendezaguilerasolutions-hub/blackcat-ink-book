import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar, Clock, List, Ban } from 'lucide-react';
import { ServicesManager } from '@/components/artist/ServicesManager';
import { AvailabilityManager } from '@/components/artist/AvailabilityManager';
import { AppointmentsCalendar } from '@/components/artist/AppointmentsCalendar';
import { BlockedDatesManager } from '@/components/artist/BlockedDatesManager';
import { AppointmentsCalendarView } from '@/components/artist/AppointmentsCalendarView';

export default function ArtistAgenda() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('calendar');

  if (!user) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardHeader>
            <CardTitle>Acceso Denegado</CardTitle>
            <CardDescription>Debes iniciar sesión para acceder a esta página</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">Mi Agenda</h1>
        <p className="text-muted-foreground">
          Gestiona tus citas, servicios y disponibilidad
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-5 lg:w-auto">
          <TabsTrigger value="calendar" className="gap-2">
            <Calendar className="h-4 w-4" />
            <span className="hidden sm:inline">Calendario</span>
          </TabsTrigger>
          <TabsTrigger value="appointments" className="gap-2">
            <List className="h-4 w-4" />
            <span className="hidden sm:inline">Citas</span>
          </TabsTrigger>
          <TabsTrigger value="services" className="gap-2">
            <List className="h-4 w-4" />
            <span className="hidden sm:inline">Servicios</span>
          </TabsTrigger>
          <TabsTrigger value="availability" className="gap-2">
            <Clock className="h-4 w-4" />
            <span className="hidden sm:inline">Horarios</span>
          </TabsTrigger>
          <TabsTrigger value="blocked" className="gap-2">
            <Ban className="h-4 w-4" />
            <span className="hidden sm:inline">Bloqueos</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="calendar" className="space-y-4">
          <AppointmentsCalendarView artistId={user.id} />
        </TabsContent>

        <TabsContent value="appointments" className="space-y-4">
          <AppointmentsCalendar artistId={user.id} />
        </TabsContent>

        <TabsContent value="services" className="space-y-4">
          <ServicesManager artistId={user.id} />
        </TabsContent>

        <TabsContent value="availability" className="space-y-4">
          <AvailabilityManager artistId={user.id} />
        </TabsContent>

        <TabsContent value="blocked" className="space-y-4">
          <BlockedDatesManager artistId={user.id} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
