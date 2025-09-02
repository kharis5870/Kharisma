import { createContext, useContext, useState, ReactNode } from 'react';
import { PPLMaster } from '@shared/api';

interface PPLContextType {
  selectedPPLsForActivity: PPLMaster[];
  setSelectedPPLsForActivity: (ppls: PPLMaster[]) => void;
  clearSelectedPPLsForActivity: () => void;
}

const PPLContext = createContext<PPLContextType | undefined>(undefined);

export const usePPL = () => {
  const context = useContext(PPLContext);
  if (!context) {
    throw new Error('usePPL must be used within a PPLProvider');
  }
  return context;
};

export const PPLProvider = ({ children }: { children: ReactNode }) => {
  const [selectedPPLsForActivity, setSelectedPPLsForActivityState] = useState<PPLMaster[]>([]);

  const setSelectedPPLsForActivity = (ppls: PPLMaster[]) => {
    setSelectedPPLsForActivityState(ppls);
  };

  const clearSelectedPPLsForActivity = () => {
    setSelectedPPLsForActivityState([]);
  };

  return (
    <PPLContext.Provider value={{ selectedPPLsForActivity, setSelectedPPLsForActivity, clearSelectedPPLsForActivity }}>
      {children}
    </PPLContext.Provider>
  );
};
