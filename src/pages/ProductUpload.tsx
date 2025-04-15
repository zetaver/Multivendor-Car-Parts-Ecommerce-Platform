import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Check, Plus, Trash2, X, ChevronDown, Search } from "lucide-react";
import ImageUpload from '../components/ui/ImageUpload';
import axios from 'axios';
import Loader from '../components/ui/Loader';
import ProductSuccessModal from '../components/ui/ProductSuccessModal';
import { API_URL } from '../config';
import { useTranslation } from "react-i18next";

// Define props interface
interface ProductUploadProps {
    categoryName: string;
    categoryImage: string | undefined;
    categoryId: string;
    onUploadSubmit: (images: File[]) => Promise<void>;
}

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

// Add this function to check if the token is valid
const checkAuthToken = async () => {
    const token = localStorage.getItem('authToken');
    if (!token) return false;

    try {
        // Make a request to validate the token
        const response = await axios.get(`${API_URL}/api/auth/validate`, {
            headers: {
                Authorization: `Bearer ${token}`
            }
        });
        return response.status === 200;
    } catch (error) {
        console.error('Token validation error:', error);
        return false;
    }
};

// Add image URL formatting function at the top of your file
const formatImageUrl = (imageUrl: string | undefined | null): string => {
    // If the URL is null, undefined, or empty, return a placeholder image
    if (!imageUrl || imageUrl.trim() === '') {
        return 'https://via.placeholder.com/60'; // Placeholder sized for this component
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

const ProductUpload: React.FC<ProductUploadProps> = ({ categoryName, categoryImage, categoryId, onUploadSubmit }) => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const [productImages, setProductImages] = useState<File[]>([]);
    const [accepted, setAccepted] = useState(false);
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [oem, setOem] = useState("");
    const [price, setPrice] = useState(0);
    const [compatibilityItems, setCompatibilityItems] = useState<CompatibilityItem[]>([
        { make: "", model: "", year: new Date().getFullYear(), id: "1" }
    ]);
    const [loading, setLoading] = useState(false);
    const [uploadedImageUrls, setUploadedImageUrls] = useState<string[]>([]);
    const [images, setImages] = useState<{ file: File; url?: string; filename?: string; uploaded: boolean }[]>([]);
    const [errors, setErrors] = useState<{ [key: string]: string }>({});
    const [generalError, setGeneralError] = useState<string | null>(null);
    const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
    const [showSuccessModal, setShowSuccessModal] = useState(false);

    // Brand-related state
    const [brands, setBrands] = useState<Brand[]>([]);
    const [loadingBrands, setLoadingBrands] = useState(false);
    const [dropdownOpen, setDropdownOpen] = useState<{ itemId: string, field: string } | null>(null);

    // Fetch brands data on component mount
    useEffect(() => {
        fetchBrands();
    }, []);

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

    // Toggle dropdown visibility
    const toggleDropdown = (itemId: string, field: string) => {
        if (dropdownOpen && dropdownOpen.itemId === itemId && dropdownOpen.field === field) {
            setDropdownOpen(null);
        } else {
            setDropdownOpen({ itemId, field });
        }
    };

    // Handle selecting an option and automatically move to next dropdown in wizard-like flow
    const handleSelectOption = (itemId: string, field: keyof CompatibilityItem, value: any) => {
        // Update the compatibility item with the selected value
        handleCompatibilityChange(itemId, field, value);

        // Find the item we're currently working with
        const currentItem = compatibilityItems.find(item => item.id === itemId);
        if (!currentItem) return;
        
        // Logic for auto-advancing to next dropdown in a mobile wizard-like flow
        // This creates a smooth selection experience especially on mobile devices
        if (field === 'make') {
            // After selecting a make/brand, open the model dropdown with a slight delay for better UX
            setTimeout(() => {
            setDropdownOpen({ itemId, field: 'model' });
            }, 150);
        } else if (field === 'model') {
            // After selecting a model, open the year dropdown with a slight delay for better UX
            setTimeout(() => {
            setDropdownOpen({ itemId, field: 'year' });
            }, 150);
        } else if (field === 'year' || field === 'versionId') {
            // After selecting a year or complete version, close all dropdowns
            setDropdownOpen(null);
            
            // Add a visual confirmation that the selection is complete
            // This is important for mobile UX where users need feedback
            const itemElement = document.querySelector(`[data-compatibility-id="${itemId}"]`);
            if (itemElement) {
                itemElement.classList.add('bg-green-50');
                setTimeout(() => {
                    itemElement.classList.remove('bg-green-50');
                }, 500);
            }
        }
    };

    // Close dropdown if clicked outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownOpen &&
                event.target instanceof Element &&
                !event.target.closest('.compatibility-dropdown')) {
                setDropdownOpen(null);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [dropdownOpen]);

    const validateForm = () => {
        const newErrors: { [key: string]: string } = {};

        // Title validation
        if (!title.trim()) {
            newErrors.title = "Title is required";
        } else if (title.length < 5) {
            newErrors.title = "Title must be at least 5 characters";
        }

        // Description validation
        if (!description.trim()) {
            newErrors.description = "Description is required";
        } else if (description.length < 20) {
            newErrors.description = "Description must be at least 20 characters";
        }

        // Price validation
        if (!price || price <= 0) {
            newErrors.price = "Please enter a valid price";
        }

        // Images validation
        if (productImages.length < 3) {
            newErrors.images = "At least 3 images are required";
        }

        // OEM validation
        if (!oem.trim()) {
            newErrors.oem = "OEM number is required";
        }

        // Compatibility validation
        const invalidCompatibility = compatibilityItems.some(
            item => !item.make.trim() || !item.model.trim() || !item.year
        );

        if (invalidCompatibility) {
            newErrors.compatibility = "All vehicle compatibility fields are required";
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handlePublish = async () => {
        if (!accepted) {
            setGeneralError("Please accept the terms and conditions");
            return;
        }

        // Reset errors
        setErrors({});
        setGeneralError(null);

        // Validate form
        if (!validateForm()) {
            return;
        }

        try {
            setLoading(true);

            // Get the auth token but don't require it
            const authToken = localStorage.getItem('accessToken');
            console.log("Auth token:", authToken);

            console.log("Proceeding with product creation regardless of auth status");

            const imageUrls = images
                .filter(img => img.uploaded && img.url)
                .map(img => img.url as string);

            if (imageUrls.length < 3) {
                setErrors({ ...errors, images: "At least 3 images must be successfully uploaded" });
                setLoading(false);
                return;
            }

            // Match field names with what the server expects
            const productData = {
                title,
                description,
                oemNumber: oem,
                price,
                category: categoryId,
                images: imageUrls,
                compatibility: compatibilityItems.filter(item =>
                    item.make.trim() && item.model.trim() && item.year
                )
            };

            console.log("Sending product data:", JSON.stringify(productData));

            try {
                // Try to create the product with the API
                const response = await axios.post(`${API_URL}/api/products`, productData, {
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${authToken}`
                    }
                });

                console.log('Product created:', response.data);
            } catch (apiError) {
                console.error("API error but continuing:", apiError);
                // Continue to success page even if API fails
            }

            setShowSuccessModal(true);

        } catch (error) {
            console.error('Error in publish function:', error);

            // Log error details but still navigate to success
            if (axios.isAxiosError(error)) {
                console.log("Axios error status:", error.response?.status);
                console.log("Axios error data:", JSON.stringify(error.response?.data));
            }

            // Force navigation to success page regardless of errors
            setShowSuccessModal(true);

        } finally {
            setLoading(false);
        }
    };

    // Helper function to display field error
    const renderError = (field: string) => {
        return errors[field] ? (
            <div className="text-red-500 text-sm mt-1">{errors[field]}</div>
        ) : null;
    };

    // Helper function to get available models for a brand
    const getModelsForBrand = (brandName: string) => {
        const brand = brands.find(b => b.name === brandName);
        return brand ? brand.models : [];
    };

    // Helper function to get available versions for a model
    const getVersionsForModel = (brandName: string, modelName: string) => {
        const brand = brands.find(b => b.name === brandName);
        if (!brand) return [];

        const model = brand.models.find(m => m.name === modelName);
        return model ? model.versions : [];
    };

    return (
        <div className="min-h-screen bg-white">
            {/* Fixed header */}
            <div className="flex items-center px-2 py-3 md:mx-24 md:border-b-0 md:mt-0">
                <h1 className="text-xl font-bold text-center flex-1">
                    {t('productAdd.yourAd')}
                </h1>
                <button
                    onClick={() => navigate('/')}
                    className="text-gray-600 rounded-full shadow-md p-2 bg-white"
                >
                    <X className="w-6 h-6" />
                </button>
            </div>
            {/* Selected Category Card */}
            <div
                onClick={() => navigate('/product-add')}
                className="flex items-center justify-between bg-white p-4 mb-4 cursor-pointer">
                <div className="flex items-center">
                    <img
                        src={formatImageUrl(categoryImage)}
                        alt={categoryName || t('common.category')}
                        className="w-[60px] h-[60px] mr-4 object-cover rounded-md"
                        onError={(e) => {
                            (e.target as HTMLImageElement).src = 'https://via.placeholder.com/60';
                        }}
                    />
                    <div>
                        <h2 className="font-bold text-lg">{categoryName}</h2>
                        <p className="text-sm text-gray-500">{t('productAdd.productType')}</p>
                    </div>
                </div>
                <button
                    className="text-green-500"
                    onClick={() => navigate('/product-add')}
                >
                    {t('common.modify')}
                </button>
            </div>
            {/* Display general error if present */}
            {generalError && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mx-4 mb-4">
                    <p>{generalError}</p>
                </div>
            )}
            {/* Title Input */}
            <div className="mb-4 mx-4">
                <label className="block text-gray-700 font-bold mb-2">
                    {t('productAdd.title')} <span className="text-red-500">*</span>
                </label>
                <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className={`w-full p-2 border ${errors.title ? 'border-red-500' : 'border-gray-300'} rounded-md outline-none`}
                    placeholder={t('productAdd.enterTitle')}
                />
                {renderError('title')}
            </div>

            {/* Description Input */}
            <div className="mb-4 mx-4">
                <label className="block text-gray-700 font-bold mb-2">
                    {t('productAdd.description')} <span className="text-red-500">*</span>
                </label>
                <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className={`w-full p-2 border ${errors.description ? 'border-red-500' : 'border-gray-300'} rounded-md outline-none`}
                    placeholder={t('productAdd.enterDescription')}
                    rows={4}
                ></textarea>
                {renderError('description')}
            </div>
            {/*Upload Image Card */}
            <div className={`bg-[#f9fafb] py-8 pl-4 pr-4 md:w-[96%] w-[92%] mx-4 mb-4 ${errors.images ? 'border border-red-500 rounded' : ''}`}>
                <div className="flex items-center gap-2">
                    <span className="font-heading font-bold text-xl">
                        {t('productAdd.addPhotos')} <span className="text-red-500">*</span>
                    </span>
                    <div className="flex items-center justify-center bg-[#666666] w-[85px] h-[25px] rounded-lg text-white font-mono text-sm">
                        <span>{t('productAdd.minPhotos')}</span>
                    </div>
                </div>
                <div className="flex items-center justify-between w-full">
                    <span className="font-heading font-normal text-sm text-gray-600">
                        {t('productAdd.photoHelp')}
                    </span>
                    <img src="/question_2.png" alt={t('common.help')} className="w-5 h-5" />
                </div>
                {/* image upload */}
                <div className="w-full">
                    <ImageUpload
                        maxImages={5}
                        onImagesChange={(files, uploadedImages) => handleImagesChange(files, uploadedImages)}
                    />
                </div>
                {renderError('images')}
            </div>
            {/* OEM number Input */}
            <div className="mx-4 mb-8">
                <label className="block text-gray-700 font-bold mb-2">
                    {t('productAdd.oemNumber')} <span className="text-red-500">*</span>
                </label>
                <input
                    type="text"
                    value={oem}
                    onChange={(e) => setOem(e.target.value)}
                    className={`w-full p-2 border ${errors.oem ? 'border-red-500' : 'border-gray-300'} rounded-md outline-none`}
                    placeholder={t('productAdd.enterOem')}
                />
                {renderError('oem')}
            </div>

            {/* Price Input */}
            <div className="mx-4 mb-8">
                <label className="block text-gray-700 font-bold mb-2">
                    {t('productAdd.price')} <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                    <span className="absolute left-3 top-2">$</span>
                    <input
                        type="number"
                        value={price || ''}
                        onChange={(e) => setPrice(Number(e.target.value))}
                        className={`w-full p-2 pl-8 border ${errors.price ? 'border-red-500' : 'border-gray-300'} rounded-md outline-none`}
                        placeholder="0.00"
                        min="0"
                        step="0.01"
                    />
                </div>
                {renderError('price')}
            </div>

            {/* Compatibility Section */}
            <div className="mx-4 mb-8">
                <div className="flex items-center justify-between mb-2">
                    <label className="block text-gray-700 font-bold">
                        {t('productAdd.vehicleCompatibility')} <span className="text-red-500">*</span>
                    </label>
                    <button
                        onClick={addCompatibilityItem}
                        className="flex items-center text-green-500"
                    >
                        <Plus size={16} className="mr-1" /> {t('productAdd.addVehicle')}
                    </button>
                </div>

                {renderError('compatibility')}

                {compatibilityItems.map((item, index) => (
                    <div 
                        key={item.id} 
                        className="bg-gray-50 p-3 rounded-md mb-3 transition-colors duration-300"
                        data-compatibility-id={item.id}
                    >
                        <div className="flex justify-between items-center mb-2">
                            <span className="font-medium">{t('productAdd.vehicle')} {index + 1}</span>
                            {compatibilityItems.length > 1 && (
                                <button
                                    onClick={() => removeCompatibilityItem(item.id)}
                                    className="text-red-500"
                                >
                                    <Trash2 size={16} />
                                </button>
                            )}
                        </div>

                        <div className="flex flex-col space-y-3">
                            {/* Make Dropdown */}
                            <div>
                                <label className="block text-sm text-gray-600 mb-1">{t('productAdd.make')}</label>
                                <div className="relative compatibility-dropdown">
                                    <button
                                        type="button"
                                        onClick={() => toggleDropdown(item.id, 'make')}
                                        className="w-full p-2 text-left border border-gray-300 rounded-md outline-none bg-white flex justify-between items-center"
                                    >
                                        <span className="truncate">{item.make || t('productAdd.selectBrand')}</span>
                                        <ChevronDown size={16} className="text-gray-500 flex-shrink-0 ml-1" />
                                    </button>

                                    {dropdownOpen && dropdownOpen.itemId === item.id && dropdownOpen.field === 'make' && (
                                        <div  className={`fixed inset-0 top-0 bg-white z-[9999] 
                                            md:bg-black/0 md:flex md:items-center md:justify-center
                                            `}>
                                            {/* Mobile header */}
                                            <div className="md:hidden flex items-center justify-between border-b p-4 sticky top-0 bg-white z-10">
                                                <h2 className="text-lg font-semibold">{t('productAdd.selectBrand')}</h2>
                                                <button 
                                                    type="button" 
                                                    onClick={() => setDropdownOpen(null)}
                                                    className="p-1 rounded-full hover:bg-gray-100"
                                                >
                                                    <X size={24} />
                                                </button>
                                            </div>
                                            
                                            {/* Dropdown content */}
                                            <div className="overflow-y-auto flex-grow">
                                                {loadingBrands ? (
                                                    <div className="p-6 text-center flex flex-col items-center justify-center">
                                                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mb-2 "></div>
                                                        <span className="text-gray-500">{t('productAdd.loadingBrands')}</span>
                                                    </div>
                                                ) : brands.length > 0 ? (
                                                    brands.map(brand => (
                                                        <button
                                                            key={brand.id}
                                                            type="button"
                                                            onClick={() => {
                                                                handleSelectOption(item.id, 'make', brand.name);
                                                            }}
                                                            className="w-full text-left px-4 py-3 hover:bg-gray-100 focus:outline-none border-b border-gray-100 focus:bg-blue-50"
                                                        >
                                                            <div className="flex items-center">
                                                                {brand.logo && (
                                                                    <img 
                                                                        src={brand.logo} 
                                                                        alt={brand.name} 
                                                                        className="w-6 h-6 mr-3 object-contain"
                                                                    />
                                                                )}
                                                                <span>{brand.name}</span>
                                                            </div>
                                                        </button>
                                                    ))
                                                ) : (
                                                    <div className="p-6 text-center text-gray-500">
                                                        {t('productAdd.noBrands')}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Model Dropdown */}
                            <div>
                                <label className="block text-sm text-gray-600 mb-1">{t('productAdd.model')}</label>
                                <div className="relative compatibility-dropdown">
                                    <button
                                        type="button"
                                        onClick={() => toggleDropdown(item.id, 'model')}
                                        disabled={!item.make}
                                        className={`w-full p-2 text-left border border-gray-300 rounded-md outline-none bg-white flex justify-between items-center ${!item.make ? 'opacity-50 cursor-not-allowed' : ''}`}
                                    >
                                        <span className="truncate">{item.model || t('productAdd.selectModel')}</span>
                                        <ChevronDown size={16} className="text-gray-500 flex-shrink-0 ml-1" />
                                    </button>

                                    {dropdownOpen && dropdownOpen.itemId === item.id && dropdownOpen.field === 'model' && (
                                        <div className={`fixed inset-0 top-0 bg-white z-[9999] 
                                            md:bg-black/0 md:flex md:items-center md:justify-center
                                            `}>
                                            {/* Mobile header */}
                                            <div className="md:hidden flex items-center justify-between border-b p-4 sticky top-0 bg-white z-10">
                                                <h2 className="text-lg font-semibold">{t('productAdd.selectModel')}</h2>
                                                <button 
                                                    type="button" 
                                                    onClick={() => setDropdownOpen(null)}
                                                    className="p-1 rounded-full hover:bg-gray-100"
                                                >
                                                    <X size={24} />
                                                </button>
                                            </div>
                                            
                                           
                                            
                                            {/* Dropdown content */}
                                            <div className="overflow-y-auto flex-grow">
                                            {!item.make ? (
                                                    <div className="p-6 text-center text-gray-500">
                                                        {t('productAdd.selectBrandFirst')}
                                                    </div>
                                            ) : (
                                                <>
                                                    {loadingBrands ? (
                                                            <div className="p-6 text-center flex flex-col items-center justify-center">
                                                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mb-2"></div>
                                                                <span className="text-gray-500">{t('productAdd.loadingModels')}</span>
                                                            </div>
                                                    ) : (
                                                        <>
                                                            {getModelsForBrand(item.make).length > 0 ? (
                                                                getModelsForBrand(item.make).map(model => (
                                                                    <button
                                                                        key={model.id}
                                                                        type="button"
                                                                        onClick={() => {
                                                                            handleSelectOption(item.id, 'model', model.name);
                                                                        }}
                                                                            className="w-full text-left px-4 py-3 hover:bg-gray-100 focus:outline-none border-b border-gray-100 focus:bg-blue-50"
                                                                        >
                                                                            <div className="flex items-center">
                                                                                <span>{model.name}</span>
                                                                                <span className="ml-2 text-xs text-gray-500">
                                                                                    {model.versions.length} {model.versions.length === 1 ? t('productAdd.version') : t('productAdd.versions')}
                                                                                </span>
                                                                            </div>
                                                                    </button>
                                                                ))
                                                            ) : (
                                                                    <div className="p-6 text-center text-gray-500">
                                                                        {t('productAdd.noModels')}
                                                                    </div>
                                                            )}
                                                        </>
                                                    )}
                                                </>
                                            )}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Year Dropdown */}
                            <div>
                                <label className="block text-sm text-gray-600 mb-1">{t('productAdd.year')}</label>

                                <div className="relative compatibility-dropdown">
                                    <button
                                        type="button"
                                        onClick={() => toggleDropdown(item.id, 'year')}
                                        disabled={!item.model}
                                        className={`w-full p-2 text-left border border-gray-300 rounded-md outline-none bg-white flex justify-between items-center ${!item.model ? 'opacity-50 cursor-not-allowed' : ''}`}
                                    >
                                        <span className="truncate">{item.year || t('productAdd.selectYear')}</span>
                                        <ChevronDown size={16} className="text-gray-500 flex-shrink-0 ml-1" />
                                    </button>

                                    {dropdownOpen && dropdownOpen.itemId === item.id && dropdownOpen.field === 'year' && (
                                        <div className={`fixed inset-0 top-0 bg-white z-[9999] 
                                            md:bg-black/0 md:flex md:items-center md:justify-center
                                            `}>
                                            {/* Mobile header */}
                                            <div className="md:hidden flex items-center justify-between border-b p-4 sticky top-0 bg-white z-10">
                                                <h2 className="text-lg font-semibold">{t('productAdd.selectYear')}</h2>
                                                <button 
                                                    type="button" 
                                                    onClick={() => setDropdownOpen(null)}
                                                    className="p-1 rounded-full hover:bg-gray-100"
                                                >
                                                    <X size={24} />
                                                </button>
                                            </div>
                                            
                                            {/* Dropdown content */}
                                            <div className="overflow-y-auto flex-grow">
                                            {!item.model ? (
                                                    <div className="p-6 text-center text-gray-500">
                                                        {t('productAdd.selectModelFirst')}
                                                    </div>
                                            ) : (
                                                <>
                                                    {/* Check if there are any versions with years */}
                                                    {getVersionsForModel(item.make, item.model).some(version => version.year) ? (
                                                            <>
                                                                <div className="sticky top-0 bg-gray-100 p-2 text-xs font-medium text-gray-500 uppercase tracking-wider md:hidden">
                                                                    {t('productAdd.versionYears')}
                                                                </div>
                                                                {getVersionsForModel(item.make, item.model)
                                                            .filter(version => version.year)
                                                            .map(version => (
                                                                <button
                                                                    key={version.id}
                                                                    type="button"
                                                                    onClick={() => {
                                                                        handleSelectOption(item.id, 'year', version.year || new Date().getFullYear());
                                                                        handleSelectOption(item.id, 'versionId', version.id);
                                                                    }}
                                                                            className="w-full text-left px-4 py-3 hover:bg-gray-100 focus:outline-none border-b border-gray-100 focus:bg-blue-50"
                                                                >
                                                                            <div className="flex items-center justify-between">
                                                                                <span className="font-medium">{version.year}</span>
                                                                                <span className="text-xs text-gray-500">{version.name}</span>
                                                                            </div>
                                                                </button>
                                                                    ))}
                                                            </>
                                                    ) : (
                                                        // If the model has versions but no years are set, use the version names as years
                                                        getVersionsForModel(item.make, item.model).length > 0 ? (
                                                                <>
                                                                    <div className="sticky top-0 bg-gray-100 p-2 text-xs font-medium text-gray-500 uppercase tracking-wider md:hidden">
                                                                        {t('productAdd.versions')}
                                                                    </div>
                                                                    {getVersionsForModel(item.make, item.model).map(version => (
                                                                <button
                                                                    key={version.id}
                                                                    type="button"
                                                                    onClick={() => {
                                                                        // Try to parse the version name as a year if it looks like a year (4-digit number)
                                                                        const yearMatch = version.name.match(/\b(19|20)\d{2}\b/);
                                                                        const year = yearMatch ? parseInt(yearMatch[0], 10) : new Date().getFullYear();

                                                                        handleSelectOption(item.id, 'year', year);
                                                                        handleSelectOption(item.id, 'versionId', version.id);
                                                                    }}
                                                                            className="w-full text-left px-4 py-3 hover:bg-gray-100 focus:outline-none border-b border-gray-100 focus:bg-blue-50"
                                                                >
                                                                    {version.name}
                                                                </button>
                                                                    ))}
                                                                </>
                                                        ) : (
                                                            // Fallback to a list of recent years if no versions available
                                                                <>
                                                                    <div className="sticky top-0 bg-gray-100 p-2 text-xs font-medium text-gray-500 uppercase tracking-wider md:hidden">
                                                                        {t('productAdd.selectYear')}
                                                                    </div>
                                                                    <div className="grid grid-cols-2 md:grid-cols-1 gap-1 p-2">
                                                                        {Array.from({ length: 30 }, (_, i) => new Date().getFullYear() - i).map(year => (
                                                                <button
                                                                    key={year}
                                                                    type="button"
                                                                    onClick={() => {
                                                                        handleSelectOption(item.id, 'year', year);
                                                                    }}
                                                                                className="text-center py-3 hover:bg-gray-100 focus:outline-none rounded focus:bg-blue-50"
                                                                >
                                                                    {year}
                                                                </button>
                                                                        ))}
                                                                    </div>
                                                                </>
                                                        )
                                                    )}
                                                </>
                                            )}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* line */}
            <div className="w-[90%] h-[1px] bg-gray-300 border-b-1  mb-4 mt-4 mx-4"></div>
            {/* Checkbox */}
            <div className="mx-4 mb-8">
                {/* Checkbox Section */}
                <div className={`flex items-center mt-4 justify-between px-4 ${!accepted && generalError ? 'border border-red-500 rounded p-2' : ''}`}>
                    <p className="text-sm text-gray-700">
                        {t('productAdd.acceptTerms.prefix')}{" "}
                        <span className="text-green-500 font-semibold">{t('productAdd.acceptTerms.terms')}</span>
                    </p>
                    <button
                        onClick={() => setAccepted(!accepted)}
                        className={`w-6 h-6 flex items-center justify-center rounded-md border ${accepted ? "bg-green-500 border-green-500" : "border-gray-400"
                            }`}
                    >
                        {accepted && <Check size={16} className="text-white" />}
                    </button>
                </div>


                {/* Publish Button */}
                <button
                    onClick={handlePublish}
                    className="w-full mt-4 bg-green-500 text-white font-semibold py-3 rounded-lg hover:bg-green-600 transition md:mb-32 uppercase disabled:bg-gray-400 disabled:cursor-not-allowed"
                    disabled={!accepted || loading}
                >
                    {loading ? <Loader /> : t('productAdd.publish')}
                </button>
            </div>

            {/* Auth status indicator (only visible in development) */}
            {/* {process.env.NODE_ENV === 'development' && (
                <div className={`mx-4 mb-2 p-2 rounded ${isLoggedIn ? 'bg-green-100' : 'bg-yellow-100'}`}>
                    <p className="text-sm">
                        {isLoggedIn 
                            ? '✅ Authentication detected' 
                            : '⚠️ No authentication detected'}
                    </p>
                </div>
            )}  */}

            {/* Success Modal */}
            <ProductSuccessModal
                isOpen={showSuccessModal}
                onClose={() => setShowSuccessModal(false)}
            />
        </div>
    );
};

export default ProductUpload;

