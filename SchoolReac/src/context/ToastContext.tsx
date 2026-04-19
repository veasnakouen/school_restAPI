import React, { createContext, useContext, useState, useCallback, ReactNode, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Alert, Box } from '@mui/material';

const TOAST_TIMEOUT = 5000; // 5 seconds

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface Toast {
  id: number;
  message: string;
  type: ToastType;
  timeout?: number;
}

interface ToastContextType {
  showToast: (message: string, type?: ToastType) => void;
  toasts: Toast[];
  removeToast: (id: number) => void;
}

const ToastContext = createContext<ToastContextType | null>(null);

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

// Customize your toast colors here! You can use Hex codes, RGB, or standard CSS colors.
const customColors: Record<ToastType, { bg: string; text: string }> = {
  success: { bg: '#10b981', text: '#ffffff' }, // Emerald Green
  error: { bg: '#ef4444', text: '#ffffff' },   // Vibrant Red
  warning: { bg: '#f59e0b', text: '#ffffff' }, // Amber Orange
  info: { bg: '#3b82f6', text: '#ffffff' },    // Bright Blue
};

const Toast: React.FC<{ toast: Toast, onRemove: (id: number) => void }> = ({ toast, onRemove }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onRemove(toast.id);
    }, toast.timeout || TOAST_TIMEOUT);

    return () => clearTimeout(timer);
  }, [toast, onRemove]);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: -50, scale: 0.5 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, x: 100, scale: 0.5, transition: { duration: 0.2 } }}
      transition={{ type: 'spring', stiffness: 300, damping: 25 }}
    >
      <Alert
        onClose={() => onRemove(toast.id)}
        severity={toast.type}
        elevation={6}
        variant="filled"
        sx={{ 
          width: '100%', 
          mb: 2, 
          boxShadow: 3,
          bgcolor: customColors[toast.type].bg,
          color: customColors[toast.type].text,
          '& .MuiAlert-icon': { color: customColors[toast.type].text }, // Updates the leading icon color
          '& .MuiAlert-action svg': { color: customColors[toast.type].text } // Updates the close 'x' button color
        }}
      >
        {toast.message}
      </Alert>
    </motion.div>
  );
};

const ToastContainer: React.FC = () => {
  const { toasts, removeToast } = useToast();
  return (
    <Box sx={{ position: 'fixed', top: 16, right: 16, zIndex: 9999, width: 'auto', maxWidth: 344 }}>
      <AnimatePresence>
        {toasts.map((toast) => (
          <Toast key={toast.id} toast={toast} onRemove={removeToast} />
        ))}
      </AnimatePresence>
    </Box>
  );
};

export const ToastProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = useCallback((message: string, type: ToastType = 'info') => {
    const id = Date.now() + Math.random(); // Add random to avoid collision
    setToasts(prevToasts => [{ id, message, type }, ...prevToasts]);
  }, []);

  const removeToast = useCallback((id: number) => {
    setToasts(prevToasts => prevToasts.filter(toast => toast.id !== id));
  }, []);

  const value = { showToast, toasts, removeToast };

  return (
    <ToastContext.Provider value={value}>
      {children}
      <ToastContainer />
    </ToastContext.Provider>
  );
};