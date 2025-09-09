import React, { useEffect, useState } from 'react';
import { useUniversalAI } from '../context/UniversalAIContext';
import { useIntelligentBotOrchestration } from '../hooks/useIntelligentBotOrchestration';

interface PersonalizationEngineProps {
  children: React.ReactNode;
}

export const PersonalizationEngine: React.FC<PersonalizationEngineProps> = ({ children }) => {
  const { 
    currentContext, 
    getPersonalizationData, 
    updatePreferences,
    aiInteractions 
  } = useUniversalAI();
  
  const { getOptimalBot } = useIntelligentBotOrchestration();
  const [personalizationScore, setPersonalizationScore] = useState(0);

  useEffect(() => {
    const personalizeExperience = () => {
      const data = getPersonalizationData();
      
      // Auto-adjust preferred AI based on success patterns
      if (data.preferredAIType && data.preferredAIType !== currentContext.preferences.preferredAI) {
        updatePreferences({ preferredAI: data.preferredAIType as any });
      }
      
      // Adjust response style based on success factors
      const conciseSuccess = data.successFactors.conciseQueries || 0;
      if (conciseSuccess > 0.8 && currentContext.preferences.responseStyle !== 'concise') {
        updatePreferences({ responseStyle: 'concise' });
      }
      
      // Calculate personalization effectiveness
      const recentInteractions = aiInteractions.slice(0, 20);
      const successRate = recentInteractions.filter(i => i.success).length / recentInteractions.length || 0;
      const responseTime = recentInteractions
        .filter(i => i.duration)
        .reduce((sum, i) => sum + (i.duration || 0), 0) / recentInteractions.filter(i => i.duration).length || 0;
      
      // Score based on success rate (60%) + response time efficiency (40%)
      const timeScore = Math.max(0, 1 - (responseTime - 1000) / 3000);
      const score = Math.round((successRate * 0.6 + timeScore * 0.4) * 100);
      setPersonalizationScore(score);
    };

    if (aiInteractions.length > 5) {
      personalizeExperience();
    }
  }, [aiInteractions, currentContext, getPersonalizationData, updatePreferences]);

  return (
    <div data-personalization-score={personalizationScore}>
      {children}
    </div>
  );
};

export default PersonalizationEngine;