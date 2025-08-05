import React, { createContext, useContext, useState, ReactNode } from 'react';

interface MakuBotState {
  isOpen: boolean;
  userVertical: 'Family' | 'Solo' | 'Pet' | 'Spiritual';
  currentSearchContext?: {
    destination?: string;
    dates?: string;
    travelers?: number;
  };
}

interface MakuBotContextType {
  state: MakuBotState;
  openChat: () => void;
  closeChat: () => void;
  setUserVertical: (vertical: MakuBotState['userVertical']) => void;
  setSearchContext: (context: MakuBotState['currentSearchContext']) => void;
}

const MakuBotContext = createContext<MakuBotContextType | undefined>(undefined);

interface MakuBotProviderProps {
  children: ReactNode;
  defaultVertical?: MakuBotState['userVertical'];
}

export const MakuBotProvider: React.FC<MakuBotProviderProps> = ({ 
  children, 
  defaultVertical = 'Solo' 
}) => {
  const [state, setState] = useState<MakuBotState>({
    isOpen: false,
    userVertical: defaultVertical,
  });

  const openChat = () => {
    setState(prev => ({ ...prev, isOpen: true }));
  };

  const closeChat = () => {
    setState(prev => ({ ...prev, isOpen: false }));
  };

  const setUserVertical = (vertical: MakuBotState['userVertical']) => {
    setState(prev => ({ ...prev, userVertical: vertical }));
  };

  const setSearchContext = (context: MakuBotState['currentSearchContext']) => {
    setState(prev => ({ ...prev, currentSearchContext: context }));
  };

  const value: MakuBotContextType = {
    state,
    openChat,
    closeChat,
    setUserVertical,
    setSearchContext,
  };

  return (
    <MakuBotContext.Provider value={value}>
      {children}
    </MakuBotContext.Provider>
  );
};

export const useMakuBot = (): MakuBotContextType => {
  const context = useContext(MakuBotContext);
  if (!context) {
    throw new Error('useMakuBot must be used within a MakuBotProvider');
  }
  return context;
};