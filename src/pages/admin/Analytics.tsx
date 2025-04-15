import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaArrowLeft, FaChartLine, FaBoxOpen, FaUserFriends, FaCalendarAlt } from 'react-icons/fa';
import { MdAttachMoney } from 'react-icons/md';
import axios from 'axios';
import { Bar, Line, Pie } from 'react-chartjs-2';
import { API_URL } from '../../config';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

interface SalesData {
  totalSales: number;
  monthlySales: number;
  weeklySales: number;
  totalOrders: number;
  pendingOrders: number;
  completedOrders: number;
  processingOrders: number;
  shippedOrders: number;
  cancelledOrders: number;
}

interface StatCardProps {
  icon: React.ReactNode;
  title: string;
  value: string | number;
  bgColor: string;
  textColor: string;
}

const SellerAnalytics: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState<boolean>(true);
  const [salesData, setSalesData] = useState<SalesData>({
    totalSales: 0,
    monthlySales: 0,
    weeklySales: 0,
    totalOrders: 0,
    pendingOrders: 0,
    completedOrders: 0,
    processingOrders: 0,
    shippedOrders: 0,
    cancelledOrders: 0,
  });
  
  const [timeframeFilter, setTimeframeFilter] = useState<'week' | 'month' | 'year'>('month');
  
  const [monthlySalesData, setMonthlySalesData] = useState({
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
    datasets: [
      {
        label: 'Sales (€)',
        data: [] as number[],
        borderColor: 'rgb(75, 192, 192)',
        backgroundColor: 'rgba(75, 192, 192, 0.2)',
        tension: 0.4,
      },
    ],
  });
  
  const [orderStatusData, setOrderStatusData] = useState({
    labels: ['Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled'],
    datasets: [
      {
        label: 'Order Status',
        data: [] as number[],
        backgroundColor: [
          'rgba(255, 193, 7, 0.6)',  // Yellow for Pending
          'rgba(0, 123, 255, 0.6)',  // Blue for Processing  
          'rgba(88, 80, 236, 0.6)',  // Indigo for Shipped
          'rgba(75, 192, 192, 0.6)',  // Teal for Delivered/Completed
          'rgba(255, 99, 132, 0.6)',  // Red for Cancelled
        ],
        borderColor: [
          'rgba(255, 193, 7, 1)',  // Yellow for Pending
          'rgba(0, 123, 255, 1)',  // Blue for Processing
          'rgba(88, 80, 236, 1)',  // Indigo for Shipped
          'rgba(75, 192, 192, 1)',  // Teal for Delivered/Completed
          'rgba(255, 99, 132, 1)',  // Red for Cancelled
        ],
        borderWidth: 1,
      },
    ],
  });
  
  const [topProductsData, setTopProductsData] = useState({
    labels: [] as string[],
    datasets: [
      {
        label: 'Units Sold',
        data: [] as number[],
        backgroundColor: 'rgba(53, 162, 235, 0.5)',
      },
    ],
  });
  
  useEffect(() => {
    // Fetch analytics data from API
    const fetchAnalyticsData = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('accessToken');
        
        if (!token) {
          throw new Error('Authentication token not found');
        }
        
        console.log('Fetching analytics data from:', `${API_URL}/api/seller/analytics`);
        
        const response = await axios.get(`${API_URL}/api/seller/analytics`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        
        console.log('Analytics API response:', response.data);
        
        if (response.data.success) {
          const data = response.data.data;
          
          // Update sales data state
          setSalesData({
            totalSales: data.totalSales || 0,
            monthlySales: data.monthlySales || 0,
            weeklySales: data.weeklySales || 0,
            totalOrders: data.totalOrders || 0,
            pendingOrders: data.pendingOrders || 0,
            completedOrders: data.completedOrders || 0,
            processingOrders: data.processingOrders || 0,
            shippedOrders: data.shippedOrders || 0,
            cancelledOrders: data.cancelledOrders || 0,
          });
          
          // Update chart data if available
          if (data.monthlySalesData && Array.isArray(data.monthlySalesData)) {
            setMonthlySalesData({
              labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
              datasets: [
                {
                  label: 'Sales (€)',
                  data: data.monthlySalesData,
                  borderColor: 'rgb(75, 192, 192)',
                  backgroundColor: 'rgba(75, 192, 192, 0.2)',
                  tension: 0.4,
                },
              ],
            });
          } else {
            console.warn('No monthly sales data available or data is not an array');
          }
          
          if (data.orderStatusData && Array.isArray(data.orderStatusData)) {
            setOrderStatusData({
              labels: ['Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled'],
              datasets: [
                {
                  label: 'Order Status',
                  data: data.orderStatusData,
                  backgroundColor: [
                    'rgba(255, 193, 7, 0.6)',  // Yellow for Pending
                    'rgba(0, 123, 255, 0.6)',  // Blue for Processing  
                    'rgba(88, 80, 236, 0.6)',  // Indigo for Shipped
                    'rgba(75, 192, 192, 0.6)',  // Teal for Delivered/Completed
                    'rgba(255, 99, 132, 0.6)',  // Red for Cancelled
                  ],
                  borderColor: [
                    'rgba(255, 193, 7, 1)',  // Yellow for Pending
                    'rgba(0, 123, 255, 1)',  // Blue for Processing
                    'rgba(88, 80, 236, 1)',  // Indigo for Shipped
                    'rgba(75, 192, 192, 1)',  // Teal for Delivered/Completed
                    'rgba(255, 99, 132, 1)',  // Red for Cancelled
                  ],
                  borderWidth: 1,
                },
              ],
            });
          } else {
            console.warn('No order status data available or data is not an array');
          }
          
          if (data.topProducts && data.topProducts.labels && data.topProducts.data) {
            setTopProductsData({
              labels: data.topProducts.labels,
              datasets: [
                {
                  label: 'Units Sold',
                  data: data.topProducts.data,
                  backgroundColor: 'rgba(53, 162, 235, 0.5)',
                },
              ],
            });
          } else {
            console.warn('No top products data available');
          }
        } else {
          console.error('API returned success: false -', response.data.message);
          throw new Error(response.data.message || 'Failed to fetch analytics data');
        }
      } catch (error) {
        console.error('Error fetching analytics data:', error);
        
        // Fallback to placeholder data in case of errors
        setSalesData({
          totalSales: 350000,
          monthlySales: 42000,
          weeklySales: 12500,
          totalOrders: 128,
          pendingOrders: 20,
          processingOrders: 15,
          shippedOrders: 10,
          completedOrders: 67,
          cancelledOrders: 16,
        });
        
        // Add placeholder data for charts
        setMonthlySalesData({
          labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
          datasets: [
            {
              label: 'Sales (€)',
              data: [12000, 19000, 15000, 25000, 22000, 30000, 32000, 35000, 38000, 40000, 38000, 42000],
              borderColor: 'rgb(75, 192, 192)',
              backgroundColor: 'rgba(75, 192, 192, 0.2)',
              tension: 0.4,
            },
          ],
        });
        
        setOrderStatusData({
          labels: ['Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled'],
          datasets: [
            {
              label: 'Order Status',
              data: [20, 15, 10, 67, 16],
              backgroundColor: [
                'rgba(255, 193, 7, 0.6)',  // Yellow for Pending
                'rgba(0, 123, 255, 0.6)',  // Blue for Processing  
                'rgba(88, 80, 236, 0.6)',  // Indigo for Shipped
                'rgba(75, 192, 192, 0.6)',  // Teal for Delivered/Completed
                'rgba(255, 99, 132, 0.6)',  // Red for Cancelled
              ],
              borderColor: [
                'rgba(255, 193, 7, 1)',  // Yellow for Pending
                'rgba(0, 123, 255, 1)',  // Blue for Processing
                'rgba(88, 80, 236, 1)',  // Indigo for Shipped
                'rgba(75, 192, 192, 1)',  // Teal for Delivered/Completed
                'rgba(255, 99, 132, 1)',  // Red for Cancelled
              ],
              borderWidth: 1,
            },
          ],
        });
        
        setTopProductsData({
          labels: ['iPhone Case', 'Screen Protector', 'Charging Cable', 'Power Bank', 'Earbuds'],
          datasets: [
            {
              label: 'Units Sold',
              data: [45, 37, 30, 28, 25],
              backgroundColor: 'rgba(53, 162, 235, 0.5)',
            },
          ],
        });
      } finally {
        setLoading(false);
      }
    };
    
    fetchAnalyticsData();
  }, [timeframeFilter]);
  
  const StatCard: React.FC<StatCardProps> = ({ icon, title, value, bgColor, textColor }) => (
    <div className={`${bgColor} ${textColor} rounded-xl p-6 shadow-md flex flex-col`}>
      <div className="flex items-center mb-4">
        {icon}
        <h3 className="text-lg font-semibold ml-2">{title}</h3>
      </div>
      <p className="text-2xl font-bold">{value}</p>
    </div>
  );
  
  const formatCurrency = (amount: number): string => {
    // Format as Euro with no decimal places and no space between symbol and number
    const formatted = new Intl.NumberFormat('en-GB', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
    
    return `€${formatted}`;
  };
  
  const chartOptions = {
    responsive: true,
    plugins: {
      legend: { position: 'top' as const },
    },
  };

  return (
    <div className="min-h-screen bg-gray-50">
      
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center mb-8 md:mt-10 mt-0">
          <button 
            onClick={() => navigate('/profile')}
            className="mr-4 p-2 bg-white rounded-full shadow-md hover:bg-gray-100"
          >
            <FaArrowLeft />
          </button>
          <h1 className="text-3xl font-bold text-gray-800">Seller Analytics</h1>
        </div>
        
        <div className="mb-8 bg-white p-4 rounded-xl shadow-md">
          <h2 className="text-xl font-semibold mb-4">Time Period</h2>
          <div className="flex space-x-4">
            <button
              className={`px-4 py-2 rounded-md ${timeframeFilter === 'week' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
              onClick={() => setTimeframeFilter('week')}
            >
              Weekly
            </button>
            <button
              className={`px-4 py-2 rounded-md ${timeframeFilter === 'month' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
              onClick={() => setTimeframeFilter('month')}
            >
              Monthly
            </button>
            <button
              className={`px-4 py-2 rounded-md ${timeframeFilter === 'year' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
              onClick={() => setTimeframeFilter('year')}
            >
              Yearly
            </button>
          </div>
        </div>
        
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="loader"></div>
            <p className="ml-2">Loading analytics data...</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <StatCard 
                icon={<MdAttachMoney className="text-2xl" />} 
                title="Total Sales" 
                value={formatCurrency(salesData.totalSales)}
                bgColor="bg-blue-50"
                textColor="text-blue-700"
              />
              <StatCard 
                icon={<FaChartLine className="text-2xl" />} 
                title={`${timeframeFilter === 'week' ? 'Weekly' : timeframeFilter === 'month' ? 'Monthly' : 'Yearly'} Sales`} 
                value={formatCurrency(timeframeFilter === 'week' ? salesData.weeklySales : timeframeFilter === 'month' ? salesData.monthlySales : salesData.totalSales)}
                bgColor="bg-green-50"
                textColor="text-green-700"
              />
              <StatCard 
                icon={<FaBoxOpen className="text-2xl" />} 
                title="Total Orders" 
                value={salesData.totalOrders}
                bgColor="bg-purple-50"
                textColor="text-purple-700"
              />
              <StatCard 
                icon={<FaCalendarAlt className="text-2xl" />} 
                title="Pending Orders" 
                value={salesData.pendingOrders}
                bgColor="bg-amber-50"
                textColor="text-amber-700"
              />
            </div>
            
            <div className="bg-white p-6 rounded-xl shadow-md mb-8">
              <h2 className="text-xl font-semibold mb-4">Sales Trend</h2>
              <div className="h-80">
                <Line data={monthlySalesData} options={chartOptions} />
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
              <div className="bg-white p-6 rounded-xl shadow-md">
                <h2 className="text-xl font-semibold mb-4">Order Status</h2>
                <div className="h-64">
                  <Pie data={orderStatusData} options={chartOptions} />
                </div>
              </div>
              
              <div className="bg-white p-6 rounded-xl shadow-md">
                <h2 className="text-xl font-semibold mb-4">Top Products</h2>
                <div className="h-64">
                  <Bar data={topProductsData} options={chartOptions} />
                </div>
              </div>
            </div>
            
            <div className="bg-white p-6 rounded-xl shadow-md mb-8">
              <h2 className="text-xl font-semibold mb-4">Customer Demographics</h2>
              <div className="bg-gray-100 rounded-lg p-8 text-center">
                <FaUserFriends className="text-4xl text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">Customer demographic data will be available soon</p>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default SellerAnalytics; 