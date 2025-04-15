import React, { useEffect, useState } from 'react';
import { Link, Outlet, useLocation, Navigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  LayoutDashboard,
  Users,
  Package,
  ShoppingCart,
  Settings,
  BarChart,
  FileText,
  Bell,
  Menu,
  X,
  FolderTree,
  LogOut,
  Store,
  Image,
  PieChart,
  Car,
  MessageCircle
} from 'lucide-react';

interface AdminLayoutProps {
  children?: React.ReactNode;
}

const AdminLayout: React.FC<AdminLayoutProps> = ({ children }) => {
  const { t } = useTranslation();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [userRole, setUserRole] = useState<string | null>(localStorage.getItem('userRole'));
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(!!localStorage.getItem('accessToken'));
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check authentication and admin role
    const token = localStorage.getItem('accessToken');
    const role = localStorage.getItem('userRole');
    
    setIsAuthenticated(!!token);
    setUserRole(role);
    setIsLoading(false);
    
    // Set console message for debugging
    console.log('AdminLayout - User Role:', role);
    console.log('AdminLayout - Is Authenticated:', !!token);
  }, []);

  // Show loading indicator while checking authentication
  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
    </div>;
  }

  // Redirect non-authenticated or non-admin users to home page
  if (!isAuthenticated || userRole !== 'admin') {
    console.log(t('admin.unauthorized'));
    return <Navigate to="/" replace />;
  }
  
  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const closeSidebar = () => {
    setSidebarOpen(false);
  };

  const navigation = [
    { name: t('admin.dashboard.title'), href: '/admin', icon: LayoutDashboard },
    { name: t('admin.users.title'), href: '/admin/users', icon: Users },
    { name: t('admin.categories.title'), href: '/admin/categories', icon: FolderTree },
    { name: t('admin.categoryAnalytics.title'), href: '/admin/category-analytics', icon: PieChart },
    { name: t('admin.products.title'), href: '/admin/products', icon: Package },
    // { name: 'Orders', href: '/admin/orders', icon: ShoppingCart },
    { name: t('admin.sellerOrders.title'), href: '/admin/seller-orders', icon: Store },
    { name: t('admin.bannerManagement.title'), href: '/admin/banner-management', icon: Image },
    { name: t('admin.brandManagement.title'), href: '/admin/brand-management', icon: Car },
    { name: t('admin.contactMessages.title'), href: '/admin/contact-messages', icon: MessageCircle },
    { name: t('admin.sellerAnalytics.title'), href: '/admin/seller-analytics', icon: BarChart },
    // { name: 'Reports', href: '/admin/reports', icon: FileText },
    { name: t('admin.settings.title'), href: '/admin/settings', icon: Settings },
  ];

  const handleLogout = () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('userRole');
    localStorage.removeItem('user');
    sessionStorage.removeItem('accessToken');
    sessionStorage.removeItem('refreshToken');
    sessionStorage.removeItem('userRole');
    sessionStorage.removeItem('user');
    setUserRole(null); 
    window.location.href = '/';
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      {/* Top Navigation - Now Fixed */}
      <div className="fixed top-0 left-0 right-0 bg-white shadow z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              {/* Mobile menu button */}
              <button 
                onClick={toggleSidebar}
                className="md:hidden p-2 rounded-md text-gray-500 hover:text-gray-600 hover:bg-gray-100 focus:outline-none"
              >
                <Menu className="h-6 w-6" />
              </button>
              <div className="flex-shrink-0 flex items-center ml-2 md:ml-0">
                <Link to="/admin" className="text-2xl font-bold text-blue-600">
                  {t('admin.panel')}
                </Link>
              </div>
            </div>
            <div className="flex items-center">
              <button 
                onClick={handleLogout}
                className="p-2 rounded-md text-gray-400 hover:text-gray-500 ml-2"
              >
                <LogOut className="h-6 w-6" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Add padding to account for fixed navbar */}
      <div className="flex flex-1 overflow-hidden pt-16">
        {/* Mobile Sidebar Overlay */}
        {sidebarOpen && (
          <div 
            className="fixed inset-0 z-40 bg-black bg-opacity-50 md:hidden"
            onClick={closeSidebar}
          ></div>
        )}

        {/* Sidebar Navigation - Mobile */}
        <div 
          className={`fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out md:hidden ${
            sidebarOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
        >
          <div className="flex items-center justify-between h-16 px-4 border-b">
            <h2 className="text-xl font-semibold text-blue-600">{t('admin.menu')}</h2>
            <button 
              onClick={closeSidebar}
              className="p-2 rounded-md text-gray-500 hover:text-gray-600 hover:bg-gray-100"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
          <nav className="mt-4 space-y-1 px-2 overflow-y-auto max-h-screen pb-20">
            {navigation.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.href;
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`${
                    isActive
                      ? 'bg-blue-50 border-blue-600 text-blue-600'
                      : 'border-transparent text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  } group flex items-center px-3 py-2 text-sm font-medium border-l-4`}
                  onClick={closeSidebar}
                >
                  <Icon
                    className={`${
                      isActive ? 'text-blue-600' : 'text-gray-400 group-hover:text-gray-500'
                    } mr-3 flex-shrink-0 h-6 w-6`}
                  />
                  {item.name}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Sidebar Navigation - Desktop (Fixed) */}
        <div className="hidden md:block w-64 flex-shrink-0 fixed top-16 bottom-0 left-0 overflow-y-auto border-r border-gray-200 bg-white z-10">
          <nav className="space-y-1 py-4">
            {navigation.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.href;
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`${
                    isActive
                      ? 'bg-blue-50 border-blue-600 text-blue-600'
                      : 'border-transparent text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  } group flex items-center px-3 py-2 text-sm font-medium border-l-4`}
                >
                  <Icon
                    className={`${
                      isActive ? 'text-blue-600' : 'text-gray-400 group-hover:text-gray-500'
                    } mr-3 flex-shrink-0 h-6 w-6`}
                  />
                  {item.name}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Main Content - Scrollable */}
        <div className="flex-1 md:ml-64 overflow-y-auto">
          <div className="py-6 px-4 sm:px-6 lg:px-8">
            {children || <Outlet />}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminLayout;