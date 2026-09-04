import SpecularButton from '../ui/SpecularButton';
import React, { useState, useEffect } from 'react';
import { Search, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import MenuCard from '../ui/MenuCard';
import ItemCustomizationModal from '../ui/ItemCustomizationModal';
import api from '../../services/api.js';

// Define the categories in order
const categories = ['Menu Deals', 'Starters', 'Pizzas', 'Pastas', 'Salads', 'Desserts', 'Drinks', 'Sauces'];

const categoryTranslationKeys = {
  'Menu Deals': 'catMenuDeals',
  'Starters': 'catStarters',
  'Pizzas': 'catPizzas',
  'Pastas': 'catPastas',
  'Salads': 'catSalads',
  'Desserts': 'catDesserts',
  'Drinks': 'catDrinks',
  'Sauces': 'catSauces'
};

const mapDbItemToCard = (item) => ({
  id: item.item_id,
  name: item.name,
  description: item.description,
  price: parseFloat(item.price),
  category: item.category,
  popular: false,
  vegetarian: false,
  image_url: item.image_url || null, // Will handle empty image in MenuCard
});

const MenuView = ({ handleAddToCart }) => {
  const { t } = useTranslation();
  const [activeCategory, setActiveCategory] = useState(categories[0]);
  const [searchQuery, setSearchQuery] = useState('');
  const [menuItems, setMenuItems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedItemForModal, setSelectedItemForModal] = useState(null);

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
  }, [t]);

  let displayedItems = [];
  let displayTitle = activeCategory;

  if (searchQuery.trim() === '') {
    displayedItems = menuItems
      .filter(item => item.category === activeCategory)
      .map(mapDbItemToCard);
  } else {
    displayTitle = t('menu.searchResults');
    displayedItems = menuItems
      .filter((item) => 
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
        (item.description && item.description.toLowerCase().includes(searchQuery.toLowerCase()))
      )
      .map(mapDbItemToCard);
  }

  return (
    <div className="w-full bg-paper min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 transition-colors">
        
        {/* Header */}
        <div className="mb-10 text-center md:text-left max-w-2xl">
          <h2 className="text-4xl font-bold font-display text-ink tracking-tight mb-2">{t('menu.title')}</h2>
          <p className="text-slate text-lg">{t('menu.subtitle')}</p>
        </div>

        {/* Global Search Bar */}
        <div className="mb-8 w-full max-w-md">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-slate" />
            </div>
            <input
              type="text"
              placeholder={t('menu.searchPlaceholder')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3 rounded-md border border-slate bg-paper text-ink focus:border-signal-red focus:ring-1 focus:ring-signal-red transition-colors outline-none font-sans"
            />
          </div>
        </div>

        {/* Horizontal Tab Bar Navigation (replacing vertical sidebar) */}
        {searchQuery.trim() === '' && (
          <div className="w-full mb-8 border-b border-mist overflow-x-auto custom-scrollbar sticky top-0 z-10 bg-paper/95 backdrop-blur-sm">
            <div className="flex space-x-8 min-w-max pb-px">
              {categories.map((category) => (
                <button
                  key={category}
                  onClick={() => setActiveCategory(category)}
                  className={`py-4 text-sm font-bold tracking-wide uppercase transition-colors relative whitespace-nowrap ${
                    activeCategory === category
                      ? 'text-ink'
                      : 'text-slate hover:text-ink'
                  }`}
                >
                  {t(`menu.${categoryTranslationKeys[category]}`)}
                  {/* Signal Red Underline for active tab */}
                  {activeCategory === category && (
                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-signal-red"></div>
                  )}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="mb-6 flex justify-between items-end">
          <h3 className="text-2xl font-bold font-display text-ink capitalize">
            {Object.keys(categoryTranslationKeys).includes(displayTitle) ? t(`menu.${categoryTranslationKeys[displayTitle]}`) : displayTitle}
          </h3>
          {!isLoading && searchQuery && (
            <span className="text-sm font-medium font-mono text-slate">
              {t('menu.foundResults', { count: displayedItems.length })}
            </span>
          )}
        </div>
        
        {/* Menu Grid */}
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 text-slate">
            <Loader2 className="w-10 h-10 animate-spin text-signal-red mb-4" />
            <p className="font-mono">{t('menu.loading')}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 pb-12">
            {displayedItems.map((item, index) => (
              <div key={item.id} className="h-full">
                <MenuCard 
                  item={item} 
                  handleAddToCart={handleAddToCart} 
                  openModal={() => setSelectedItemForModal(item)}
                  searchQuery={searchQuery}
                  priority={index < 4}
                />
              </div>
            ))}
            
            {/* Empty State when search finds nothing */}
            {displayedItems.length === 0 && (
              <div className="col-span-full py-16 text-center bg-mist rounded-md border border-slate">
                <Search className="h-8 w-8 text-slate mx-auto mb-4 opacity-50" />
                <p className="text-slate font-bold">{t('menu.noItems', { query: searchQuery })}</p>
                <button 
                  onClick={() => setSearchQuery('')}
                  className="mt-4 text-signal-red hover:underline text-sm font-bold"
                >
                  {t('menu.clearSearch')}
                </button>
              </div>
            )}
          </div>
        )}

        {/* Item Customization Modal */}
        {selectedItemForModal && (
          <ItemCustomizationModal 
            item={selectedItemForModal}
            allMenuItems={menuItems} // Pass all items for deals
            onClose={() => setSelectedItemForModal(null)}
            handleAddToCart={handleAddToCart}
          />
        )}
      </div>
    </div>
  );
};

export default MenuView;