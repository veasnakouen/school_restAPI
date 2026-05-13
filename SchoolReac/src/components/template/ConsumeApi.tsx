import React, {
  useState,
  useEffect,
  createContext,
  useContext,
  useCallback,
} from "react";
import {
  createTheme,
  ThemeProvider,
  CssBaseline,
  Container,
  AppBar,
  Toolbar,
  Typography,
  Button,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  TextField,
  Snackbar,
  Alert,
  Box,
  CircularProgress,
  Tooltip,
  Avatar,
  Chip,
  Divider,
  Grid,
  InputAdornment,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Card,
  CardContent,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Drawer,
} from "@mui/material";
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Refresh as RefreshIcon,
  Warning as WarningIcon,
  Cloud as CloudIcon,
  Search as SearchIcon,
  Close as CloseIcon,
  Login as LoginIcon,
  Logout as LogoutIcon,
  Lock as LockIcon,
  Person as PersonIcon,
  Dashboard as DashboardIcon,
} from "@mui/icons-material";

// ==========================================
// AUTH CONTEXT & PROVIDER
// ==========================================
const AuthContext = createContext(null);

const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(() => localStorage.getItem("jwt_token"));
  const [user, setUser] = useState(() => {
    const stored = localStorage.getItem("jwt_user");
    return stored ? JSON.parse(stored) : null;
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (token) {
      // Optional: Verify token with backend on mount
      // fetch('https://localhost:5001/api/auth/verify', { headers: { Authorization: `Bearer ${token}` } })
      //   .then(res => res.ok ? setUser(JSON.parse(localStorage.getItem('jwt_user'))) : logout())
      //   .catch(() => logout())
      //   .finally(() => setLoading(false));
      setLoading(false);
    } else {
      setLoading(false);
    }
  }, [token]);

  const login = async (email, password) => {
    const res = await fetch("https://localhost:5001/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ message: "Login failed" }));
      throw new Error(err.message || "Invalid credentials");
    }
    const data = await res.json();
    setToken(data.accessToken);
    setUser(data.user);
    localStorage.setItem("jwt_token", data.accessToken);
    localStorage.setItem("jwt_user", JSON.stringify(data.user));
  };

  const logout = useCallback(() => {
    setToken(null);
    setUser(null);
    localStorage.removeItem("jwt_token");
    localStorage.removeItem("jwt_user");
  }, []);

  return (
    <AuthContext.Provider value={{ token, user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};

// ==========================================
// JWT-AWARE API HELPER
// ==========================================
const API_BASE = "https://localhost:5001/api";

const apiFetch = async (endpoint, options = {}) => {
  const token = localStorage.getItem("jwt_token");
  const headers = {
    "Content-Type": "application/json",
    Accept: "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  const res = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  if (res.status === 401 || res.status === 403) {
    localStorage.removeItem("jwt_token");
    window.location.reload(); // Forces re-authentication
    throw new Error("Session expired or unauthorized. Please log in again.");
  }

  if (!res.ok) {
    const errorData = await res.json().catch(() => null);
    throw new Error(
      errorData?.message || `API Error: ${res.status} ${res.statusText}`,
    );
  }

  const contentType = res.headers.get("content-type");
  return contentType && contentType.includes("application/json")
    ? res.json()
    : null;
};

// ==========================================
// LOGIN COMPONENT
// ==========================================
const LoginScreen = () => {
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError("");
    try {
      await login(email, password);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        bgcolor: "background.default",
      }}
    >
      <Card
        elevation={4}
        sx={{ maxWidth: 400, width: "100%", p: 4, borderRadius: 3 }}
      >
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            mb: 3,
          }}
        >
          <LockIcon sx={{ fontSize: 48, color: "primary.main", mb: 1 }} />
          <Typography
            variant="h5"
            component="h1"
            gutterBottom
            sx={{ fontWeight: 700 }}
          >
            Secure Login
          </Typography>
          <Typography variant="body2" color="text.secondary">
            ASP.NET Core JWT Authentication Demo
          </Typography>
        </Box>
        <form onSubmit={handleSubmit}>
          <TextField
            fullWidth
            label="Email Address"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            sx={{ mb: 2 }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <PersonIcon />
                </InputAdornment>
              ),
            }}
          />
          <TextField
            fullWidth
            label="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            sx={{ mb: 2 }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <LockIcon />
                </InputAdornment>
              ),
            }}
          />
          {error && (
            <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError("")}>
              {error}
            </Alert>
          )}
          <Button
            type="submit"
            fullWidth
            variant="contained"
            size="large"
            disabled={isSubmitting}
            startIcon={<LoginIcon />}
          >
            {isSubmitting ? <CircularProgress size={24} /> : "Sign In"}
          </Button>
          <Typography
            variant="caption"
            sx={{
              display: "block",
              mt: 2,
              textAlign: "center",
              color: "text.secondary",
            }}
          >
            Demo: Use any credentials to simulate successful JWT issuance
          </Typography>
        </form>
      </Card>
    </Box>
  );
};

