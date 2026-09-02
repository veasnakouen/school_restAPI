import React, { useState, useEffect, useRef, useMemo } from 'react';
import { ProductDto, CategoryDto, CreateProductRequest } from '../../services/api';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import dayjs, { Dayjs } from 'dayjs';

interface ProductFormModalProps {
  product: ProductDto | null;
  categories: CategoryDto[];
  persons?: any[];
  onClose: () => void;
  onSave: (product: ProductDto | CreateProductRequest, imageFile: File | null) => Promise<void>;
  isSaving: boolean;
}

const emptyProduct: ProductDto = {
  id: null, name: '', codeNumber: null, description: null, categoryId: null,
  categoryName: null, brandId: null, brandName: null, price: null, imageUrl: null,
  quality: null, createdDate: null, updateDate: null, year: null, departmentId: null,
  departmentName: null, attributes: null, plateNumber: null, engineNumber: null,
  purchaseType: null, initialQuantity: null, supplierName: null, donorName: null, voucherNumber: null,
  supplierContact: null, invoiceDate: null
};

export const ProductFormModal: React.FC<ProductFormModalProps> = ({ product, categories, onClose, onSave, isSaving }) => {
  const [formData, setFormData] = useState<ProductDto>(emptyProduct);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  // Local state for dynamic contacts
  const [contacts, setContacts] = useState<{ type: string, value: string }[]>([{ type: 'Phone', value: '' }]);

  const [isDirty, setIsDirty] = useState(false);
  const [showConfirmClose, setShowConfirmClose] = useState(false);

  const isEditing = !!(product && product.id);

  useEffect(() => {
    setIsDirty(false);
    setShowConfirmClose(false);
    if (product) {
      setFormData({ ...product });
      setImagePreview(product.imageUrl || null);
      if (product.supplierContact) {
        // supplierContact is now Record<string, string>
        const parsed = Object.entries(product.supplierContact).map(([type, value]) => ({
          type, value
        })).filter(c => c.value !== '');
        setContacts(parsed.length > 0 ? parsed : [{ type: 'Phone', value: '' }]);
      } else {
        setContacts([{ type: 'Phone', value: '' }]);
      }
    } else {
      setFormData(emptyProduct);
      setImagePreview(null);
      setContacts([{ type: 'Phone', value: '' }]);
    }
    setImageFile(null);
  }, [product]);

  const addContact = () => {
    setContacts([...contacts, { type: 'Phone', value: '' }]);
    setIsDirty(true);
  };

  const handleContactChange = (index: number, field: 'type' | 'value', val: string) => {
    const newContacts = [...contacts];
    newContacts[index][field] = val;
    setContacts(newContacts);
    updateSupplierContact(newContacts);
    setIsDirty(true);
  };

  const removeContact = (index: number) => {
    const newContacts = contacts.filter((_, i) => i !== index);
    setContacts(newContacts);
    updateSupplierContact(newContacts);
    setIsDirty(true);
  };

  const updateSupplierContact = (currentContacts: { type: string, value: string }[]) => {
    const combined = currentContacts
      .filter(c => c.value.trim() !== '')
      .reduce((acc, c) => {
        acc[c.type] = c.value;
        return acc;
      }, {} as Record<string, string>);
    setFormData(prev => ({ ...prev, supplierContact: Object.keys(combined).length > 0 ? combined : null }));
  };

  const isVehicleCategory = useMemo(() => {
    const catName = (
      formData.categoryName ||
      categories.find(c => c.id === formData.categoryId)?.name ||
      ''
    ).toLowerCase();
    return catName.includes('car') || catName.includes('motor') || catName.includes('moto') || catName.includes('bike') || catName.includes('vehicle');
  }, [formData, categories]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setIsDirty(true);
    const target = e.target as HTMLInputElement;
    const name = target.name;

    if (name === 'year') {
      const val = target.value;
      setFormData(prev => ({ ...prev, year: val ? `${val}-01-01T00:00:00Z` : null }));
      return;
    }

    const value = (target.type === 'number' || name === 'initialQuantity') ? (target.value === '' ? null : parseFloat(target.value)) : target.value;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setIsDirty(true);
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

  const handleAttemptClose = (e?: React.MouseEvent | React.FormEvent) => {
    if (e) e.preventDefault();
    if (isDirty) {
      setShowConfirmClose(true);
    } else {
      onClose();
    }
  };

  const isFormValid = formData.name && formData.price !== null && formData.price !== undefined;

  return (
    <dialog id="product-form-modal" className="modal modal-open">
      <div className="modal-box max-w-3xl">
        <button type="button" onClick={handleAttemptClose} aria-label="Close dialog" className="btn btn-sm btn-circle btn-ghost absolute right-2 top-2 z-10">✕</button>
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
              <div className="relative w-full max-w-[160px] mx-auto aspect-square rounded-xl overflow-hidden border-2 border-dashed border-base-300 bg-base-200 hover:border-primary transition-colors cursor-pointer" onClick={() => fileInputRef.current?.click()}>
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
              <input
                list="category-options"
                name="categoryName"
                value={formData.categoryName || ''}
                onChange={(e) => {
                  setIsDirty(true);
                  const val = e.target.value;
                  const selectedCat = categories.find(c => c.name.toLowerCase() === val.toLowerCase());
                  setFormData(prev => ({
                    ...prev,
                    categoryName: val,
                    categoryId: selectedCat ? selectedCat.id : null
                  }));
                }}
                placeholder="Select or type new category..."
                className="input input-bordered w-full"
              />
              <datalist id="category-options">
                {categories.map(cat => (
                  <option key={cat.id} value={cat.name} />
                ))}
              </datalist>
            </div>
            <div className="form-control w-full">
              <label className="label"><span className="label-text font-semibold">Brand</span></label>
              <input type="text" name="brandName" value={formData.brandName || ''} onChange={handleChange} placeholder="e.g. Dell" className="input input-bordered w-full" />
            </div>
          </div>

          {/* Vehicle Specific Fields */}
          {isVehicleCategory && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-base-200/50 p-4 rounded-xl border border-base-300">
              <div className="form-control w-full">
                <label className="label"><span className="label-text font-semibold">Year</span></label>
                <select name="year" value={formData.year ? formData.year.substring(0, 4) : ''} onChange={handleChange} className="select select-bordered w-full bg-base-100">
                  <option value="">Select year...</option>
                  {Array.from({ length: 21 }, (_, i) => new Date().getFullYear() - i).map(y => (
                    <option key={y} value={y.toString()}>{y}</option>
                  ))}
                </select>
              </div>
              <div className="form-control w-full">
                <label className="label"><span className="label-text font-semibold">Plate Number</span></label>
                <input type="text" name="plateNumber" value={formData.plateNumber || ''} onChange={handleChange} placeholder="e.g. 1A-1234" className="input input-bordered w-full bg-base-100" />
              </div>
              <div className="form-control w-full">
                <label className="label"><span className="label-text font-semibold">Engine / Serial Number</span></label>
                <input type="text" name="engineNumber" value={formData.engineNumber || ''} onChange={handleChange} placeholder="e.g. ENG-987654" className="input input-bordered w-full bg-base-100" />
              </div>
            </div>
          )}

          <div className="form-control w-full">
            <label className="label"><span className="label-text font-semibold">Price <span className="text-error">*</span></span></label>
            <input type="number" name="price" value={formData.price ?? ''} onChange={handleChange} required placeholder="e.g. 1200.00" className="input input-bordered w-full" step="0.01" min="0" />
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
          </div>

          <div className="form-control w-full">
            <label className="label"><span className="label-text font-semibold">Description</span></label>
            <textarea name="description" value={formData.description || ''} onChange={handleChange} placeholder="Product description..." className="textarea textarea-bordered w-full" rows={3}></textarea>
          </div>

          {(!isEditing || (formData.purchaseType && formData.purchaseType !== 'None')) && (
            <>
              <div className="divider my-2">{isEditing ? 'Purchase Information' : 'Initial Stock / Acquisition'}</div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-base-200/30 p-4 rounded-xl border border-base-300">
                <div className="form-control w-full">
                  <label className="label"><span className="label-text font-semibold">Acquisition Type</span></label>
                  <select name="purchaseType" value={formData.purchaseType || 'None'} onChange={handleChange} className="select select-bordered w-full bg-base-100">
                    <option value="None">None (Just setup product catalog)</option>
                    <option value="Purchased">Purchased</option>
                    <option value="Donated">Donated</option>
                  </select>
                </div>
                {formData.purchaseType && formData.purchaseType !== 'None' && (
                  <>
                    <div className="form-control w-full">
                      <label className="label"><span className="label-text font-semibold">Initial Quantity <span className="text-error">*</span></span></label>
                      <input type="number" name="initialQuantity" value={formData.initialQuantity ?? ''} onChange={handleChange} min="1" required className="input input-bordered w-full bg-base-100" />
                    </div>
                    <div className="form-control w-full">
                      <label className="label"><span className="label-text font-semibold">Invoice Date</span></label>
                      <DatePicker
                        slotProps={{ textField: { size: 'small', fullWidth: true, className: "bg-base-100" } }}
                        value={formData.invoiceDate ? dayjs(formData.invoiceDate) : null}
                        onChange={(newDate: Dayjs | null) => {
                          setFormData({ ...formData, invoiceDate: newDate && newDate.isValid() ? `${newDate.format('YYYY-MM-DD')}T00:00:00.000Z` : null });
                        }}
                      />
                      {/* <DatePicker
                        label={"Invoice Date"}
                        slotProps={{
                          textField: {
                            helperText: 'MM/DD/YYYY',
                          }
                        }}
                      /> */}
                    </div>
                    <div className="form-control w-full">
                      <label className="label"><span className="label-text font-semibold">Voucher Number</span></label>
                      <input type="text" name="voucherNumber" value={formData.voucherNumber || ''} onChange={handleChange} placeholder="e.g. INV-12345" className="input input-bordered w-full bg-base-100" />
                    </div>
                    <div className="form-control w-full"><label className="label"><span className="label-text font-semibold">Supplier Name</span></label><input type="text" name="supplierName" value={formData.supplierName || ''} onChange={handleChange} placeholder="e.g. ABC Tech" className="input input-bordered w-full bg-base-100" /></div>
                    <div className="form-control w-full"><label className="label"><span className="label-text font-semibold">Donor Name</span></label><input type="text" name="donorName" value={formData.donorName || ''} onChange={handleChange} placeholder="e.g. John Doe" className="input input-bordered w-full bg-base-100" /></div>

                    <div className="form-control w-full md:col-span-2">
                      <label className="label">
                        <span className="label-text font-semibold">Contact Info</span>
                        <button type="button" onClick={addContact} className="btn btn-xs btn-outline btn-primary">+ Add Contact</button>
                      </label>
                      <div className="flex flex-col gap-2">
                        {contacts.map((contact, index) => {
                          const isPredefined = ['Phone', 'Email'].includes(contact.type);
                          const selectValue = isPredefined ? contact.type : 'Other';
                          return (
                            <div key={index} className="flex gap-2 items-center">
                              <select
                                className="select select-bordered w-1/3 bg-base-100"
                                value={selectValue}
                                onChange={(e) => {
                                  const newType = e.target.value === 'Other' ? '' : e.target.value;
                                  handleContactChange(index, 'type', newType);
                                }}
                              >
                                <option value="Phone">Phone</option>
                                <option value="Email">Email</option>
                                <option value="Other">Other...</option>
                              </select>
                              {selectValue === 'Other' && (
                                <input
                                  type="text"
                                  className="input input-bordered w-1/3 bg-base-100"
                                  placeholder="Custom Label"
                                  value={contact.type}
                                  onChange={(e) => handleContactChange(index, 'type', e.target.value)}
                                />
                              )}
                              <input type="text" className="input input-bordered w-full bg-base-100" placeholder={contact.type === 'Email' ? 'e.g. mail@example.com' : 'e.g. 012 345 678'} value={contact.value} onChange={(e) => handleContactChange(index, 'value', e.target.value)} />
                              {contacts.length > 1 && (
                                <button type="button" onClick={() => removeContact(index)} className="btn btn-square btn-outline btn-error btn-sm" title="Remove contact">✕</button>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </>
                )}
              </div>
            </>
          )}

          <div className="modal-action">
            <button type="button" className="btn btn-ghost" onClick={handleAttemptClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={!isFormValid || isSaving}>
              {isSaving && <span className="loading loading-spinner loading-sm"></span>}
              {isEditing ? 'Save Changes' : 'Create Product'}
            </button>
          </div>
        </form>
      </div>
      <form method="dialog" className="modal-backdrop" onClick={(e) => { e.preventDefault(); handleAttemptClose(); }}>
        <button type="button">close</button>
      </form>

      {/* Confirmation Modal Overlay */}
      {showConfirmClose && (
        <div className="modal modal-open z-[9999] bg-black/40">
          <div className="modal-box">
            <h3 className="font-bold text-lg text-error">Unsaved Changes</h3>
            <p className="py-4">You have unsaved changes. Are you sure you want to close without saving?</p>
            <div className="modal-action">
              <button type="button" className="btn btn-ghost" onClick={() => setShowConfirmClose(false)}>Keep Editing</button>
              <button type="button" className="btn btn-error" onClick={onClose}>Discard Changes</button>
            </div>
          </div>
        </div>
      )}
    </dialog>
  );
};