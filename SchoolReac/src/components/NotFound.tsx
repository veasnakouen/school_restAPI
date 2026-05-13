import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Typography, Button } from '@mui/material';

export const NotFound: React.FC = () => {
  const navigate = useNavigate();

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        textAlign: 'center',
        p: 3,
        bgcolor: 'background.default'
      }}
    >
      <Typography variant="h1" color="primary" fontWeight="bold" sx={{ fontSize: { xs: '6rem', md: '10rem' } }}>
        404
      </Typography>
      <Typography variant="h5" color="text.secondary" sx={{ mt: 2, mb: 4 }}>
        Oops! The page you are looking for does not exist or has been moved.
      </Typography>
      <Button variant="contained" color="primary" size="large" onClick={() => navigate('/dashboard')}>
        Return to Dashboard
      </Button>
    </Box>
  );
};