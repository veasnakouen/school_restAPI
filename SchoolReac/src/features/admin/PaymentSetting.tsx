import React, { useState, useEffect, useRef } from "react";
import {
  Box,
  Typography,
  TextField,
  Button,
  Card,
  CardContent,
  Divider,
  Switch,
  FormControlLabel,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
} from "@mui/material";
import {
  Save as SaveIcon,
  AccountBalance as BankIcon,
  CloudUpload as CloudUploadIcon,
} from "@mui/icons-material";
import ReactCrop, { type Crop, type PixelCrop } from "react-image-crop";
import * as api from "../../services/api"; // Adjust path
import { useToast } from "../../context/ToastContext"; // Adjust path
import "react-image-crop/dist/ReactCrop.css";

interface PaymentSettingsProps {
  settings: api.SystemSettingsDto;
  setSettings: React.Dispatch<React.SetStateAction<api.SystemSettingsDto>>;
  isSaving: boolean;
}

export const PaymentSettings: React.FC<PaymentSettingsProps> = ({ settings, setSettings, isSaving }) => {
  const { showToast } = useToast();
  const [isTesting, setIsTesting] = useState(false);

  // QR Code Cropping State
  const [cropModalOpen, setCropModalOpen] = useState(false);
  const [cropImgSrc, setCropImgSrc] = useState<string>('');
  const [crop, setCrop] = useState<Crop>();
  const [completedCrop, setCompletedCrop] = useState<PixelCrop | null>(null);
  const imgRef = useRef<HTMLImageElement>(null);

  const handleTestStripe = async () => {
    if (!settings.stripePublicKey) {
      showToast("Please enter a Stripe key first.", "warning");
      return;
    }
    setIsTesting(true);
    try {
      const res = await api.testStripeApiKey(settings.stripePublicKey!);
      showToast(res.message || "Stripe API Key is valid!", "success");
    } catch (err: any) {
      showToast(err.response?.data?.title || "Invalid Stripe API Key.", "error");
    } finally {
      setIsTesting(false);
    }
  };

  const handleQrUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (file.size > 4 * 1024 * 1024) { // 4MB limit
      showToast("Image file is too large (max 4MB).", "error");
      return;
    }
    const reader = new FileReader();
    reader.addEventListener('load', () => {
      setCropImgSrc(reader.result?.toString() || '');
      setCropModalOpen(true);
    });
    reader.readAsDataURL(file);
    event.target.value = ''; // Reset input to allow re-uploading the same file
  };

  const handleSaveCrop = async () => {
    if (imgRef.current) {
      const cropWidth = completedCrop?.width || imgRef.current.width;
      const cropHeight = completedCrop?.height || imgRef.current.height;
      const cropX = completedCrop?.x || 0;
      const cropY = completedCrop?.y || 0;

      const canvas = document.createElement('canvas');
      const scaleX = imgRef.current.naturalWidth / imgRef.current.width;
      const scaleY = imgRef.current.naturalHeight / imgRef.current.height;

      const MAX_DIMENSION = 512;
      const actualCropWidth = cropWidth * scaleX;
      const actualCropHeight = cropHeight * scaleY;
      
      let targetWidth = actualCropWidth;
      let targetHeight = actualCropHeight;

      if (targetWidth > MAX_DIMENSION || targetHeight > MAX_DIMENSION) {
        if (targetWidth > targetHeight) {
          targetHeight = (targetHeight / targetWidth) * MAX_DIMENSION;
          targetWidth = MAX_DIMENSION;
        } else {
          targetWidth = (targetWidth / targetHeight) * MAX_DIMENSION;
          targetHeight = MAX_DIMENSION;
        }
      }

      canvas.width = targetWidth;
      canvas.height = targetHeight;
      const ctx = canvas.getContext('2d');

      if (ctx) {
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(imgRef.current, cropX * scaleX, cropY * scaleY, actualCropWidth, actualCropHeight, 0, 0, targetWidth, targetHeight);
        const dataUrl = canvas.toDataURL('image/png', 0.95);
        const base64Image = dataUrl.includes(',') ? dataUrl.split(',')[1] : dataUrl;
        setSettings({ ...settings, bankQrCodeBase64: base64Image });
        setCropModalOpen(false);
      }
    } else {
      setCropModalOpen(false);
    }
  };

  return (
    <Card sx={{ maxWidth: 800, mx: "auto", mt: 4, boxShadow: 3 }}>
      <CardContent sx={{ p: 4 }}>
        <Box sx={{ display: "flex", alignItems: "center", mb: 3, gap: 1 }}>
          <BankIcon color="primary" fontSize="large" />
          <Typography variant="h5" fontWeight="bold">
            Payment Configuration
          </Typography>
        </Box>

        <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
          <FormControlLabel
            control={
              <Switch
                checked={settings.enableOnlinePayments || false}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    enableOnlinePayments: e.target.checked,
                  })
                }
              />
            }
            label="Enable Online Payments (Stripe / Credit Card)"
          />

          <Divider>Bank Transfer Details</Divider>

          <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 3 }}>
            <TextField
              label="Default Currency"
              value={settings.defaultCurrency || ''}
              onChange={(e) =>
                setSettings({ ...settings, defaultCurrency: e.target.value })
              }
              fullWidth
            />
            <TextField
              label="Bank Account Name"
              value={settings.bankAccountName || ''}
              onChange={(e) =>
                setSettings({ ...settings, bankAccountName: e.target.value })
              }
              fullWidth
            />
            <TextField
              label="Account Number"
              value={settings.bankAccountNumber || ''}
              onChange={(e) =>
                setSettings({ ...settings, bankAccountNumber: e.target.value })
              }
              fullWidth
            />
            <TextField
              label="Routing / Swift Number"
              value={settings.bankRoutingNumber || ''}
              onChange={(e) =>
                setSettings({ ...settings, bankRoutingNumber: e.target.value })
              }
              fullWidth
            />
          </Box>

          <Box sx={{ display: "flex", flexDirection: "column", gap: 2, mt: 2 }}>
            <Typography variant="subtitle2" color="text.secondary">
              Bank QR Code (Optional)
            </Typography>
            <Box sx={{ display: "flex", alignItems: "center", gap: 3 }}>
              <Box
                sx={{
                  width: 120,
                  height: 120,
                  border: "2px dashed",
                  borderColor: "divider",
                  borderRadius: 2,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  overflow: "hidden",
                  bgcolor: "background.default",
                }}
              >
                {settings.bankQrCodeBase64 ? (
                  <img
                    src={settings.bankQrCodeBase64.startsWith('data:') ? settings.bankQrCodeBase64 : `data:image/png;base64,${settings.bankQrCodeBase64}`}
                    alt="Bank QR Code"
                    style={{ width: "100%", height: "100%", objectFit: "contain" }}
                  />
                ) : (
                  <Typography variant="caption" color="text.secondary">
                    No QR Code
                  </Typography>
                )}
              </Box>
              <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
                <Button variant="outlined" component="label" startIcon={<CloudUploadIcon />}>
                  Upload QR Code
                  <input type="file" hidden accept="image/*" onChange={handleQrUpload} />
                </Button>
                {settings.bankQrCodeBase64 && (
                  <Button variant="text" color="error" size="small" onClick={() => setSettings({ ...settings, bankQrCodeBase64: "" })}>
                    Remove Image
                  </Button>
                )}
              </Box>
            </Box>
          </Box>

          {settings.enableOnlinePayments && (
            <>
              <Divider>Stripe Integration</Divider>
              <Box sx={{ display: "flex", gap: 2, alignItems: "flex-start" }}>
                <TextField
                  label="Stripe Public API Key"
                  value={settings.stripePublicKey || ''}
                  onChange={(e) =>
                    setSettings({ ...settings, stripePublicKey: e.target.value })
                  }
                  placeholder="pk_test_..."
                  fullWidth
                />
                <Button
                  variant="outlined"
                  color="secondary"
                  sx={{ height: 56, whiteSpace: "nowrap" }}
                  onClick={handleTestStripe}
                  disabled={isTesting || !settings.stripePublicKey}
                >
                  {isTesting ? "Testing..." : "Test Key"}
                </Button>
              </Box>
            </>
          )}
        </Box>
      </CardContent>

      {/* QR Code Crop Modal */}
      <Dialog open={cropModalOpen} onClose={() => setCropModalOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Crop QR Code</DialogTitle>
        <DialogContent dividers sx={{ display: 'flex', justifyContent: 'center', bgcolor: 'grey.200', p: 2 }}>
          {cropImgSrc && (
            <ReactCrop
              crop={crop}
              onChange={(c) => setCrop(c)}
              onComplete={(c) => setCompletedCrop(c)}
              aspect={1} // QR codes are square
            >
              <img ref={imgRef} src={cropImgSrc} alt="Crop preview" style={{ maxHeight: '70vh', maxWidth: '100%', display: 'block' }} />
            </ReactCrop>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={() => setCropModalOpen(false)}>Cancel</Button>
          <Button onClick={handleSaveCrop} variant="contained" color="primary">Apply Crop</Button>
        </DialogActions>
      </Dialog>
    </Card>
  );
};
