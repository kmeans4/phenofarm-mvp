'use client';

import React, { useState, useRef } from 'react';
import { Button } from '@/app/components/ui/Button';

interface ProductFormProps {
  initialData?: {
    id?: string;
    name?: string;
    strain?: string;
    category?: string;
    subcategory?: string;
    thc?: string;
    cbd?: string;
    price?: string;
    inventoryQty?: string;
    unit?: string;
    description?: string;
    isAvailable?: boolean;
    sku?: string;
    brand?: string;
    ingredients?: string;
    ingredientsDocumentUrl?: string;
    images?: string[];
    isFeatured?: boolean;
  };
  onSubmit: (data: any) => void;
  onCancel: () => void;
  growerBrand?: string;
}

const CATEGORY_OPTIONS = [
  'Bulk Extract',
  'Cartridge',
  'Edibles',
  'Drink',
  'Flower',
  'Live Plant',
  'Merchandise',
  'Plant Material',
  'Prepack',
  'Seed',
  'Tincture',
  'Topicals/Wellness',
  'Other',
];

export function ProductForm({ initialData, onSubmit, onCancel, growerBrand }: ProductFormProps) {
  const [name, setName] = useState(initialData?.name || '');
  const [strain, setStrain] = useState(initialData?.strain || '');
  const [category, setCategory] = useState(initialData?.category || '');
  const [subcategory, setSubcategory] = useState(initialData?.subcategory || '');
  const [thc, setThc] = useState(initialData?.thc || '');
  const [cbd, setCbd] = useState(initialData?.cbd || '');
  const [price, setPrice] = useState(initialData?.price || '');
  const [inventoryQty, setInventoryQty] = useState(initialData?.inventoryQty || '');
  const [unit, setUnit] = useState(initialData?.unit || 'gram');
  const [description, setDescription] = useState(initialData?.description || '');
  const [isAvailable, setIsAvailable] = useState(initialData?.isAvailable ?? true);
  
  // New fields
  const [sku, setSku] = useState(initialData?.sku || '');
  const [brand, setBrand] = useState(initialData?.brand || growerBrand || '');
  const [ingredients, setIngredients] = useState(initialData?.ingredients || '');
  const [isFeatured, setIsFeatured] = useState(initialData?.isFeatured || false);
  
  // File uploads
  const [ingredientDocFile, setIngredientDocFile] = useState<File | null>(null);
  const [ingredientDocName, setIngredientDocName] = useState<string>('');
  const [ingredientDocBase64, setIngredientDocBase64] = useState<string>('');
  const [productImages, setProductImages] = useState<string[]>(initialData?.images || []);
  const [imagePreviewUrls, setImagePreviewUrls] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  
  const imageInputRef = useRef<HTMLInputElement>(null);
  const docInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    
    const validTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp'];
    const newImages: string[] = [];
    const newPreviews: string[] = [];
    
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (!validTypes.includes(file.type)) {
        alert(`Invalid file type: ${file.name}. Only JPG, JPEG, PNG, and WebP are allowed.`);
        continue;
      }
      
      // Check total images limit
      if (productImages.length + newImages.length >= 5) {
        alert('Maximum 5 images allowed');
        break;
      }
      
      const reader = new FileReader();
      const base64Promise = new Promise<string>((resolve) => {
        reader.onload = () => {
          const result = reader.result as string;
          resolve(result);
        };
      });
      
      reader.readAsDataURL(file);
      const base64 = await base64Promise;
      newImages.push(base64);
      newPreviews.push(base64);
    }
    
    setProductImages([...productImages, ...newImages]);
    setImagePreviewUrls([...imagePreviewUrls, ...newPreviews]);
  };

  const handleDocUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    const validTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    if (!validTypes.includes(file.type)) {
      alert('Invalid file type. Only PDF, DOC, and DOCX are allowed.');
      return;
    }
    
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      setIngredientDocBase64(result);
      setIngredientDocName(file.name);
    };
    reader.readAsDataURL(file);
    setIngredientDocFile(file);
  };

  const removeImage = (index: number) => {
    const newImages = productImages.filter((_, i) => i !== index);
    const newPreviews = imagePreviewUrls.filter((_, i) => i !== index);
    setProductImages(newImages);
    setImagePreviewUrls(newPreviews);
  };

  const removeDocument = () => {
    setIngredientDocFile(null);
    setIngredientDocName('');
    setIngredientDocBase64('');
    if (docInputRef.current) {
      docInputRef.current.value = '';
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    onSubmit({
      name,
      strain,
      category,
      subcategory,
      thc,
      cbd,
      price,
      inventoryQty,
      unit,
      description,
      isAvailable,
      sku,
      brand,
      ingredients,
      ingredientsDocumentUrl: ingredientDocBase64,
      images: productImages,
      isFeatured,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {/* Product Name */}
        <div className="space-y-2">
          <label htmlFor="name" className="text-sm font-medium text-gray-900">
            Product Name *
          </label>
          <input
            id="name"
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-green-500 focus:ring-green-500"
          />
        </div>

        {/* Category Dropdown - REQUIRED */}
        <div className="space-y-2">
          <label htmlFor="category" className="text-sm font-medium text-gray-900">
            Category *
          </label>
          <select
            id="category"
            required
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-green-500 focus:ring-green-500"
          >
            <option value="">Select a category</option>
            {CATEGORY_OPTIONS.map((cat) => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>

        {/* Strain */}
        <div className="space-y-2">
          <label htmlFor="strain" className="text-sm font-medium text-gray-900">
            Strain
          </label>
          <input
            id="strain"
            type="text"
            value={strain}
            onChange={(e) => setStrain(e.target.value)}
            className="block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-green-500 focus:ring-green-500"
          />
        </div>

        {/* Subcategory */}
        <div className="space-y-2">
          <label htmlFor="subcategory" className="text-sm font-medium text-gray-900">
            Subcategory
          </label>
          <input
            id="subcategory"
            type="text"
            value={subcategory}
            onChange={(e) => setSubcategory(e.target.value)}
            className="block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-green-500 focus:ring-green-500"
          />
        </div>

        {/* SKU */}
        <div className="space-y-2">
          <label htmlFor="sku" className="text-sm font-medium text-gray-900">
            SKU
          </label>
          <input
            id="sku"
            type="text"
            value={sku}
            onChange={(e) => setSku(e.target.value)}
            placeholder="Enter product SKU"
            className="block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-green-500 focus:ring-green-500"
          />
        </div>

        {/* Brand */}
        <div className="space-y-2">
          <label htmlFor="brand" className="text-sm font-medium text-gray-900">
            Brand
          </label>
          <input
            id="brand"
            type="text"
            value={brand}
            onChange={(e) => setBrand(e.target.value)}
            className="block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-green-500 focus:ring-green-500"
          />
          <p className="text-xs text-gray-500">Defaults to your grower brand</p>
        </div>

        {/* THC */}
        <div className="space-y-2">
          <label htmlFor="thc" className="text-sm font-medium text-gray-900">
            THC %
          </label>
          <input
            id="thc"
            type="number"
            step="0.1"
            max="100"
            value={thc}
            onChange={(e) => setThc(e.target.value)}
            className="block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-green-500 focus:ring-green-500"
          />
        </div>

        {/* CBD */}
        <div className="space-y-2">
          <label htmlFor="cbd" className="text-sm font-medium text-gray-900">
            CBD %
          </label>
          <input
            id="cbd"
            type="number"
            step="0.1"
            max="100"
            value={cbd}
            onChange={(e) => setCbd(e.target.value)}
            className="block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-green-500 focus:ring-green-500"
          />
        </div>

        {/* Price */}
        <div className="space-y-2">
          <label htmlFor="price" className="text-sm font-medium text-gray-900">
            Price ($) *
          </label>
          <input
            id="price"
            type="number"
            step="0.01"
            required
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            className="block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-green-500 focus:ring-green-500"
          />
        </div>

        {/* Inventory Quantity */}
        <div className="space-y-2">
          <label htmlFor="inventoryQty" className="text-sm font-medium text-gray-900">
            Inventory Quantity *
          </label>
          <input
            id="inventoryQty"
            type="number"
            required
            min="0"
            value={inventoryQty}
            onChange={(e) => setInventoryQty(e.target.value)}
            className="block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-green-500 focus:ring-green-500"
          />
        </div>

        {/* Unit */}
        <div className="space-y-2">
          <label htmlFor="unit" className="text-sm font-medium text-gray-900">
            Unit *
          </label>
          <select
            id="unit"
            value={unit}
            onChange={(e) => setUnit(e.target.value)}
            className="block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-green-500 focus:ring-green-500"
          >
            <option value="gram">Gram</option>
            <option value="eighth">1/8 Oz (3.5g)</option>
            <option value="quarter">1/4 Oz (7g)</option>
            <option value="half">1/2 Oz (14g)</option>
            <option value="ounce">Ounce (28g)</option>
            <option value="pound">Pound (448g)</option>
          </select>
        </div>

        {/* Ingredients */}
        <div className="space-y-2 md:col-span-2">
          <label htmlFor="ingredients" className="text-sm font-medium text-gray-900">
            Ingredients
          </label>
          <textarea
            id="ingredients"
            rows={3}
            value={ingredients}
            onChange={(e) => setIngredients(e.target.value)}
            placeholder="List ingredients..."
            className="block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-green-500 focus:ring-green-500"
          />
        </div>

        {/* Description */}
        <div className="space-y-2 md:col-span-2">
          <label htmlFor="description" className="text-sm font-medium text-gray-900">
            Description
          </label>
          <textarea
            id="description"
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-green-500 focus:ring-green-500"
          />
        </div>

        {/* Ingredients Document Upload */}
        <div className="space-y-2 md:col-span-2">
          <label htmlFor="ingredientDoc" className="text-sm font-medium text-gray-900">
            Upload Ingredients Document (Optional)
          </label>
          <div className="flex items-center gap-4">
            <input
              ref={docInputRef}
              id="ingredientDoc"
              type="file"
              accept=".pdf,.doc,.docx"
              onChange={handleDocUpload}
              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-green-50 file:text-green-700 hover:file:bg-green-100"
            />
            {ingredientDocName && (
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">{ingredientDocName}</span>
                <button
                  type="button"
                  onClick={removeDocument}
                  className="text-red-500 hover:text-red-700"
                >
                  ✕
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Product Images Upload */}
        <div className="space-y-2 md:col-span-2">
          <label className="text-sm font-medium text-gray-900">
            Product Images (Max 5)
          </label>
          <div 
            className="border-2 border-dashed border-gray-300 rounded-md p-4 hover:border-green-500 transition-colors cursor-pointer"
            onClick={() => imageInputRef.current?.click()}
          >
            <input
              ref={imageInputRef}
              type="file"
              accept=".jpg,.jpeg,.png,.webp"
              multiple
              onChange={handleImageUpload}
              className="hidden"
            />
            <div className="text-center">
              <p className="text-sm text-gray-500">
                Click to upload or drag and drop
              </p>
              <p className="text-xs text-gray-400">
                JPG, JPEG, PNG, WebP (max 5 images)
              </p>
            </div>
          </div>
          
          {/* Image Previews */}
          {imagePreviewUrls.length > 0 && (
            <div className="flex flex-wrap gap-4 mt-4">
              {imagePreviewUrls.map((url, index) => (
                <div key={index} className="relative">
                  <img 
                    src={url} 
                    alt={`Product image ${index + 1}`} 
                    className="w-24 h-24 object-cover rounded-md border border-gray-200"
                  />
                  <button
                    type="button"
                    onClick={() => removeImage(index)}
                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-700"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Is Available Checkbox */}
        <div className="flex items-center space-x-2">
          <input
            id="isAvailable"
            type="checkbox"
            checked={isAvailable}
            onChange={(e) => setIsAvailable(e.target.checked)}
            className="h-4 w-4 rounded border-gray-300 text-green-600 focus:ring-green-500"
          />
          <label htmlFor="isAvailable" className="text-sm font-medium text-gray-900">
            Product is currently available
          </label>
        </div>

        {/* Is Featured Checkbox */}
        <div className="flex items-center space-x-2">
          <input
            id="isFeatured"
            type="checkbox"
            checked={isFeatured}
            onChange={(e) => setIsFeatured(e.target.checked)}
            className="h-4 w-4 rounded border-gray-300 text-green-600 focus:ring-green-500"
          />
          <label htmlFor="isFeatured" className="text-sm font-medium text-gray-900">
            Feature this product
          </label>
          <span className="text-xs text-gray-500">(Show in Featured Products section)</span>
        </div>
      </div>

      <div className="flex justify-end space-x-3 border-t border-gray-200 pt-6">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" variant="primary" disabled={isUploading}>
          {isUploading ? 'Creating...' : (initialData?.id ? 'Update Product' : 'Create Product')}
        </Button>
      </div>
    </form>
  );
}

export default ProductForm;
