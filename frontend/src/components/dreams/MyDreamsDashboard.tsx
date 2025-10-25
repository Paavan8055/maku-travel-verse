import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Wallet, Users, Gift, Target, Plus, ArrowRight } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';

const MyDreamsDashboard = () => {
  const navigate = useNavigate();
  const [dreams] = useState([]);

  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">My Dreams</h1>
          <p className="text-slate-600">Track your journeys and offers</p>
        </div>
        <Button onClick={() => navigate('/smart-dreams?tab=library')} size="lg">
          <Plus className="w-4 h-4 mr-2" />
          New Dream
        </Button>
      </div>

      {dreams.length === 0 && (
        <Card className="p-12 text-center">
          <Wallet className="w-16 h-16 text-slate-300 mx-auto mb-4" />
          <h3 className="text-xl font-semibold mb-2">No Dreams Yet</h3>
          <p className="text-slate-600 mb-6">Browse expert-curated dream packages</p>
          <Button onClick={() => navigate('/smart-dreams?tab=library')} size="lg">
            <Plus className="w-4 h-4 mr-2" />
            Browse Dream Library
          </Button>
        </Card>
      )}
    </div>
  );
};

export default MyDreamsDashboard;