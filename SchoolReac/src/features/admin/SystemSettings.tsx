import React, { useState, useEffect } from 'react';
import { Box, Typography, Card, CardContent, Grid, TextField, Switch, FormControlLabel, Button, Divider, Alert, CircularProgress, Avatar, Autocomplete, Chip } from '@mui/material';
import { CloudUpload as CloudUploadIcon } from '@mui/icons-material';
import { useToast } from '../../context/ToastContext';
import { getSystemSettings, updateSystemSettings, SystemSettingsDto } from '../../services/api';
import { PaymentSettings } from './PaymentSetting';
import KHQRGenerator from './Khqrgenerate';

const AVAILABLE_EXPORT_FIELDS = [
  'Item Name', 'Code Number', 'Brand', 'Department', 'Quality', 'Condition', 
  'Price', 'Voucher Number', 'Purchase Date', 'Responsible Person', 
  'Supplier', 'Donor', 'Description', 'Specs', 'Created Date', 'Category'
];

export const SystemSettings: React.FC = () => {
  const { showToast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  
  const [settings, setSettings] = useState<SystemSettingsDto>({
    siteName: '',
    logoBase64: '',
    contactEmail: '',
    allowRegistration: false,
    requireEmailVerification: false,
    maintenanceMode: false,
    defaultToDarkMode: false,
    // Payment settings defaults
    defaultCurrency: 'USD',
    bankAccountName: '',
    bankAccountNumber: '',
    bankRoutingNumber: '',
    stripePublicKey: '',
    enableOnlinePayments: false,
    bankQrCodeBase64: '',
    allowedCorsOrigins: '',
    productExportFields: '',
  });

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const data = await getSystemSettings();
        
        // Fallback: If backend doesn't support storing productExportFields yet, load it from localStorage
        const localExportFields = localStorage.getItem('productExportFields');
        if (data && !data.productExportFields && localExportFields !== null) {
          data.productExportFields = localExportFields;
        }
        
        setSettings(data || settings); // Use existing settings as fallback
      } catch (err: any) {
        if (err.response?.status !== 404) {
          console.warn('Failed to load settings from server, using defaults:', err);
        }
      } finally {
        setIsLoading(false);
      }
    };
    void fetchSettings();
  }, []);

  const handleChange = (field: keyof SystemSettingsDto, value: string | boolean) => {
    setSettings(prev => ({ ...prev, [field]: value }));
  };

  const handleLogoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      const img = new Image();
      img.onload = () => {
        const MAX_SIZE = 256;
        let { width, height } = img;
        
        if (width > height && width > MAX_SIZE) {
          height *= MAX_SIZE / width;
          width = MAX_SIZE;
        } else if (height > MAX_SIZE) {
          width *= MAX_SIZE / height;
          height = MAX_SIZE;
        }
        
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const dataUrl = canvas.toDataURL(file.type === 'image/jpeg' ? 'image/jpeg' : 'image/png');
          handleChange('logoBase64', dataUrl.includes(',') ? dataUrl.split(',')[1] : dataUrl);
        } else {
          const result = reader.result as string;
          handleChange('logoBase64', result.includes(',') ? result.split(',')[1] : result);
        }
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
    event.target.value = ''; // Reset input to allow re-uploading the same file
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const updatedSettings = await updateSystemSettings(settings);
      
      // Fallback: Save to localStorage in case the C# backend drops the field
      if (settings.productExportFields !== undefined) {
        localStorage.setItem('productExportFields', settings.productExportFields);
      }

      // After saving, merge the response from the server with the current state
      // to ensure any just-uploaded (but not yet saved) images are preserved visually.
      setSettings(prev => ({ 
        ...prev, 
        ...updatedSettings,
        logoBase64: updatedSettings.logoBase64 || prev.logoBase64,
        bankQrCodeBase64: updatedSettings.bankQrCodeBase64 || prev.bankQrCodeBase64,
        productExportFields: updatedSettings.productExportFields || settings.productExportFields
      }));
      showToast('System settings saved successfully', 'success');
      
      // Dispatch a custom event so other components (like Sidebar/Navbar) can instantly reload the logo
      window.dispatchEvent(new CustomEvent('brandingUpdated', { 
        detail: { logoBase64: updatedSettings.logoBase64 || settings.logoBase64 } 
      }));
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
        <Grid size={{ xs: 12, md: 6 }}>
          <Card sx={{ height: '100%', boxShadow: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>General</Typography>
              <Divider sx={{ mb: 3 }} />
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, mb: 1 }}>
                  <Avatar src={settings.logoBase64 ? (settings.logoBase64.startsWith('data:') ? settings.logoBase64 : `data:image/png;base64,${settings.logoBase64}`) : undefined} sx={{ width: 120, height: 120, bgcolor: 'grey.200' }} variant="rounded" />
                  <Button component="label" variant="outlined" startIcon={<CloudUploadIcon />}>
                    Upload Logo
                    <input type="file" style={{ display: 'none' }} accept="image/*" onChange={handleLogoUpload} />
                  </Button>
                </Box>
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
        <Grid size={{ xs: 12, md: 6 }}>
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
                <Box sx={{ mt: 2 }}>
                  <Typography variant="subtitle2" gutterBottom>CORS Configuration</Typography>
                  <TextField
                    label="Allowed CORS Origins"
                    value={settings.allowedCorsOrigins || ''}
                    onChange={(e) => handleChange('allowedCorsOrigins', e.target.value)}
                    fullWidth
                    variant="outlined"
                    placeholder="http://localhost:3000, https://myapp.com"
                    helperText="Comma-separated list of allowed origins. Leave empty to allow all."
                  />
                </Box>
                <Box sx={{ mt: 2 }}>
                  <Typography variant="subtitle2" gutterBottom>Export Configuration</Typography>
                  <Autocomplete
                    multiple
                    freeSolo
                    options={AVAILABLE_EXPORT_FIELDS}
                    value={settings.productExportFields ? settings.productExportFields.split(',').map(s => s.trim()).filter(Boolean) : []}
                    onChange={(_event, newValue) => {
                      handleChange('productExportFields', newValue.join(', '));
                    }}
                    renderTags={(value: readonly string[], getTagProps) =>
                      value.map((option: string, index: number) => {
                        const { key, ...tagProps } = getTagProps({ index });
                        return <Chip key={key} variant="outlined" label={option} size="small" {...tagProps} />;
                      })
                    }
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        variant="outlined"
                        label="Product Export Fields"
                        placeholder="e.g. Category, Brand, Price"
                        helperText="Select or type fields to include in Product PDF/Image exports. Leave empty to include all."
                      />
                    )}
                  />
                </Box>
              </Box>
              <Box>
                {/* <KHQRGenerator/> */}
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <PaymentSettings settings={settings} setSettings={setSettings} isSaving={isSaving} />
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
        <Button variant="contained" color="primary" size="large" onClick={handleSave} disabled={isSaving}>
          {isSaving ? <CircularProgress size={24} sx={{ color: 'inherit', mr: 1 }} /> : null}
          {isSaving ? 'Saving...' : 'Save Settings'}
        </Button>
      </Box>
    </Box>
  );
};