import React, { useState, useEffect } from 'react';
import { Package, Edit, Trash2, Search, CheckCircle, Clock, XCircle, X } from 'lucide-react';
import axios from 'axios';
import { API_URL } from '../../config';
interface Product {
  _id: string;
  title: string;
  price: number;
  status?: string;
  images?: string[];
  category?: { _id: string; name: string };
}

const Products = () => {
  const API_BASE_URL = `${API_URL}`;
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [showStatusModal, setShowStatusModal] = useState(false);

  const [stats, setStats] = useState({
    total: 0,
    approved: 0,
    pending: 0,
    rejected: 0,
  });

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('accessToken');
        const response = await axios.get(`${API_BASE_URL}/api/admin/products`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (Array.isArray(response.data)) {
          setProducts(response.data);
        } else if (response.data.products) {
          setProducts(response.data.products);
        } else {
          setError('Unexpected API response structure.');
        }

        // Calculate product statistics
        const total = response.data.length;
        const approved = response.data.filter((p: Product) => p.status === 'approved').length;
        const pending = response.data.filter((p: Product) => p.status === 'pending').length;
        const rejected = response.data.filter((p: Product) => p.status === 'rejected').length;

        setStats({ total, approved, pending, rejected });
      } catch (err) {
        console.error('Error fetching products:', err);
        setError('Failed to load products. Please try again later.');
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, []);
  // Filter products
const filteredProducts = products.filter((product) =>
  product.title?.toLowerCase().includes(searchTerm.toLowerCase())
);

// Status Badge Styling
const getStatusBadgeClass = (status: string) => {
  switch (status) {
    case 'approved':
      return 'bg-green-100 text-green-800';
    case 'rejected':
      return 'bg-red-100 text-red-800';
    case 'pending':
    default:
      return 'bg-yellow-100 text-yellow-800';
  }
};

// Add this function to your component
const updateProductStatus = async (productId: string, newStatus: string) => {
  try {
    setLoading(true);
    const token = localStorage.getItem('accessToken');
    
    const response = await axios.patch(
      `${API_BASE_URL}/api/admin/products/${productId}/status`,
      { status: newStatus },
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    // Update the product in the state
    setProducts(prevProducts => 
      prevProducts.map(product => 
        product._id === productId 
          ? { ...product, status: newStatus } 
          : product
      )
    );
    
    setShowStatusModal(false);
    setSelectedProduct(null);
    
  } catch (err) {
    console.error('Error updating product status:', err);
    setError('Failed to update product status. Please try again.');
  } finally {
    setLoading(false);
  }
};
// Add this function to your component after the updateProductStatus function
const deleteProduct = async (productId: string) => {
  if (!window.confirm('Are you sure you want to delete this product?')) {
    return;
  }
  
  try {
    setLoading(true);
    const token = localStorage.getItem('accessToken');
    
    await axios.delete(
      `${API_BASE_URL}/api/products/${productId}`,
      {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    );
    
    // Remove the product from state
    setProducts(prevProducts => 
      prevProducts.filter(product => product._id !== productId)
    );
    
    setError(null);
  } catch (err) {
    console.error('Error deleting product:', err);
    setError('Failed to delete product. Please try again.');
  } finally {
    setLoading(false);
  }
};


  return (
    
    <div className="p-6 bg-gray-100 min-h-screen">
      {/* Status Update Modal */}
      {showStatusModal && selectedProduct && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-96">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium">Update Product Status</h3>
              <button onClick={() => setShowStatusModal(false)} className="text-gray-500">
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <p className="mb-4">Update status for: <strong>{selectedProduct.title}</strong></p>
            
            <div className="space-y-3">
              <button
                onClick={() => updateProductStatus(selectedProduct._id, 'approved')}
                className="w-full py-2 px-4 bg-green-600 text-white rounded hover:bg-green-700"
              >
                Approve
              </button>
              
              <button
                onClick={() => updateProductStatus(selectedProduct._id, 'pending')}
                className="w-full py-2 px-4 bg-yellow-500 text-white rounded hover:bg-yellow-600"
              >
                Set as Pending
              </button>
              
              <button
                onClick={() => updateProductStatus(selectedProduct._id, 'rejected')}
                className="w-full py-2 px-4 bg-red-600 text-white rounded hover:bg-red-700"
              >
                Reject
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Error Alert */}
      {error && <div className="bg-red-100 p-4 mb-4 text-red-700">{error}</div>}

     

      <h2 className="text-2xl font-bold mb-4">Products Dashboard</h2>

      {/* Status Summary Section */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white shadow-md p-4 rounded-lg flex items-center">
          <Package className="h-8 w-8 text-gray-600" />
          <div className="ml-4">
            <p className="text-gray-500">Total Products</p>
            <h3 className="text-xl font-semibold">{stats.total}</h3>
          </div>
        </div>

        <div className="bg-green-100 shadow-md p-4 rounded-lg flex items-center">
          <CheckCircle className="h-8 w-8 text-green-600" />
          <div className="ml-4">
            <p className="text-green-600">Approved</p>
            <h3 className="text-xl font-semibold">{stats.approved}</h3>
          </div>
        </div>

        <div className="bg-yellow-100 shadow-md p-4 rounded-lg flex items-center">
          <Clock className="h-8 w-8 text-yellow-600" />
          <div className="ml-4">
            <p className="text-yellow-600">Pending</p>
            <h3 className="text-xl font-semibold">{stats.pending}</h3>
          </div>
        </div>

        <div className="bg-red-100 shadow-md p-4 rounded-lg flex items-center">
          <XCircle className="h-8 w-8 text-red-600" />
          <div className="ml-4">
            <p className="text-red-600">Rejected</p>
            <h3 className="text-xl font-semibold">{stats.rejected}</h3>
          </div>
        </div>
      </div>
       {/* Search Bar */}
       <div className="mb-6 flex flex-col sm:flex-row gap-4">
        <div className="flex-1 relative">
          <input
            type="text"
            placeholder="Search products..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
        </div>
      </div>

      {/* Error Message */}
      {error && <div className="bg-red-100 p-4 mb-4 text-red-700">{error}</div>}

      {/* Loading Indicator */}
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        </div>
      ) : (
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Image</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Product</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Price</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredProducts.length > 0 ? (
                  filteredProducts.map((product) => (
                    
                    <tr key={product._id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <div className="flex-shrink-0 h-10 w-10">
                          {product.images?.[0] ? (
                            <img 
                              src={product.images[0].startsWith('http') 
                                ? product.images[0] 
                                : `${API_BASE_URL}${product.images[0]}`} 
                              alt={product.title} 
                              className="h-10 w-10 rounded-lg object-cover" 
                            />
                          ) : (
                            <Package className="h-10 w-10 rounded-lg bg-gray-100 p-2" />
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{product.title}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {product.category?.name || 'Uncategorized'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">€{product.price}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-2 inline-flex text-xs font-semibold rounded-full ${getStatusBadgeClass(
                            product.status || 'pending'
                          )}`}
                        >
                          {product.status || 'Pending'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button className="text-blue-600 hover:text-blue-900 mr-4">
                          <Edit className="h-5 w-5"  onClick={() => { setSelectedProduct(product); setShowStatusModal(true); }}/>
                        </button>
                        <button className="text-red-600 hover:text-red-900">
                          <Trash2 className="h-5 w-5"onClick={() => deleteProduct(product._id)} />
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="px-6 py-4 text-center text-sm text-gray-500">
                      No products found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default Products;
