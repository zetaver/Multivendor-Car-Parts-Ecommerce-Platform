import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Users,
  Package,
  DollarSign,
  Clock,
  AlertCircle,
  Store,
  Loader,
  ChevronRight,
} from 'lucide-react';
import TopCategories from '../../components/TopCategories';
import { API_URL } from '../../config';
import { formatCurrency } from '../../utils/formatters';
import { useTranslation } from 'react-i18next';

interface OrderItem {
  product: {
    _id: string;
    title: string;
    price: number;
    images: string[];
  };
  quantity: number;
  price: number;
}

interface Order {
  _id: string;
  buyer: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
  };
  seller: {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
    storeName?: string;
  };
  items: OrderItem[];
  totalAmount: number;
  status: string;
  paymentStatus: string;
  createdAt: string;
  updatedAt: string;
}

const Dashboard = () => {
  const { t } = useTranslation();
  const [totalCategories, setTotalCategories] = useState<number | null>(null);
  const [totalUsers, setTotalUsers] = useState<number | null>(null);
  const [totalProducts, setTotalProducts] = useState<number | null>(null);
  const [totalSellerOrders, setTotalSellerOrders] = useState<number | null>(null);
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(true);
  const [ordersError, setOrdersError] = useState<string | null>(null);
  const navigate = useNavigate();
  useEffect(() => {
    const fetchTotalCategories = async () => {
      try {
        const response = await fetch(`${API_URL}/api/categories/total`);
        if (!response.ok) {
          throw new Error('Failed to fetch total categories');
        }
        const data = await response.json();
        setTotalCategories(data.totalCategories);
      } catch (error) {
        console.error('Error fetching total categories:', error);
      }
    };

    const fetchTotalUsers = async () => {
      try {
        const token = localStorage.getItem('accessToken');
        const response = await fetch(`${API_URL}/api/users/total`, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });
        if (!response.ok) {
          throw new Error('Failed to fetch total users');
        }
        const data = await response.json();
        setTotalUsers(data.totalUsers);
      } catch (error) {
        console.error('Error fetching total users:', error);
      }
    };

    const fetchTotalProducts = async () => {
      try {
        const token = localStorage.getItem('accessToken');
        const response = await fetch(`${API_URL}/api/products/admin/count`, {
          headers: { 'Authorization': `Bearer ${token}` },
        });
        if (!response.ok) throw new Error('Failed to fetch total products');
        const data = await response.json();
        setTotalProducts(data.total);
      } catch (error) {
        console.error('Error fetching total products:', error);
      }
    };

    const fetchTotalSellerOrders = async () => {
      try {
        const token = localStorage.getItem('accessToken');
        const response = await fetch(`${API_URL}/api/orders/admin/count`, {
          headers: { 'Authorization': `Bearer ${token}` },
        });
        if (!response.ok) throw new Error('Failed to fetch total seller orders');
        const data = await response.json();
        setTotalSellerOrders(data.totalCount);
      } catch (error) {
        console.error('Error fetching total seller orders:', error);
      }
    };

    const fetchRecentOrders = async () => {
      try {
        setOrdersLoading(true);
        const token = localStorage.getItem('accessToken');
        const response = await fetch(`${API_URL}/api/orders/admin/all?limit=5&sort=-createdAt`, {
          headers: { 'Authorization': `Bearer ${token}` },
        });

        if (!response.ok) {
          throw new Error(`Failed to fetch recent orders: ${response.status}`);
        }

        const data = await response.json();

        if (data.success) {
          setRecentOrders(data.data);
        } else {
          throw new Error(data.message || 'Failed to fetch recent orders');
        }
      } catch (err) {
        console.error('Error fetching recent orders:', err);
        setOrdersError(err instanceof Error ? err.message : 'An unknown error occurred');
      } finally {
        setOrdersLoading(false);
      }
    };

    fetchTotalCategories();
    fetchTotalUsers();
    fetchTotalProducts();
    fetchTotalSellerOrders();
    fetchRecentOrders();
  }, []);

  const stats = [
    {
      name: t('admin.dashboard.totalUsers'),
      value: totalUsers !== null ? totalUsers.toString() : t('common.loading'),
      icon: Users,
      trend: 'up',
      link: '/admin/users',
    },
    {
      name: t('admin.dashboard.totalCategories'),
      value: totalCategories !== null ? totalCategories.toString() : t('common.loading'),
      icon: Users,
      trend: 'up',
      link: '/admin/categories',
    },
    {
      name: t('admin.dashboard.totalProducts'),
      value: totalProducts !== null ? totalProducts.toString() : t('common.loading'),
      icon: Package,
      link: '/admin/products',
    },
    {
      name: t('admin.dashboard.sellerOrders'),
      value: totalSellerOrders !== null ? totalSellerOrders.toString() : t('common.loading'),
      icon: Store,
      link: '/admin/seller-orders',
    },
    // {
    //   name: 'Revenue',
    //   value: '€12,345',
    //   icon: DollarSign,
    //   trend: 'up',
    // },
  ];

  const alerts = [
    {
      title: t('admin.dashboard.alerts.newOrders'),
      message: t('admin.dashboard.alerts.newOrdersMessage'),
      type: 'info',
      link: '/admin/orders',
    },
    {
      title: t('admin.dashboard.alerts.newSellerOrders'),
      message: t('admin.dashboard.alerts.newSellerOrdersMessage'),
      type: 'info',
      link: '/admin/seller-orders',
    },
  ];

  // Format date to a more readable format
  const formatDate = (dateString: string) => {
    const options: Intl.DateTimeFormatOptions = {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  // Get appropriate badge color based on order status
  const getStatusBadgeColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'processing':
        return 'bg-blue-100 text-blue-800';
      case 'shipped':
        return 'bg-indigo-100 text-indigo-800';
      case 'delivered':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">{t('admin.dashboard.title')}</h1>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div
              key={stat.name}
              className="bg-white rounded-lg shadow p-6"
            >
              <div className="flex items-center justify-between">
                <div className="text-gray-400">
                  <Icon className="w-6 h-6" />
                </div>
                <div className={`text-sm ${stat.trend === 'up' ? 'text-green-500' : 'text-red-500'
                  }`}>
                  {/* {stat.change} */}
                </div>
              </div>
              <div className="mt-4">
                <h3 className="text-2xl font-semibold text-gray-900">{stat.value}</h3>
                {stat.link ? (
                  <Link to={stat.link} className="text-gray-600 hover:text-blue-600">{stat.name}</Link>
                ) : (
                  <p className="text-gray-600">{stat.name}</p>
                )}
              </div>
            </div>
          );
        })}
      </div>
      {/* Total Sales Summary */}
      <div className="px-6 pt-4 pb-2 bg-gray-50 border border-gray-200 rounded-lg mt-4">
        <div className="flex flex-wrap items-center justify-between">
          <div className="flex items-center">
            <div className="mr-8">
              <p className="text-sm text-gray-500">{t('admin.dashboard.totalOrders')}</p>
              <p className="text-xl font-semibold text-gray-900">{totalSellerOrders}</p>
            </div>
            {/* <div>
              <p className="text-sm text-gray-500">Total Sales</p>
              <p className="text-xl font-semibold text-emerald-600">
                {formatCurrency()}
              </p>
            </div> */}
          </div>
          <div className="mt-2 sm:mt-0">
            <button
              onClick={() => navigate("/admin/seller-analytics")}
              className="text-sm text-blue-600 hover:text-blue-800 flex items-center cursor-pointer"
            >
              <span>{t('admin.dashboard.viewAnalytics')}</span>
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8 mt-4">
        {/* Top Categories with Revenue */}
        <div>
          <TopCategories limit={5} showRevenue={true} />
        </div>

        {/* Recent Orders */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">{t('admin.dashboard.recentOrders')}</h2>
              <Link
                to="/admin/seller-orders"
                className="text-sm text-blue-600 hover:text-blue-500"
              >
                {t('admin.dashboard.viewAll')}
              </Link>
            </div>

            {ordersLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader className="w-8 h-8 text-blue-500 animate-spin" />
                <span className="ml-2 text-gray-500">{t('admin.dashboard.loadingOrders')}</span>
              </div>
            ) : ordersError ? (
              <div className="p-4 text-red-500 bg-red-50 rounded-lg">
                <p>{t('admin.dashboard.errorLoadingOrders')}: {ordersError}</p>
              </div>
            ) : recentOrders.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <p>{t('admin.dashboard.noOrdersFound')}</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead>
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {t('admin.dashboard.orderTable.orderId')}
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {t('admin.dashboard.orderTable.customer')}
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {t('admin.dashboard.orderTable.date')}
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {t('admin.dashboard.orderTable.amount')}
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {t('admin.dashboard.orderTable.status')}
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {recentOrders.slice(0, 5).map((order) => (
                      <tr key={order._id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          #{order._id.substring(0, 8).toUpperCase()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {order.buyer.firstName} {order.buyer.lastName}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formatDate(order.createdAt)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          €{order.totalAmount.toFixed(2)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadgeColor(order.status)}`}>
                            {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Alerts and Activity */}
      <div className="lg:col-span-1">
        <div className="bg-white rounded-lg shadow">
          <div className="p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">{t('admin.dashboard.alertsActivity')}</h2>
            <div className="space-y-4">
              {alerts.map((alert, index) => (
                <div
                  key={index}
                  className={`p-4 rounded-lg ${alert.type === 'warning'
                      ? 'bg-yellow-50 text-yellow-800'
                      : 'bg-blue-50 text-blue-800'
                    }`}
                >
                  <div className="flex items-center">
                    {alert.type === 'warning' ? (
                      <AlertCircle className="w-5 h-5 mr-2" />
                    ) : (
                      <Clock className="w-5 h-5 mr-2" />
                    )}
                    <div>
                      <h3 className="font-medium">{alert.title}</h3>
                      <p className="text-sm mt-1">{alert.message}</p>
                      {alert.link && (
                        <Link to={alert.link} className="text-sm mt-2 inline-block font-medium hover:underline">
                          View Details →
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;