// ==========================================
// PRODUCT DIALOG
// ==========================================
const ProductDialog = ({
  open,
  onClose,
  onSave,
  initialData,
  isSubmitting,
}) => {
  const [formData, setFormData] = useState({
    name: "",
    category: "",
    price: "",
    description: "",
  });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (initialData) setFormData(initialData);
    else
      setFormData({
        name: "",
        category: "Electronics",
        price: "",
        description: "",
      });
    setErrors({});
  }, [initialData, open]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: null }));
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.name.trim()) newErrors.name = "Required";
    if (!formData.price || isNaN(formData.price) || Number(formData.price) <= 0)
      newErrors.price = "Invalid";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validate()) onSave({ ...formData, price: Number(formData.price) });
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="sm"
      PaperProps={{ elevation: 3 }}
    >
      <form onSubmit={handleSubmit}>
        <DialogTitle
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          {initialData ? "Edit Product" : "Add Product"}
          <IconButton onClick={onClose} size="small">
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <Divider />
        <DialogContent
          sx={{ pt: 3, display: "flex", flexDirection: "column", gap: 2 }}
        >
          <TextField
            label="Name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            fullWidth
            error={!!errors.name}
            helperText={errors.name}
            autoFocus
          />
          <FormControl fullWidth>
            <InputLabel>Category</InputLabel>
            <Select
              name="category"
              value={formData.category}
              onChange={handleChange}
              label="Category"
            >
              <MenuItem value="Electronics">Electronics</MenuItem>
              <MenuItem value="Clothing">Clothing</MenuItem>
              <MenuItem value="Home">Home</MenuItem>
            </Select>
          </FormControl>
          <TextField
            label="Price ($)"
            name="price"
            type="number"
            value={formData.price}
            onChange={handleChange}
            fullWidth
            error={!!errors.price}
            helperText={errors.price}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">$</InputAdornment>
              ),
            }}
          />
          <TextField
            label="Description"
            name="description"
            value={formData.description}
            onChange={handleChange}
            fullWidth
            multiline
            rows={2}
          />
        </DialogContent>
        <Divider />
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" variant="contained" disabled={isSubmitting}>
            {isSubmitting ? <CircularProgress size={24} /> : "Save"}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

