import React from 'react';
import { Link as RouterLink } from 'react-router-dom';
import { Box, Button, Stack, Typography } from '@mui/material';
import { Home as HomeIcon } from '@mui/icons-material';
import { PageTransition } from '../../components/PageTransition';
import { ThemeToggle } from '../../components/ThemeToggle';

export const NotFound: React.FC = () => {
  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        bgcolor: 'background.default',
        color: 'text.primary',
        position: 'relative',
        px: 3,
      }}
    >
      <Box sx={{ position: 'absolute', top: 20, right: 20 }}>
        <ThemeToggle />
      </Box>
      <PageTransition pageKey="not-found">
        <Stack spacing={2} sx={{ textAlign: 'center', alignItems: 'center' }}>
          <Typography
            variant="h1"
            sx={{ fontSize: { xs: '5rem', sm: '7.5rem' }, fontWeight: 900, opacity: 0.16, lineHeight: 1 }}
          >
            404
          </Typography>
          <Typography variant="h4" sx={{ fontWeight: 700 }}>
            Page not found
          </Typography>
          <Typography variant="body1" color="text.secondary">
            We can&apos;t find the page you&apos;re looking for.
          </Typography>
          <Button
            component={RouterLink}
            to="/dashboard"
            variant="contained"
            startIcon={<HomeIcon />}
            sx={{ mt: 1 }}
          >
            Go back home
          </Button>
        </Stack>
      </PageTransition>
    </Box>
  );
};
