import { useState, useMemo } from 'react';
import { DealProduct, DealStep, DealCartItemSelection, BaseProduct, PizzaVariant } from '../types';

export const useDealCustomizer = (deal: DealProduct) => {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  // Store selections mapping stepId -> Array of selections
  const [selections, setSelections] = useState<Record<string, DealCartItemSelection[]>>({});

  const steps = deal.configuration?.steps || [];
  const currentStep = steps[currentStepIndex];

  const selectItem = (product: BaseProduct, variant?: PizzaVariant, customizations?: any) => {
    if (!currentStep) return;

    setSelections((prev) => {
      const stepSelections = prev[currentStep.id] || [];
      
      // If we haven't reached the required quantity, add it
      if (stepSelections.length < currentStep.requiredQuantity) {
        return {
          ...prev,
          [currentStep.id]: [
            ...stepSelections,
            { stepId: currentStep.id, product, variant, customizations }
          ]
        };
      }
      return prev; // already reached max for this step
    });
  };

  const removeItem = (index: number) => {
    if (!currentStep) return;

    setSelections((prev) => {
      const stepSelections = prev[currentStep.id] || [];
      const newSelections = [...stepSelections];
      newSelections.splice(index, 1);
      
      return {
        ...prev,
        [currentStep.id]: newSelections
      };
    });
  };

  const getStepSelections = (stepId: string) => {
    return selections[stepId] || [];
  };

  const isCurrentStepComplete = useMemo(() => {
    if (!currentStep) return false;
    const stepSelections = getStepSelections(currentStep.id);
    return stepSelections.length === currentStep.requiredQuantity;
  }, [currentStep, selections]);

  const isDealComplete = useMemo(() => {
    return steps.every((step) => {
      const stepSelections = getStepSelections(step.id);
      return stepSelections.length === step.requiredQuantity;
    });
  }, [steps, selections]);

  const nextStep = () => {
    if (isCurrentStepComplete && currentStepIndex < steps.length - 1) {
      setCurrentStepIndex((prev) => prev + 1);
    }
  };

  const prevStep = () => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex((prev) => prev - 1);
    }
  };

  const generateCartItem = () => {
    if (!isDealComplete) return null;

    // Flatten all selections
    const allSelections = Object.values(selections).flat();

    return {
      cartItemId: `${deal.id}-${Date.now()}`,
      productId: deal.id,
      quantity: 1,
      totalPrice: deal.price, // Deal base price. We can add upgrades here if needed.
      baseProduct: deal,
      dealSelections: allSelections
    };
  };

  return {
    currentStepIndex,
    currentStep,
    steps,
    selections,
    isCurrentStepComplete,
    isDealComplete,
    selectItem,
    removeItem,
    nextStep,
    prevStep,
    getStepSelections,
    generateCartItem
  };
};
