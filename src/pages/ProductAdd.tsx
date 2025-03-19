import React, { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import ProductUpload from "./ProductUpload";
import { API_URL } from '../config';

// Add image URL formatting function
const formatImageUrl = (imageUrl: string | undefined | null): string => {
  // If the URL is null, undefined, or empty, return a placeholder image
  if (!imageUrl || imageUrl.trim() === '') {
    return 'https://via.placeholder.com/64'; // Larger placeholder for product cards
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

interface Category {
  _id: string;
  name: string;
  description?: string;
  slug: string;
  createdAt: string;
  updatedAt: string;
  parentId?: string;
  level?: number;
  isExpanded?: boolean;
  subcategories?: Category[];
  imageUrl?: string;
}

interface ProductAddProps {
  onDialogVisibilityChange?: (isVisible: boolean) => void;
}

const ProductAdd: React.FC<ProductAddProps> = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [selectedItemView, setSelectedItemView] = useState<Category | null>(null);

  // Navigation state
  const [navigationHistory, setNavigationHistory] = useState<Category[][]>([]);
  const [currentCategories, setCurrentCategories] = useState<Category[]>([]);
  const [currentParent, setCurrentParent] = useState<Category | null>(null);

  const handleCategoryClick = (category: Category) => {
    if (category.subcategories && category.subcategories.length > 0) {
      // Save current view to history
      setNavigationHistory([...navigationHistory, currentCategories]);
      // Update current parent for breadcrumb
      setCurrentParent(category);
      // Show subcategories
      setCurrentCategories(category.subcategories);
    } else {
      // For leaf categories (no subcategories)
      setSelectedItemView(category);
    }
  };

  const handleGoBack = () => {
    if (navigationHistory.length > 0) {
      // Get the previous level of categories
      const previousCategories = navigationHistory[navigationHistory.length - 1];
      // Update navigation history
      setNavigationHistory(navigationHistory.slice(0, navigationHistory.length - 1));
      // Set current categories to previous level
      setCurrentCategories(previousCategories);

      // Update current parent (if we're going back to root, set to null)
      if (navigationHistory.length > 1) {
        // This is simplified - in a real app, you'd track parent info in history
        setCurrentParent(null); // This would need proper tracking in a complete implementation
      } else {
        setCurrentParent(null);
      }
    }
  };
  const goBack = () => {
    setNavigationHistory((prev) => prev.slice(0, -1));
  };
  const fetchCategories = async () => {
    try {
      const response = await fetch(`${API_URL}/api/categories`);
      if (!response.ok) {
        throw new Error("Network response was not ok");
      }
      const data = await response.json();
      console.log("Fetched Categories:", data);
      setCategories(data);
      setCurrentCategories(data); // Initialize current categories with top-level categories
    } catch (err) {
      setError("Failed to fetch categories");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Render a single category card
  const renderCategoryCard = (category: Category) => (
    <div
      key={category._id}
      className="border-b border-gray-200"
    >
      <div className="py-3 px-4">
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center">
            <img
              src={formatImageUrl(category.imageUrl)}
              alt={category.name || 'Category'}
              className="w-16 h-16 object-cover rounded-md"
              onError={(e) => {
                (e.target as HTMLImageElement).src = 'https://via.placeholder.com/64';
              }}
            />
            <span
              className="font-medium cursor-pointer ml-2"
              onClick={() => handleCategoryClick(category)}
            >
              {category.name}
            </span>
          </div>

          {category.subcategories && category.subcategories.length > 0 && (
            <button
              onClick={() => handleCategoryClick(category)}
              className="text-gray-500 hover:text-gray-700"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState(0);
  const [condition, setCondition] = useState("");
  const [oemNumber, setOemNumber] = useState("");

  const createProduct = async (images: File[]) => {
    // Gather all required fields
    const productData = {
      title: title,
      description: description,
      price: price,
      category: selectedCategory?._id,
      condition: condition,
      oemNumber: oemNumber,
      images: images, // Include the images here
    };

    try {
      const response = await fetch(`${API_URL}/api/products`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(productData),
      });

      if (!response.ok) {
        throw new Error("Failed to create product");
      }

      const result = await response.json();
      console.log("Product created successfully:", result);
      // Handle success (e.g., reset form, show success message)
    } catch (error) {
      console.error("Error creating product:", error);
      // Handle error (e.g., show error message)
    }
  };

  const handleUploadSubmit = async (images: File[]) => {
    // Call the createProduct function
    await createProduct(images);
  };

  return (
    <div className="md:pt-20 pt-0 pb-[60px] md:pb-0 animate-slide-left md:animate-slide-left md:mx-96 bg-white">
      <div className="max-w-full mx-auto min-h-screen">
        {loading && <div>Loading categories...</div>}
        {error && <div className="text-red-500">{error}</div>}

        {!selectedItemView && !loading && (
          <div>
            <div className="relative px-6 py-3 rounded-t-lg flex items-center justify-between">
              
              <button
                onClick={goBack}
                className={`w-10 h-10 flex items-center justify-center rounded-full bg-white hover:bg-green-400 transition shadow-md ${navigationHistory.length === 0 ? "invisible" : "visible"
                  }`}
              >
                <ChevronLeft size={20} className="text-black" />
              </button>

              {/* Title (Always Centered) */}
              <h2 className="absolute left-1/2 transform -translate-x-1/2 text-lg font-semibold text-gray-900">
                {navigationHistory.length === 0 ? "Activities" : "Types"}
              </h2>

              {/* Close Button */}
              <button className="w-10 h-10 flex items-center justify-center rounded-full bg-white hover:bg-green-400 transition shadow-md">
                <X size={20} className="text-black" />
              </button>
            </div>
            <h2 className="mb-2 px-14 pt-6 font-semibold text-[20px]">
              {navigationHistory.length === 0
                ? "Are you selling a product for?"
                : "What do you want to sell?"}
            </h2>

            {/* Category grid */}
            <div className="space-y-4 px-6">
              {currentCategories.map(renderCategoryCard)}
            </div>
          </div>
        )}

        {selectedItemView && (
          <ProductUpload
            categoryName={selectedItemView.name}
            categoryImage={selectedItemView.imageUrl}
            categoryId={selectedItemView._id}
            onUploadSubmit={handleUploadSubmit}
          />
        )}
      </div>
    </div>
  );
};

export default ProductAdd;