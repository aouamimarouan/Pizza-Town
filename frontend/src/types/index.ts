// Basic product types
export interface BaseProduct {
  id: string;
  name: string;
  description?: string;
  price: number;
  category: string;
  image?: string;
  popular?: boolean;
  vegetarian?: boolean;
}

// Pizza variants (Small, Medium, Large)
export interface PizzaVariant {
  id: string;
  name: string; // e.g. "Small", "Medium", "Large"
  priceModifier: number; // e.g. 0 for small, +2 for medium, +7 for large
}

export interface PizzaProduct extends BaseProduct {
  category: 'Pizzas' | 'Half-Half Pizzas';
  variants: PizzaVariant[];
}

// Deals Configuration
export interface DealStep {
  id: string;
  title: string; // e.g., "Choose 1 Large Pizza"
  category: string; // e.g., "Pizzas"
  requiredQuantity: number; // e.g., 1
  sizeConstraint?: string; // Optional: restrict to specific size, e.g., 'Large'
  isFixed?: boolean;
  fixedItems?: { name: string; quantity?: number; category?: string }[];
}

export interface DealConfiguration {
  steps: DealStep[];
}

export interface DealProduct extends BaseProduct {
  category: 'Menu Deals';
  configuration: DealConfiguration;
}

// Cart Items
export interface CartItemOption {
  productId: string;
  name: string;
  quantity: number;
  priceModifier?: number;
}

export interface DealCartItemSelection {
  stepId: string;
  product: BaseProduct;
  variant?: PizzaVariant;
  customizations?: any;
}

export interface CartItem {
  cartItemId: string; // Unique ID for cart instance
  productId: string;
  quantity: number;
  totalPrice: number;
  
  // For standard products or pizzas
  baseProduct: BaseProduct | PizzaProduct;
  selectedVariant?: PizzaVariant;
  customizations?: any; // e.g., crust, toppings
  
  // For deals
  dealSelections?: DealCartItemSelection[];
}
