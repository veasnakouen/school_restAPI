import React, { useState, useEffect } from 'react';
import { Box, Typography, Card, CardContent, Grid, TextField, Switch, FormControlLabel, Button, Divider, Alert, CircularProgress } from '@mui/material';
import { useToast } from '../../context/ToastContext';
import { getSystemSettings, updateSystemSettings, SystemSettingsDto } from '../../services/api';

export const SystemSettings: React.FC = () => {
  const { showToast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  
  const [settings, setSettings] = useState<SystemSettingsDto>({
    siteName: '',
    contactEmail: '',
    allowRegistration: false,
    requireEmailVerification: false,
    maintenanceMode: false,
    defaultToDarkMode: false,
  });

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const data = await getSystemSettings();
        setSettings(data);
      } catch (err) {
        console.warn('Failed to load settings from server, using defaults:', err);
      } finally {
        setIsLoading(false);
      }
    };
    void fetchSettings();
  }, []);

  const handleChange = (field: keyof SystemSettingsDto, value: string | boolean) => {
    setSettings(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const updatedSettings = await updateSystemSettings(settings);
      setSettings(updatedSettings);
      showToast('System settings saved successfully', 'success');
    } catch (err: any) {
      showToast(err.response?.data?.title || 'Failed to save system settings.', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) return <Box sx={{ display: 'flex', justifyContent: 'center', p: 8 }}><CircularProgress /></Box>;

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      <Box>
        <Typography variant="h5" fontWeight="bold">System Configuration</Typography>
        <Typography variant="body2" color="text.secondary">
          Configure global application preferences, security policies, and maintenance modes.
        </Typography>
      </Box>

      <Grid container spacing={3}>
        {/* General Settings Card */}
        <Grid item xs={12} md={6}>
          <Card sx={{ height: '100%', boxShadow: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>General</Typography>
              <Divider sx={{ mb: 3 }} />
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                <TextField
                  label="Site Name"
                  value={settings.siteName}
                  onChange={(e) => handleChange('siteName', e.target.value)}
                  fullWidth
                  variant="outlined"
                />
                <TextField
                  label="Support Contact Email"
                  type="email"
                  value={settings.contactEmail}
                  onChange={(e) => handleChange('contactEmail', e.target.value)}
                  fullWidth
                  variant="outlined"
                />
                <FormControlLabel
                  control={<Switch checked={settings.defaultToDarkMode} onChange={(e) => handleChange('defaultToDarkMode', e.target.checked)} color="secondary" />}
                  label="Default to Dark Mode for New Users"
                />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Security & Access Card */}
        <Grid item xs={12} md={6}>
          <Card sx={{ height: '100%', boxShadow: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>Security & Access</Typography>
              <Divider sx={{ mb: 2 }} />
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                <FormControlLabel
                  control={<Switch checked={settings.allowRegistration} onChange={(e) => handleChange('allowRegistration', e.target.checked)} color="primary" />}
                  label="Allow New User Registration"
                />
                <FormControlLabel
                  control={<Switch checked={settings.requireEmailVerification} onChange={(e) => handleChange('requireEmailVerification', e.target.checked)} color="primary" />}
                  label="Require Email Verification"
                />
                <Box sx={{ mt: 2 }}>
                  <Alert severity="warning" sx={{ mb: 2 }}>
                    Enabling maintenance mode will disconnect all non-admin users.
                  </Alert>
                  <FormControlLabel
                    control={<Switch checked={settings.maintenanceMode} onChange={(e) => handleChange('maintenanceMode', e.target.checked)} color="error" />}
                    label="Enable Maintenance Mode"
                  />
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
        <Button variant="contained" color="primary" size="large" onClick={handleSave} disabled={isSaving}>
          {isSaving ? <CircularProgress size={24} sx={{ color: 'inherit', mr: 1 }} /> : null}
          {isSaving ? 'Saving...' : 'Save Settings'}
        </Button>
      </Box>
    </Box>
  );
};