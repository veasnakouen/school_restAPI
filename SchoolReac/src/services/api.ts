import axios, { AxiosError, AxiosInstance, InternalAxiosRequestConfig } from "axios";
import { DEV_MODE_MOCK_AUTH } from "../auth/AuthContext"; // Assuming this path


// --- Product Management ---
export interface CreateProductRequest {
  name: string;
  description: string | null;
  categoryId: string | null;
  categoryName: string | null;
  brandId: string | null;
  brandName: string | null;
  price: number | null;
  quality: string | null;
  qualityId?: string | null;
  departmentId?: string | null;
  departmentName?: string | null;
  codeNumber?: string | null;
  year?: string | null;
  attributes?: string | null;
  plateNumber?: string | null;
  engineNumber?: string | null;
  purchaseType?: string | null;
  initialQuantity?: number | null;
  supplierName?: string | null;
  donorName?: string | null;
  voucherNumber?: string | null;
  supplierContact?: Record<string, string> | null;
  supplierContactList?: string[] | null;
  invoiceDate?: string | null;
  responsiblePerson?: string | null;
  responsiblePersonId?: string | null;
}

// Define types similar to your Angular models
export interface ProductDto {
  id: string | null;
  name: string;
  description: string | null;
  categoryId: string | null;
  categoryName: string | null;
  brandId: string | null;
  brandName: string | null;
  price: number | null;
  imageUrl: string | null;
  quality: string | null;
  qualityId?: string | null;
  createdDate: string | null;
  updateDate: string | null;
  departmentId?: string | null;
  departmentName?: string | null;
  codeNumber?: string | null;
  year?: string | null;
  attributes?: string | null;
  plateNumber?: string | null;
  engineNumber?: string | null;
  purchaseType?: string | null;
  initialQuantity?: number | null;
  supplierName?: string | null;
  donorName?: string | null;
  voucherNumber?: string | null;
  supplierContact?: Record<string, string> | null;
  supplierContactList?: string[] | null;
  invoiceDate?: string | null;
  responsiblePerson?: string | null;
  responsiblePersonId?: string | null;
  purchaseHistory?: ProductPurchaseHistoryDto[];
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
  location?: string;
}

export interface QualityDto {
  id: string;
  name: string;
}

export interface SupplierDto {
  id: string;
  name: string;
  contactInfo?: string[];
  address?: string;
}

export interface PersonDto {
  id: string;
  fullName: string;
  department?: string;
  email?: string;
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
  name?: string;
  codeNumber?: string;
  categoryId?: string;
  departmentId?: string;
  qualityId?: string;
  purchaseType?: string;
  transactionType?: string;
  filterOn?: string;
  filterQuery?: string;
  productGroup?: string;
  vehicleType?: string;
  // For date range filtering
  startDate?: string;
  endDate?: string;
  invoiceStartDate?: string;
  invoiceEndDate?: string;
  minPrice?: number;
  maxPrice?: number;
}

// Use environment variable in production, fallback to localhost:5001 in development
// Assuming Vite setup; use process.env.REACT_APP_API_URL for CRA
let envUrl =
  import.meta.env?.VITE_API_URL ||
  import.meta.env?.VITE_API_BASE_URL ||
  (globalThis as { process?: { env?: Record<string, string | undefined> } }).process?.env?.REACT_APP_API_URL;

if (!envUrl) {
  console.warn("⚠️ NO API URL PROVIDED! Falling back to localhost. Please set VITE_API_URL in Netlify.");
  envUrl = 'http://localhost:5001';
}

// Ensure we don't accidentally double up on '/api' or trailing slashes from the .env file
envUrl = envUrl.replace(/\/+$/, '').replace(/\/api$/i, '');

export const BASE_URL = envUrl;

const apiClient: AxiosInstance = axios.create({
  baseURL: `${BASE_URL}/api`, // Your API base URL
  headers: {
    'Accept': 'application/json'
  }, timeout: 30000,
  withCredentials: false, // Set to true if you need to send cookies
});
let isRedirecting = false; // Flag to prevent multiple redirects  

// Global loading state management callbacks
let incrementLoading: () => void;
let decrementLoading: () => void;
export const setLoadingCallbacks = (inc: () => void, dec: () => void) => { incrementLoading = inc; decrementLoading = dec; };

