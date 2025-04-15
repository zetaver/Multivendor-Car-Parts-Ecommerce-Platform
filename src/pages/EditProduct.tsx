import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Check, Plus, Trash2, X, ChevronDown, Search, ArrowLeft, Loader2, Eye, AlertTriangle } from "lucide-react";
import ImageUpload from '../components/ui/ImageUpload';
import axios from 'axios';
import Loader from '../components/ui/Loader';
import { API_URL } from '../config';
import { toast } from "react-toastify";

interface Version {
  id: string;
  name: string;
  year?: number;
}

interface Model {
  id: string;
  name: string;
  versions: Version[];
}

interface Brand {
  id: string;
  name: string;
  logo?: string;
  models: Model[];
}

interface CompatibilityItem {
  make: string;
  model: string;
  year: number;
  id: string;
  brandId?: string;
  modelId?: string;
  versionId?: string;
}

interface Category {
  _id: string;
  name: string;
  description?: string;
  imageUrl?: string;
}

// Add image URL formatting function
const formatImageUrl = (imageUrl: string | undefined | null): string => {
  // If the URL is null, undefined, or empty, return a placeholder image
  if (!imageUrl || imageUrl.trim() === '') {
    return 'https://via.placeholder.com/60';
  }

  // Check if the URL already includes http:// or https://
  if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
    return imageUrl;
  }

  // Check if the URL starts with a slash
  if (!imageUrl.startsWith('/')) {
    imageUrl = '/' + imageUrl;
  }

  // Return the complete URL
  return `${API_URL}${imageUrl}`;
};

