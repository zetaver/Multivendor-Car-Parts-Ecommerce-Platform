// import React from 'react';
// import { useParams } from 'react-router-dom';
// import { Star, MapPin, MessageCircle, Package, Filter, Search, SortDesc, ChevronDown } from 'lucide-react';
// import { useTranslation } from 'react-i18next';
// import sampleProducts from '../data/sampleProducts';

// const SellerStore = () => {
//   const { sellerId } = useParams();
//   const { t } = useTranslation();
  
//   // Mock seller data - Replace with actual API data
//   const seller = {
//     id: '1',
//     name: 'Auto Parts Pro',
//     joinDate: '2023',
//     rating: 4.8,
//     sales: 1234,
//     location: 'Paris, France',
//     responseTime: '< 2 hours',
//     description: 'Specialized in high-quality auto parts with over 10 years of experience. We offer a wide range of genuine and aftermarket parts for all major vehicle brands.',
//     stats: {
//       totalListings: 156,
//       returnRate: '< 1%'
//     }
//   };

//   return (
//     <div className="min-h-screen bg-gray-50">
//       {/* Seller Header */}
//       <div className="bg-white border-b">
//         <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
//           <div className="flex flex-col md:flex-row items-start md:items-center justify-between">
//             <div className="flex items-center">
//               <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center text-white text-2xl font-bold">
//                 {seller.name.charAt(0)}
//               </div>
//               <div className="ml-4">
//                 <h1 className="text-2xl font-bold text-gray-900">{seller.name}</h1>
//                 <div className="flex items-center mt-1 text-sm text-gray-500">
//                   <Star className="w-4 h-4 text-yellow-400 fill-current" />
//                   <span className="ml-1">{seller.rating}</span>
//                   <span className="mx-2">•</span>
//                   <span>{seller.sales} {t('product.sales')}</span>
//                   <span className="mx-2">•</span>
//                   <span>{t('product.memberSince')} {seller.joinDate}</span>
//                 </div>
//               </div>
//             </div>
//             <div className="mt-4 md:mt-0 flex items-center space-x-4">
//               <button className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700">
//                 <MessageCircle className="w-4 h-4 mr-2" />
//                 {t('common.contactSeller')}
//               </button>
//               <div className="flex items-center text-sm text-gray-500">
//                 <MapPin className="w-4 h-4 mr-1" />
//                 {seller.location}
//               </div>
//             </div>
//           </div>
//         </div>
//       </div>

//       {/* Seller Stats */}
//       <div className="bg-blue-50 border-b">
//         <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
//           <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//             <div className="bg-white p-4 rounded-lg">
//               <div className="text-sm text-gray-500">{t('common.totalListings')}</div>
//               <div className="text-xl font-semibold mt-1">{seller.stats.totalListings}</div>
//             </div>
//             <div className="bg-white p-4 rounded-lg">
//               <div className="text-sm text-gray-500">{t('common.returnRate')}</div>
//               <div className="text-xl font-semibold mt-1">{seller.stats.returnRate}</div>
//             </div>
//           </div>
//         </div>
//       </div>

//       {/* Products Section */}
//       <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
//         {/* Filters and Search */}
//         <div className="mb-6 flex flex-col sm:flex-row gap-4">
//           <div className="flex-1 relative">
//             <input
//               type="text"
//               placeholder={t('common.searchInStore')}
//               className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
//             />
//             <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
//           </div>
//           <div className="flex space-x-4">
//             <button className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50">
//               <Filter className="h-5 w-5 mr-2 text-gray-400" />
//               {t('common.filters')}
//             </button>
//             <button className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50">
//               <SortDesc className="h-5 w-5 mr-2 text-gray-400" />
//               {t('common.sort')}
//               <ChevronDown className="h-4 w-4 ml-2" />
//             </button>
//           </div>
//         </div>

//         {/* Products Grid */}
//         <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
//           {sampleProducts.map((product) => (
//             <div key={product.id} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300">
//               <div className="relative">
//                 <img
//                   src={product.images[0]}
//                   alt={product.title}
//                   className="w-full h-48 object-cover"
//                 />
//                 {product.stock < 5 && (
//                   <span className="absolute top-2 right-2 px-2 py-1 bg-red-100 text-red-800 text-xs font-medium rounded-full">
//                     {t('common.lowStock')}
//                   </span>
//                 )}
//               </div>
//               <div className="p-4">
//                 <h3 className="text-lg font-semibold text-gray-900 mb-1">{product.title}</h3>
//                 <p className="text-sm text-gray-500 mb-2">OEM: {product.oemNumber}</p>
//                 <div className="flex items-center justify-between mb-2">
//                   <span className="text-lg font-bold text-blue-600">€{product.price}</span>
//                   <div className="flex items-center">
//                     <Star className="w-4 h-4 text-yellow-400 fill-current" />
//                     <span className="ml-1 text-sm text-gray-600">{product.rating}</span>
//                   </div>
//                 </div>
//                 <div className="flex items-center justify-between mb-4">
//                   <span className="text-sm text-gray-500">{product.condition}</span>
//                   <span className="text-sm text-gray-500">{t('common.stock')}: {product.stock}</span>
//                 </div>
//                 <button className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors duration-200">
//                   {t('common.viewDetails')}
//                 </button>
//               </div>
//             </div>
//           ))}
//         </div>
//       </div>
//     </div>
//   );
// };

// export default SellerStore;