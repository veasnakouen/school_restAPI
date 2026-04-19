import React, { useState, useEffect, useRef } from 'react';
import { getProfile, updateProfile, changePassword, User, uploadAvatar } from '../../services/api';
import { Box, Grid, Card, CardContent, Typography, Divider, TextField, Button, CircularProgress, Chip, Alert, Avatar, Badge, IconButton, Dialog, DialogTitle, DialogContent, DialogActions } from '@mui/material';
import { PhotoCamera as PhotoCameraIcon } from '@mui/icons-material';
import { useAuth } from '../../auth/AuthContext';
import { useToast } from '../../context/ToastContext';
import ReactCrop, { type Crop, type PixelCrop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';

export const Profile: React.FC = () => {
  const [profile, setProfile] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Password state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Avatar state
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);

  // Image Cropping State
  const [cropModalOpen, setCropModalOpen] = useState(false);
  const [cropImgSrc, setCropImgSrc] = useState<string>('');
  const [crop, setCrop] = useState<Crop>();
  const [completedCrop, setCompletedCrop] = useState<PixelCrop | null>(null);
  const imgRef = useRef<HTMLImageElement>(null);

  const { showToast } = useToast();
  const { updateUser } = useAuth();

  const [isProfileUpdating, setIsProfileUpdating] = useState(false);
  const [isPasswordChanging, setIsPasswordChanging] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const data = await getProfile();
        setProfile(data);
        setAvatarPreview(data.imageUrl || null);
      } catch (err) {
        console.error('Failed to load profile', err);
        // You could set an error state here to show a full-page error
      } finally {
        setLoading(false);
      }
    };
    void fetchProfile();
  }, []);

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProfileUpdating(true);
    try {
      const data = {
        fullName: profile?.fullName || '',
        email: profile?.email || '',
        phoneNumber: profile?.phoneNumber || '',
        userName: profile?.userName || '',
      };
      const updatedUser = await updateProfile(data);
      showToast('Profile updated successfully.', 'success');
      setProfile(updatedUser);
      updateUser(updatedUser);
      setAvatarPreview(updatedUser.imageUrl || null);
    } catch (err: any) {
      showToast(err.response?.data?.title || 'Failed to update profile.', 'error');
    } finally {
      setIsProfileUpdating(false);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      showToast('New passwords do not match.', 'error');
      return;
    }
    setIsPasswordChanging(true);
    try {
      await changePassword({ currentPassword, newPassword });
      showToast('Password changed successfully.', 'success');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      showToast(err.response?.data?.title || 'Failed to change password. Please check your current password.', 'error');
    } finally {
      setIsPasswordChanging(false);
    }
  };

  const handleAvatarFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.addEventListener('load', () => {
        setCropImgSrc(reader.result?.toString() || '');
        setCropModalOpen(true);
      });
      reader.readAsDataURL(file);
      event.target.value = ''; // Reset input to allow selecting the same file again
    }
  };

  const handleUploadAvatar = async () => {
    if (!avatarFile) return;
    setIsUploadingAvatar(true);
    try {
      const { imageUrl } = await uploadAvatar(avatarFile);
      setProfile(p => (p ? { ...p, imageUrl } : null));
      updateUser({ imageUrl }); // Update global state
      setAvatarPreview(imageUrl);
      setAvatarFile(null);
      showToast('Avatar updated successfully!', 'success');
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || err.message || 'Failed to upload avatar.';
      showToast(errorMessage, 'error');
      // Revert preview if upload fails
      setAvatarPreview(profile?.imageUrl || null);
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  const handleSaveCrop = async () => {
    if (imgRef.current && completedCrop?.width && completedCrop?.height) {
      const canvas = document.createElement('canvas');
      const scaleX = imgRef.current.naturalWidth / imgRef.current.width;
      const scaleY = imgRef.current.naturalHeight / imgRef.current.height;

      // Enforce a maximum resolution of 256x256 to save space
      const MAX_SIZE = 256;
      const cropWidth = completedCrop.width * scaleX;
      const cropHeight = completedCrop.height * scaleY;
      const finalWidth = Math.min(cropWidth, MAX_SIZE);
      const finalHeight = Math.min(cropHeight, MAX_SIZE);

      canvas.width = finalWidth;
      canvas.height = finalHeight;
      const ctx = canvas.getContext('2d');

      if (ctx) {
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(
          imgRef.current,
          completedCrop.x * scaleX,
          completedCrop.y * scaleY,
          cropWidth,
          cropHeight,
          0,
          0,
          finalWidth,
          finalHeight
        );

        canvas.toBlob((blob) => {
          if (blob) {
            const file = new File([blob], 'cropped-avatar.jpg', { type: 'image/jpeg' });
            setAvatarFile(file);
            setAvatarPreview(URL.createObjectURL(blob));
            setCropModalOpen(false);
          }
        }, 'image/jpeg', 0.7); // Compress quality to 70%
      }
    } else {
      setCropModalOpen(false);
    }
  };

  if (loading) {
    return <Box sx={{ display: 'flex', justifyContent: 'center', p: 8 }}><CircularProgress size={40} /></Box>;
  }

  return (
    <Box sx={{ p: { xs: 2, md: 3 }, maxWidth: 'lg', mx: 'auto' }}>
      <Grid container spacing={3}>
        {/* Profile Info Form */}
        <Grid item xs={12} md={6}>
          <Card sx={{ boxShadow: 3 }}>
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mb: 3 }}>
                <Badge
                  overlap="circular"
                  anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                  badgeContent={
                    <IconButton
                      aria-label="upload picture"
                      component="label"
                      sx={{ bgcolor: 'background.paper', '&:hover': { bgcolor: 'background.default' } }}
                    >
                      <input hidden accept="image/*" type="file" onChange={handleAvatarFileChange} />
                      <PhotoCameraIcon />
                    </IconButton>
                  }
                >
                  <Avatar
                    alt={profile?.fullName || profile?.userName}
                    src={avatarPreview || undefined}
                    sx={{ width: 120, height: 120, mb: 1, border: '2px solid', borderColor: 'divider' }}
                  />
                </Badge>
                {avatarFile && (
                  <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
                    <Button
                      size="small"
                      variant="contained"
                      onClick={handleUploadAvatar}
                      disabled={isUploadingAvatar}
                      startIcon={isUploadingAvatar ? <CircularProgress size={16} color="inherit" /> : null}
                    >
                      Save Avatar
                    </Button>
                    <Button size="small" variant="outlined" onClick={() => {
                      setAvatarFile(null);
                      setAvatarPreview(profile?.imageUrl || null);
                    }}>
                      Cancel
                    </Button>
                  </Box>
                )}
              </Box>
              <Typography variant="h5" component="h3" gutterBottom>Personal Information</Typography>
              <Divider sx={{ mb: 2 }} />
              <form onSubmit={handleProfileUpdate}>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <TextField label="Username" value={profile?.userName || ''} disabled fullWidth variant="outlined" />
                  <TextField
                    label="Full Name"
                    name="fullName"
                    value={profile?.fullName || ''}
                    onChange={e => setProfile(p => p ? { ...p, fullName: e.target.value } : null)}
                    fullWidth
                    variant="outlined"
                  />
                  <TextField
                    label="Email"
                    type="email"
                    name="email"
                    value={profile?.email || ''}
                    onChange={e => setProfile(p => p ? { ...p, email: e.target.value } : null)}
                    fullWidth
                    variant="outlined"
                  />
                  <TextField
                    label="Phone Number"
                    type="tel"
                    name="phoneNumber"
                    value={profile?.phoneNumber || ''}
                    onChange={e => setProfile(p => p ? { ...p, phoneNumber: e.target.value } : null)}
                    fullWidth
                    variant="outlined"
                  />
                  <Box>
                    <Typography variant="subtitle2" color="text.secondary">Roles</Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 1 }}>
                  {profile?.roles.map(role => (
                        <Chip key={role} label={role} color="primary" size="small" />
                  ))}
                    </Box>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
                    <Button type="submit" variant="contained" color="primary" disabled={isProfileUpdating}>
                      {isProfileUpdating && <CircularProgress size={24} sx={{ color: 'inherit', mr: 1 }} />}
                      Save Profile
                    </Button>
                  </Box>
                </Box>
              </form>
            </CardContent>
          </Card>
        </Grid>

        {/* Change Password Form */}
        <Grid item xs={12} md={6}>
          <Card sx={{ boxShadow: 3 }}>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="h5" component="h3" gutterBottom>Change Password</Typography>
              <Divider sx={{ mb: 2 }} />
              <form onSubmit={handlePasswordChange}>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <TextField
                    label="Current Password"
                    type="password"
                    name="currentPassword"
                    value={currentPassword}
                    onChange={e => setCurrentPassword(e.target.value)}
                    required
                    fullWidth
                    variant="outlined"
                  />
                  <TextField
                    label="New Password"
                    type="password"
                    name="newPassword"
                    value={newPassword}
                    onChange={e => setNewPassword(e.target.value)}
                    required
                    fullWidth
                    variant="outlined"
                  />
                  <TextField
                    label="Confirm New Password"
                    type="password"
                    name="confirmPassword"
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                    required
                    fullWidth
                    variant="outlined"
                  />
                  <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
                    <Button type="submit" variant="contained" color="secondary" disabled={isPasswordChanging}>
                      {isPasswordChanging && <CircularProgress size={24} sx={{ color: 'inherit', mr: 1 }} />}
                      Update Password
                    </Button>
                  </Box>
                </Box>
              </form>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Avatar Image Crop Modal */}
      <Dialog open={cropModalOpen} onClose={() => setCropModalOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Crop Avatar</DialogTitle>
        <DialogContent dividers sx={{ display: 'flex', justifyContent: 'center', bgcolor: 'grey.200' }}>
          {cropImgSrc && (
            <ReactCrop
              crop={crop}
              onChange={(c) => setCrop(c)}
              onComplete={(c) => setCompletedCrop(c)}
              aspect={1}
              circularCrop
            >
              <img ref={imgRef} src={cropImgSrc} alt="Crop preview" style={{ maxHeight: '50vh', maxWidth: '100%', objectFit: 'contain' }} />
            </ReactCrop>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={() => setCropModalOpen(false)}>Cancel</Button>
          <Button onClick={handleSaveCrop} variant="contained" color="primary">Apply Crop</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};