const EditProduct: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  
  // Product form state
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [oem, setOem] = useState("");
  const [price, setPrice] = useState(0);
  const [category, setCategory] = useState<Category | null>(null);
  const [compatibilityItems, setCompatibilityItems] = useState<CompatibilityItem[]>([
    { make: "", model: "", year: new Date().getFullYear(), id: "1" }
  ]);
  
  // UI state
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [generalError, setGeneralError] = useState<string | null>(null);
  const [productImages, setProductImages] = useState<File[]>([]);
  const [images, setImages] = useState<{ file: File; url?: string; filename?: string; uploaded: boolean }[]>([]);
  const [existingImageUrls, setExistingImageUrls] = useState<string[]>([]);
  const [imagesToRemove, setImagesToRemove] = useState<string[]>([]);
  
  // Brand-related state
  const [brands, setBrands] = useState<Brand[]>([]);
  const [loadingBrands, setLoadingBrands] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState<{ itemId: string, field: string } | null>(null);

  // Fetch product data
  useEffect(() => {
    const fetchProduct = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('accessToken');
        const response = await axios.get(`${API_URL}/api/products/${id}`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });

        const product = response.data;
        
        // Populate form fields
        setTitle(product.title || '');
        setDescription(product.description || '');
        setOem(product.oemNumber || '');
        setPrice(product.price || 0);
        
        // Set category if available
        if (product.category) {
          setCategory({
            _id: product.category._id,
            name: product.category.name,
            description: product.category.description,
            imageUrl: product.category.imageUrl
          });
        }
        
        // Set existing images
        if (product.images && product.images.length > 0) {
          setExistingImageUrls(product.images);
        }
        
        // Set compatibility
        if (product.compatibility && product.compatibility.length > 0) {
          // Format compatibility items with IDs
          const formattedCompatibility = product.compatibility.map((item: any, index: number) => ({
            make: item.make || '',
            model: item.model || '',
            year: item.year || new Date().getFullYear(),
            id: `existing-${index}`
          }));
          setCompatibilityItems(formattedCompatibility);
        }
        
      } catch (error) {
        console.error('Error fetching product:', error);
        setGeneralError('Failed to load product data. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
    fetchBrands();
  }, [id]);
  
  // Fetch brands for compatibility
  const fetchBrands = async () => {
    try {
      setLoadingBrands(true);
      const response = await axios.get(`${API_URL}/api/brands`);
      if (response.data && response.data.brands) {
        setBrands(response.data.brands);
      }
    } catch (err) {
      console.error('Error fetching brands:', err);
    } finally {
      setLoadingBrands(false);
    }
  };

  const handleImagesChange = (files: File[], uploadedImages?: { file: File; url?: string; filename?: string; uploaded: boolean }[]) => {
    setProductImages(files);
    if (uploadedImages) {
      setImages(uploadedImages);
    }
  };

  // Handle removing existing images
  const handleRemoveExistingImage = (imageUrl: string) => {
    setExistingImageUrls(prev => prev.filter(url => url !== imageUrl));
    setImagesToRemove(prev => [...prev, imageUrl]);
  };

  const handleCompatibilityChange = (id: string, field: keyof CompatibilityItem, value: string | number) => {
    setCompatibilityItems(prevItems => {
      return prevItems.map(item => {
        if (item.id !== id) {
          return item;
        }

        const newItem = { ...item };

        // Handle specific fields
        if (field === 'make') {
          // Make sure make is always a string
          const makeValue = String(value);
          newItem.make = makeValue;
          newItem.model = ''; // Reset dependent fields
          newItem.year = new Date().getFullYear();

          // Find the brand
          const brand = brands.find(b => b.name === makeValue);
          if (brand) {
            newItem.brandId = brand.id;
          }
        }
        else if (field === 'model') {
          // Make sure model is always a string
          const modelValue = String(value);
          newItem.model = modelValue;
          newItem.year = new Date().getFullYear(); // Reset year when model changes

          // Find the model
          const brand = brands.find(b => b.name === item.make);
          if (brand) {
            const model = brand.models.find(m => m.name === modelValue);
            if (model) {
              newItem.modelId = model.id;
            }
          }
        }
        else if (field === 'year') {
          // Make sure year is always a number
          newItem.year = typeof value === 'string' ? parseInt(value, 10) : value;
        }

        return newItem;
      });
    });
  };

  const addCompatibilityItem = () => {
    setCompatibilityItems([
      ...compatibilityItems,
      {
        make: "",
        model: "",
        year: new Date().getFullYear(),
        id: Date.now().toString()
      }
    ]);
  };

  const removeCompatibilityItem = (id: string) => {
    if (compatibilityItems.length > 1) {
      setCompatibilityItems(items => items.filter(item => item.id !== id));
    }
  };

  const toggleDropdown = (itemId: string, field: string) => {
    if (dropdownOpen && dropdownOpen.itemId === itemId && dropdownOpen.field === field) {
      setDropdownOpen(null);
    } else {
      setDropdownOpen({ itemId, field });
    }
  };

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};

    if (!title || title.trim().length < 5) {
      newErrors.title = "Title must be at least 5 characters";
    }

    if (!description || description.trim().length < 20) {
      newErrors.description = "Description must be at least 20 characters";
    }

    if (!price || price <= 0) {
      newErrors.price = "Price must be greater than zero";
    }

    if (!oem) {
      newErrors.oem = "OEM number is required";
    }

    if (existingImageUrls.length === 0 && productImages.length === 0) {
      newErrors.images = "At least one image is required";
    }

    // Validate compatibility
    const hasValidCompatibility = compatibilityItems.some(
      item => item.make && item.model && item.year
    );

    if (!hasValidCompatibility) {
      newErrors.compatibility = "At least one complete compatibility entry is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Upload images function
  const uploadImages = async () => {
    if (productImages.length === 0) {
      return existingImageUrls;
    }
    
    const formData = new FormData();
    productImages.forEach(image => {
      formData.append('files', image);
    });
    
    try {
      const token = localStorage.getItem('accessToken');
      const response = await axios.post(`${API_URL}/api/upload`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.data && response.data.fileUrls) {
        // Combine existing images (that weren't removed) with new uploaded images
        return [...existingImageUrls, ...response.data.fileUrls];
      }
      return existingImageUrls;
    } catch (error) {
      console.error('Error uploading images:', error);
      throw new Error('Failed to upload images');
    }
  };

  const handleUpdate = async () => {
    if (!validateForm()) {
      window.scrollTo(0, 0);
      return;
    }
    
    try {
      setSubmitting(true);
      setGeneralError(null);
      
      // Upload new images if any
      const allImages = await uploadImages();
      
      // Prepare product data
      const productData = {
        title,
        description,
        price,
        oemNumber: oem,
        category: category?._id,
        compatibility: compatibilityItems.map(item => ({
          make: item.make,
          model: item.model,
          year: item.year
        })),
        images: allImages
      };
      
      // Make the update request
      const token = localStorage.getItem('accessToken');
      const response = await axios.put(`${API_URL}/api/products/${id}`, productData, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.status === 200) {
        toast.success('Product updated successfully!');
        navigate('/profile?tab=wardrobe');
      }
    } catch (error) {
      console.error('Error updating product:', error);
      if (axios.isAxiosError(error) && error.response) {
        // Handle validation errors from the server
        if (error.response.status === 400 && error.response.data.errors) {
          setErrors(error.response.data.errors);
        } else {
          setGeneralError(error.response.data.message || 'Failed to update product');
        }
      } else {
        setGeneralError('An unexpected error occurred');
      }
      window.scrollTo(0, 0);
    } finally {
      setSubmitting(false);
    }
  };

  const renderError = (field: string) => {
    return errors[field] ? (
      <p className="text-red-500 text-sm mt-1">{errors[field]}</p>
    ) : null;
  };

  const getModelsForBrand = (brandName: string) => {
    const brand = brands.find(b => b.name === brandName);
    return brand ? brand.models : [];
  };

  const getVersionsForModel = (brandName: string, modelName: string) => {
    const brand = brands.find(b => b.name === brandName);
    if (!brand) return [];
    
    const model = brand.models.find(m => m.name === modelName);
    return model ? model.versions : [];
  };

  // Add a deleteProduct function
  const handleDeleteProduct = async () => {
    try {
      setDeleting(true);
      const token = localStorage.getItem('accessToken');
      await axios.delete(`${API_URL}/api/products/${id}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      toast.success('Product deleted successfully');
      navigate('/profile?tab=wardrobe');
    } catch (error) {
      console.error('Error deleting product:', error);
      toast.error('Failed to delete product');
    } finally {
      setDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  // Add a preview function
  const handlePreview = () => {
    // Open the product details page in a new tab
    window.open(`/products/${id}`, '_blank');
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loader />
      </div>
    );
  }

  return (
    <div className="md:pt-20 pt-0 pb-24 bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header with breadcrumbs */}
        <div className="mb-6 pt-4 md:mt-16">
          <div className="flex items-center mb-2">
            <button
              onClick={() => navigate('/profile?tab=wardrobe')}
              className="mr-3 p-2 rounded-full text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition-colors"
            >
              <ArrowLeft size={20} />
            </button>
            <h1 className="text-2xl font-bold text-gray-900">Edit Product</h1>
          </div>
          <div className="text-sm text-gray-500 flex items-center ml-2">
            <span onClick={() => navigate('/profile?tab=wardrobe')} className="hover:text-blue-600 cursor-pointer">My Products</span>
            <span className="mx-2">›</span>
            <span className="text-gray-700 font-medium">{title || 'Edit Product'}</span>
          </div>
        </div>

        {/* Error display */}
        {generalError && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md flex items-start">
            <AlertTriangle className="text-red-500 mr-3 mt-0.5" size={18} />
            <p className="text-red-600">{generalError}</p>
          </div>
        )}

        {/* Form */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden mb-6 transition-all hover:shadow-md">
          {/* Main form */}
          <div className="p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
              <span className="bg-blue-100 text-blue-700 p-1.5 rounded-md mr-2">
                <Check size={16} />
              </span>
              Product Information
            </h2>
            
            {/* Product title */}
            <div className="mb-6">
              <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
                Product Title *
              </label>
              <input
                type="text"
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full border border-gray-300 rounded-lg py-2.5 px-4 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                placeholder="Enter product title"
              />
              {renderError("title")}
            </div>
            
            {/* Product description */}
            <div className="mb-6">
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                Description *
              </label>
              <textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
                className="w-full border border-gray-300 rounded-lg py-2.5 px-4 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                placeholder="Describe your product in detail"
              />
              {renderError("description")}
            </div>
            
            {/* Price and OEM number */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div>
                <label htmlFor="price" className="block text-sm font-medium text-gray-700 mb-1">
                  Price ($) *
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-500">$</span>
                  <input
                    type="number"
                    id="price"
                    value={price}
                    onChange={(e) => setPrice(parseFloat(e.target.value))}
                    min="0"
                    step="0.01"
                    className="w-full border border-gray-300 rounded-lg py-2.5 pl-8 pr-4 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                    placeholder="0.00"
                  />
                </div>
                {renderError("price")}
              </div>
              <div>
                <label htmlFor="oem" className="block text-sm font-medium text-gray-700 mb-1">
                  OEM Number *
                </label>
                <input
                  type="text"
                  id="oem"
                  value={oem}
                  onChange={(e) => setOem(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg py-2.5 px-4 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                  placeholder="Enter OEM number"
                />
                {renderError("oem")}
              </div>
            </div>
            
            {/* Category */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Category
              </label>
              <div className="flex items-center p-3 border border-gray-300 rounded-lg bg-gray-50">
                {category && (
                  <>
                    {category.imageUrl && (
                      <img
                        src={formatImageUrl(category.imageUrl)}
                        alt={category.name}
                        className="w-10 h-10 object-cover rounded-md mr-3"
                      />
                    )}
                    <span className="text-gray-900">{category.name}</span>
                  </>
                )}
                {!category && <span className="text-gray-500">No category selected</span>}
              </div>
              <p className="text-sm text-gray-500 mt-1">
                Category cannot be changed. Please create a new product if you need a different category.
              </p>
            </div>
            
            {/* Images */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Product Images *
              </label>
              
              {/* Existing images */}
              {existingImageUrls.length > 0 && (
                <div className="mb-4">
                  <p className="text-sm text-gray-600 mb-2">Existing Images:</p>
                  <div className="flex flex-wrap gap-3">
                    {existingImageUrls.map((url, index) => (
                      <div key={`existing-${index}`} className="relative group">
                        <img
                          src={formatImageUrl(url)}
                          alt={`Product ${index + 1}`}
                          className="w-24 h-24 object-cover rounded-md border border-gray-200 transition-transform transform hover:scale-105"
                        />
                        <button
                          type="button"
                          onClick={() => handleRemoveExistingImage(url)}
                          className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 shadow-md hover:bg-red-600 transition-colors"
                          title="Remove image"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Image uploader for new images */}
              <ImageUpload 
                onImagesChange={handleImagesChange}
                maxImages={5 - existingImageUrls.length}
              />
              {renderError("images")}
            </div>
            
            {/* Vehicle Compatibility */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                <span className="bg-green-100 text-green-700 p-1 rounded-md mr-2">
                  <Check size={14} />
                </span>
                Vehicle Compatibility *
              </label>
              <div className="space-y-4">
                {compatibilityItems.map((item, index) => (
                  <div key={item.id} className="p-4 border border-gray-200 rounded-lg transition-colors hover:border-blue-300 hover:bg-blue-50/30">
                    {/* Vehicle make */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-3">
                      <div className="relative">
                        <label className="block text-xs text-gray-500 mb-1">
                          Make
                        </label>
                        <div
                          onClick={() => toggleDropdown(item.id, 'make')}
                          className="cursor-pointer flex items-center justify-between border border-gray-300 rounded-lg py-2.5 px-3 bg-white hover:border-blue-400 transition-colors"
                        >
                          <span className={item.make ? "text-gray-900" : "text-gray-400"}>
                            {item.make || "Select Make"}
                          </span>
                          <ChevronDown size={16} className="text-gray-400" />
                        </div>
                        
                        {/* Dropdown for make */}
                        {dropdownOpen && dropdownOpen.itemId === item.id && dropdownOpen.field === 'make' && (
                          <div className="absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-y-auto">
                            <div className="sticky top-0 bg-white border-b border-gray-200">
                              <div className="flex items-center p-2">
                                <Search size={14} className="text-gray-400 mr-2" />
                                <input
                                  type="text"
                                  className="w-full p-1 text-sm focus:outline-none"
                                  placeholder="Search makes..."
                                  onClick={(e) => e.stopPropagation()}
                                  // Add search functionality here
                                />
                              </div>
                            </div>
                            {brands.map(brand => (
                              <div
                                key={brand.id}
                                className="px-3 py-2 cursor-pointer hover:bg-blue-50 transition-colors"
                                onClick={() => {
                                  handleCompatibilityChange(item.id, 'make', brand.name);
                                  setDropdownOpen(null);
                                }}
                              >
                                {brand.name}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                      
                      {/* Vehicle model */}
                      <div className="relative">
                        <label className="block text-xs text-gray-500 mb-1">
                          Model
                        </label>
                        <div
                          onClick={() => item.make ? toggleDropdown(item.id, 'model') : null}
                          className={`cursor-pointer flex items-center justify-between border border-gray-300 rounded-lg py-2.5 px-3 ${
                            !item.make 
                              ? 'bg-gray-100 cursor-not-allowed' 
                              : 'bg-white hover:border-blue-400 transition-colors'
                          }`}
                        >
                          <span className={item.model ? "text-gray-900" : "text-gray-400"}>
                            {item.model || "Select Model"}
                          </span>
                          <ChevronDown size={16} className="text-gray-400" />
                        </div>
                        
                        {/* Dropdown for model */}
                        {dropdownOpen && dropdownOpen.itemId === item.id && dropdownOpen.field === 'model' && (
                          <div className="absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-y-auto">
                            <div className="sticky top-0 bg-white border-b border-gray-200">
                              <div className="flex items-center p-2">
                                <Search size={14} className="text-gray-400 mr-2" />
                                <input
                                  type="text"
                                  className="w-full p-1 text-sm focus:outline-none"
                                  placeholder="Search models..."
                                  onClick={(e) => e.stopPropagation()}
                                  // Add search functionality here
                                />
                              </div>
                            </div>
                            {getModelsForBrand(item.make).map(model => (
                              <div
                                key={model.id}
                                className="px-3 py-2 cursor-pointer hover:bg-blue-50 transition-colors"
                                onClick={() => {
                                  handleCompatibilityChange(item.id, 'model', model.name);
                                  setDropdownOpen(null);
                                }}
                              >
                                {model.name}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                      
                      {/* Vehicle year */}
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">
                          Year
                        </label>
                        <input
                          type="number"
                          value={item.year}
                          onChange={(e) => handleCompatibilityChange(item.id, 'year', parseInt(e.target.value))}
                          min="1900"
                          max={new Date().getFullYear() + 1}
                          className="w-full border border-gray-300 rounded-lg py-2.5 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                        />
                      </div>
                    </div>
                    
                    {/* Remove button */}
                    {compatibilityItems.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeCompatibilityItem(item.id)}
                        className="text-red-600 text-sm flex items-center hover:text-red-800 transition-colors"
                      >
                        <Trash2 size={16} className="mr-1" />
                        Remove
                      </button>
                    )}
                  </div>
                ))}
                
                {/* Add button */}
                <button
                  type="button"
                  onClick={addCompatibilityItem}
                  className="flex items-center text-blue-600 hover:text-blue-800 transition-colors group"
                >
                  <div className="bg-blue-100 rounded-full p-1 mr-2 group-hover:bg-blue-200 transition-colors">
                    <Plus size={14} />
                  </div>
                  Add Another Vehicle
                </button>
              </div>
              {renderError("compatibility")}
            </div>
            
            {/* Actions */}
            <div className="mt-10 border-t border-gray-200 pt-6">
              <div className="flex flex-wrap justify-between items-center gap-4">
                <div className="flex items-center">
                  <button
                    type="button"
                    onClick={() => setShowDeleteConfirm(true)}
                    className="px-4 py-2 border border-red-300 rounded-lg shadow-sm text-sm font-medium text-red-700 bg-white hover:bg-red-50 focus:outline-none transition-colors"
                  >
                    <Trash2 size={16} className="inline mr-1" />
                    Delete Product
                  </button>
                </div>
                
                <div className="flex items-center space-x-3">
                  <button
                    type="button"
                    onClick={handlePreview}
                    className="px-4 py-2 border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none transition-colors"
                  >
                    <Eye size={16} className="inline mr-1" />
                    Preview
                  </button>
                  <button
                    type="button"
                    onClick={() => navigate('/profile?tab=wardrobe')}
                    className="px-4 py-2 border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleUpdate}
                    disabled={submitting}
                    className={`px-6 py-2 rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none transition-colors ${submitting ? 'opacity-70 cursor-not-allowed' : ''}`}
                  >
                    {submitting ? (
                      <span className="flex items-center">
                        <Loader2 size={16} className="mr-2 animate-spin" /> Updating...
                      </span>
                    ) : (
                      'Update Product'
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Delete confirmation modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6 shadow-xl">
            <h3 className="text-lg font-medium text-gray-900 mb-1">Delete Product</h3>
            <p className="text-gray-600 mb-4">Are you sure you want to delete this product? This action cannot be undone.</p>
            
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(false)}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteProduct}
                disabled={deleting}
                className="px-4 py-2 bg-red-600 text-white rounded-md text-sm font-medium hover:bg-red-700 focus:outline-none"
              >
                {deleting ? (
                  <span className="flex items-center">
                    <Loader2 size={16} className="mr-2 animate-spin" /> Deleting...
                  </span>
                ) : (
                  'Delete Product'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EditProduct; 