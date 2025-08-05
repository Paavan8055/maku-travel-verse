import React, { createContext, useContext, useState, ReactNode } from 'react';

interface AgenticBotState {
  isOpen: boolean;
  userVertical: 'Family' | 'Solo' | 'Pet' | 'Spiritual';
  currentTaskId?: string;
  settings: {
    autoBook: boolean;
    maxBudget?: number;
    notifications: boolean;
  };
}

interface AgenticBotContextType {
  state: AgenticBotState;
  openPanel: () => void;
  closePanel: () => void;
  setUserVertical: (vertical: AgenticBotState['userVertical']) => void;
  setCurrentTask: (taskId: string | undefined) => void;
  updateSettings: (settings: Partial<AgenticBotState['settings']>) => void;
}

const AgenticBotContext = createContext<AgenticBotContextType | undefined>(undefined);

interface AgenticBotProviderProps {
  children: ReactNode;
  defaultVertical?: AgenticBotState['userVertical'];
}

export const AgenticBotProvider: React.FC<AgenticBotProviderProps> = ({ 
  children, 
  defaultVertical = 'Solo' 
}) => {
  const [state, setState] = useState<AgenticBotState>({
    isOpen: false,
    userVertical: defaultVertical,
    settings: {
      autoBook: false,
      notifications: true,
    }
  });

  const openPanel = () => {
    setState(prev => ({ ...prev, isOpen: true }));
  };

  const closePanel = () => {
    setState(prev => ({ ...prev, isOpen: false }));
  };

  const setUserVertical = (vertical: AgenticBotState['userVertical']) => {
    setState(prev => ({ ...prev, userVertical: vertical }));
  };

  const setCurrentTask = (taskId: string | undefined) => {
    setState(prev => ({ ...prev, currentTaskId: taskId }));
  };

  const updateSettings = (settings: Partial<AgenticBotState['settings']>) => {
    setState(prev => ({ 
      ...prev, 
      settings: { ...prev.settings, ...settings }
    }));
  };

  const value: AgenticBotContextType = {
    state,
    openPanel,
    closePanel,
    setUserVertical,
    setCurrentTask,
    updateSettings,
  };

  return (
    <AgenticBotContext.Provider value={value}>
      {children}
    </AgenticBotContext.Provider>
  );
};

export const useAgenticBot = (): AgenticBotContextType => {
  const context = useContext(AgenticBotContext);
  if (!context) {
    throw new Error('useAgenticBot must be used within an AgenticBotProvider');
  }
  return context;
};