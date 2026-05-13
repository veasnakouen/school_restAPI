import React from 'react';
import { useAuth } from '../auth/AuthContext';
import { Backdrop, CircularProgress, Box, Typography } from '@mui/material';

export const GlobalSpinner: React.FC = () => {
  const { isLoading, loadingMessage } = useAuth();

  return (
    <Backdrop
      sx={{
        color: '#fff',
        // Ensure it's above other elements like drawers or app bars
        zIndex: (theme) => theme.zIndex.drawer + 1,
        // A subtle glass effect
        backdropFilter: 'blur(3px)',
        backgroundColor: 'rgba(0, 0, 0, 0.3)',
      }}
      open={isLoading}
    >
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 2,
          p: 4,
          bgcolor: 'background.paper',
          borderRadius: 4,
          boxShadow: 24,
          color: 'text.primary',
        }}
      >
        <CircularProgress color="primary" />
        {loadingMessage && <Typography variant="body1" sx={{ mt: 1, fontWeight: 'medium' }}>{loadingMessage}</Typography>}
      </Box>
    </Backdrop>
  );
};