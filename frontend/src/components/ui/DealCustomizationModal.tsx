import React, { useState } from 'react';
import { X, Check, ArrowRight, ArrowLeft, ShoppingBag } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useDealCustomizer } from '../../hooks/useDealCustomizer';
import { DealProduct, BaseProduct } from '../../types';

interface DealCustomizationModalProps {
  deal: DealProduct;
  availableProducts: BaseProduct[]; // Mock data passed from parent
  onClose: () => void;
  handleAddToCart: (item: any) => void;
}

export const DealCustomizationModal: React.FC<DealCustomizationModalProps> = ({ 
  deal, 
  availableProducts,
  onClose, 
  handleAddToCart 
}) => {
  const { t } = useTranslation();
  const customizer = useDealCustomizer(deal);

  // Filter products for the current step (STRICT CATEGORY FILTERING)
  const currentStepProducts = customizer.currentStep?.isFixed
    ? []
    : availableProducts.filter((p) => p.category === customizer.currentStep?.category);

  const handleConfirm = () => {
    const cartItem = customizer.generateCartItem();
    if (cartItem) {
      handleAddToCart(cartItem);
      onClose();
    }
  };

  if (!customizer.currentStep) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-stone-950 w-full max-w-4xl max-h-[90vh] rounded-3xl shadow-2xl overflow-hidden flex flex-col border border-stone-800 animate-in zoom-in-95 duration-300">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-stone-800 flex justify-between items-center bg-stone-900/50">
          <div>
            <h2 className="text-xl font-bold text-white">{deal.name}</h2>
            {(!customizer.steps || !customizer.steps[0]?.isFixed || customizer.steps.length > 1) && (
              <p className="text-sm text-stone-400">
                {t('dealModal.stepProgress', 'Step {{current}} of {{total}}', { 
                  current: customizer.currentStepIndex + 1, 
                  total: customizer.steps.length 
                })} - {customizer.currentStep.title}
              </p>
            )}
          </div>
          <button 
            onClick={onClose}
            className="p-2 rounded-full hover:bg-stone-800 text-stone-400 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Progress Bar */}
        {(!customizer.steps || !customizer.steps[0]?.isFixed || customizer.steps.length > 1) && (
          <div className="flex h-1.5 bg-stone-900 w-full">
            {customizer.steps.map((step, idx) => (
              <div 
                key={step.id} 
                className={`h-full transition-all duration-300 ${
                  idx <= customizer.currentStepIndex ? 'bg-red-600' : 'bg-transparent'
                }`}
                style={{ width: `${100 / customizer.steps.length}%` }}
              />
            ))}
          </div>
        )}

        {/* Scrollable Content */}
        <div className="flex-grow overflow-y-auto p-6 space-y-6 custom-scrollbar bg-stone-950">
          <div className="flex justify-between items-end mb-6">
            <h3 className="text-2xl font-bold text-white tracking-tight">
              {customizer.currentStep.title}
            </h3>
            {!customizer.currentStep.isFixed && (
              <span className="text-sm text-stone-400">
                {t('dealModal.selectX', 'Select {{req}}', { req: customizer.currentStep.requiredQuantity })}
              </span>
            )}
          </div>

          {customizer.currentStep.isFixed ? (
            <div className="bg-stone-900 border border-stone-800 rounded-2xl p-6 text-center space-y-4">
              <h4 className="text-lg font-bold text-white mb-4">Included in this Deal:</h4>
              <ul className="space-y-3 inline-block text-left mx-auto">
                {customizer.currentStep.fixedItems?.map((item, idx) => (
                  <li key={idx} className="flex items-center text-stone-300 gap-3 text-lg">
                    <Check className="w-5 h-5 text-emerald-500" />
                    {item.name}
                  </li>
                ))}
              </ul>
              <div className="mt-8 pt-6 border-t border-stone-800 text-stone-400 text-sm">
                These items are grouped and pre-selected. Click Add to Cart to confirm.
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {currentStepProducts.map((product) => {
              const stepSelections = customizer.getStepSelections(customizer.currentStep!.id);
              const isSelected = stepSelections.some(s => s.product.id === product.id);
              const canSelectMore = stepSelections.length < customizer.currentStep!.requiredQuantity;

              return (
                <div
                  key={product.id}
                  onClick={() => {
                    if (isSelected) {
                      const idx = stepSelections.findIndex(s => s.product.id === product.id);
                      if (idx !== -1) customizer.removeItem(idx);
                    } else if (canSelectMore) {
                      let variantToSelect = undefined;
                      const pizzaProduct = product as any;
                      if (customizer.currentStep?.sizeConstraint && pizzaProduct.variants) {
                        variantToSelect = pizzaProduct.variants.find((v: any) => v.id === customizer.currentStep?.sizeConstraint);
                      }
                      customizer.selectItem(product, variantToSelect);
                    }
                  }}
                  className={`relative p-4 rounded-2xl border-2 transition-all duration-200 cursor-pointer flex flex-col justify-between min-h-[140px] ${
                    isSelected
                      ? 'border-red-500 bg-red-900/10'
                      : canSelectMore 
                        ? 'border-stone-800 bg-stone-900 hover:border-stone-600 hover:bg-stone-800'
                        : 'border-stone-800 bg-stone-900/50 opacity-50 cursor-not-allowed'
                  }`}
                >
                  {isSelected && (
                    <div className="absolute top-3 right-3 bg-red-500 text-white p-1 rounded-full">
                      <Check className="w-3 h-3" />
                    </div>
                  )}
                  <div>
                    <h4 className={`font-bold ${isSelected ? 'text-white' : 'text-stone-200'}`}>
                      {product.name}
                    </h4>
                    {product.description && (
                      <p className="text-xs text-stone-400 mt-1 line-clamp-2">
                        {product.description}
                      </p>
                    )}
                  </div>
                  {product.price > 0 && (
                    <div className="mt-3 font-semibold text-sm text-amber-500">
                      Standard: €{product.price.toFixed(2)}
                    </div>
                  )}
                </div>
              );
            })}
            </div>
          )}
        </div>

        {/* Footer / Action */}
        <div className="p-6 border-t border-stone-800 bg-stone-900/50 flex items-center justify-between">
          <div className="font-bold text-lg text-white">
            Total: €{deal.price.toFixed(2)}
          </div>
          
          <div className="flex gap-3">
            {customizer.currentStepIndex > 0 && (
              <button
                onClick={customizer.prevStep}
                className="flex items-center justify-center p-3 sm:px-6 rounded-xl border border-stone-700 text-stone-300 hover:bg-stone-800 transition-colors"
              >
                <ArrowLeft className="w-5 h-5 sm:mr-2" />
                <span className="hidden sm:block">{t('dealModal.back', 'Back')}</span>
              </button>
            )}

            {!customizer.isDealComplete ? (
               <button
                 onClick={customizer.nextStep}
                 disabled={!customizer.isCurrentStepComplete}
                 className={`flex items-center justify-center p-3 px-6 rounded-xl font-bold transition-all ${
                   customizer.isCurrentStepComplete
                     ? 'bg-red-600 hover:bg-red-700 text-white shadow-lg shadow-red-600/20'
                     : 'bg-stone-800 text-stone-500 cursor-not-allowed'
                 }`}
               >
                 <span>{t('dealModal.next', 'Next Step')}</span>
                 <ArrowRight className="w-5 h-5 ml-2" />
               </button>
            ) : (
              <button
                onClick={handleConfirm}
                className="flex items-center justify-center p-3 px-8 rounded-xl font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-600/20 transition-all"
              >
                <ShoppingBag className="w-5 h-5 mr-2" />
                <span>{t('dealModal.addToCart', 'Add to Cart')}</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DealCustomizationModal;
