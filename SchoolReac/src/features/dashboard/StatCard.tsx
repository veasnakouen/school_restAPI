import React from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, Typography, Box, Skeleton, Button } from "@mui/material";
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';

interface StatCardProps {
  icon: React.ReactNode;
  title: string;
  value: number | string;
  link: string;
  linkText: string;
  color: string;
  loading: boolean;
}

export const StatCard: React.FC<StatCardProps> = ({ icon, title, value, link, linkText, color, loading }) => (
  <Card sx={{ display: 'flex', flexDirection: 'column', borderLeft: 4, borderColor: color }}>
    <CardContent sx={{ flexGrow: 1 }}>
      <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
        <Box sx={{ fontSize: '2.5rem', color: 'text.secondary' }}>{icon}</Box>
        <Box>
          <Typography variant="body1" color="text.secondary">{title}</Typography>
          {loading ? (
            <Skeleton variant="text" width={80} height={48} />
          ) : (
            <Typography variant="h4" component="p" fontWeight="bold">{value}</Typography>
          )}
        </Box>
      </Box>
    </CardContent>
    <Box sx={{ p: 1, display: 'flex', justifyContent: 'flex-end' }}>
      <Button component={Link} to={link} size="small" endIcon={<ArrowForwardIcon fontSize="small" />}>
        {linkText}
      </Button>
    </Box>
  </Card>
);