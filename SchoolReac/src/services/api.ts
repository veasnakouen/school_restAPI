import axios, { AxiosError, AxiosInstance, InternalAxiosRequestConfig } from "axios";
import { DEV_MODE_MOCK_AUTH } from "../auth/AuthContext";

// --- Product Management ---
export interface CreateProductRequest {
  name: string;
  codeNumber: string | null;
  description: string | null;
  categoryId: string | null;
  categoryName: string | null;
  brandId: string | null;
  brandName: string | null;
  price: number | null;
  quality: string | null;
  department?: string | null;
  productCode?: string | null;
  specs?: string | null;
}

// Define types similar to your Angular models
export interface ProductDto {
  id: string | null;
  name: string;
  codeNumber: string | null;
  description: string | null;
  categoryId: string | null;
  categoryName: string | null;
  brandId: string | null;
  brandName: string | null;
  price: number | null;
  imageUrl: string | null;
  quality: string | null;
  createdDate: string | null;
  updateDate: string | null;
  department?: string | null;
  productCode?: string | null;
  specs?: string | null;
}

export interface CategoryDto {
  id: string;
  name: string;
  description: string | null;
}

export interface BrandDto {
  id: string;
  name: string;
}

export interface DepartmentDto {
  id: string;
  name: string;
}

export interface SupplierDto {
  id: string;
  name: string;
}

// This is what the backend actually sends for a permission
export interface BackendPermission {
  id: number;
  name: string;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  expiresAt: string;
  userId: string;
  email: string;
  fullName: string;
  isSuccess: boolean;
  role: string[];
  phoneNumber?: string;
  accessFailedCount: number;
  imageUrl?: string;
}

export interface User {
  id: string;
  userName: string;
  fullName?: string;
  email: string;
  phoneNumber?: string;
  lockoutEnd?: string | null;
  imageUrl?: string;
  roles: string[];
}

export interface Role {
  id: string;
  name: string;
}

export interface PermissionDto {
  type: string;
  value: string;
  description: string;
}

export interface RoleDto extends Role {
  permissions: string[];
}

// This would be a more complete model for creating/updating users
export type UserPayload = Omit<User, 'id' | 'lockoutEnd' | 'imageUrl'> & { password?: string };

export interface PagedResult<T> {
  items: T[];
  totalCount: number;
}

export interface QueryOptions {
  pageNumber?: number;
  pageSize?: number;
  sortBy?: string;
  isAscending?: boolean;
  filterOn?: string;
  filterQuery?: string;
  department?: string;
}

const apiClient :AxiosInstance = axios.create({
  baseURL: 'http://localhost:5001/api', // Your API base URL
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  }, timeout: 30000,
  withCredentials: false, // Set to true if you need to send cookies
});
let isRedirecting = false; // Flag to prevent multiple redirects  

// Add a request interceptor to include the auth token
apiClient.interceptors.request.use(
  (config :InternalAxiosRequestConfig) => {
    // Get the token from localStorage or sessionStorage
    // Do not add the auth token to the refresh endpoint itself
    if (config.url?.includes('/auth/refresh')) {
      return config;
    }

    const token = localStorage.getItem('accessToken') || sessionStorage.getItem('accessToken');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    console.error('Error in auth interceptor:', error);
    return Promise.reject(error);
  }
);
// Response interceptor: Handle 401/403 globally
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value: any) => void;
  reject: (error: any) => void;
}> = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

