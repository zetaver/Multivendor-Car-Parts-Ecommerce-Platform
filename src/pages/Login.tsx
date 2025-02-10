import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { setCredentials } from '../store/slices/authSlice';
import { Mail, Lock, LogIn, Info } from 'lucide-react';

const Login = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const dispatch = useDispatch();

  // Demo credentials
  const demoCredentials = {
    admin: {
      email: 'admin@easycasse.com',
      password: 'admin123',
      role: 'admin'
    },
    seller: {
      email: 'seller@easycasse.com',
      password: 'seller123',
      role: 'seller'
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Check if credentials match demo accounts
      let user = null;
      if (formData.email === demoCredentials.admin.email && 
          formData.password === demoCredentials.admin.password) {
        user = {
          id: '1',
          email: demoCredentials.admin.email,
          role: demoCredentials.admin.role,
          name: 'Admin User'
        };
      } else if (formData.email === demoCredentials.seller.email && 
                 formData.password === demoCredentials.seller.password) {
        user = {
          id: '2',
          email: demoCredentials.seller.email,
          role: demoCredentials.seller.role,
          name: 'Seller User'
        };
      }

      if (user) {
        const token = `demo-token-${user.role}`;
        
        // Save to localStorage
        localStorage.setItem('token', token);
        localStorage.setItem('userRole', user.role);
        
        // Update Redux state
        dispatch(setCredentials({ user, token }));

        // Navigate based on role
        if (user.role === 'admin') {
          navigate('/admin');
        } else if (user.role === 'seller') {
          navigate('/seller/dashboard');
        } else {
          navigate('/');
        }
      } else {
        setError('Invalid credentials');
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const fillDemoCredentials = (type: 'admin' | 'seller') => {
    setFormData({
      email: demoCredentials[type].email,
      password: demoCredentials[type].password
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          Sign in to your account
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          Or{' '}
          <Link to="/register" className="font-medium text-blue-600 hover:text-blue-500">
            create a new account
          </Link>
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          {/* Demo Credentials Info */}
          <div className="mb-6 bg-blue-50 rounded-lg p-4">
            <div className="flex items-center">
              <Info className="h-5 w-5 text-blue-400 mr-2" />
              <h3 className="text-sm font-medium text-blue-800">Demo Credentials</h3>
            </div>
            <div className="mt-2 space-y-2">
              <button
                onClick={() => fillDemoCredentials('admin')}
                className="w-full text-left text-sm px-3 py-2 rounded bg-white hover:bg-gray-50"
              >
                <div className="font-medium text-gray-900">Admin Account</div>
                <div className="text-gray-500">Email: {demoCredentials.admin.email}</div>
                <div className="text-gray-500">Password: {demoCredentials.admin.password}</div>
              </button>
              <button
                onClick={() => fillDemoCredentials('seller')}
                className="w-full text-left text-sm px-3 py-2 rounded bg-white hover:bg-gray-50"
              >
                <div className="font-medium text-gray-900">Seller Account</div>
                <div className="text-gray-500">Email: {demoCredentials.seller.email}</div>
                <div className="text-gray-500">Password: {demoCredentials.seller.password}</div>
              </button>
            </div>
          </div>

          <form className="space-y-6" onSubmit={handleSubmit}>
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md">
                {error}
              </div>
            )}

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email address
              </label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="you@example.com"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Password
              </label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  id="remember-me"
                  name="remember-me"
                  type="checkbox"
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-900">
                  Remember me
                </label>
              </div>

              <div className="text-sm">
                <a href="#" className="font-medium text-blue-600 hover:text-blue-500">
                  Forgot your password?
                </a>
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center items-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
              >
                {loading ? (
                  'Signing in...'
                ) : (
                  <>
                    <LogIn className="w-5 h-5 mr-2" />
                    Sign in
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Login;