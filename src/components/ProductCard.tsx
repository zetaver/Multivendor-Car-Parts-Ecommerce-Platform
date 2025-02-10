// Create a new ProductCard component for consistent styling
interface ProductCardProps {
  id: string;
  title: string;
  oemNumber: string;
  rating: number;
  price: number;
  image: string;
  onViewDetails: () => void;
}

const ProductCard = ({ id, title, oemNumber, rating, price, image, onViewDetails }: ProductCardProps) => {
  return (
    <div className="bg-white rounded-xl shadow-sm hover:shadow-md transition-all duration-300">
      <div className="aspect-square relative overflow-hidden rounded-t-xl">
        <img
          src={image}
          alt={title}
          className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
        />
      </div>
      
      <div className="p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-medium text-gray-500">
            OEM: {oemNumber}
          </span>
          <div className="flex items-center bg-chrome-light px-2 py-1 rounded-full">
            <span className="text-primary">★</span>
            <span className="ml-1 text-xs font-medium text-secondary">
              {rating}
            </span>
          </div>
        </div>

        <h3 className="text-secondary font-medium text-sm mb-3 line-clamp-2">
          {title}
        </h3>

        <div className="flex items-center justify-between">
          <span className="text-lg font-bold text-secondary">
            €{price}
          </span>
          <button
            onClick={onViewDetails}
            className="bg-primary text-secondary-dark px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary-dark transition-colors"
          >
            View Details
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProductCard; 