// Add a response interceptor to handle 401 Unauthorized errors globally
apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    // If the error is not a 401, or it's a 401 for the login/refresh route, or already retried, just reject.
    if (error.response?.status !== 401 || originalRequest.url?.includes('/auth/login') || originalRequest.url?.includes('/auth/refresh') || originalRequest._retry) {
      return Promise.reject(error);
    }

    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        failedQueue.push({
          resolve: (token) => {
            originalRequest.headers!['Authorization'] = 'Bearer ' + token;
            resolve(apiClient(originalRequest));
          },
          reject: (err) => {
            reject(err);
          },
        });
      });
    }

    originalRequest._retry = true;
    isRefreshing = true;

    const accessToken = localStorage.getItem('accessToken') || sessionStorage.getItem('accessToken');
    const refreshToken = localStorage.getItem('refreshToken');

    if (!refreshToken || !accessToken) {
      // No refresh token, hard redirect to login
      if (!DEV_MODE_MOCK_AUTH) {
        localStorage.removeItem('user');
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        sessionStorage.removeItem('user');
        sessionStorage.removeItem('accessToken');
        if (window.location.pathname !== '/login') {
          window.location.href = '/login';
        }
      } else {
        console.warn('DEV_MODE: No refresh token. API calls are expected to fail. Preventing redirect.');
      }
      isRefreshing = false;
      return Promise.reject(new Error('No refresh or access token available.'));
    }

    try {
      // The backend's Refresh endpoint requires both the expired accessToken and the refreshToken.
      const response = await apiClient.post<AuthResponse>("/auth/refresh", {
        accessToken,
        refreshToken,
      });
      const { accessToken: newAccessToken, refreshToken: newRefreshToken } = response.data;

      const storage = localStorage.getItem('user') ? localStorage : sessionStorage;
      storage.setItem('accessToken', newAccessToken);
      localStorage.setItem('refreshToken', newRefreshToken);

      processQueue(null, newAccessToken);
      if (originalRequest.headers) {
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
      }
      return apiClient(originalRequest);
    } catch (refreshError) {
      processQueue(refreshError, null);
      if (!DEV_MODE_MOCK_AUTH) {
        localStorage.removeItem('user');
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        sessionStorage.removeItem('user');
        sessionStorage.removeItem('accessToken');
        if (window.location.pathname !== '/login') {
          window.location.href = '/login';
        }
      } else {
        console.error('DEV_MODE: Token refresh failed. Preventing redirect.');
      }
      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  }
);

// --- Product Management ---
export const getProducts = (params: QueryOptions): Promise<PagedResult<ProductDto>> => 
  apiClient.get('/inventory/products', { params }).then(res => res.data);

export const getCategories = (): Promise<CategoryDto[]> => 
  apiClient.get('/Category').then(res => res.data);

export const createCategory = (category: { name: string; description?: string | null }): Promise<CategoryDto> =>
  apiClient.post('/Category', category).then(res => res.data);

export const getBrands = (): Promise<BrandDto[]> => 
  apiClient.get('/Brand').then(res => res.data);

export const createBrand = (brand: { name: string }): Promise<BrandDto> =>
  apiClient.post('/Brand', brand).then(res => res.data);

export const getDepartments = (): Promise<DepartmentDto[]> =>
  apiClient.get('/Department').then(res => res.data);

export const createDepartment = (department: { name: string, location?: string }): Promise<DepartmentDto> =>
  apiClient.post('/Department', department).then(res => res.data);

export const getSuppliers = (): Promise<SupplierDto[]> =>
  apiClient.get('/Supplier').then(res => res.data);

export const createSupplier = (supplier: { name: string }): Promise<SupplierDto> =>
  apiClient.post('/Supplier', supplier).then(res => res.data);

export const createProduct = (product: CreateProductRequest): Promise<ProductDto> =>
  apiClient.post('/inventory/products', product).then(res => res.data);

export const updateProduct = (id: string, product: Partial<ProductDto>): Promise<ProductDto> =>
  apiClient.put(`/inventory/products/${id}`, product).then(res => res.data);

export const deleteProduct = (id: string): Promise<any> =>
  apiClient.delete(`/inventory/products/${id}`).then(res => res.data);

export const uploadProductImage = (id: string, file: File): Promise<{ imageUrl: string }> => {
  const formData = new FormData();
  formData.append('file', file);
  return apiClient.post(`/inventory/products/${id}/image`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }).then(res => res.data);
};

