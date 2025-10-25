/**
 * Dream Library Browser Component
 * Displays curated dream packages by expert travelers
 * Users browse, select, and customize pre-made dreams
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Sparkles, Heart, MapPin, Calendar, DollarSign, Users,
  Star, TrendingUp, Zap, ArrowRight, Filter, Search, TestTube2
} from 'lucide-react';
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
  const [selectedAgeGroup, setSelectedAgeGroup] = useState<string>('all');
  const [priceFilter, setPriceFilter] = useState<number>(20000);
  const [searchQuery, setSearchQuery] = useState('');

  const categories = [
    { id: 'all', name: 'All Dreams', icon: '🌍' },
    { id: 'romantic-luxury', name: 'Romantic', icon: '💑' },
    { id: 'cultural-family', name: 'Cultural', icon: '👨‍👩‍👧‍👦' },
    { id: 'adventure-wildlife', name: 'Adventure', icon: '🦁' },
    { id: 'wellness-cultural', name: 'Wellness', icon: '🧘' },
    { id: 'digital-nomad-budget', name: 'Digital Nomad', icon: '💻' },
    { id: 'senior-luxury', name: 'Senior Friendly', icon: '🎭' }
  ];

  const ageGroups = [
    { id: 'all', name: 'All Ages' },
    { id: 'young-adults', name: 'Young Adults' },
    { id: 'couples', name: 'Couples' },
    { id: 'families', name: 'Families' },
    { id: 'seniors', name: 'Seniors' }
  ];

  const filteredDreams = dreamLibrary.filter(dream => {
    const matchesCategory = selectedCategory === 'all' || dream.category === selectedCategory;
    const matchesAge = selectedAgeGroup === 'all' || dream.ageGroup.includes(selectedAgeGroup);
    const matchesPrice = dream.budget.base <= priceFilter;
    const matchesSearch = searchQuery === '' || 
      dream.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      dream.destination.toLowerCase().includes(searchQuery.toLowerCase());
    
    return matchesCategory && matchesAge && matchesPrice && matchesSearch;
  });

  const handleSelectDream = (dream: DreamPackage) => {
    sessionStorage.setItem('selectedDream', JSON.stringify(dream));
    
    toast({
      title: "Dream Selected! ✨",
      description: `${dream.title} - Setting up your Travel Fund`
    });

    navigate(`/travel-fund?dreamId=${dream.id}&source=smart-dream`);
  };

  return (
    <div className=\"w-full\">\n      {/* Filters */}\n      <Card className=\"p-6 mb-8\">\n        <div className=\"grid grid-cols-1 md:grid-cols-4 gap-4\">\n          <div>\n            <Input\n              placeholder=\"Search dreams...\"\n              value={searchQuery}\n              onChange={(e) => setSearchQuery(e.target.value)}\n            />\n          </div>\n\n          <Select value={selectedCategory} onValueChange={setSelectedCategory}>\n            <SelectTrigger>\n              <SelectValue placeholder=\"Category\" />\n            </SelectTrigger>\n            <SelectContent>\n              {categories.map(cat => (\n                <SelectItem key={cat.id} value={cat.id}>\n                  {cat.icon} {cat.name}\n                </SelectItem>\n              ))}\n            </SelectContent>\n          </Select>\n\n          <Select value={selectedAgeGroup} onValueChange={setSelectedAgeGroup}>\n            <SelectTrigger>\n              <SelectValue placeholder=\"Age Group\" />\n            </SelectTrigger>\n            <SelectContent>\n              {ageGroups.map(age => (\n                <SelectItem key={age.id} value={age.id}>{age.name}</SelectItem>\n              ))}\n            </SelectContent>\n          </Select>\n\n          <div>\n            <label className=\"text-xs text-gray-600 mb-1 block\">Max: ${priceFilter.toLocaleString()}</label>\n            <input\n              type=\"range\"\n              min=\"1000\"\n              max=\"20000\"\n              step=\"500\"\n              value={priceFilter}\n              onChange={(e) => setPriceFilter(parseInt(e.target.value))}\n              className=\"w-full\"\n            />\n          </div>\n        </div>\n\n        <p className=\"mt-4 text-center text-sm text-gray-600\">\n          {filteredDreams.length} dreams found\n        </p>\n      </Card>\n\n      {/* Dream Grid */}\n      <div className=\"grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6\">\n        {filteredDreams.map((dream) => (\n          <Card key={dream.id} className=\"overflow-hidden hover:shadow-2xl transition-shadow\">\n            <div className=\"relative h-56\">\n              <img src={dream.imageUrl} alt={dream.title} className=\"w-full h-full object-cover\" />\n              <div className=\"absolute inset-0 bg-gradient-to-t from-black/60 to-transparent\" />\n              <Badge className=\"absolute top-3 right-3 bg-green-600 text-white\">\n                ${dream.budget.base.toLocaleString()}\n              </Badge>\n              <div className=\"absolute bottom-3 left-3 right-3\">\n                <h3 className=\"text-xl font-bold text-white\">{dream.title}</h3>\n                <p className=\"text-white/90 text-sm\">{dream.tagline}</p>\n              </div>\n            </div>\n\n            <div className=\"p-5\">\n              <div className=\"flex items-center gap-2 mb-3 text-sm text-gray-600\">\n                <MapPin className=\"w-4 h-4\" />\n                {dream.destination}\n              </div>\n\n              <div className=\"mb-4\">\n                <p className=\"text-xs font-semibold text-gray-500 mb-2\">HIDDEN GEMS</p>\n                {dream.hiddenGems.slice(0,2).map((gem, idx) => (\n                  <p key={idx} className=\"text-xs text-gray-700 mb-1\">\n                    ✨ {gem.name}: {gem.mustTry}\n                  </p>\n                ))}\n                <p className=\"text-xs text-purple-600\">+{dream.hiddenGems.length - 2} more...</p>\n              </div>\n\n              <div className=\"flex gap-2 mb-4\">\n                {dream.providers.map((p, i) => (\n                  <Badge key={i} variant=\"outline\" className=\"text-xs\">\n                    🧪 {p.split(' ')[0]}\n                  </Badge>\n                ))}\n              </div>\n\n              <Button \n                className=\"w-full bg-gradient-to-r from-purple-600 to-pink-600\"\n                onClick={() => handleSelectDream(dream)}\n              >\n                Select & Setup Travel Fund\n                <ArrowRight className=\"w-4 h-4 ml-2\" />\n              </Button>\n            </div>\n          </Card>\n        ))}\n      </div>\n    </div>\n  );\n};\n\nexport default DreamLibraryBrowser;\n