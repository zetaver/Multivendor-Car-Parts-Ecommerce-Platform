interface Product {
  id: string;
  title: string;
  description: string;
  price: number;
  oldPrice?: number;
  discount?: number;
  condition: string;
  oemNumber: string;
  images: string[];
  rating: number;
  stock: number;
}

const sampleProducts = [
  {
    feature: "Ski Touring Shoes",
    products: [
      {
        id: "1",
        title: "Fischer Cross TS",
        description: "Touring shoes with great comfort and durability.",
        price: 80,
        condition: "Delivery possible",
        oemNumber: "ST5000-123",
        images: [
          "https://images.unsplash.com/photo-1580274455191-1c62238fa333?auto=format&fit=crop&q=80&w=500",
        ],
        rating: 4.5,
        stock: 10,
      },
      {
        id: "2",
        title: "Scott Celestial",
        description: "Premium touring shoes for advanced users.",
        price: 109,
        condition: "Delivery possible",
        oemNumber: "ST5001-234",
        images: [
          "https://images.unsplash.com/photo-1600712242805-5f78671b24da?auto=format&fit=crop&q=80&w=500",
        ],
        rating: 4.8,
        stock: 15,
      },

      {
        id: "3",
        title: "Scott Celestial",
        description: "Premium touring shoes for advanced users.",
        price: 109,
        condition: "Delivery possible",
        oemNumber: "ST5001-234",
        images: [
          "https://images.unsplash.com/photo-1600712242805-5f78671b24da?auto=format&fit=crop&q=80&w=500",
        ],
        rating: 4.8,
        stock: 15,
      },
    ],
  },
  {
    feature: "Touring Skis",
    products: [
      {
        id: "3",
        title: "Volkl Rise Above 88",
        description: "High-performance touring skis for professionals.",
        price: 650,
        condition: "Delivered to your home",
        oemNumber: "TS1000-789",
        images: [
          "https://images.unsplash.com/photo-1489824904134-891ab64532f1?auto=format&fit=crop&q=80&w=500",
        ],
        rating: 4.7,
        stock: 5,
      },
      {
        id: "4",
        title: "Scott Superguide",
        description: "Reliable skis for all terrains.",
        price: 280,
        condition: "Delivered to your home",
        oemNumber: "TS1001-567",
        images: [
          "https://images.unsplash.com/photo-1578844251758-2f71da64c96f?auto=format&fit=crop&q=80&w=500",
          "https://images.unsplash.com/photo-1578844251758-2f71da64c96f?auto=format&fit=crop&q=80&w=500",
        ],
        rating: 4.6,
        stock: 10,
      },
      {
        id: "5",
        title: "Volkl Rise Above 88",
        description: "High-performance touring skis for professionals.",
        price: 650,
        condition: "Delivered to your home",
        oemNumber: "TS1000-789",
        images: [
          "https://images.unsplash.com/photo-1489824904134-891ab64532f1?auto=format&fit=crop&q=80&w=500",
        ],
        rating: 4.7,
        stock: 5,
      },
      {
        id: "6",
        title: "Volkl Rise Above 88",
        description: "High-performance touring skis for professionals.",
        price: 650,
        condition: "Delivered to your home",
        oemNumber: "TS1000-789",
        images: [
          "https://images.unsplash.com/photo-1489824904134-891ab64532f1?auto=format&fit=crop&q=80&w=500",
        ],
        rating: 4.7,
        stock: 5,
      },
      {
        id: "7",
        title: "Volkl Rise Above 88",
        description: "High-performance touring skis for professionals.",
        price: 650,
        condition: "Delivered to your home",
        oemNumber: "TS1000-789",
        images: [
          "https://images.unsplash.com/photo-1489824904134-891ab64532f1?auto=format&fit=crop&q=80&w=500",
        ],
        rating: 4.7,
        stock: 5,
      },
    ],
  },
  {
    feature: "New Parts",
    products: [
      {
        id: "5",
        title: "Heavy Duty Car Battery",
        description: "Long-lasting car battery with high performance",
        price: 149.99,
        condition: "New",
        oemNumber: "BAT500-222",
        images: [
          "https://images.unsplash.com/photo-1504328345606-18bbc8c9d7d1?auto=format&fit=crop&q=80&w=500",
        ],
        rating: 4.9,
        stock: 12,
      },
      {
        id: "6",
        title: "Synthetic Motor Oil 5W-30",
        description: "Advanced synthetic motor oil for engine protection",
        price: 39.99,
        condition: "New",
        oemNumber: "OIL5W30-789",
        images: [
          "https://images.unsplash.com/photo-1580274455191-1c62238fa333?auto=format&fit=crop&q=80&w=500",
        ],
        rating: 4.7,
        stock: 30,
      },
      {
        id: "7",
        title: "Heavy Duty Car Battery",
        description: "Long-lasting car battery with high performance",
        price: 149.99,
        condition: "New",
        oemNumber: "BAT500-222",
        images: [
          "https://images.unsplash.com/photo-1504328345606-18bbc8c9d7d1?auto=format&fit=crop&q=80&w=500",
        ],
        rating: 4.9,
        stock: 12,
      },
      {
        id: "8",
        title: "Heavy Duty Car Battery",
        description: "Long-lasting car battery with high performance",
        price: 149.99,
        condition: "New",
        oemNumber: "BAT500-222",
        images: [
          "https://images.unsplash.com/photo-1504328345606-18bbc8c9d7d1?auto=format&fit=crop&q=80&w=500",
        ],
        rating: 4.9,
        stock: 12,
      },
      {
        id: "9",
        title: "Heavy Duty Car Battery",
        description: "Long-lasting car battery with high performance",
        price: 149.99,
        condition: "New",
        oemNumber: "BAT500-222",
        images: [
          "https://images.unsplash.com/photo-1504328345606-18bbc8c9d7d1?auto=format&fit=crop&q=80&w=500",
        ],
        rating: 4.9,
        stock: 12,
      },
    ],
  },
];