// ==========================================
// MAIN DASHBOARD COMPONENT
// ==========================================
const Dashboard = () => {
  const { user, logout } = useAuth();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [currentProduct, setCurrentProduct] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });
  const [searchQuery, setSearchQuery] = useState("");

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const data = await apiFetch("/products");
      setProducts(data || []);
    } catch (error) {
      setSnackbar({ open: true, message: error.message, severity: "error" });
      // Fallback for demo when API isn't running
      setProducts([
        {
          id: 1,
          name: "Wireless Mouse",
          category: "Electronics",
          price: 25.99,
          description: "Ergonomic USB receiver",
        },
        {
          id: 2,
          name: "Cotton T-Shirt",
          category: "Clothing",
          price: 15.5,
          description: "Organic fabric",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const handleSave = async (productData) => {
    setIsSubmitting(true);
    try {
      if (currentProduct) {
        await apiFetch(`/products/${currentProduct.id}`, {
          method: "PUT",
          body: JSON.stringify(productData),
        });
        setProducts(
          products.map((p) =>
            p.id === currentProduct.id ? { ...p, ...productData } : p,
          ),
        );
        setSnackbar({
          open: true,
          message: "Product updated",
          severity: "success",
        });
      } else {
        const res = await apiFetch("/products", {
          method: "POST",
          body: JSON.stringify(productData),
        });
        setProducts([...products, { ...productData, id: Date.now() }]);
        setSnackbar({
          open: true,
          message: "Product created",
          severity: "success",
        });
      }
    } catch (error) {
      setSnackbar({ open: true, message: error.message, severity: "error" });
    } finally {
      setIsSubmitting(false);
      setDialogOpen(false);
    }
  };

  const handleDelete = async () => {
    setIsSubmitting(true);
    try {
      await apiFetch(`/products/${currentProduct.id}`, { method: "DELETE" });
      setProducts(products.filter((p) => p.id !== currentProduct.id));
      setSnackbar({
        open: true,
        message: "Product deleted",
        severity: "success",
      });
    } catch (error) {
      setSnackbar({ open: true, message: error.message, severity: "error" });
    } finally {
      setIsSubmitting(false);
      setDeleteDialogOpen(false);
    }
  };

  const filtered = products.filter(
    (p) =>
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.category.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        minHeight: "100vh",
        bgcolor: "background.default",
      }}
    >
      <AppBar position="static" elevation={2}>
        <Toolbar>
          <CloudIcon sx={{ mr: 2 }} />
          <Typography variant="h6" sx={{ flexGrow: 1 }}>
            Inventory Manager
          </Typography>
          <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
            <Typography
              variant="body2"
              sx={{ display: { xs: "none", sm: "block" } }}
            >
              Welcome, {user?.name || "User"}
            </Typography>
            <Tooltip title="Logout">
              <IconButton color="inherit" onClick={logout}>
                <LogoutIcon />
              </IconButton>
            </Tooltip>
          </Box>
        </Toolbar>
      </AppBar>

      <Container sx={{ py: 4, flexGrow: 1 }}>
        <Grid container spacing={3} alignItems="center" sx={{ mb: 3 }}>
          <Grid item xs={12} md={6}>
            <TextField
              placeholder="Search..."
              fullWidth
              size="small"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              InputProps={{ startAdornment: <SearchIcon color="action" /> }}
            />
          </Grid>
          <Grid item xs={12} md={6} sx={{ textAlign: { md: "right" } }}>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => {
                setCurrentProduct(null);
                setDialogOpen(true);
              }}
              size="large"
            >
              Add Product
            </Button>
            <Tooltip title="Refresh">
              <IconButton
                onClick={fetchProducts}
                disabled={loading}
                sx={{ ml: 1 }}
              >
                <RefreshIcon />
              </IconButton>
            </Tooltip>
          </Grid>
        </Grid>

        <Paper elevation={3} sx={{ overflow: "hidden", borderRadius: 2 }}>
          <TableContainer>
            <Table>
              <TableHead sx={{ backgroundColor: "#f8f9fa" }}>
                <TableRow>
                  <TableCell sx={{ fontWeight: "bold" }}>Product</TableCell>
                  <TableCell sx={{ fontWeight: "bold" }}>Category</TableCell>
                  <TableCell sx={{ fontWeight: "bold", textAlign: "right" }}>
                    Price
                  </TableCell>
                  <TableCell sx={{ fontWeight: "bold" }}>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={4} align="center" sx={{ py: 6 }}>
                      <CircularProgress />
                      <Typography mt={2}>Loading...</Typography>
                    </TableCell>
                  </TableRow>
                ) : filtered.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={4}
                      align="center"
                      sx={{ py: 6, color: "text.secondary" }}
                    >
                      No products found
                    </TableCell>
                  </TableRow>
                ) : (
                  filtered.map((item) => (
                    <TableRow key={item.id} hover>
                      <TableCell>
                        <Box
                          sx={{ display: "flex", alignItems: "center", gap: 2 }}
                        >
                          <Avatar sx={{ bgcolor: "primary.main" }}>
                            {item.name.charAt(0)}
                          </Avatar>
                          <Typography
                            variant="subtitle1"
                            sx={{ fontWeight: 500 }}
                          >
                            {item.name}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={item.category}
                          size="small"
                          variant="outlined"
                        />
                      </TableCell>
                      <TableCell
                        align="right"
                        sx={{ fontFamily: "monospace", fontWeight: 600 }}
                      >
                        ${item.price.toFixed(2)}
                      </TableCell>
                      <TableCell align="center">
                        <Tooltip title="Edit">
                          <IconButton
                            color="primary"
                            onClick={() => {
                              setCurrentProduct(item);
                              setDialogOpen(true);
                            }}
                          >
                            <EditIcon />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Delete">
                          <IconButton
                            color="error"
                            onClick={() => {
                              setCurrentProduct(item);
                              setDeleteDialogOpen(true);
                            }}
                          >
                            <DeleteIcon />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      </Container>

      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
      >
        <DialogTitle sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <WarningIcon color="error" /> Confirm Delete
        </DialogTitle>
        <DialogContent>
          <DialogContentText>
            Delete {currentProduct?.name}? This cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setDeleteDialogOpen(false)}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            onClick={handleDelete}
            color="error"
            variant="contained"
            disabled={isSubmitting}
          >
            {isSubmitting ? <CircularProgress size={24} /> : "Delete"}
          </Button>
        </DialogActions>
      </Dialog>

      <ProductDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        onSave={handleSave}
        initialData={currentProduct}
        isSubmitting={isSubmitting}
      />

      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar((p) => ({ ...p, open: false }))}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
      >
        <Alert
          severity={snackbar.severity}
          onClose={() => setSnackbar((p) => ({ ...p, open: false }))}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

// ==========================================
// APP ENTRY POINT
// ==========================================
const App = () => {
  const theme = createTheme({
    palette: {
      mode: "light",
      primary: { main: "#1976d2" },
      background: { default: "#f5f5f5" },
    },
    typography: { fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif' },
  });

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </ThemeProvider>
  );
};

const AppContent = () => {
  const { token, loading } = useAuth();
  if (loading) {
    return (
      <Box
        sx={{
          height: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          bgcolor: "background.default",
        }}
      >
        <CircularProgress />
      </Box>
    );
  }
  return token ? <Dashboard /> : <LoginScreen />;
};

export default App;
