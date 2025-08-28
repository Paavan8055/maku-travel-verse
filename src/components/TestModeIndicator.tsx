import { Badge } from '@/components/ui/badge';
import { AlertTriangle } from 'lucide-react';

const TestModeIndicator = () => {
  // Only show in development or if explicitly enabled
  const showTestMode = process.env.NODE_ENV === 'development' || 
                      window.location.hostname === 'localhost' ||
                      window.location.search.includes('test=true');

  if (!showTestMode) return null;

  return (
    <div className="fixed top-4 left-4 z-50">
      <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 border-yellow-300">
        <AlertTriangle className="h-3 w-3 mr-1" />
        Test Mode
      </Badge>
    </div>
  );
};

export default TestModeIndicator;