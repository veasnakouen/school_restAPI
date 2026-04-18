import React, { useState, useEffect, useRef } from 'react';
import { ProductDto, CategoryDto, CreateProductRequest } from '../../services/api';

interface ProductFormModalProps {
  product: ProductDto | null;
  categories: CategoryDto[];
  onClose: () => void;
  onSave: (product: ProductDto | CreateProductRequest, imageFile: File | null) => Promise<void>;
  isSaving: boolean;
}

const emptyProduct: ProductDto = {
  id: null, name: '', codeNumber: null, description: null, categoryId: null,
  categoryName: null, brandId: null, brandName: null, price: null, imageUrl: null,
  quality: null, voucherNumber: null, createdDate: null, updateDate: null
};

export const ProductFormModal: React.FC<ProductFormModalProps> = ({ product, categories, onClose, onSave, isSaving }) => {
  const [formData, setFormData] = useState<ProductDto>(emptyProduct);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isEditing = !!(product && product.id);

  useEffect(() => {
    if (product) {
      setFormData({ ...product });
      setImagePreview(product.imageUrl);
    } else {
      setFormData(emptyProduct);
      setImagePreview(null);
    }
    setImageFile(null);
  }, [product]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSave(formData, imageFile);
  };

  const isFormValid = formData.name && formData.price !== null && formData.price !== undefined;

  return (
    <dialog id="product-form-modal" className="modal modal-open">
      <div className="modal-box max-w-3xl">
        <button onClick={onClose} aria-label="Close dialog" className="btn btn-sm btn-circle btn-ghost absolute right-2 top-2 z-10">✕</button>
        <h3 className="font-bold text-lg mb-4">
          {isEditing ? 'Edit Product' : 'Create New Product'}
        </h3>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2 space-y-4">
              <div className="form-control w-full">
                <label className="label"><span className="label-text font-semibold">Product Name <span className="text-error">*</span></span></label>
                <input type="text" name="name" value={formData.name} onChange={handleChange} required placeholder="e.g. Laptop Dell XPS 15" className="input input-bordered w-full" />
              </div>
              <div className="form-control w-full">
                <label className="label"><span className="label-text font-semibold">Code Number</span></label>
                <input type="text" name="codeNumber" value={formData.codeNumber || ''} onChange={handleChange} placeholder="e.g. PROD-001" className="input input-bordered w-full" />
              </div>
            </div>

            <div className="flex flex-col items-center gap-3">
              <div className="relative w-full aspect-square rounded-xl overflow-hidden border-2 border-dashed border-base-300 bg-base-200 hover:border-primary transition-colors cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                {imagePreview ? (
                  <img src={imagePreview} alt="Product preview" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center text-base-content/40">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                    <span className="text-sm font-medium">Click to upload</span>
                  </div>
                )}
              </div>
              <input id="product-image-input" type="file" accept="image/*" className="hidden" ref={fileInputRef} onChange={handleImageChange} />
            </div>
          </div>

          <div className="divider my-2"></div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="form-control w-full">
              <label className="label"><span className="label-text font-semibold">Category</span></label>
              <select name="categoryId" value={formData.categoryId || ''} onChange={handleChange} className="select select-bordered w-full">
                <option value="">Select category...</option>
                {categories.map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
            </div>
            <div className="form-control w-full">
              <label className="label"><span className="label-text font-semibold">Brand</span></label>
              <input type="text" name="brandName" value={formData.brandName || ''} onChange={handleChange} placeholder="e.g. Dell" className="input input-bordered w-full" />
            </div>
          </div>

          <div className="form-control w-full">
            <label className="label"><span className="label-text font-semibold">Price <span className="text-error">*</span></span></label>
            <input type="number" name="price" value={formData.price || ''} onChange={handleChange} required placeholder="e.g. 1200.00" className="input input-bordered w-full" step="0.01" min="0" />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="form-control w-full">
              <label className="label"><span className="label-text font-semibold">Quality</span></label>
              <select name="quality" value={formData.quality || ''} onChange={handleChange} className="select select-bordered w-full">
                <option value="">Select quality...</option>
                <option value="Excellent">Excellent</option>
                <option value="Good">Good</option>
                <option value="Fair">Fair</option>
                <option value="Poor">Poor</option>
              </select>
            </div>
            <div className="form-control w-full">
              <label className="label"><span className="label-text font-semibold">Voucher Number</span></label>
              <input type="text" name="voucherNumber" value={formData.voucherNumber || ''} onChange={handleChange} placeholder="e.g. VCH-2024-001" className="input input-bordered w-full" />
            </div>
          </div>

          <div className="form-control w-full">
            <label className="label"><span className="label-text font-semibold">Description</span></label>
            <textarea name="description" value={formData.description || ''} onChange={handleChange} placeholder="Product description..." className="textarea textarea-bordered w-full" rows={3}></textarea>
          </div>

          <div className="modal-action">
            <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={!isFormValid || isSaving}>
              {isSaving && <span className="loading loading-spinner loading-sm"></span>}
              {isEditing ? 'Save Changes' : 'Create Product'}
            </button>
          </div>
        </form>
      </div>
      <form method="dialog" className="modal-backdrop" onClick={onClose}>
        <button>close</button>
      </form>
    </dialog>
  );
};