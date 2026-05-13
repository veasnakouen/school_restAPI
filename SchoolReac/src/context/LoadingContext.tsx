// e:\NexjsAndDotnet\School\src\SchoolReac\src\context\LoadingContext.tsx
import React, { createContext, useContext, useState, useCallback, useMemo } from 'react';

interface LoadingContextType {
  isLoading: boolean;
  incrementLoading: () => void;
  decrementLoading: () => void;
}

const LoadingContext = createContext<LoadingContextType | undefined>(undefined);

export const LoadingProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [loadingCount, setLoadingCount] = useState(0);

  const incrementLoading = useCallback(() => {
    setLoadingCount(prev => prev + 1);
  }, []);

  const decrementLoading = useCallback(() => {
    setLoadingCount(prev => Math.max(0, prev - 1));
  }, []);

  const isLoading = useMemo(() => loadingCount > 0, [loadingCount]);

  const value = useMemo(() => ({
    isLoading,
    incrementLoading,
    decrementLoading,
  }), [isLoading, incrementLoading, decrementLoading]);

  return (
    <LoadingContext.Provider value={value}>
      {children}
    </LoadingContext.Provider>
  );
};

export const useLoading = () => {
  const context = useContext(LoadingContext);
  if (context === undefined) {
    throw new Error('useLoading must be used within a LoadingProvider');
  }
  return context;
};