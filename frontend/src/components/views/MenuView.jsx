import React, { useState, useEffect } from 'react';
import { Search, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import MenuCard from '../ui/MenuCard';
import { PizzaCard } from '../ui/PizzaCard';
import ItemCustomizationModal from '../ui/ItemCustomizationModal';
import DealCustomizationModal from '../ui/DealCustomizationModal';
import api from '../../services/api.js';

// Define the categories in order for the sidebar
const categories = ['Menu Deals', 'Starters', 'Pizzas', 'Pastas', 'Half-Half Pizzas', 'Salads', 'Desserts', 'Drinks'];

const categoryTranslationKeys = {
  'Menu Deals': 'catMenuDeals',
  'Starters': 'catStarters',
  'Pizzas': 'catPizzas',
  'Pastas': 'catPastas',
  'Half-Half Pizzas': 'catHalfHalf',
  'Salads': 'catSalads',
  'Desserts': 'catDesserts',
  'Drinks': 'catDrinks'
};

// Map DB item to Component format
const mapDbItemToCard = (item) => {
  const isPizza = item.category === 'Pizzas' || item.category === 'Half-Half Pizzas';
  const isDeal = item.category === 'Menu Deals';

  return {
    id: item.item_id,
    name: item.name,
    description: item.description,
    price: isPizza ? 11.95 : parseFloat(item.price),
    category: item.category,
    popular: false,
    vegetarian: false,
    // Add variants for pizzas
    variants: isPizza ? [
      { id: 'small', name: 'Small', priceModifier: 0 },
      { id: 'medium', name: 'Medium ', priceModifier: 2.00 },
      { id: 'large', name: 'Large', priceModifier: 7.00 },
    ] : undefined,
    // Mock configuration for deals
    configuration: isDeal ? {
      steps: [
        { id: 'step1', title: 'Choose 1 Pizza', categoryConstraint: 'Pizzas', requiredQuantity: 1 },
        { id: 'step2', title: 'Choose 1 Starter', categoryConstraint: 'Starters', requiredQuantity: 1 },
        { id: 'step3', title: 'Choose 2 Drinks', categoryConstraint: 'Drinks', requiredQuantity: 2 }
      ]
    } : undefined
  };
};

const MenuView = ({ handleAddToCart }) => {
  const { t } = useTranslation();
  const [activeCategory, setActiveCategory] = useState(categories[0]);
  const [searchQuery, setSearchQuery] = useState('');
  const [menuItems, setMenuItems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedItemForModal, setSelectedItemForModal] = useState(null);

  // Fetch Menu from Backend
  useEffect(() => {
    const fetchMenu = async () => {
      setIsLoading(true);
      try {
        const res = await api.get('/menu');
        setMenuItems(res.data);
      } catch (err) {
        console.error(err);
        toast.error(t('menu.toastError'));
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
    displayTitle = t('menu.searchResults');
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
        <h2 className="text-3xl font-extrabold text-stone-900 dark:text-white tracking-tight">{t('menu.title')}</h2>
        <p className="text-stone-500 dark:text-stone-400 mt-2 text-lg">{t('menu.subtitle')}</p>
      </div>

      <div className="flex flex-col md:flex-row gap-8">
        
        {/* Sidebar Categories */}
        <aside className="w-full md:w-1/4">
          <div 
            className="md:sticky md:top-28 flex overflow-x-auto md:flex-col gap-3 md:gap-0 md:space-y-2 pb-2 md:pb-0"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            <style>{`
              aside div::-webkit-scrollbar { display: none; }
            `}</style>
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => {
                  setActiveCategory(category);
                  setSearchQuery(''); // Clear search when clicking a new category
                }}
                className={`flex-shrink-0 whitespace-nowrap w-auto md:w-full text-left px-5 py-3.5 rounded-xl transition-all duration-200 font-semibold ${
                  activeCategory === category && searchQuery === ''
                    ? 'bg-red-600 text-white shadow-md shadow-red-900/20'
                    : 'bg-white dark:bg-stone-900 text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800 hover:text-stone-900 dark:hover:text-white border border-transparent dark:border-stone-800'
                }`}
              >
                {t(`menu.${categoryTranslationKeys[category]}`)}
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
                placeholder={t('menu.searchPlaceholder')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-3.5 rounded-2xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 text-stone-900 dark:text-white focus:bg-white dark:focus:bg-stone-900 focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-colors shadow-sm outline-none"
              />
            </div>
          </div>

          <div className="mb-6 pb-4 border-b border-stone-200 dark:border-stone-800 flex justify-between items-end">
            <h3 className="text-2xl font-bold text-stone-900 dark:text-white capitalize">
              {Object.keys(categoryTranslationKeys).includes(displayTitle) ? t(`menu.${categoryTranslationKeys[displayTitle]}`) : displayTitle}
            </h3>
            {!isLoading && searchQuery && (
              <span className="text-sm font-medium text-stone-500 dark:text-stone-400">
                {t('menu.foundResults', { count: displayedItems.length })}
              </span>
            )}
          </div>
          
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-20 text-stone-500">
              <Loader2 className="w-10 h-10 animate-spin text-red-500 mb-4" />
              <p>{t('menu.loading')}</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pb-12">
              {displayedItems.map((item) => {
                const isPizza = item.category === 'Pizzas' || item.category === 'Half-Half Pizzas';
                return (
                  <div key={item.id} className="h-full">
                    {isPizza ? (
                      <PizzaCard 
                        item={item} 
                        handleAddToCart={handleAddToCart}
                        openModal={(itemToOpen) => setSelectedItemForModal(itemToOpen)}
                      />
                    ) : (
                      <MenuCard 
                        item={item} 
                        handleAddToCart={handleAddToCart} 
                        openModal={() => setSelectedItemForModal(item)}
                      />
                    )}
                  </div>
                );
              })}
              
              {/* Empty State when search finds nothing */}
              {displayedItems.length === 0 && (
                <div className="col-span-1 lg:col-span-2 py-12 text-center bg-stone-50 dark:bg-stone-900/50 rounded-2xl border border-dashed border-stone-200 dark:border-stone-800">
                  <Search className="h-8 w-8 text-stone-300 dark:text-stone-600 mx-auto mb-3" />
                  <p className="text-stone-500 dark:text-stone-400 font-medium">{t('menu.noItems', { query: searchQuery })}</p>
                  <button 
                    onClick={() => setSearchQuery('')}
                    className="mt-4 text-red-600 dark:text-red-400 hover:underline text-sm font-medium"
                  >
                    {t('menu.clearSearch')}
                  </button>
                </div>
              )}
            </div>
          )}
        </main>
        
      </div>

      {/* Modals Handling */}
      {selectedItemForModal && (
        selectedItemForModal.category === 'Menu Deals' ? (
          <DealCustomizationModal 
            deal={selectedItemForModal}
            availableProducts={menuItems.map(mapDbItemToCard)} // Pass flattened list for steps
            onClose={() => setSelectedItemForModal(null)}
            handleAddToCart={handleAddToCart}
          />
        ) : (
          <ItemCustomizationModal 
            item={selectedItemForModal}
            onClose={() => setSelectedItemForModal(null)}
            handleAddToCart={handleAddToCart}
          />
        )
      )}
    </div>
  );
};

export default MenuView;