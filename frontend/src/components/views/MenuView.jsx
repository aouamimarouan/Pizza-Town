import React, { useState, useEffect } from 'react';
import { Search, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import MenuCard from '../ui/MenuCard';
import api from '../../services/api.js';

// Define the categories in order for the sidebar
const categories = ['Menu Deals', 'Starters', 'Pizzas', 'Pastas', 'Half-Half Pizzas', 'Salads', 'Desserts', 'Drinks'];

// 1. Premium Unsplash Curated Images mapping
const categoryImages = {
  'Menu Deals': 'https://images.unsplash.com/photo-1604382354936-07c5d9983bd3?q=80&w=800&auto=format&fit=crop',
  'Starters': 'https://images.unsplash.com/photo-1573140247632-f8fd74997d5c?q=80&w=800&auto=format&fit=crop',
  'Pizzas': 'https://images.unsplash.com/photo-1513104890138-7c749659a591?q=80&w=800&auto=format&fit=crop',
  'Pastas': 'https://images.unsplash.com/photo-1473093295043-cdd812d0e601?q=80&w=800&auto=format&fit=crop',
  'Half-Half Pizzas': 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?q=80&w=800&auto=format&fit=crop',
  'Salads': 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?q=80&w=800&auto=format&fit=crop',
  'Desserts': 'https://images.unsplash.com/photo-1571115177098-24ec42ed204d?q=80&w=800&auto=format&fit=crop',
  'Drinks': 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?q=80&w=800&auto=format&fit=crop',
};

// Helper to map DB item to Component format
const mapDbItemToCard = (item) => ({
  id: item.item_id,
  name: item.name,
  description: item.description,
  price: parseFloat(item.price),
  image: categoryImages[item.category] || categoryImages['Pizzas'], // fallback
  popular: false, // Could add to DB later if needed
  vegetarian: false, // Could add to DB later if needed
});

const MenuView = ({ handleAddToCart }) => {
  const [activeCategory, setActiveCategory] = useState(categories[0]);
  const [searchQuery, setSearchQuery] = useState('');
  const [menuItems, setMenuItems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch Menu from Backend
  useEffect(() => {
    const fetchMenu = async () => {
      setIsLoading(true);
      try {
        const res = await api.get('/menu');
        setMenuItems(res.data);
      } catch (err) {
        console.error(err);
        toast.error('Failed to load the menu. Please refresh.');
      } finally {
        setIsLoading(false);
      }
    };
    fetchMenu();
  }, []);

  // 3. Global Search & Categorization Logic
  let displayedItems = [];
  let displayTitle = activeCategory;

  if (searchQuery.trim() === '') {
    // If no search, show the active category
    displayedItems = menuItems
      .filter(item => item.category === activeCategory)
      .map(mapDbItemToCard);
  } else {
    // If searching, show "Search Results" and flatten all categories
    displayTitle = 'Search Results';
    displayedItems = menuItems
      .filter((item) => 
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
        (item.description && item.description.toLowerCase().includes(searchQuery.toLowerCase()))
      )
      .map(mapDbItemToCard);
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 transition-colors">
      
      <div className="mb-10 text-center md:text-left">
        <h2 className="text-3xl font-extrabold text-stone-900 dark:text-white tracking-tight">Our Menu</h2>
        <p className="text-stone-500 dark:text-stone-400 mt-2 text-lg">Authentic Italian recipes, baked to perfection.</p>
      </div>

      <div className="flex flex-col md:flex-row gap-8">
        
        {/* Sidebar Categories */}
        <aside className="w-full md:w-1/4">
          <div className="md:sticky md:top-28 space-y-2">
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => {
                  setActiveCategory(category);
                  setSearchQuery(''); // Clear search when clicking a new category
                }}
                className={`w-full text-left px-5 py-3.5 rounded-xl transition-all duration-200 font-semibold ${
                  activeCategory === category && searchQuery === ''
                    ? 'bg-red-600 text-white shadow-md shadow-red-900/20'
                    : 'bg-white dark:bg-stone-900 text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800 hover:text-stone-900 dark:hover:text-white border border-transparent dark:border-stone-800'
                }`}
              >
                {category}
              </button>
            ))}
          </div>
        </aside>

        {/* Menu Items Grid */}
        <main className="w-full md:w-3/4">

          {/* Global Search Bar */}
          <div className="mb-8 w-full">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-stone-400 dark:text-stone-500" />
              </div>
              <input
                type="text"
                placeholder="Search entire menu for pizzas, pastas..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-3.5 rounded-2xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 text-stone-900 dark:text-white focus:bg-white dark:focus:bg-stone-900 focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-colors shadow-sm outline-none"
              />
            </div>
          </div>

          <div className="mb-6 pb-4 border-b border-stone-200 dark:border-stone-800 flex justify-between items-end">
            <h3 className="text-2xl font-bold text-stone-900 dark:text-white capitalize">
              {displayTitle}
            </h3>
            {!isLoading && searchQuery && (
              <span className="text-sm font-medium text-stone-500 dark:text-stone-400">
                Found {displayedItems.length} result(s)
              </span>
            )}
          </div>
          
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-20 text-stone-500">
              <Loader2 className="w-10 h-10 animate-spin text-red-500 mb-4" />
              <p>Loading fresh menu items from the oven...</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pb-12">
              {displayedItems.map((item) => (
                <div key={item.id} className="h-full">
                  <MenuCard item={item} handleAddToCart={handleAddToCart} />
                </div>
              ))}
              
              {/* Empty State when search finds nothing */}
              {displayedItems.length === 0 && (
                <div className="col-span-1 lg:col-span-2 py-12 text-center bg-stone-50 dark:bg-stone-900/50 rounded-2xl border border-dashed border-stone-200 dark:border-stone-800">
                  <Search className="h-8 w-8 text-stone-300 dark:text-stone-600 mx-auto mb-3" />
                  <p className="text-stone-500 dark:text-stone-400 font-medium">No items found matching "{searchQuery}".</p>
                  <button 
                    onClick={() => setSearchQuery('')}
                    className="mt-4 text-red-600 dark:text-red-400 hover:underline text-sm font-medium"
                  >
                    Clear search
                  </button>
                </div>
              )}
            </div>
          )}
        </main>
        
      </div>
    </div>
  );
};

export default MenuView;