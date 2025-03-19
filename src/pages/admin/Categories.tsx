import React, { useState, useEffect } from 'react';
import {
  FolderPlus,
  Edit,
  Trash2,
  Plus,
  Search,
  X,
  AlertCircle,
  CheckCircle,
  ChevronDown,
  ChevronRight
} from 'lucide-react';
import { ThreeDots } from 'react-loader-spinner'; // Import the spinner
import { API_URL } from '../../config';

// Define interfaces for our data
interface Category {
  _id: string;
  name: string;
  description?: string;
  slug: string;
  createdAt: string;
  updatedAt: string;
  parentId?: string;
  level?: number; // Added to track nesting level
  isExpanded?: boolean;
  subcategories?: Category[];
  imageUrl?: string;
}

// Add onSearch to the props interface
interface CategoriesProps {
  onSearch: (query: string) => void; // Define the onSearch prop
}

const formatImageUrl = (imageUrl: string | undefined | null): string => {
  // If the URL is null, undefined, or empty, return a placeholder image
  if (!imageUrl || imageUrl.trim() === '') {
    return 'https://via.placeholder.com/24';
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

const flattenCategories = (categories: Category[]): Category[] => {
  let flatList: Category[] = [];

  categories.forEach(category => {
    flatList.push(category);
    if (category.subcategories && category.subcategories.length > 0) {
      flatList = flatList.concat(flattenCategories(category.subcategories));
    }
  });

  return flatList;
};

const Categories: React.FC<CategoriesProps> = ({ onSearch }) => {
  // State for categories
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  // State for category form
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [searching, setSearching] = useState(false);
  const [editImageFile, setEditImageFile] = useState<File | null>(null);
  const [editImagePreview, setEditImagePreview] = useState<string | null>(null);
  // State for the category being edited/deleted
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  // State for new category form
  const [newCategory, setNewCategory] = useState<{
    name: string;
    description: string;
    parentId: string;
    image: File | null; // Allow image to be either File or null
  }>({
    name: '',
    description: '',
    parentId: '',
    image: null
  });

  const [imagePreview, setImagePreview] = useState<string | null>(null); // For image preview

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);
    
    // Still call the onSearch prop to maintain compatibility
    if (onSearch) onSearch(query);
    
    // If query is empty, fetch all categories
    if (!query.trim()) {
      fetchCategories();
      return;
    }
    
    // Set a small timeout to debounce the search requests
    setSearching(true);
    const debounce = setTimeout(() => {
      searchCategories(query);
    }, 300);
    
    return () => clearTimeout(debounce);
  };

  const searchCategories = async (query: string) => {
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/api/categories/search?query=${encodeURIComponent(query)}`);
      
      if (!response.ok) {
        throw new Error('Failed to search categories');
      }
      
      const data = await response.json();
      
      // Update the categories state with the search results
      setCategories(data.results);
      setError('');
    } catch (err) {
      console.error('Error searching categories:', err);
      setError('Failed to search categories');
    } finally {
      setLoading(false);
      setSearching(false);
    }
  };

  // Fetch categories on component mount
  const fetchCategories = async () => {
    try {
      const response = await fetch(`${API_URL}/api/categories`);
      const data = await response.json();
      setCategories(data);
    } catch (err) {
      setError('Failed to fetch categories');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);
  const renderCategoryOptions = (categories: Category[], level: number = 0): React.ReactNode[] => {
    return categories.flatMap(category => [
      <option
        key={category._id}
        value={category._id}
        className="text-sm"
      >
        {Array(level).fill('─ ').join('') + ' ' + category.name}
      </option>,
      ...(category.subcategories && category.subcategories.length > 0
        ? renderCategoryOptions(category.subcategories, level + 1)
        : [])
    ]);
  };
  // Function to toggle category expansion
  const toggleCategoryExpansion = (categoryId: string) => {
    setCategories(prevCategories => {
      // Create a deep copy and update the isExpanded property for the matching category
      const updateCategoriesRecursively = (cats: Category[]): Category[] => {
        return cats.map(cat => {
          if (cat._id === categoryId) {
            return { ...cat, isExpanded: !cat.isExpanded };
          } else if (cat.subcategories && cat.subcategories.length > 0) {
            return { ...cat, subcategories: updateCategoriesRecursively(cat.subcategories) };
          }
          return cat;
        });
      };

      return updateCategoriesRecursively(prevCategories);
    });
  };


  // Function to render a category and its subcategories recursively
  const renderCategoryTree = (category: Category) => {
    return (
      <div key={category._id} className="divide-y divide-gray-200">
        <div className={`py-3 px-4`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <img
                src={formatImageUrl(category.imageUrl)}
                alt={category.name || 'Category'}
                className="w-6 h-6 object-cover rounded-md mr-2"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = 'https://via.placeholder.com/24';
                }}
              />
              {category.subcategories && category.subcategories.length > 0 ? (
                <button
                  onClick={() => toggleCategoryExpansion(category._id)}
                  className="mr-2 text-gray-500 hover:text-gray-700"
                >
                  {category.isExpanded ? (
                    <ChevronDown className="h-5 w-5" />
                  ) : (
                    <ChevronRight className="h-5 w-5" />
                  )}
                </button>
              ) : (
                <div className="w-5 mr-2"></div>
              )}
              <span className="font-medium">{category.name}</span>
            </div>
            <div className="flex space-x-2">
              <button
                onClick={() => {
                  setSelectedCategory(category);
                  setEditImagePreview(category.imageUrl ? formatImageUrl(category.imageUrl) : null);
                  setShowEditModal(true);
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                <Edit className="h-5 w-5 text-blue-500" />
              </button>
              <button
                onClick={() => {
                  setSelectedCategory(category);
                  setShowDeleteModal(true);
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                <Trash2 className="h-5 w-5 text-red-500" />
              </button>
            </div>
          </div>
        </div>

        {/* Render subcategories recursively if expanded */}
        {
          category.isExpanded && category.subcategories && category.subcategories.length > 0 && (
            <div className="pl-4">
              {category.subcategories.map(subcategory => renderCategoryTree(subcategory))}
            </div>
          )
        }
      </div >
    );
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setNewCategory(prev => ({ ...prev, [name]: value }));
  };

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsAdding(true);
    setFormError('');
    setFormSuccess('');

    try {
      const token = localStorage.getItem('token');

      // Check if an image is selected
      if (!newCategory.image) {
        throw new Error('Please select an image to upload.');
      }

      // Create FormData for image upload
      const imageFormData = new FormData();
      imageFormData.append('file', newCategory.image); // Assuming newCategory.image holds the file

      // Upload the image first
      const uploadResponse = await fetch(`${API_URL}/api/media/upload`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: imageFormData
      });

      const uploadData = await uploadResponse.json();

      if (!uploadResponse.ok) {
        throw new Error(uploadData.error?.message || 'Failed to upload image');
      }

      // Now create the category with the uploaded image URL
      const requestBody = {
        name: newCategory.name,
        description: newCategory.description,
        imageUrl: uploadData.url, // Use the uploaded image URL
        ...(newCategory.parentId ? { parentId: newCategory.parentId } : {})
      };

      const response = await fetch(`${API_URL}/api/categories`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(requestBody)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error?.message || 'Failed to create category');
      }

      fetchCategories();
      setFormSuccess('Category added successfully!');
      setNewCategory({
        name: '',
        description: '',
        parentId: '',
        image: null // Reset image
      });
      setTimeout(() => {
        setShowAddModal(false);
        setFormSuccess('');
      }, 100);
    } catch (err) {
      console.error('Error adding category:', err);
      setFormError(err instanceof Error ? err.message : 'Error adding category');
    } finally {
      setIsAdding(false); // Set loading to false
    }
  };

  const handleEditInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;

    if (selectedCategory) {
      setSelectedCategory(prev => ({
        ...prev!,
        [name]: value
      }));
    }
  };

  const uploadImage = async (file: File, token: string) => {

    const imageFormData = new FormData();
    imageFormData.append('file', file);

    const uploadResponse = await fetch(`${API_URL}/api/media/upload`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      },
      body: imageFormData
    });

    const uploadData = await uploadResponse.json();

    if (!uploadResponse.ok) {
      throw new Error(uploadData.error?.message || 'Failed to upload image');
    }

    return uploadData.url; // Return the uploaded image URL
  };

  const handleEditCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    setFormSuccess('');
    setIsAdding(true);
    try {
      const token = localStorage.getItem('token');

      // Prepare the request body
      const requestBody = {
        name: selectedCategory?.name,
        description: selectedCategory?.description,
        parentId: selectedCategory?.parentId,
        // Ensure imageUrl is always a string
        imageUrl: editImageFile ? await uploadImage(editImageFile, token as string) : (selectedCategory?.imageUrl || '')
      };

      const response = await fetch(`${API_URL}/api/categories/${selectedCategory?._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(requestBody)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error?.message || 'Failed to update category');
      }

      // Refresh categories to get the updated hierarchy
      fetchCategories();

      setFormSuccess('Category updated successfully!');

      // Close modal after a delay
      setTimeout(() => {
        setShowEditModal(false);
        setFormSuccess('');
      }, 100);
    } catch (err) {
      console.error('Error updating category:', err);
      setFormError(err instanceof Error ? err.message : 'Error updating category');
    } finally {
      setIsAdding(false);
    }
  };

  const handleDeleteCategory = async () => {
    if (!selectedCategory) return;

    setFormError('');
    setFormSuccess('');
    setIsAdding(true);

    try {
      const token = localStorage.getItem('token');

      const response = await fetch(`${API_URL}/api/categories/${selectedCategory._id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error?.message || 'Failed to delete category');
      }

      // Refresh categories to get the updated hierarchy
      fetchCategories();

      setFormSuccess('Category deleted successfully!');

      // Close modal after a delay
      setTimeout(() => {
        setShowDeleteModal(false);
        setFormSuccess('');
      }, 300);
    } catch (err) {
      console.error('Error deleting category:', err);
      setFormError(err instanceof Error ? err.message : 'Error deleting category');
    } finally {
      setIsAdding(false);
    }
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Categories</h1>
        <button
          onClick={() => {
            setNewCategory({ name: '', description: '', parentId: '', image: null });
            setFormError('');
            setFormSuccess('');
            setShowAddModal(true);
          }}
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          <Plus className="h-5 w-5 mr-2" />
          Add Category
        </button>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 text-red-700 rounded-md">
          <p className="flex items-center">
            <AlertCircle className="h-5 w-5 mr-2" />
            {error}
          </p>
        </div>
      )}

      <div className="mb-6">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            placeholder="Search categories..."
            value={searchQuery}
            onChange={handleSearchChange}
            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          />
          {searchQuery && (
            <button
              onClick={() => {
                setSearchQuery("");
                fetchCategories(); // Fetch all categories when search is cleared
              }}
              className="absolute inset-y-0 right-0 pr-3 flex items-center"
            >
              <X className="h-5 w-5 text-gray-400 hover:text-gray-600" />
            </button>
          )}
        </div>
      </div>

      <div className="overflow-hidden border border-gray-200 rounded-md">
        <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <span className="font-medium">Category Name</span>
            <span className="font-medium">Actions</span>
          </div>
        </div>

        <div className="divide-y divide-gray-200">
          {loading ? (
            <div className="py-4 px-6 text-center text-gray-500">
              {searching ? 'Searching categories...' : 'Loading categories...'}
            </div>
          ) : categories.length > 0 ? (
            categories.map(category => renderCategoryTree(category))
          ) : (
            <div className="py-4 px-6 text-center text-gray-500">
              {searchQuery ? 'No categories match your search.' : 'No categories found. Add your first category!'}
            </div>
          )}
        </div>
      </div>

      {/* Add Category Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Add Category</h2>
              <button
                onClick={() => {
                  setShowAddModal(false);
                  setImagePreview(null);
                  setNewCategory({
                    name: '',
                    description: '',
                    parentId: '',
                    image: null
                  });
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {formSuccess && (
              <div className="mb-4 p-3 bg-green-50 text-green-800 rounded-md flex items-center">
                <CheckCircle className="h-5 w-5 mr-2" />
                {formSuccess}
              </div>
            )}

            {formError && (
              <div className="mb-4 p-3 bg-red-50 text-red-800 rounded-md flex items-center">
                <AlertCircle className="h-5 w-5 mr-2" />
                {formError}
              </div>
            )}

            <form onSubmit={handleAddCategory}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Category Name
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={newCategory.name}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    name="description"
                    value={newCategory.description}
                    onChange={handleInputChange}
                    required
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Parent Category (Optional)
                  </label>
                  <select
                    name="parentId"
                    value={newCategory.parentId || ''}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">None (Top Level Category)</option>
                    {renderCategoryOptions(categories)}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Image
                  </label>
                  <div className="flex items-center">
                    <input
                      type="file"
                      accept="image/*"
                      id="imageUpload"
                      className="hidden"
                      onChange={(e) => {
                        const files = e.target.files;
                        if (files && files.length > 0) {
                          const file = files[0];
                          setNewCategory(prev => ({ ...prev, image: file }));

                          // Create and set the image preview URL
                          try {
                            const fileURL = URL.createObjectURL(file);
                            setImagePreview(fileURL);
                            console.log("Preview URL created:", fileURL); // For debugging
                          } catch (error) {
                            console.error("Error creating object URL:", error);
                          }
                        }
                      }}
                      required
                    />
                    <label
                      htmlFor="imageUpload"
                      className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 cursor-pointer"
                    >
                      Choose File
                    </label>
                    {newCategory.image && (
                      <span className="ml-3 text-sm text-gray-500 truncate">
                        {newCategory.image.name}
                      </span>
                    )}
                  </div>

                  <div className="mt-4" style={{ minHeight: '100px' }}>
                    {imagePreview ? (
                      <div className="mt-4">
                        <img
                          src={imagePreview}
                          alt="Image Preview"
                          className="w-28 h-28 object-cover rounded-md"
                        />
                      </div>
                    ) : null}
                  </div>
                </div>
              </div>

              <div className="mt-6 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddModal(false);
                    setImagePreview(null);
                    setNewCategory({
                      name: '',
                      description: '',
                      parentId: '',
                      image: null
                    });
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700"
                >
                  {isAdding ? (
                    <div className="flex items-center">
                      <ThreeDots
                        height="30"
                        width="30"
                        color="#000"
                        ariaLabel="loading"

                      />
                      <span className="ml-2">Adding...</span>
                    </div>
                  ) : (
                    'Add Category'
                  )}
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

      {/* Edit Category Modal */}
      {showEditModal && selectedCategory && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Edit Category</h2>
              <button
                onClick={() => {
                  setShowEditModal(false);
                  setEditImagePreview(null);
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {formSuccess && (
              <div className="mb-4 p-3 bg-green-50 text-green-800 rounded-md flex items-center">
                <CheckCircle className="h-5 w-5 mr-2" />
                {formSuccess}
              </div>
            )}

            {formError && (
              <div className="mb-4 p-3 bg-red-50 text-red-800 rounded-md flex items-center">
                <AlertCircle className="h-5 w-5 mr-2" />
                {formError}
              </div>
            )}

            <form onSubmit={handleEditCategory}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Category Name
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={selectedCategory.name}
                    onChange={handleEditInputChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    name="description"
                    value={selectedCategory.description || ''}
                    onChange={handleEditInputChange}
                    required
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Parent Category (Optional)
                  </label>
                  <select
                    name="parentId"
                    value={selectedCategory.parentId || ''}
                    onChange={handleEditInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">None (Top Level Category)</option>
                    {flattenCategories(categories).map(category => (
                      <option key={category._id} value={category._id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Image
                  </label>
                  <div className="flex items-center">
                    <input
                      type="file"
                      accept="image/*"
                      id="editImageUpload"
                      className="hidden"
                      onChange={(e) => {
                        const files = e.target.files;
                        if (files && files.length > 0) {
                          setEditImageFile(files[0]);
                          const fileURL = URL.createObjectURL(files[0]);
                          setEditImagePreview(fileURL);
                          console.log("Set preview to:", fileURL); 
                        }
                      }}
                    />
                    <label
                      htmlFor="editImageUpload"
                      className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 cursor-pointer"
                    >
                      Choose File
                    </label>
                    {selectedCategory.imageUrl && (
                      <span className="ml-3 text-sm text-gray-500 truncate">
                        {selectedCategory.imageUrl.split('/').pop()}
                      </span>
                    )}
                  </div>

                  {(editImagePreview || selectedCategory?.imageUrl) && (
                    <div className="mt-4">
                      <img
                        src={editImagePreview || formatImageUrl(selectedCategory?.imageUrl)}
                        alt="Image Preview"
                        className="w-28 h-28 object-cover rounded-md border border-gray-300"
                        onError={(e) => {
                          console.log("Image failed to load"); 
                          (e.target as HTMLImageElement).src = 'https://via.placeholder.com/112';
                        }}
                      />
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-6 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowEditModal(false);
                    setEditImagePreview(null);
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700"
                >
                  {isAdding ? (
                    <div className="flex items-center">
                      <ThreeDots
                        height="30"
                        width="30"
                        color="#000"
                        ariaLabel="loading"
                      />
                      <span className="ml-2">Updating...</span>
                    </div>
                  ) : (
                    'Update Category'
                  )}
                </button>
              </div>
            </form>


          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && selectedCategory && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Delete Category</h2>
              <button
                onClick={() => setShowDeleteModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {formError && (
              <div className="mb-4 p-3 bg-red-50 text-red-800 rounded-md flex items-center">
                <AlertCircle className="h-5 w-5 mr-2" />
                {formError}
              </div>
            )}

            <p className="mb-4">
              Are you sure you want to delete <span className="font-semibold">{selectedCategory.name}</span>?
            </p>

            <div className="mt-6 flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => setShowDeleteModal(false)}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteCategory}
                className="px-4 py-2 bg-red-600 text-white rounded-md text-sm font-medium hover:bg-red-700"
              >
                {isAdding ? (
                  <div className="flex items-center">
                    <ThreeDots
                      height="30"
                      width="30"
                      color="#000"
                      ariaLabel="loading"
                    />
                    <span className="ml-2">Deleting...</span>
                  </div>
                ) : (
                  'Delete Category'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Categories;