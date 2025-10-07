/**
 * ГЛАВНЫЙ КАЛЬКУЛЯТОР CRM СИСТЕМЫ
 * 
 * Это основной и единственный калькулятор, который нужно использовать.
 * Все остальные калькуляторы являются алиасами для обратной совместимости.
 */

import { ImprovedPrintingCalculatorModal } from './ImprovedPrintingCalculatorModal';

export { ImprovedPrintingCalculatorModal as MainCalculator } from './ImprovedPrintingCalculatorModal';
export { ImprovedPrintingCalculatorModal as Calculator } from './ImprovedPrintingCalculatorModal';
export { ImprovedPrintingCalculatorModal as PricingCalculator } from './ImprovedPrintingCalculatorModal';

// Для обратной совместимости - все используют главный калькулятор
export { ImprovedPrintingCalculatorModal } from './ImprovedPrintingCalculatorModal';

export default ImprovedPrintingCalculatorModal;
