// import React from 'react';
// import { Link } from 'react-router-dom';
// import { Tag, Timer, Percent } from 'lucide-react';

// const Deals = () => {
//   const deals = [
//     {
//       id: 1,
//       name: 'Performance Oil Filter Pack',
//       originalPrice: 89.99,
//       discountedPrice: 69.99,
//       image: 'https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?auto=format&fit=crop&q=80&w=500',
//       discountPercentage: 22,
//       endsIn: '2d 5h',
//     },
//     // Add more deals as needed
//   ];

//   return (
//     <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
//       <div className="flex justify-between items-center mb-8">
//         <div className="flex items-center">
//           <Tag className="w-8 h-8 text-blue-600 mr-3" />
//           <h1 className="text-3xl font-bold text-gray-900">Special Deals</h1>
//         </div>
//         <div className="flex items-center text-gray-500">
//           <Timer className="w-5 h-5 mr-2" />
//           <span>Limited time offers</span>
//         </div>
//       </div>

//       <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
//         {deals.map((deal) => (
//           <Link
//             key={deal.id}
//             to={`/products/${deal.id}`}
//             className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-xl transition-shadow duration-300"
//           >
//             <div className="relative">
//               <img
//                 src={deal.image}
//                 alt={deal.name}
//                 className="w-full h-48 object-cover"
//               />
//               <div className="absolute top-2 right-2 bg-red-600 text-white px-3 py-1 rounded-full flex items-center">
//                 <Percent className="w-4 h-4 mr-1" />
//                 {deal.discountPercentage}% OFF
//               </div>
//             </div>
//             <div className="p-4">
//               <h3 className="text-lg font-semibold text-gray-900 mb-2">{deal.name}</h3>
//               <div className="flex items-center justify-between mb-2">
//                 <div className="flex items-center space-x-2">
//                   <span className="text-xl font-bold text-blue-600">
//                     €{deal.discountedPrice}
//                   </span>
//                   <span className="text-sm text-gray-500 line-through">
//                     €{deal.originalPrice}
//                   </span>
//                 </div>
//                 <div className="flex items-center text-red-600">
//                   <Timer className="w-4 h-4 mr-1" />
//                   <span className="text-sm font-medium">Ends in {deal.endsIn}</span>
//                 </div>
//               </div>
//             </div>
//           </Link>
//         ))}
//       </div>
//     </div>
//   );
// };

// export default Deals;