const allSampleProducts = [
  {
    id: '1',
    title: 'High Performance Engine Filter',
    description: 'Premium quality engine filter for superior filtration',
    price: 49.99,
    condition: 'New',
    oemNumber: 'TF2000X-123',
    images: ['https://images.unsplash.com/photo-1580274455191-1c62238fa333?auto=format&fit=crop&q=80&w=500'],
    rating: 4.5,
    stock: 10,
  },
  {
    id: '2',
    title: 'Premium Brake Pads Set',
    description: 'High-quality ceramic brake pads for optimal stopping power',
    price: 89.99,
    condition: 'New',
    oemNumber: 'BP4500-789',
    images: ['https://images.unsplash.com/photo-1600712242805-5f78671b24da?auto=format&fit=crop&q=80&w=500'],
    rating: 4.8,
    stock: 25,
  },
  {
    id: '3',
    title: 'LED Headlight Assembly',
    description: 'Bright and energy-efficient LED headlight assembly',
    price: 199.99,
    condition: 'New',
    oemNumber: 'HL7890-456',
    images: ['https://images.unsplash.com/photo-1489824904134-891ab64532f1?auto=format&fit=crop&q=80&w=500'],
    rating: 4.7,
    stock: 8,
  },
  {
    id: '4',
    title: 'All-Season Car Tires',
    description: 'Durable all-season tires for excellent traction',
    price: 129.99,
    condition: 'New',
    oemNumber: 'TIR3000-999',
    images: ['https://images.unsplash.com/photo-1578844251758-2f71da64c96f?auto=format&fit=crop&q=80&w=500'],
    rating: 4.6,
    stock: 15,
  },
  {
    id: '5',
    title: 'Heavy Duty Car Battery',
    description: 'Long-lasting car battery with high performance',
    price: 149.99,
    condition: 'New',
    oemNumber: 'BAT500-222',
    images: ['https://images.unsplash.com/photo-1504328345606-18bbc8c9d7d1?auto=format&fit=crop&q=80&w=500'],
    rating: 4.9,
    stock: 12,
  },
  {
    id: '6',
    title: 'Synthetic Motor Oil 5W-30',
    description: 'Advanced synthetic motor oil for engine protection',
    price: 39.99,
    condition: 'New',
    oemNumber: 'OIL5W30-789',
    images: ['https://images.unsplash.com/photo-1580274455191-1c62238fa333?auto=format&fit=crop&q=80&w=500'],
    rating: 4.7,
    stock: 30,
  },
  {
    id: '7',
    title: 'Car Air Filter',
    description: 'Efficient air filter to enhance engine performance',
    price: 24.99,
    condition: 'New',
    oemNumber: 'AF200X-567',
    images: ['https://images.unsplash.com/photo-1600712242805-5f78671b24da?auto=format&fit=crop&q=80&w=500'],
    rating: 4.5,
    stock: 20,
  },
  {
    id: '8',
    title: 'Performance Exhaust System',
    description: 'Enhanced exhaust system for better fuel efficiency',
    price: 299.99,
    condition: 'New',
    oemNumber: 'EX1000-333',
    images: ['https://images.unsplash.com/photo-1580274455191-1c62238fa333?auto=format&fit=crop&q=80&w=500'],
    rating: 4.8,
    stock: 5,
  },
  {
    id: '9',
    title: 'Shock Absorbers Set',
    description: 'High-performance shock absorbers for a smooth ride',
    price: 179.99,
    condition: 'New',
    oemNumber: 'SHOCK450-111',
    images: ['https://images.unsplash.com/photo-1511919884226-fd3cad34687c?auto=format&fit=crop&q=80&w=500'],
    rating: 4.6,
    stock: 18,
  },
  {
    id: '10',
    title: 'Radiator Cooling Fan',
    description: 'Efficient cooling fan for better engine temperature control',
    price: 99.99,
    condition: 'New',
    oemNumber: 'RADFAN600-222',
    images: ['https://images.unsplash.com/photo-1600712242805-5f78671b24da?auto=format&fit=crop&q=80&w=500'],
    rating: 4.7,
    stock: 10,
  },
  {
    id: '11',
    title: 'Brake Fluid',
    description: 'High-performance brake fluid for enhanced safety',
    price: 19.99,
    condition: 'New',
    oemNumber: 'BF890-555',
    images: ['https://images.unsplash.com/photo-1600712242805-5f78671b24da?auto=format&fit=crop&q=80&w=500'],
    rating: 4.3,
    stock: 35,
  },
  {
    id: '12',
    title: 'Interior Car Mat Set',
    description: 'Durable and stylish mats to protect your car interior',
    price: 59.99,
    condition: 'New',
    oemNumber: 'MATSET-001',
    images: ['https://images.unsplash.com/photo-1524182576060-3b524850d5a8?auto=format&fit=crop&q=80&w=500'],
    rating: 4.4,
    stock: 50,
  },
];


export { sampleProducts, allSampleProducts };
export default sampleProducts;