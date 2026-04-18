import React, { useEffect, useState } from 'react';
import { Snackbar, Alert } from '@mui/material';
import { useToast, Toast } from '../context/ToastContext';

export const ToastContainer: React.FC = () => {
  const { toasts, removeToast } = useToast();
  const [currentToast, setCurrentToast] = useState<Toast | null>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (toasts.length > 0 && !currentToast) {
      setCurrentToast(toasts[0]);
      setOpen(true);
    } else if (toasts.length === 0 && currentToast) {
      setOpen(false);
    }
  }, [toasts, currentToast]);

  const handleClose = (event?: React.SyntheticEvent | Event, reason?: string) => {
    if (reason === 'clickaway') {
      return;
    }
    setOpen(false);
  };

  const handleExited = () => {
    if (currentToast) {
      removeToast(currentToast.id);
      setCurrentToast(null);
    }
  };

  return (
    <Snackbar
      open={open}
      autoHideDuration={6000}
      onClose={handleClose}
      TransitionProps={{ onExited: handleExited }}
      anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
    >
      <Alert onClose={handleClose} severity={currentToast?.type || 'info'} variant="filled" sx={{ width: '100%' }}>
        {currentToast?.message}
      </Alert>
    </Snackbar>
  );
};