import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Provider } from 'react-redux';
import { store } from './store/store';
import Navbar from './components/Navbar';
import Footer from './components/ui/Footer';
import BottomNavigation from './components/BottomNavigation';

// Pages
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import ProductList from './pages/ProductList';
import ProductDetail from './pages/ProductDetail';
import Categories from './pages/Categories';
import NewArrivals from './pages/NewArrivals';
import BestSellers from './pages/BestSellers';
import Deals from './pages/Deals';
import Sell from './pages/Sell';
import Messages from './pages/Messages';
import SellerGuidelines from './pages/SellerGuidelines';
import SellerDashboard from './pages/SellerDashboard';
import Orders from './pages/seller/Orders';
import AddListing from './pages/seller/AddListing';
import Inventory from './pages/seller/Inventory';
import SellerAnalytics from './pages/seller/Analytics';
import Shipping from './pages/Shipping';
import SellerSupport from './pages/SellerSupport';
import Help from './pages/Help';
import Returns from './pages/Returns';
import TrackOrder from './pages/TrackOrder';
import Terms from './pages/Terms';
import Privacy from './pages/Privacy';
import Contact from './pages/Contact';
import Cookies from './pages/Cookies';
import AdminLayout from './pages/admin/AdminLayout';
import AdminDashboard from './pages/admin/Dashboard';
import Users from './pages/admin/Users';
import Products from './pages/admin/Products';
import AdminOrders from './pages/admin/Orders';
import AdminAnalytics from './pages/admin/Analytics';
import Reports from './pages/admin/Reports';
import Settings from './pages/admin/Settings';
import SellerStore from './pages/SellerStore';
import Wishlist from './pages/Wishlist';
import Notifications from './pages/Notifications';
import UserSettings from './pages/UserSettings';
import SearchPage from './pages/SearchPage';
import ProductsPage from './pages/Home';

interface ProtectedRouteProps {
  children: React.ReactNode;
  role?: string;
  redirectTo?: string;
}

const ProtectedRoute = ({ children, role, redirectTo = '/login' }: ProtectedRouteProps) => {
  const isAuthenticated = localStorage.getItem('token') !== null;
  const userRole = localStorage.getItem('userRole');

  if (!isAuthenticated) {
    return <Navigate to={redirectTo} />;
  }

  if (role && userRole !== role) {
    return <Navigate to="/" />;
  }

  return <>{children}</>;
};

const App = () => {
  return (
    <Provider store={store}>
      <Router>
        <div className="min-h-screen bg-gray-50 flex flex-col">
          <Navbar />
          <main className="flex-grow pb-16 md:pb-0">
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={<Home />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/products" element={<ProductList />} />
              <Route path="/products/:id" element={<ProductDetail />} />
              <Route path="/categories" element={<Categories />} />
              <Route path="/new-arrivals" element={<NewArrivals />} />
              <Route path="/best-sellers" element={<BestSellers />} />
              <Route path="/deals" element={<Deals />} />
              <Route path="/sell" element={<Sell />} />
              <Route path="/seller-guidelines" element={<SellerGuidelines />} />
              <Route path="/shipping" element={<Shipping />} />
              <Route path="/seller-support" element={<SellerSupport />} />
              <Route path="/help" element={<Help />} />
              <Route path="/returns" element={<Returns />} />
              <Route path="/track-order" element={<TrackOrder />} />
              <Route path="/terms" element={<Terms />} />
              <Route path="/privacy" element={<Privacy />} />
              <Route path="/cookies" element={<Cookies />} />
              <Route path="/contact" element={<Contact />} />
              <Route path="/seller/:sellerId" element={<SellerStore />} />
              <Route path="/search" element={<SearchPage />} />
              <Route path="/products" element={<ProductsPage />} />

              {/* Protected Routes */}
              <Route
                path="/messages"
                element={
                  <ProtectedRoute>
                    <Messages />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/wishlist"
                element={
                  <ProtectedRoute>
                    <Wishlist />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/notifications"
                element={
                  <ProtectedRoute>
                    <Notifications />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/settings"
                element={
                  <ProtectedRoute>
                    <UserSettings />
                  </ProtectedRoute>
                }
              />

              {/* Protected Seller Routes */}
              <Route
                path="/seller/dashboard"
                element={
                  <ProtectedRoute role="seller">
                    <SellerDashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/seller/orders"
                element={
                  <ProtectedRoute role="seller">
                    <Orders />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/seller/add-listing"
                element={
                  <ProtectedRoute role="seller">
                    <AddListing />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/seller/inventory"
                element={
                  <ProtectedRoute role="seller">
                    <Inventory />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/seller/analytics"
                element={
                  <ProtectedRoute role="seller">
                    <SellerAnalytics />
                  </ProtectedRoute>
                }
              />

              {/* Protected Admin Routes */}
              <Route
                path="/admin"
                element={
                  <ProtectedRoute role="admin">
                    <AdminLayout />
                  </ProtectedRoute>
                }
              >
                <Route index element={<AdminDashboard />} />
                <Route path="users" element={<Users />} />
                <Route path="products" element={<Products />} />
                <Route path="orders" element={<AdminOrders />} />
                <Route path="analytics" element={<AdminAnalytics />} />
                <Route path="reports" element={<Reports />} />
                <Route path="settings" element={<Settings />} />
              </Route>

              {/* Catch all route - 404 */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>
          <Footer className="hidden md:block" />
          <BottomNavigation 
            className={`md:hidden ${location.pathname.includes('/products/') ? 'hidden' : ''}`} 
          />
        </div>
      </Router>
    </Provider>
  );
};

export default App;