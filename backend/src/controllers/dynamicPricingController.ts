import { Request, Response } from 'express';
import { asyncHandler } from '../middleware/asyncHandler';
import { DynamicPricingService } from '../services/dynamicPricingService';
import { logger } from '../utils/logger';

export class DynamicPricingController {
  // Получение минимальных стоимостей заказов
  static getMinimumOrderCosts = asyncHandler(async (req: Request, res: Response) => {
    try {
      const costs = await DynamicPricingService.getMinimumOrderCosts();
      res.json({
        success: true,
        data: costs
      });
    } catch (error: any) {
      logger.error('Ошибка получения минимальных стоимостей заказов', error);
      res.status(500).json({
        success: false,
        error: 'Ошибка получения минимальных стоимостей заказов',
        details: error.message
      });
    }
  });

  // Получение минимальной стоимости для конкретного заказа
  static getMinimumCostForOrder = asyncHandler(async (req: Request, res: Response) => {
    try {
      const { format, productType, quantity } = req.query;
      
      if (!format || !productType || !quantity) {
        res.status(400).json({
          success: false,
          error: 'Необходимы параметры: format, productType, quantity'
        });
        return;
      }

      const cost = await DynamicPricingService.getMinimumCostForOrder(
        format as string,
        productType as string,
        parseInt(quantity as string)
      );

      res.json({
        success: true,
        data: cost
      });
    } catch (error: any) {
      logger.error('Ошибка получения минимальной стоимости заказа', error);
      res.status(500).json({
        success: false,
        error: 'Ошибка получения минимальной стоимости заказа',
        details: error.message
      });
    }
  });

  // Получение базовых цен продуктов
  static getProductBasePrices = asyncHandler(async (req: Request, res: Response) => {
    try {
      const { productType, format, urgency } = req.query;
      
      const filters: any = {};
      if (productType) filters.productType = productType;
      if (format) filters.format = format;
      if (urgency) filters.urgency = urgency;

      const prices = await DynamicPricingService.getProductBasePrices(filters);
      res.json({
        success: true,
        data: prices
      });
    } catch (error: any) {
      logger.error('Ошибка получения базовых цен продуктов', error);
      res.status(500).json({
        success: false,
        error: 'Ошибка получения базовых цен продуктов',
        details: error.message
      });
    }
  });

  // Получение цен на материалы
  static getMaterialPrices = asyncHandler(async (req: Request, res: Response) => {
    try {
      const prices = await DynamicPricingService.getMaterialPrices();
      res.json({
        success: true,
        data: prices
      });
    } catch (error: any) {
      logger.error('Ошибка получения цен на материалы', error);
      res.status(500).json({
        success: false,
        error: 'Ошибка получения цен на материалы',
        details: error.message
      });
    }
  });

  // Получение цен на услуги
  static getServicePrices = asyncHandler(async (req: Request, res: Response) => {
    try {
      const prices = await DynamicPricingService.getServicePrices();
      res.json({
        success: true,
        data: prices
      });
    } catch (error: any) {
      logger.error('Ошибка получения цен на услуги', error);
      res.status(500).json({
        success: false,
        error: 'Ошибка получения цен на услуги',
        details: error.message
      });
    }
  });

  // Получение коэффициентов ценообразования
  static getPricingMultipliers = asyncHandler(async (req: Request, res: Response) => {
    try {
      const { multiplierType } = req.query;
      const multipliers = await DynamicPricingService.getPricingMultipliers(
        multiplierType as string
      );
      res.json({
        success: true,
        data: multipliers
      });
    } catch (error: any) {
      logger.error('Ошибка получения коэффициентов ценообразования', error);
      res.status(500).json({
        success: false,
        error: 'Ошибка получения коэффициентов ценообразования',
        details: error.message
      });
    }
  });

  // Получение правил скидок
  static getDiscountRules = asyncHandler(async (req: Request, res: Response) => {
    try {
      const { discountType } = req.query;
      const rules = await DynamicPricingService.getDiscountRules(
        discountType as string
      );
      res.json({
        success: true,
        data: rules
      });
    } catch (error: any) {
      logger.error('Ошибка получения правил скидок', error);
      res.status(500).json({
        success: false,
        error: 'Ошибка получения правил скидок',
        details: error.message
      });
    }
  });

  // Получение конфигурации ИИ-модели
  static getAIModelConfig = asyncHandler(async (req: Request, res: Response) => {
    try {
      const { modelName } = req.query;
      const config = await DynamicPricingService.getAIModelConfig(
        modelName as string
      );
      res.json({
        success: true,
        data: config
      });
    } catch (error: any) {
      logger.error('Ошибка получения конфигурации ИИ-модели', error);
      res.status(500).json({
        success: false,
        error: 'Ошибка получения конфигурации ИИ-модели',
        details: error.message
      });
    }
  });

