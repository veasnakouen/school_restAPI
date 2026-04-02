export interface ProductDto {
  id?: string | null;
  name: string;
  codeNumber?: string | null;
  description?: string | null;
  categoryId?: string | null;
  categoryName?: string | null;
  brandId?: string | null;
  brandName?: string | null;
  price?: number | null;
  imageUrl?: string | null;
  quality?: string | null;
  voucherNumber?: string | null;
  createdDate?: string | null;
  updateDate?: string | null;
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