export const deleteProductImage = (id: string): Promise<any> => {
  return apiClient.delete(`/inventory/products/${id}/image`).then(res => res.data);
};

// --- Auth ---
export const login = (credentials: {
  email: string;
  password: string;
 }): Promise<AuthResponse> => {
  // The built-in Identity /login endpoint expects an `email` field, which matches
  // the `credentials` object shape.
  return apiClient.post<AuthResponse>("/auth/login", credentials).then((res) => res.data);
 };

export const forceRefreshToken = (): Promise<AuthResponse> => {
  const accessToken = localStorage.getItem('accessToken') || sessionStorage.getItem('accessToken');
  const refreshToken = localStorage.getItem('refreshToken');
  
  if (!accessToken || !refreshToken) return Promise.reject(new Error('No tokens available'));
  return apiClient.post<AuthResponse>("/auth/refresh", { accessToken, refreshToken }).then(res => res.data);
};

// --- User Management ---
// The backend AuthController serves users at /auth/users and returns a PagedResult with an 'items' array
export const getUsers = (params?: QueryOptions): Promise<PagedResult<User>> => apiClient.get('/auth/users', { params }).then(res => res.data);

// Use the dedicated UserManagement controller for admin actions
export const createUser = (user: UserPayload): Promise<any> => apiClient.post('/UserManagement', user).then(res => res.data);
export const updateUser = (id: string, user: Partial<UserPayload>): Promise<User> => apiClient.put(`/UserManagement/${id}`, user).then(res => res.data);
export const deleteUser = (id: string): Promise<any> => apiClient.delete(`/UserManagement/${id}`).then(res => res.data);
export const toggleUserStatus = (id: string): Promise<{ message: string }> => apiClient.post(`/UserManagement/${id}/toggle-status`, {}).then(res => res.data);

// --- Role & Permission Management ---
export const getRoles = (): Promise<Role[]> => apiClient.get('/roles/all_roles').then(res => res.data);
export const getPermissions = (): Promise<PermissionDto[]> =>
  apiClient.get<BackendPermission[]>('/permissions').then(res => {
    // The backend sends a flat list of permissions like { id: 1, name: "users.read" }
    // We need to transform this into the PermissionDto structure the frontend expects.
    return res.data.map(p => {
      const parts = p.name.split('.');
      const type = parts[0] || 'general';
      const action = parts[1] || p.name;

      // Create a simple description from the action and type.
      // e.g., "users.read" -> "Read users"
      const description = `${action.charAt(0).toUpperCase() + action.slice(1)} ${type}`;

      return {
        type: type,
        value: p.name,
        description: description,
      };
    });
  });
export const getRoleDetails = (id: string): Promise<RoleDto> => apiClient.get(`/roles/${id}`).then(res => res.data);
export const createRole = (role: { name: string, permissions: string[] }): Promise<any> => apiClient.post('/roles', role).then(res => res.data);
export const updateRole = (id: string, role: { name: string, permissions: string[] }): Promise<any> => apiClient.put(`/roles/${id}`, role).then(res => res.data);
export const deleteRole = (id: string): Promise<any> => apiClient.delete(`/roles/${id}`).then(res => res.data);

// --- Profile Management ---
export const getProfile = (): Promise<User> => {
  // The custom AuthController likely serves the profile under its own route.
  // Common conventions are /auth/profile or /auth/me.
  return apiClient.get('/auth/profile').then(res => res.data);
};
export const updateProfile = (user: Partial<User>): Promise<User> => apiClient.put('/auth/profile', user).then(res => res.data);
export const changePassword = (passwords: { currentPassword: string, newPassword: string }): Promise<any> => {
  return apiClient.post('/auth/profile/change-password', passwords).then(res => res.data);
};

export const uploadAvatar = (file: File): Promise<{ imageUrl: string }> => {
  const formData = new FormData();
  formData.append('file', file);
  return apiClient.post('/auth/profile/avatar', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }).then(res => res.data);
};