  // Обновление минимальной стоимости заказа
  static updateMinimumOrderCost = asyncHandler(async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const updates = req.body;

      const success = await DynamicPricingService.updateMinimumOrderCost(
        parseInt(id),
        updates
      );

      if (success) {
        res.json({
          success: true,
          message: 'Минимальная стоимость заказа обновлена'
        });
      } else {
        res.status(404).json({
          success: false,
          error: 'Минимальная стоимость заказа не найдена'
        });
      }
    } catch (error: any) {
      logger.error('Ошибка обновления минимальной стоимости заказа', error);
      res.status(500).json({
        success: false,
        error: 'Ошибка обновления минимальной стоимости заказа',
        details: error.message
      });
    }
  });

  // Обновление базовой цены продукта
  static updateProductBasePrice = asyncHandler(async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const updates = req.body;

      const success = await DynamicPricingService.updateProductBasePrice(
        parseInt(id),
        updates
      );

      if (success) {
        res.json({
          success: true,
          message: 'Базовая цена продукта обновлена'
        });
      } else {
        res.status(404).json({
          success: false,
          error: 'Базовая цена продукта не найдена'
        });
      }
    } catch (error: any) {
      logger.error('Ошибка обновления базовой цены продукта', error);
      res.status(500).json({
        success: false,
        error: 'Ошибка обновления базовой цены продукта',
        details: error.message
      });
    }
  });

  // Обновление цены материала
  static updateMaterialPrice = asyncHandler(async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const updates = req.body;

      const success = await DynamicPricingService.updateMaterialPrice(
        parseInt(id),
        updates
      );

      if (success) {
        res.json({
          success: true,
          message: 'Цена материала обновлена'
        });
      } else {
        res.status(404).json({
          success: false,
          error: 'Цена материала не найдена'
        });
      }
    } catch (error: any) {
      logger.error('Ошибка обновления цены материала', error);
      res.status(500).json({
        success: false,
        error: 'Ошибка обновления цены материала',
        details: error.message
      });
    }
  });

  // Обновление цены услуги
  static updateServicePrice = asyncHandler(async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const updates = req.body;

      const success = await DynamicPricingService.updateServicePrice(
        parseInt(id),
        updates
      );

      if (success) {
        res.json({
          success: true,
          message: 'Цена услуги обновлена'
        });
      } else {
        res.status(404).json({
          success: false,
          error: 'Цена услуги не найдена'
        });
      }
    } catch (error: any) {
      logger.error('Ошибка обновления цены услуги', error);
      res.status(500).json({
        success: false,
        error: 'Ошибка обновления цены услуги',
        details: error.message
      });
    }
  });

  // Обновление коэффициента ценообразования
  static updatePricingMultiplier = asyncHandler(async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const updates = req.body;

      const success = await DynamicPricingService.updatePricingMultiplier(
        parseInt(id),
        updates
      );

      if (success) {
        res.json({
          success: true,
          message: 'Коэффициент ценообразования обновлен'
        });
      } else {
        res.status(404).json({
          success: false,
          error: 'Коэффициент ценообразования не найден'
        });
      }
    } catch (error: any) {
      logger.error('Ошибка обновления коэффициента ценообразования', error);
      res.status(500).json({
        success: false,
        error: 'Ошибка обновления коэффициента ценообразования',
        details: error.message
      });
    }
  });

  // Обновление правила скидки
  static updateDiscountRule = asyncHandler(async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const updates = req.body;

      const success = await DynamicPricingService.updateDiscountRule(
        parseInt(id),
        updates
      );

      if (success) {
        res.json({
          success: true,
          message: 'Правило скидки обновлено'
        });
      } else {
        res.status(404).json({
          success: false,
          error: 'Правило скидки не найдено'
        });
      }
    } catch (error: any) {
      logger.error('Ошибка обновления правила скидки', error);
      res.status(500).json({
        success: false,
        error: 'Ошибка обновления правила скидки',
        details: error.message
      });
    }
  });

  // Обновление конфигурации ИИ-модели
  static updateAIModelConfig = asyncHandler(async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const updates = req.body;

      const success = await DynamicPricingService.updateAIModelConfig(
        parseInt(id),
        updates
      );

      if (success) {
        res.json({
          success: true,
          message: 'Конфигурация ИИ-модели обновлена'
        });
      } else {
        res.status(404).json({
          success: false,
          error: 'Конфигурация ИИ-модели не найдена'
        });
      }
    } catch (error: any) {
      logger.error('Ошибка обновления конфигурации ИИ-модели', error);
      res.status(500).json({
        success: false,
        error: 'Ошибка обновления конфигурации ИИ-модели',
        details: error.message
      });
    }
  });

  // Экспорт всех данных ценообразования
  static exportPricingData = asyncHandler(async (req: Request, res: Response) => {
    try {
      const data = await DynamicPricingService.exportPricingData();
      res.json({
        success: true,
        data
      });
    } catch (error: any) {
      logger.error('Ошибка экспорта данных ценообразования', error);
      res.status(500).json({
        success: false,
        error: 'Ошибка экспорта данных ценообразования',
        details: error.message
      });
    }
  });
}

