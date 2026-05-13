export interface CategoryDto {
  id?: string | null;
  name: string;
}

export interface BrandDto {
  id?: string | null;
  name: string;
}

export interface DepartmentDto {
  id: string;
  name: string;
}

export interface PersonDto {
  id: string;
  fullName: string;
}

export interface SupplierDto {
  id: string;
  name: string;
}

export interface ProductPurchaseHistoryDto {
  purchaseId: string;
  purchaseDate: string;
  voucherNumber?: string | null;
  supplierName?: string | null;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export interface ProductDto {
  id?: string | null;
  name: string;
  codeNumber?: string | null;
  description?: string | null;
  categoryId?: string | null;
  categoryName?: string | null;
  brandId?: string | null;
  brandName?: string | null;
  departmentId?: string | null;
  departmentName?: string | null;
  price?: number | null;
  imageUrl?: string | null;
  quality?: string | null;
  voucherNumber?: string | null;
  createdDate?: string | null;
  updateDate?: string | null;
  year?: string | null;
  plateNumber?: string | null;
  engineNumber?: string | null;
  purchaseType?: string | null;
  initialQuantity?: number | null;
  supplierName?: string | null;
  donorName?: string | null;
  supplierContact?: string | null;
  invoiceDate?: string | null;
  purchaseHistory?: ProductPurchaseHistoryDto[] | null;
  responsiblePerson?: string | null;
}

export interface CreateProductRequest {
  name: string;
  codeNumber?: string | null;
  description?: string | null;
  categoryId?: string | null;
  categoryName?: string | null;
  brandId?: string | null;
  brandName?: string | null;
  departmentId?: string | null;
  departmentName?: string | null;
  price?: number | null;
  quality?: string | null;
  voucherNumber?: string | null;
  year?: string | null;
  plateNumber?: string | null;
  engineNumber?: string | null;
  purchaseType?: string | null;
  initialQuantity?: number | null;
  supplierName?: string | null;
  donorName?: string | null;
  supplierContact?: string | null;
  invoiceDate?: string | null;
  responsiblePerson?: string | null;
}

export type TransactionType = 'Purchase' | 'Donate' | 'Resource';

export interface TransactionDto {
  id: string;
  productId: string;
  productName: string;
  transactionType: TransactionType;
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
  createdDate: string;
  updateDate: string;
}
