import React from 'react';
import { useAgenticBot } from '../context/AgenticBotContext';
import { useAgenticTasks } from '../hooks/useAgenticTasks';
import AgenticLauncher from './AgenticLauncher';
import AgenticPanel from './AgenticPanel';

import { AgenticBotEnhanced } from '@/features/agenticBot/components/AgenticBotEnhanced';

const AgenticWidget: React.FC = () => {
  const { state, openPanel, closePanel } = useAgenticBot();
  const { activeTaskCount, overallStatus } = useAgenticTasks();

  return (
    <>
      <AgenticLauncher
        isOpen={state.isOpen}
        onToggle={openPanel}
        status={overallStatus}
        activeTaskCount={activeTaskCount}
      />
      
      <AgenticPanel
        isOpen={state.isOpen}
        onClose={closePanel}
        userVertical={state.userVertical}
      />

      {/* Enhanced AI Assistant */}
      <AgenticBotEnhanced 
        userVertical={state.userVertical?.toLowerCase() as 'family' | 'solo' | 'pet' | 'spiritual' || 'family'}
      />
    </>
  );
};

export default AgenticWidget;