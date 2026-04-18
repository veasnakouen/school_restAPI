import React, { useState } from 'react';
import { useFormik, FormikHelpers } from 'formik';
import * as Yup from 'yup';
import { useAuth } from '../../auth/AuthContext';
import { Navigate, useLocation } from 'react-router-dom';
import { Box, Button, Card, CardContent, Checkbox, CircularProgress, FormControlLabel, Link, TextField, Typography } from '@mui/material';

// Define a type for our form values for better type safety
type LoginFormValues = {
  email: string;
  password: string;
  rememberMe: boolean;
};

const LoginSchema = Yup.object().shape({
  email: Yup.string().email('Invalid email format').required('Email is required'),
  password: Yup.string().required('Password is required'),
});

export const LoginPage: React.FC = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { login, isLoading, isAuthenticated } = useAuth();
  const location = useLocation();

  const formik = useFormik<LoginFormValues>({
    initialValues: {
      email: '',
      password: '',
      rememberMe: false,
    },
    validationSchema: LoginSchema,
    onSubmit: async (values, { setSubmitting }: FormikHelpers<LoginFormValues>) => {
      setError(null);
      try {
        // Pass email and password to the login function.
        await login({ email: values.email, password: values.password }, values.rememberMe);
        // Navigation is now handled by the conditional redirect below
      } catch (err: any) {
        // Handle different error response structures from the API
        const data = err.response?.data;
        const errorMessage = typeof data === 'string' 
          ? data 
          : data?.message || 'Login failed. Please check your credentials.';
        setError(errorMessage);
      } finally {
        setSubmitting(false);
      }
    },
  });

  if (isAuthenticated) {
    const from = location.state?.from?.pathname || '/dashboard';
    return <Navigate to={from} replace />;
  }

  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', p: 4 }}>
      <Card sx={{ maxWidth: 400, width: '100%', boxShadow: 3 }}>
        <CardContent sx={{ p: 4 }}>
          <Typography variant="h4" component="h2" align="center" gutterBottom>
            Login
          </Typography>
          <form onSubmit={formik.handleSubmit}>
            {error && (
              <Typography color="error" align="center" sx={{ mb: 2 }}>
                {error}
              </Typography>
            )}
            <TextField
              fullWidth
              id="email"
              name="email"
              label="Email"
              value={formik.values.email}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              error={formik.touched.email && Boolean(formik.errors.email)}
              helperText={formik.touched.email && formik.errors.email}
              margin="normal"
            />
            <TextField
              fullWidth
              id="password"
              name="password"
              label="Password"
              type={showPassword ? 'text' : 'password'}
              value={formik.values.password}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              error={formik.touched.password && Boolean(formik.errors.password)}
              helperText={formik.touched.password && formik.errors.password}
              margin="normal"
            />
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 1 }}>
              <FormControlLabel
                control={
                  <Checkbox
                    id="rememberMe"
                    name="rememberMe"
                    checked={formik.values.rememberMe}
                    onChange={formik.handleChange}
                    color="primary"
                  />
                }
                label="Remember me"
              />
              <Link href="#" variant="body2">
                Forgot password?
              </Link>
            </Box>
            <Box sx={{ mt: 2, position: 'relative' }}>
              <Button
                color="primary"
                variant="contained"
                fullWidth
                type="submit"
                disabled={isLoading || formik.isSubmitting}
              >
                Login
              </Button>
              {(isLoading || formik.isSubmitting) && (
                <CircularProgress
                  size={24}
                  sx={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    marginTop: '-12px',
                    marginLeft: '-12px',
                  }}
                />
              )}
            </Box>
          </form>
        </CardContent>
      </Card>
    </Box>
  );
};