// Add a request interceptor to include the auth token
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // Get the token from localStorage or sessionStorage
    // Do not add the auth token to the refresh endpoint itself
    if (config.url?.includes('/auth/refresh')) {
      return config;
    }

    const token = localStorage.getItem('accessToken') || sessionStorage.getItem('accessToken');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    incrementLoading?.(); // Increment loading counter
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
  (response) => {
    decrementLoading?.();
    return response;
  },
  async (error: AxiosError) => {
    // Decrement for any error, but not for cancellations which are not "real" errors.
    if (!axios.isCancel(error)) {
      decrementLoading?.();
    }
    // If the backend returns a 503 Service Unavailable, it likely means Maintenance Mode is active.
    if (error.response?.status === 503) {
      const userStr = localStorage.getItem('user') || sessionStorage.getItem('user');
      let isAdmin = false;
      if (userStr) {
        try {
          const userObj = JSON.parse(userStr);
          isAdmin = userObj.roles?.includes('Admin') || userObj.roles?.includes('SuperAdmin');
        } catch (e) { }
      }

      if (!isAdmin) {
        localStorage.clear();
        sessionStorage.clear();
        window.location.href = '/login?maintenance=true';
      }
      return Promise.reject(error);
    }

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

// Shared in-memory response + in-flight promise deduplication cache to eliminate redundant API waterfalls during navigation
interface CacheEntry<T> {
  data: T;
  expiresAt: number;
}

const responseCache = new Map<string, CacheEntry<unknown>>();
const inFlightRequests = new Map<string, Promise<unknown>>();

const DEFAULT_LOOKUP_TTL_MS = 120_000;
const DEFAULT_LIST_TTL_MS = 12_000;

function stableKey(prefix: string, params?: unknown): string {
  if (!params || typeof params !== 'object') return prefix;
  const entries = Object.entries(params as Record<string, unknown>)
    .filter(([, v]) => v !== undefined && v !== null && v !== '')
    .sort(([a], [b]) => a.localeCompare(b));
  return `${prefix}:${JSON.stringify(entries)}`;
}

async function cachedGet<T>(
  key: string,
  fetcher: () => Promise<T>,
  ttlMs: number = DEFAULT_LOOKUP_TTL_MS
): Promise<T> {
  const now = Date.now();
  const cached = responseCache.get(key) as CacheEntry<T> | undefined;
  if (cached && cached.expiresAt > now) {
    return cached.data;
  }

  const pending = inFlightRequests.get(key) as Promise<T> | undefined;
  if (pending) {
    return pending;
  }

  const request = fetcher()
    .then((data) => {
      responseCache.set(key, { data, expiresAt: Date.now() + ttlMs });
      return data;
    })
    .finally(() => {
      inFlightRequests.delete(key);
    });

  inFlightRequests.set(key, request);
  return request;
}

export function invalidateApiCache(...prefixes: string[]): void {
  if (prefixes.length === 0) {
    responseCache.clear();
    return;
  }
  for (const key of responseCache.keys()) {
    if (prefixes.some((p) => key === p || key.startsWith(`${p}:`))) {
      responseCache.delete(key);
    }
  }
}

// --- Product Management ---
export const getProducts = (params: QueryOptions): Promise<PagedResult<ProductDto>> =>
  cachedGet(
    stableKey('products', params),
    () => apiClient.get('/inventory/products', { params }).then(res => res.data),
    DEFAULT_LIST_TTL_MS
  );

export const exportProductsExcel = (params: QueryOptions): Promise<Blob> =>
  apiClient.get('/inventory/products/export', { params, responseType: 'blob' }).then(res => res.data);

export const exportProductsCsv = (params: QueryOptions): Promise<Blob> =>
  apiClient.get('/inventory/products/export/csv', { params, responseType: 'blob' }).then(res => res.data);

export const exportProductsPdf = (params: QueryOptions): Promise<Blob> =>
  apiClient.get('/inventory/products/export/pdf', { params, responseType: 'blob' }).then(res => res.data);

export const getCategories = (): Promise<CategoryDto[]> =>
  cachedGet('categories', () => apiClient.get('/Category').then(res => res.data));

export const createCategory = (category: { name: string; description?: string | null }): Promise<CategoryDto> => {
  invalidateApiCache('categories', 'products');
  return apiClient.post('/Category', category).then(res => res.data);
};

export const updateCategory = (id: string, category: Partial<CategoryDto>): Promise<CategoryDto> => {
  invalidateApiCache('categories', 'products');
  return apiClient.put(`/Category/${id}`, category).then(res => res.data);
};

export const deleteCategory = (id: string): Promise<any> => {
  invalidateApiCache('categories', 'products');
  return apiClient.delete(`/Category/${id}`).then(res => res.data);
};

export const getBrands = (): Promise<BrandDto[]> =>
  cachedGet('brands', () => apiClient.get('/Brand').then(res => res.data));

export const createBrand = (brand: { name: string }): Promise<BrandDto> => {
  invalidateApiCache('brands', 'products');
  return apiClient.post('/Brand', brand).then(res => res.data);
};

export const updateBrand = (id: string, brand: Partial<BrandDto>): Promise<BrandDto> => {
  invalidateApiCache('brands', 'products');
  return apiClient.put(`/Brand/${id}`, brand).then(res => res.data);
};

export const deleteBrand = (id: string): Promise<any> => {
  invalidateApiCache('brands', 'products');
  return apiClient.delete(`/Brand/${id}`).then(res => res.data);
};

export const getDepartments = (): Promise<DepartmentDto[]> =>
  cachedGet('departments', () => apiClient.get('/Department').then(res => res.data));

export const createDepartment = (department: { name: string, location?: string }): Promise<DepartmentDto> => {
  invalidateApiCache('departments', 'products', 'transactions');
  return apiClient.post('/Department', department).then(res => res.data);
};

export const updateDepartment = (id: string, department: Partial<DepartmentDto>): Promise<DepartmentDto> => {
  invalidateApiCache('departments', 'products', 'transactions');
  return apiClient.put(`/Department/${id}`, department).then(res => res.data);
};

export const deleteDepartment = (id: string): Promise<any> => {
  invalidateApiCache('departments', 'products', 'transactions');
  return apiClient.delete(`/Department/${id}`).then(res => res.data);
};

export const getQualities = (): Promise<QualityDto[]> =>
  cachedGet('qualities', () => apiClient.get('/Quality').then(res => res.data));

export const createQuality = (quality: { name: string }): Promise<QualityDto> => {
  invalidateApiCache('qualities', 'products');
  return apiClient.post('/Quality', quality).then(res => res.data);
};

export const updateQuality = (id: string, quality: Partial<QualityDto>): Promise<QualityDto> => {
  invalidateApiCache('qualities', 'products');
  return apiClient.put(`/Quality/${id}`, quality).then(res => res.data);
};

export const deleteQuality = (id: string): Promise<any> => {
  invalidateApiCache('qualities', 'products');
  return apiClient.delete(`/Quality/${id}`).then(res => res.data);
};

export const getSuppliers = (): Promise<SupplierDto[]> =>
  cachedGet('suppliers', () => apiClient.get('/Supplier').then(res => res.data));

export const createSupplier = (supplier: { name: string; contactInfo?: string[]; address?: string }): Promise<SupplierDto> => {
  invalidateApiCache('suppliers', 'products');
  return apiClient.post('/Supplier', supplier).then(res => res.data);
};

export const updateSupplier = (id: string, supplier: Partial<SupplierDto>): Promise<SupplierDto> => {
  invalidateApiCache('suppliers', 'products');
  return apiClient.put(`/Supplier/${id}`, supplier).then(res => res.data);
};

export const deleteSupplier = (id: string): Promise<any> => {
  invalidateApiCache('suppliers', 'products');
  return apiClient.delete(`/Supplier/${id}`).then(res => res.data);
};

export const getPersons = (): Promise<PersonDto[]> =>
  cachedGet('persons', () => apiClient.get('/Person').then(res => res.data));

export const createPerson = (person: { fullName: string; department?: string; email?: string }): Promise<PersonDto> => {
  invalidateApiCache('persons', 'products');
  return apiClient.post('/Person', person).then(res => res.data);
};

export const updatePerson = (id: string, person: Partial<PersonDto>): Promise<PersonDto> => {
  invalidateApiCache('persons', 'products');
  return apiClient.put(`/Person/${id}`, person).then(res => res.data);
};

export const deletePerson = (id: string): Promise<any> => {
  invalidateApiCache('persons', 'products');
  return apiClient.delete(`/Person/${id}`).then(res => res.data);
};

export const createProduct = (product: CreateProductRequest): Promise<ProductDto> =>
  apiClient.post('/inventory/products', product).then(res => {
    invalidateApiCache('products', 'transactions');
    return res.data;
  });

export const updateProduct = (id: string, product: Partial<ProductDto>): Promise<ProductDto> =>
  apiClient.put(`/inventory/products/${id}`, product).then(res => {
    invalidateApiCache('products', 'transactions');
    return res.data;
  });

export const deleteProduct = (id: string): Promise<any> =>
  apiClient.delete(`/inventory/products/${id}`).then(res => {
    invalidateApiCache('products', 'transactions');
    return res.data;
  });

export interface ExcelSheetPreviewDto {
  sheetIndex: number;
  sheetName: string;
  isImportable: boolean;
  skipReason?: string | null;
  headerRowNumber: number;
  estimatedRowCount: number;
  suggestedDepartment?: string | null;
  detectedColumns: string[];
  mappedFields: Record<string, string>;
  sampleRows: Record<string, string>[];
}

export interface ExcelImportPreviewResponse {
  fileName: string;
  totalSheets: number;
  importableSheets: number;
  sheets: ExcelSheetPreviewDto[];
}

export interface ExcelSheetImportResultDto {
  sheetName: string;
  status: string;
  importedCount: number;
  skippedDuplicateCount: number;
  errorCount: number;
  notes?: string | null;
}

export interface ExcelImportResultDto {
  message: string;
  importedCount: number;
  skippedDuplicateCount: number;
  sheetResults: ExcelSheetImportResultDto[];
  errors: string[];
}

export const previewImportProducts = async (file: File): Promise<ExcelImportPreviewResponse> => {
  const formData = new FormData();
  formData.append('file', file);
  return apiClient
    .post('/inventory/products/import/preview', formData, { timeout: 180000 })
    .then(res => res.data);
};

export const importProducts = async (
  file: File,
  sheets?: string[],
  skipDuplicates: boolean = true,
  sheetDepartments?: Record<string, string>
): Promise<ExcelImportResultDto> => {
  const formData = new FormData();
  formData.append('file', file);
  if (sheets && sheets.length > 0) {
    formData.append('sheets', JSON.stringify(sheets));
  }
  formData.append('skipDuplicates', String(skipDuplicates));
  if (sheetDepartments && Object.keys(sheetDepartments).length > 0) {
    formData.append('sheetDepartments', JSON.stringify(sheetDepartments));
  }

  // Let axios automatically set the multipart/form-data boundary and allow generous timeout for multi-sheet workbooks
  return apiClient
    .post('/inventory/products/import', formData, { timeout: 180000 })
    .then(res => {
      invalidateApiCache('products', 'categories', 'brands', 'departments', 'qualities', 'suppliers', 'persons', 'transactions');
      return res.data;
    });
};

export const uploadProductImage = (id: string, file: File): Promise<{ imageUrl: string }> => {
  const formData = new FormData();
  formData.append('file', file);
  return apiClient.post(`/inventory/products/${id}/image`, formData).then(res => res.data);
};

export const deleteProductImage = (id: string): Promise<any> => {
  return apiClient.delete(`/inventory/products/${id}/image`).then(res => res.data);
};

export const getProductById = (id: string): Promise<ProductDto> =>
  apiClient.get(`/inventory/products/${id}`).then(res => res.data);

// --- Auth ---
export const login = (credentials: {
  email: string;
  password: string;
}): Promise<AuthResponse> => {
  // Clear cached session responses on fresh login
  invalidateApiCache();
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

export const forgotPassword = (data: { email: string }): Promise<{ message: string, isSuccess: boolean, resetToken?: string }> => {
  return apiClient.post('/auth/forgot-password', data).then(res => res.data);
};

export const resetPassword = (data: { email: string, token: string, newPassword: string }): Promise<{ message: string, isSuccess: boolean }> => {
  return apiClient.post('/auth/reset-password', data).then(res => res.data);
};

// --- User Management ---
export const getUsers = (params?: QueryOptions): Promise<PagedResult<User>> =>
  cachedGet(
    stableKey('users', params),
    () => apiClient.get('/users', { params }).then(res => res.data),
    DEFAULT_LIST_TTL_MS
  );

// Use the dedicated UserManagement controller for admin actions
export const createUser = (user: UserPayload): Promise<any> => apiClient.post('/users', user).then(res => { invalidateApiCache('users'); return res.data; });
export const updateUser = (id: string, user: Partial<UserPayload>): Promise<User> => apiClient.put(`/users/${id}`, user).then(res => { invalidateApiCache('users'); return res.data; });
export const deleteUser = (id: string): Promise<any> => apiClient.delete(`/users/${id}`).then(res => { invalidateApiCache('users'); return res.data; });
export const toggleUserStatus = (id: string): Promise<{ message: string }> => apiClient.post(`/users/${id}/toggle-status`, {}).then(res => { invalidateApiCache('users'); return res.data; });

export const uploadUserAvatar = (id: string, file: File): Promise<{ imageUrl: string }> => {
  const formData = new FormData();
  formData.append('file', file);
  return apiClient.post(`/users/${id}/avatar`, formData).then(res => { invalidateApiCache('users'); return res.data; });
};

// --- Role & Permission Management ---
export const getRoles = (): Promise<Role[]> =>
  cachedGet('roles', () => apiClient.get('/roles/all_roles').then(res => res.data));
export const getPermissions = (): Promise<PermissionDto[]> =>
  cachedGet('permissions', () => apiClient.get<PermissionDto[]>('/permissions').then(res => res.data));
export const getRoleDetails = (id: string): Promise<RoleDto> => apiClient.get(`/roles/${id}`).then(res => res.data);
export const createRole = (role: { name: string, permissions: string[] }): Promise<any> => apiClient.post('/roles', role).then(res => { invalidateApiCache('roles'); return res.data; });
export const updateRole = (id: string, role: { name: string, permissions: string[] }): Promise<any> => apiClient.put(`/roles/${id}`, role).then(res => { invalidateApiCache('roles'); return res.data; });
export const deleteRole = (id: string): Promise<any> => apiClient.delete(`/roles?id=${id}`).then(res => { invalidateApiCache('roles'); return res.data; });

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
  return apiClient.post('/auth/profile/avatar', formData).then(res => res.data);
};

// --- System Settings ---
export interface SystemSettingsDto {
  siteName: string;
  contactEmail: string;
  allowRegistration: boolean;
  requireEmailVerification: boolean;
  maintenanceMode: boolean;
  defaultToDarkMode: boolean;
  logoBase64?: string;
  // Merged from PaymentSettingsDto
  defaultCurrency?: string;
  bankAccountName?: string;
  bankAccountNumber?: string;
  bankRoutingNumber?: string;
  stripePublicKey?: string;
  enableOnlinePayments?: boolean;
  bankQrCodeBase64?: string;
  allowedCorsOrigins?: string;
  productExportFields?: string;
}
export const getSystemSettings = (): Promise<SystemSettingsDto> =>
  cachedGet('systemSettings', () => apiClient.get('/settings').then(res => res.data));
export const updateSystemSettings = (settings: SystemSettingsDto): Promise<SystemSettingsDto> =>
  apiClient.put('/settings', settings).then(res => {
    invalidateApiCache('systemSettings');
    return res.data;
  });

export const testStripeApiKey = (publicKey: string): Promise<{ success: boolean, message: string }> => {
  return apiClient.post('/settings/test-stripe', { publicKey }).then(res => res.data);
};

// --- Transactions ---
export interface TransactionDto {
  id: string;
  productId: string;
  productName: string;
  plateNumber?: string | null;
  engineNumber?: string | null;
  transactionType: string; // This is an enum on backend
  providerName: string;
  donorId: string;
  donorName: string;
  departmentId: string;
  departmentName: string;
  responserId: string;
  responserName: string;
  resource: string;
  quantity: number;
  totalCost: number;
  createdDate?: string | null;
  updateDate?: string | null;
}
export const getTransactions = (params: QueryOptions): Promise<PagedResult<TransactionDto>> =>
  cachedGet(
    stableKey('transactions', params),
    () => apiClient.get('/transactions', { params }).then(res => res.data),
    DEFAULT_LIST_TTL_MS
  );

// --- Product Purchase History ---
export interface ProductPurchaseHistoryDto {
  purchaseId: string;
  purchaseDate: string;
  voucherNumber?: string;
  supplierName?: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export const getProductPurchaseHistory = (productId: string): Promise<ProductPurchaseHistoryDto[]> =>
  apiClient.get(`/inventory/products/${productId}/purchase-history`).then(res => res.data);

export interface CreateWriteOffRequest {
  productId: string;
  quantity: number;
  reason: number; // 1: Damaged, 2: Stolen, 3: Expired, 4: Obsolete, 5: Lost, 6: BeyondRepair
  description?: string;
}
export const createWriteOff = (data: CreateWriteOffRequest): Promise<any> =>
  apiClient.post('/inventory/write-offs', data).then(res => {
    invalidateApiCache('products', 'transactions', 'writeoffs');
    return res.data;
  });

export interface WriteOffDto {
  id: string;
  productId: string;
  productName?: string;
  codeNumber?: string;
  quantity: number;
  reason: number;
  description?: string;
  status: string; // e.g., 'Pending', 'Approved', 'Rejected'
  createdDate?: string;
  createdBy?: string;
}

export const getWriteOffs = (params?: QueryOptions): Promise<PagedResult<WriteOffDto>> =>
  cachedGet(
    stableKey('writeoffs', params),
    () => apiClient.get('/inventory/write-offs', { params }).then(res => res.data),
    DEFAULT_LIST_TTL_MS
  );
export const approveWriteOff = (id: string): Promise<any> => apiClient.post(`/inventory/write-offs/${id}/approve`, {}).then(res => { invalidateApiCache('products', 'transactions', 'writeoffs'); return res.data; });
export const rejectWriteOff = (id: string): Promise<any> => apiClient.post(`/inventory/write-offs/${id}/reject`, {}).then(res => { invalidateApiCache('writeoffs'); return res.data; });
export const undoWriteOff = (id: string): Promise<any> => apiClient.post(`/inventory/write-offs/${id}/undo`, {}).then(res => { invalidateApiCache('products', 'transactions', 'writeoffs'); return res.data; });

// --- Complex Enterprise Reports ---
export interface CustomInventoryReportRequest {
  companyName: string;
  reportTitle: string;
  period: string;
  departmentLabel: string;
  preparedBy: string;
  checkedBy: string;
  approvedBy: string;
  logoBase64?: string | null;
  templateStyle?: 'Standard' | 'LegacyYearlyList';
  groupBy: 'None' | 'Category' | 'Department' | 'Year';
  columns: string[];
  name?: string;
  categoryId?: string;
  departmentId?: string;
  qualityId?: string;
  productGroup?: string;
  purchaseType?: string;
  vehicleType?: string;
  invoiceStartDate?: string;
  invoiceEndDate?: string;
  minPrice?: number;
  maxPrice?: number;
}

export interface AssessmentLineItemDto {
  description: string;
  quantity: number;
  price: number;
}

export interface AssessmentRequestFormDto {
  assessmentNo: string;
  assessmentDate: string;
  refToTicketNo: string;
  itemCode: string;
  subject: string;
  issueDescription: string;
  userName: string;
  departmentName: string;
  brandName: string;
  modelName: string;
  checkedBy: string;
  checkedDate?: string | null;
  items: AssessmentLineItemDto[];
}

export const exportCustomInventoryExcel = (payload: CustomInventoryReportRequest): Promise<Blob> =>
  apiClient.post('/reports/inventory/custom-excel', payload, { responseType: 'blob' }).then(res => res.data);

export const exportCustomInventoryPdf = (payload: CustomInventoryReportRequest): Promise<Blob> =>
  apiClient.post('/reports/inventory/custom-pdf', payload, { responseType: 'blob' }).then(res => res.data);

export const exportProductAssessmentPdf = (payload: AssessmentRequestFormDto): Promise<Blob> =>
  apiClient.post('/assessment-reports/product/pdf', payload, { responseType: 'blob' }).then(res => res.data);

export const exportProductAssessmentExcel = (payload: AssessmentRequestFormDto): Promise<Blob> =>
  apiClient.post('/assessment-reports/product/excel', payload, { responseType: 'blob' }).then(res => res.data);

export interface MonthlyTransactionReportFilters {
  departmentId?: string;
  transactionType?: string;
  search?: string;
  vehicleType?: string;
}

export const downloadMonthlyTransactionsPdf = (
  year: number,
  month: number,
  filters?: MonthlyTransactionReportFilters
): Promise<Blob> =>
  apiClient
    .get(`/reports/monthly-transactions/${year}/${month}`, {
      params: filters,
      responseType: 'blob',
    })
    .then(res => res.data);

export const downloadMonthlyTransactionsExcel = (
  year: number,
  month: number,
  filters?: MonthlyTransactionReportFilters
): Promise<Blob> =>
  apiClient
    .get(`/reports/monthly-transactions/${year}/${month}/excel`, {
      params: filters,
      responseType: 'blob',
    })
    .then(res => res.data);

export const enqueueMonthlyTransactionsReport = (year: number, month: number): Promise<{ jobId: string; message: string }> =>
  apiClient.post(`/reports/monthly-transactions/${year}/${month}/enqueue`, {}).then(res => res.data);

export interface QuickBooksReconciliationRequest {
  startDate?: string | null;
  endDate?: string | null;
  periodLabel: string;
  departmentId?: string | null;
  purchaseType?: string | null;
  vehicleType?: string | null;
  preparedBy: string;
  preparedRole: string;
  reviewedBy: string;
  reviewedRole: string;
  quickBooksReferenceTotal?: number | null;
  accountMappings?: Record<string, string>;
  includeMonthlyDepartmentSubReport: boolean;
}

export interface ReconciliationRowDto {
  productId: string;
  date: string;
  reference: string;
  department: string;
  description: string;
  plateNumber?: string | null;
  engineNumber?: string | null;
  className: string;
  categoryName: string;
  accountGroup: string;
  monthKey: string;
  monthLabel: string;
  quantity: number;
  unitPrice: number;
  amount: number;
}

export interface ReconciliationAccountGroupDto {
  accountGroup: string;
  rows: ReconciliationRowDto[];
  subtotal: number;
}

export interface ReconciliationSummaryItemDto {
  categoryLabel: string;
  itemCount: number;
  totalQuantity: number;
  amount: number;
}

export interface DepartmentMonthlyAmountRowDto {
  department: string;
  monthlyAmounts: Record<string, number>;
  totalItems: number;
  totalQuantity: number;
  totalAmount: number;
}

export interface QuickBooksReconciliationResponse {
  periodLabel: string;
  startDate: string;
  endDate: string;
  preparedBy: string;
  preparedRole: string;
  reviewedBy: string;
  reviewedRole: string;
  includeVehicleColumns?: boolean;
  accountGroups: ReconciliationAccountGroupDto[];
  recordedSummary: ReconciliationSummaryItemDto[];
  months: string[];
  departmentMonthlySubReport: DepartmentMonthlyAmountRowDto[];
  monthColumnTotals: Record<string, number>;
  grandTotal: number;
  quickBooksReferenceTotal?: number | null;
  varianceAmount?: number | null;
  totalItems: number;
  totalQuantity: number;
}

export const previewQuickBooksReconciliation = (
  payload: QuickBooksReconciliationRequest
): Promise<QuickBooksReconciliationResponse> =>
  apiClient.post('/reports/quickbooks-reconciliation/preview', payload).then(res => res.data);

export const exportQuickBooksReconciliationPdf = (
  payload: QuickBooksReconciliationRequest
): Promise<Blob> =>
  apiClient.post('/reports/quickbooks-reconciliation/pdf', payload, { responseType: 'blob' }).then(res => res.data);

export const exportQuickBooksReconciliationExcel = (
  payload: QuickBooksReconciliationRequest
): Promise<Blob> =>
  apiClient.post('/reports/quickbooks-reconciliation/excel', payload, { responseType: 'blob' }).then(res => res.data);
