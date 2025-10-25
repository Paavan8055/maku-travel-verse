/**
 * Dream Library Browser - Professional
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin, Star, ArrowRight, TestTube2, Search } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { dreamLibrary, DreamPackage } from '@/data/dreamLibrary';
import { useToast } from '@/hooks/use-toast';

const DreamLibraryBrowser = ({ onSelectDream }: { onSelectDream?: (dream: DreamPackage) => void }) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [priceFilter, setPriceFilter] = useState<number>(20000);
  const [searchQuery, setSearchQuery] = useState('');

  const categories = [
    { id: 'all', name: 'All Dreams' },
    { id: 'romantic-luxury', name: 'Romantic' },
    { id: 'cultural-family', name: 'Cultural' },
    { id: 'adventure-wildlife', name: 'Adventure' }
  ];

  const filteredDreams = dreamLibrary.filter(dream => {
    const matchesCategory = selectedCategory === 'all' || dream.category === selectedCategory;
    const matchesPrice = dream.budget.base <= priceFilter;
    const matchesSearch = searchQuery === '' || 
      dream.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      dream.destination.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesPrice && matchesSearch;
  });

  const handleSelectDream = (dream: DreamPackage) => {
    sessionStorage.setItem('selectedDream', JSON.stringify(dream));
    if (onSelectDream) {
      onSelectDream(dream);
    } else {
      toast({ title: "Dream Selected!", description: dream.title });
      navigate(`/travel-fund?dreamId=${dream.id}`);
    }
  };

  return (
    <div className="w-full">
      <Card className="p-6 mb-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Input
            placeholder="Search dreams..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {categories.map(cat => (
                <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div>
            <input
              type="range"
              min="1000"
              max="20000"
              step="500"
              value={priceFilter}
              onChange={(e) => setPriceFilter(parseInt(e.target.value))}
              className="w-full"
            />
            <p className="text-xs text-center text-slate-600 mt-1">Max: ${priceFilter.toLocaleString()}</p>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredDreams.map((dream) => (
          <Card key={dream.id} className="overflow-hidden hover:shadow-xl transition-shadow">
            <div className="relative h-56">
              <img src={dream.imageUrl} alt={dream.title} className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
              <Badge className="absolute top-3 right-3 bg-green-600 text-white">
                ${dream.budget.base.toLocaleString()}
              </Badge>
              <div className="absolute bottom-3 left-3 right-3">
                <h3 className="text-xl font-bold text-white">{dream.title}</h3>
                <p className="text-white/90 text-sm">{dream.tagline}</p>
              </div>
            </div>

            <div className="p-5">
              <div className="flex items-center gap-2 mb-3 text-sm text-slate-600">
                <MapPin className="w-4 h-4" />
                {dream.destination}
              </div>

              <div className="mb-4">
                <p className="text-xs font-semibold text-slate-500 mb-2">HIDDEN GEMS</p>
                {dream.hiddenGems.slice(0,2).map((gem, idx) => (
                  <p key={idx} className="text-xs text-slate-700 mb-1">
                    <Star className="w-3 h-3 inline text-amber-500" /> {gem.name}
                  </p>
                ))}
                <p className="text-xs text-purple-600">+{dream.hiddenGems.length - 2} more</p>
              </div>

              <Button 
                className="w-full bg-gradient-to-r from-purple-600 to-rose-600"
                onClick={() => handleSelectDream(dream)}
              >
                Select Dream
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default DreamLibraryBrowser;
