import React from 'react';

export const ToastContainer: React.FC = () => {
  // The old Snackbar-based toast container has been deprecated and replaced 
  // by the Framer Motion animated ToastContainer built directly into ToastContext.tsx.
  // Returning null safely removes the duplicate "top" toast without breaking App.tsx imports.
  return null;
};