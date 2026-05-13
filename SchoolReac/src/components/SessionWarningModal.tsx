import React from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, Typography } from '@mui/material';
import { useAuth } from '../auth/AuthContext';

export const SessionWarningModal: React.FC = () => {
  const { showExpirationWarning, extendSession, logout } = useAuth();

  return (
    <Dialog open={showExpirationWarning} disableEscapeKeyDown>
      <DialogTitle sx={{ color: 'warning.main', fontWeight: 'bold' }}>Session Expiring Soon</DialogTitle>
      <DialogContent dividers>
        <Typography>
          Your session is about to expire due to inactivity. For your security, you will be logged out automatically.
        </Typography>
        <Typography sx={{ mt: 2 }}>
          Would you like to extend your session?
        </Typography>
      </DialogContent>
      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button onClick={() => logout()} color="inherit">
          Log Out
        </Button>
        <Button onClick={extendSession} variant="contained" color="primary">
          Continue Session
        </Button>
      </DialogActions>
    </Dialog>
  );
};