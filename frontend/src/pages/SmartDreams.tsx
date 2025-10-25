/**
 * Smart Dreams - Professional Dream Marketplace Platform
 * Sophisticated UX for dream curation, budget management, provider marketplace
 * Integrated with: Travel Fund Manager, Off-Season Engine, Plan Together, Rewards
 */

import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import Navbar from '@/components/Navbar';
import DreamLibraryBrowser from '@/components/DreamLibraryBrowser';
import DreamCustomizer from '@/components/dreams/DreamCustomizer';
import MyDreamsDashboard from '@/components/dreams/MyDreamsDashboard';
import ProviderMarketplace from '@/components/dreams/ProviderMarketplace';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Sparkles, Library, Wand2, LayoutDashboard, Store, Wallet, Users, Gift, Target } from 'lucide-react';
import { useAuth } from '@/features/auth/context/AuthContext';
import { dreamLibrary } from '@/data/dreamLibrary';

const SmartDreams = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState(searchParams.get('tab') || 'library');
  const [selectedDream, setSelectedDream] = useState<any>(null);

  useEffect(() => {
    // Update URL when tab changes
    if (activeTab !== searchParams.get('tab')) {
      setSearchParams({ tab: activeTab });
    }
  }, [activeTab]);

  useEffect(() => {
    // Check for selected dream from session
    const dreamData = sessionStorage.getItem('selectedDream');
    if (dreamData) {
      setSelectedDream(JSON.parse(dreamData));
      setActiveTab('customize');
    }
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-purple-50/30 to-white">
      <Navbar />

      {/* Professional Hero */}
      <section className="pt-24 pb-8 px-6 bg-gradient-to-br from-purple-900 via-purple-800 to-rose-900">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center gap-3 mb-4">
            <Sparkles className="w-8 h-8 text-amber-400" />
            <Badge className="bg-white/10 text-white border-white/20 text-sm px-3 py-1.5 backdrop-blur">
              Dream Marketplace Platform
            </Badge>
          </div>

          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4 tracking-tight">
            Smart Dreams
          </h1>
          
          <p className="text-lg text-purple-100 max-w-2xl mb-6">
            Expert-curated journeys meet intelligent budget management. 
            Hotels compete, you save, everyone wins.
          </p>

          {/* Quick Stats */}
          <div className="grid grid-cols-4 gap-4 max-w-2xl">
            {[
              { icon: Library, value: dreamLibrary.length, label: 'Curated Dreams' },
              { icon: Wallet, value: '0', label: 'Active Funds' },
              { icon: Target, value: '0', label: 'Live Offers' },
              { icon: Users, value: '0', label: 'Collaborators' }
            ].map((stat, idx) => (
              <div key={idx} className="text-center">
                <stat.icon className="w-5 h-5 text-purple-300 mx-auto mb-1" />
                <p className="text-2xl font-bold text-white">{stat.value}</p>
                <p className="text-xs text-purple-200">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Professional Tab Navigation */}
      <section className="bg-white border-b shadow-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="w-full justify-start border-b-0 bg-transparent h-auto p-0">
              <TabsTrigger 
                value="library" 
                className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-purple-600 rounded-none px-6 py-4"
              >
                <Library className="w-4 h-4 mr-2" />
                Dream Library
              </TabsTrigger>
              <TabsTrigger 
                value="customize"
                className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-purple-600 rounded-none px-6 py-4"
              >
                <Wand2 className="w-4 h-4 mr-2" />
                Customize
                {selectedDream && <Badge className="ml-2 bg-purple-100 text-purple-700">1</Badge>}
              </TabsTrigger>
              <TabsTrigger 
                value="myDreams"
                className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-purple-600 rounded-none px-6 py-4"
              >
                <LayoutDashboard className="w-4 h-4 mr-2" />
                My Dreams
              </TabsTrigger>
              <TabsTrigger 
                value="marketplace"
                className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-purple-600 rounded-none px-6 py-4"
              >
                <Store className="w-4 h-4 mr-2" />
                Marketplace
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </section>

      {/* Tab Content */}
      <main className="min-h-screen">
        <Tabs value={activeTab} className="w-full">
          {/* Dream Library */}
          <TabsContent value="library" className="mt-0">
            <div className="py-12 px-6">
              <DreamLibraryBrowser onSelectDream={(dream) => {
                setSelectedDream(dream);
                setActiveTab('customize');
              }} />
            </div>
          </TabsContent>

          {/* Dream Customizer */}
          <TabsContent value="customize" className="mt-0">
            <div className="py-12 px-6">
              {selectedDream ? (
                <DreamCustomizer dream={selectedDream} />
              ) : (
                <Card className="p-12 text-center max-w-2xl mx-auto">
                  <Wand2 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold mb-2">Select a Dream to Customize</h3>
                  <p className="text-gray-600 mb-6">
                    Choose a dream from the library to start customizing your perfect journey
                  </p>
                  <button 
                    onClick={() => setActiveTab('library')}
                    className="text-purple-600 hover:underline"
                  >
                    Browse Dream Library →
                  </button>
                </Card>
              )}
            </div>
          </TabsContent>

          {/* My Dreams Dashboard */}
          <TabsContent value="myDreams" className="mt-0">
            <div className="py-12 px-6">
              <MyDreamsDashboard />
            </div>
          </TabsContent>

          {/* Provider Marketplace */}
          <TabsContent value="marketplace" className="mt-0">
            <div className="py-12 px-6">
              <ProviderMarketplace />
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default SmartDreams;
