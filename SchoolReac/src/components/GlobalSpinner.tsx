import React from 'react';
import { useAuth } from '../auth/AuthContext';
import { Backdrop, CircularProgress, Box, Typography } from '@mui/material';
import { alpha, useTheme as useMuiTheme } from '@mui/material/styles';
import { AnimatePresence, motion } from 'framer-motion';

interface GlobalSpinnerProps {
  open?: boolean;
  message?: string;
}

export const GlobalSpinner: React.FC<GlobalSpinnerProps> = ({ open, message }) => {
  const { isLoading, loadingMessage } = useAuth();
  const muiTheme = useMuiTheme();

  const isOpen = open ?? isLoading;
  const displayMessage = message ?? loadingMessage;

  return (
    <Backdrop
      sx={{
        color: '#fff',
        zIndex: (theme) => theme.zIndex.drawer + 10,
        backdropFilter: 'blur(6px)',
        backgroundColor: alpha(muiTheme.palette.background.default, 0.55),
      }}
      open={isOpen}
      transitionDuration={250}
    >
      <AnimatePresence>
        {isOpen && (
          <Box
            component={motion.div}
            initial={{ opacity: 0, scale: 0.9, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 6 }}
            transition={{ type: 'spring', stiffness: 340, damping: 26 }}
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 2,
              px: 4.5,
              py: 3.5,
              bgcolor: 'background.paper',
              borderRadius: 4,
              border: '1px solid',
              borderColor: alpha(muiTheme.palette.primary.main, 0.18),
              boxShadow: `0 18px 45px ${alpha(muiTheme.palette.common.black, 0.18)}`,
              color: 'text.primary',
              minWidth: 210,
            }}
          >
            <Box sx={{ position: 'relative', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
              <Box
                component={motion.div}
                animate={{ scale: [1, 1.28, 1], opacity: [0.45, 0.1, 0.45] }}
                transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
                sx={{
                  position: 'absolute',
                  width: 56,
                  height: 56,
                  borderRadius: '50%',
                  bgcolor: alpha(muiTheme.palette.primary.main, 0.25),
                }}
              />
              <CircularProgress color="primary" size={40} thickness={4} />
            </Box>
            {displayMessage && (
              <Typography variant="body2" sx={{ fontWeight: 600, letterSpacing: 0.2, textAlign: 'center' }}>
                {displayMessage}
              </Typography>
            )}
          </Box>
        )}
      </AnimatePresence>
    </Backdrop>
  );
};
