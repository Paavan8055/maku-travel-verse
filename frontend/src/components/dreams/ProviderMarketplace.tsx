import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Target, Star, Check, ArrowRight, TestTube2, TrendingDown, Hotel } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';

const ProviderMarketplace = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [offers] = useState([]);

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Provider Marketplace</h1>
        <p className="text-slate-600">Hotels & airlines competing for your business</p>
      </div>

      <Card className="p-12 text-center">
        <Target className="w-16 h-16 text-slate-300 mx-auto mb-4" />
        <h3 className="text-xl font-semibold mb-2">No Offers Yet</h3>
        <p className="text-slate-600 mb-6">Create a dream to get exclusive offers!</p>
        <Button onClick={() => navigate('/smart-dreams?tab=library')} size="lg">
          Browse Dream Library
        </Button>
      </Card>
    </div>
  );
};

export default ProviderMarketplace;