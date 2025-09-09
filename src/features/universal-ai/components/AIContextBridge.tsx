import React, { useEffect } from 'react';
import { useUniversalAI } from '../context/UniversalAIContext';
import { useMakuBot } from '@/features/makuBot/context/MakuBotContext';
import { useAgenticBot } from '@/features/agenticBot/context/AgenticBotContext';

/**
 * AIContextBridge enables seamless context sharing between different AI systems
 * and maintains conversation continuity across dashboard switches
 */
export const AIContextBridge: React.FC = () => {
  const { currentContext, trackInteraction } = useUniversalAI();
  const { state: makuState, setUserVertical: setMakuVertical } = useMakuBot();
  const { state: agenticState, setUserVertical: setAgenticVertical } = useAgenticBot();

  // Sync user vertical across all AI systems
  useEffect(() => {
    if (currentContext.userVertical !== makuState.userVertical) {
      setMakuVertical(currentContext.userVertical);
    }
    if (currentContext.userVertical !== agenticState.userVertical) {
      setAgenticVertical(currentContext.userVertical);
    }
  }, [currentContext.userVertical, makuState.userVertical, agenticState.userVertical, setMakuVertical, setAgenticVertical]);

  // Track dashboard transitions for context continuity
  useEffect(() => {
    const handleContextSwitch = () => {
      trackInteraction({
        type: 'widget_opened',
        dashboardType: currentContext.currentDashboard,
        aiType: 'master',
        timestamp: new Date(),
        context: currentContext,
        metadata: {
          contextSwitch: true,
          previousActions: currentContext.recentActions.slice(-3)
        }
      });
    };

    // Debounce context switch tracking
    const timeoutId = setTimeout(handleContextSwitch, 500);
    return () => clearTimeout(timeoutId);
  }, [currentContext.currentDashboard]);

  return null; // This is a utility component with no UI
};

export default AIContextBridge;