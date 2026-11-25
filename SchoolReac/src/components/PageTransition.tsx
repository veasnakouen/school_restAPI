import React from 'react';
import { Box } from '@mui/material';
import { alpha, useTheme as useMuiTheme } from '@mui/material/styles';
import { AnimatePresence, motion } from 'framer-motion';

interface PageTransitionProps {
  pageKey: string | number;
  variant?: 'page' | 'tab';
  children: React.ReactNode;
}

const TRANSITION_EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];

/**
 * Lightweight, snappy entrance transition for top-level routes and tab panels.
 * Runs GPU-composited opacity and subtle glide (~120-160ms) without delaying navigation.
 */
export const PageTransition: React.FC<PageTransitionProps> = ({
  pageKey,
  variant = 'page',
  children,
}) => {
  const yOffset = variant === 'page' ? 8 : 4;
  const duration = variant === 'page' ? 0.16 : 0.12;

  return (
    <Box
      component={motion.div}
      key={pageKey}
      initial={{ opacity: 0, y: yOffset }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration, ease: TRANSITION_EASE }}
      sx={{ width: '100%', willChange: 'transform, opacity' }}
    >
      {children}
    </Box>
  );
};

interface RouteLoadingBarProps {
  loading: boolean;
}

/**
 * Top edge progress sweep visible only while API requests or lazy chunks are actively loading.
 */
export const RouteLoadingBar: React.FC<RouteLoadingBarProps> = ({ loading }) => {
  const muiTheme = useMuiTheme();

  return (
    <AnimatePresence>
      {loading && (
        <Box
          component={motion.div}
          key="route-loading-bar"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          sx={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            height: 3,
            overflow: 'hidden',
            pointerEvents: 'none',
            background: `linear-gradient(90deg, ${alpha(muiTheme.palette.primary.main, 0.15)}, ${muiTheme.palette.primary.main}, ${muiTheme.palette.secondary.main}, ${muiTheme.palette.primary.main})`,
            backgroundSize: '200% 100%',
            animation: 'route-bar-shimmer 1.05s linear infinite',
          }}
        />
      )}
    </AnimatePresence>
  );
};
