import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, User, Image } from 'lucide-react';
import { ProfileEditor } from '@/components/artist/ProfileEditor';
import { MyPortfolio } from '@/components/artist/MyPortfolio';

const MySpace = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('profile');

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-5xl mx-auto">
          {/* Header */}
          <div className="flex items-center gap-4 mb-6">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate('/dashboard')}
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold">Mi Espacio</h1>
              <p className="text-muted-foreground">
                Gestiona tu perfil y portfolio
              </p>
            </div>
          </div>

          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="profile" className="flex items-center gap-2">
                <User className="h-4 w-4" />
                Perfil
              </TabsTrigger>
              <TabsTrigger value="portfolio" className="flex items-center gap-2">
                <Image className="h-4 w-4" />
                Portfolio
              </TabsTrigger>
            </TabsList>

            <TabsContent value="profile">
              <ProfileEditor userId={user.id} />
            </TabsContent>

            <TabsContent value="portfolio">
              <MyPortfolio artistId={user.id} />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default MySpace;
