import React from 'react';
import { FileText, Download, Filter, Calendar } from 'lucide-react';

const Reports = () => {
  const reports = [
    {
      id: 1,
      name: 'Monthly Sales Report',
      description: 'Detailed breakdown of sales performance',
      type: 'Sales',
      format: 'PDF',
      lastGenerated: '2024-03-10',
      size: '2.4 MB',
    },
    {
      id: 2,
      name: 'Customer Analytics',
      description: 'Customer behavior and demographics analysis',
      type: 'Analytics',
      format: 'Excel',
      lastGenerated: '2024-03-09',
      size: '1.8 MB',
    },
    {
      id: 3,
      name: 'Inventory Status',
      description: 'Current stock levels and projections',
      type: 'Inventory',
      format: 'PDF',
      lastGenerated: '2024-03-08',
      size: '3.1 MB',
    },
    // Add more reports as needed
  ];

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">Reports</h1>
        <button className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700">
          <FileText className="h-5 w-5 mr-2" />
          Generate New Report
        </button>
      </div>

      {/* Filters */}
      <div className="mb-6 flex flex-col sm:flex-row gap-4">
        <select className="w-full sm:w-48 px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500">
          <option value="">All Types</option>
          <option value="sales">Sales</option>
          <option value="analytics">Analytics</option>
          <option value="inventory">Inventory</option>
        </select>
        <select className="w-full sm:w-48 px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500">
          <option value="">All Formats</option>
          <option value="pdf">PDF</option>
          <option value="excel">Excel</option>
          <option value="csv">CSV</option>
        </select>
        <div className="relative flex-1">
          <input
            type="text"
            placeholder="Search reports..."
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
      </div>

      {/* Reports Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {reports.map((report) => (
          <div
            key={report.id}
            className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-200"
          >
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center">
                  <FileText className="h-6 w-6 text-blue-600" />
                  <h3 className="ml-2 text-lg font-medium text-gray-900">{report.name}</h3>
                </div>
                <span className="px-2 py-1 text-xs font-medium text-blue-600 bg-blue-100 rounded-full">
                  {report.format}
                </span>
              </div>
              <p className="text-sm text-gray-600 mb-4">{report.description}</p>
              <div className="flex items-center text-sm text-gray-500 mb-4">
                <Calendar className="h-4 w-4 mr-1" />
                Last generated: {report.lastGenerated}
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">{report.size}</span>
                <button className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50">
                  <Download className="h-4 w-4 mr-2" />
                  Download
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Schedule Reports Section */}
      <div className="mt-8 bg-white rounded-lg shadow-md p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Scheduled Reports</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="border rounded-lg p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-medium text-gray-900">Daily Sales Summary</h3>
              <span className="px-2 py-1 text-xs font-medium text-green-600 bg-green-100 rounded-full">
                Active
              </span>
            </div>
            <p className="text-sm text-gray-600 mb-4">
              Automated daily sales report sent at 23:00
            </p>
            <button className="text-sm text-blue-600 hover:text-blue-700">
              Edit Schedule
            </button>
          </div>
          <div className="border rounded-lg p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-medium text-gray-900">Weekly Analytics Report</h3>
              <span className="px-2 py-1 text-xs font-medium text-green-600 bg-green-100 rounded-full">
                Active
              </span>
            </div>
            <p className="text-sm text-gray-600 mb-4">
              Sent every Monday at 09:00
            </p>
            <button className="text-sm text-blue-600 hover:text-blue-700">
              Edit Schedule
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Reports;