import axios from 'axios';
import { Order, Item, PresetCategory, MaterialRow, Material, DailyReport, UserRef, OrderFile, Printer } from './types';
const api = axios.create({ baseURL: '/api' });

// 🆕 Экспортируем api для использования в других компонентах
export { api };

// Attach auth token from localStorage for protected endpoints
api.interceptors.request.use((config) => {
  try {
    const token = localStorage.getItem('crmToken');
    if (token) {
      config.headers = {
        ...(config.headers || {}),
        Authorization: `Bearer ${token}`
      } as any;
    }
  } catch {}
  return config;
});

// Handle API errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API Error:', error);
    if (error.response) {
      // Server responded with error status
      const message = error.response.data?.message || error.response.statusText || 'Ошибка сервера';
      throw new Error(`${error.response.status}: ${message}`);
    } else if (error.request) {
      // Request was made but no response received
      throw new Error('Нет ответа от сервера');
    } else {
      // Something else happened
      throw new Error(error.message || 'Неизвестная ошибка');
    }
  }
);

export function setAuthToken(token?: string) {
  if (token) localStorage.setItem('crmToken', token);
  else localStorage.removeItem('crmToken');
}

export const getOrders = () => api.get<Order[]>('/orders');
export const createOrder = (date?: string) => api.post<Order>('/orders', { date });
export const updateOrderStatus = (id: number, status: number) =>
  api.put<Order>(`/orders/${id}/status`, { status });

export const addOrderItem = (id: number, item: Omit<Item, 'id'>) =>
  api.post<Item>(`/orders/${id}/items`, item);

export const deleteOrder = (id: number) => api.delete(`/orders/${id}`);
export const deleteOrderItem = (orderId: number, itemId: number) =>
  api.delete(`/orders/${orderId}/items/${itemId}`);
export const updateOrderItem = (orderId: number, itemId: number, data: Partial<Item>) =>
  api.patch(`/orders/${orderId}/items/${itemId}`, data);

export const getMaterials = () => api.get<Material[]>('/materials');
export const saveMaterial = (mat: Partial<Material>) =>
  api.post<Material[]>('/materials', mat);

// Paper Types API
export const getPaperTypes = () => {
  // Используем кэширование для типов бумаги
  const cacheKey = 'paper-types';
  const cached = localStorage.getItem(cacheKey);
  if (cached) {
    const { data, timestamp } = JSON.parse(cached);
    // Кэш на 10 минут
    if (Date.now() - timestamp < 600000) {
      return Promise.resolve({ data });
    }
  }
  
  return api.get('/paper-types').then(response => {
    // Сохраняем в кэш
    localStorage.setItem(cacheKey, JSON.stringify({
      data: response.data,
      timestamp: Date.now()
    }));
    return response;
  });
};
export const createPaperType = (paperType: any) => api.post('/paper-types', paperType);
export const updatePaperType = (id: number, paperType: any) => api.put(`/paper-types/${id}`, paperType);
export const deletePaperType = (id: number) => api.delete(`/paper-types/${id}`);
export const addPrintingPrice = (priceData: any) => api.post('/paper-types/prices', priceData);
export const deletePrintingPrice = (id: number) => api.delete(`/paper-types/prices/${id}`);
export const findPaperTypeByMaterial = (materialName: string) => 
  api.get(`/paper-types/find/by-material?materialName=${encodeURIComponent(materialName)}`);
export const getPrintingPrice = (paperTypeId: number, density: number) => 
  api.get(`/paper-types/prices/lookup?paper_type_id=${paperTypeId}&density=${density}`);
export const deleteMaterial = (id: number) => api.delete(`/materials/${id}`);
export const spendMaterial = (payload: { materialId: number; delta: number; reason?: string; orderId?: number }) => api.post<Material>('/materials/spend', payload);
export const getMaterialMoves = (params?: { materialId?: number; orderId?: number; user_id?: number; from?: string; to?: string }) =>
  api.get('/materials/moves', { params });
export const getLowStock = () => api.get<Material[]>('/materials/low-stock');
export const getMaterialTop = (params?: { from?: string; to?: string; limit?: number }) => api.get('/materials/report/top', { params });
export const getMaterialForecast = () => api.get('/materials/report/forecast');

export const getProductMaterials = (cat: string, desc: string) =>
  api.get<MaterialRow[]>(`/product-materials/${encodeURIComponent(cat)}/${encodeURIComponent(desc)}`);
export const saveProductMaterials = (cfg: {
  presetCategory: string;
  presetDescription: string;
  materials: { materialId: number; qtyPerItem: number }[];
}) => api.post('/product-materials', cfg);
export const getDailyReports = (params?: { user_id?: number | ''; from?: string; to?: string; current_user_id?: number }) =>
  api.get<DailyReport[]>('/daily-reports', { params });

export const getCurrentUser = () => api.get<{ id: number; name: string; role: string }>('/auth/me');

export const deleteDailyReport = (reportId: number) => api.delete(`/daily-reports/${reportId}`);

// Получение полного отчёта с заказами
export const getFullDailyReport = (reportDate: string, userId?: number) => 
  api.get<DailyReport>(`/daily-reports/full/${reportDate}${userId ? `?user_id=${userId}` : ''}`);

// Сохранение полного отчёта
export const saveFullDailyReport = (report: DailyReport) => 
  api.post<DailyReport>('/daily-reports/full', report);

// Дублирование заказа
export const duplicateOrder = (orderId: number) => 
  api.post<Order>(`/orders/${orderId}/duplicate`);

export const getDailyReportByDate = (date: string) =>
  api.get<DailyReport>(`/daily-reports/${date}`);
export const updateDailyReport = (date: string, data: {
  orders_count?: number;
  total_revenue?: number;
}) =>
  api.patch<DailyReport>(`/daily-reports/${date}`, data);

export const getPresets = () => api.get<PresetCategory[]>('/presets');
export const getUsers = () => api.get<UserRef[]>('/users');
export const createDailyReport = (data: { report_date: string; user_id?: number; orders_count?: number; total_revenue?: number }) =>
  api.post<DailyReport>('/daily-reports', data);

export const getOrderStatuses = () => api.get<Array<{ id: number; name: string; color?: string; sort_order: number }>>('/order-statuses');

// Files API
export const listOrderFiles = (orderId: number) => api.get<OrderFile[]>(`/orders/${orderId}/files`);
export const uploadOrderFile = (orderId: number, file: File) => {
  const fd = new FormData();
  fd.append('file', file);
  return api.post<OrderFile>(`/orders/${orderId}/files`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
};
export const deleteOrderFile = (orderId: number, fileId: number) => api.delete(`/orders/${orderId}/files/${fileId}`);
export const approveOrderFile = (orderId: number, fileId: number) => api.post<OrderFile>(`/orders/${orderId}/files/${fileId}/approve`, {});

// Payments / Prepayment
export const createPrepaymentLink = (orderId: number, amount?: number, paymentMethod: 'online' | 'offline' = 'online') => 
  api.post<Order>(`/orders/${orderId}/prepay`, { amount, paymentMethod });

// Pricing API
export const getPricingPolicy = () => api.get('/pricing/policy');
export const calculateProductPrice = (params: any) => api.post('/pricing/calculate', params);
export const getBasePrices = () => api.get('/pricing/base-prices');
export const getPricingMultipliers = () => api.get('/pricing/multipliers');
export const getVolumeDiscounts = () => api.get('/pricing/volume-discounts');
export const getLoyaltyDiscounts = () => api.get('/pricing/loyalty-discounts');

// Printers
export const getPrinters = () => api.get<Printer[]>('/printers');
export const submitPrinterCounter = (printerId: number, data: { counter_date: string; value: number }) => api.post(`/printers/${printerId}/counters`, data);
export const getPrinterCountersByDate = (date: string) => api.get(`/printers/counters`, { params: { date } });
export const getDailySummary = (date: string) => api.get(`/reports/daily/${date}/summary`);

// Calculators (MVP)
export const getFlyersSchema = () => api.get('/calculators/flyers-color');
export const calcFlyersPrice = (payload: { format: 'A6'|'A5'|'A4'; qty: number; sides: 1|2; paperDensity?: 130|150; lamination?: 'none'|'matte'|'glossy' }) =>
  api.post('/calculators/flyers-color/price', payload);

// Enhanced Calculator with Pricing Policy
export const getEnhancedProductTypes = () => api.get('/enhanced-calculator/product-types');
export const getEnhancedPricingPolicy = () => api.get('/enhanced-calculator/pricing-policy');
export const calcEnhancedFlyersPrice = (payload: { 
  format: 'A6'|'A5'|'A4'; 
  qty: number; 
  sides: 1|2; 
  paperDensity?: 130|150; 
  lamination?: 'none'|'matte'|'glossy';
  priceType?: 'rush'|'online'|'promo';
  customerType?: 'regular'|'vip';
}) => api.post('/enhanced-calculator/flyers', payload);

export const calcEnhancedBusinessCardsPrice = (payload: {
  qty: number;
  lamination?: 'none'|'matte'|'glossy';
  magnetic?: boolean;
  priceType?: 'rush'|'online'|'promo';
  customerType?: 'regular'|'vip';
}) => api.post('/enhanced-calculator/business-cards', payload);

export const calcEnhancedBookletsPrice = (payload: {
  format: 'A4'|'A5';
  pages: number;
  qty: number;
  priceType?: 'rush'|'online'|'promo';
  customerType?: 'regular'|'vip';
}) => api.post('/enhanced-calculator/booklets', payload);

export const calcUniversalPrice = (payload: {
  productType: string;
  specifications: any;
  qty: number;
  priceType?: 'rush'|'online'|'promo';
  customerType?: 'regular'|'vip';
}) => api.post('/enhanced-calculator/calculate', payload);

// Категории материалов
export const getMaterialCategories = () => api.get<any[]>('/material-categories');
export const createMaterialCategory = (category: any) => api.post<any>('/material-categories', category);
export const updateMaterialCategory = (id: number, category: any) => api.put<any>(`/material-categories/${id}`, category);
export const deleteMaterialCategory = (id: number) => api.delete(`/material-categories/${id}`);
export const getMaterialCategoryStats = () => api.get<any[]>('/material-categories/stats');

// Поставщики
export const getSuppliers = () => api.get<any[]>('/suppliers');
export const getActiveSuppliers = () => api.get<any[]>('/suppliers/active');
export const createSupplier = (supplier: any) => api.post<any>('/suppliers', supplier);
export const updateSupplier = (id: number, supplier: any) => api.put<any>(`/suppliers/${id}`, supplier);
export const deleteSupplier = (id: number) => api.delete(`/suppliers/${id}`);
export const getSupplierStats = () => api.get<any[]>('/suppliers/stats');
export const getSupplierMaterials = (id: number) => api.get<any[]>(`/suppliers/${id}/materials`);

// Уведомления
export const getMaterialAlerts = (params?: any) => api.get<any[]>('/material-alerts', { params });
export const getUnreadMaterialAlerts = () => api.get<any[]>('/material-alerts/unread');
export const markAlertAsRead = (id: number) => api.put(`/material-alerts/${id}/read`);
export const markAllAlertsAsRead = () => api.put('/material-alerts/read-all');
export const deleteAlert = (id: number) => api.delete(`/material-alerts/${id}`);
export const checkMaterialAlerts = () => api.post<any>('/material-alerts/check');
export const getAlertStats = () => api.get<any>('/material-alerts/stats');

// Массовые операции
export const bulkUpdateMaterials = (updates: any[]) => api.post<any>('/material-bulk/update', { updates });
export const bulkSpendMaterials = (spends: any[]) => api.post<any>('/material-bulk/spend', { spends });
export const bulkCreateMaterials = (materials: any[]) => api.post<any>('/material-bulk/create', { materials });
export const bulkDeleteMaterials = (materialIds: number[]) => api.post<any>('/material-bulk/delete', { materialIds });
export const bulkChangeCategory = (materialIds: number[], categoryId: number) => 
  api.post<any>('/material-bulk/change-category', { materialIds, categoryId });
export const bulkChangeSupplier = (materialIds: number[], supplierId: number) => 
  api.post<any>('/material-bulk/change-supplier', { materialIds, supplierId });

// Импорт/экспорт
export const exportMaterialsCSV = (params?: any) => api.get('/material-import-export/export/csv', { params, responseType: 'blob' });
export const exportMaterialsJSON = (params?: any) => api.get('/material-import-export/export/json', { params });
export const importMaterialsJSON = (data: any) => api.post<any>('/material-import-export/import', data);
export const getImportTemplate = () => api.get<any>('/material-import-export/template');
export const validateImportData = (data: any) => api.post<any>('/material-import-export/validate', data);

// Отчеты по материалам
export const getMaterialReports = {
  inventory: (params?: any) => api.get<any[]>('/material-reports/inventory', { params }),
  consumption: (params?: any) => api.get<any[]>('/material-reports/consumption', { params }),
  cost: (params?: any) => api.get<any[]>('/material-reports/cost', { params }),
  summary: () => api.get<any>('/material-reports/summary'),
  dailyMovement: (params?: any) => api.get<any[]>('/material-reports/daily-movement', { params })
};

// Отслеживание стоимости
export const getMaterialCostTracking = {
  history: (params?: any) => api.get<any[]>('/material-cost-tracking/history', { params }),
  materialHistory: (materialId: number, params?: any) => api.get<any[]>(`/material-cost-tracking/history/${materialId}`, { params }),
  stats: (params?: any) => api.get<any>('/material-cost-tracking/stats', { params }),
  priceChanges: (params?: any) => api.get<any[]>('/material-cost-tracking/price-changes', { params }),
  trends: (params?: any) => api.get<any[]>('/material-cost-tracking/trends', { params }),
  updatePrice: (materialId: number, newPrice: number, reason: string) => 
    api.put<any>(`/material-cost-tracking/price/${materialId}`, { new_price: newPrice, reason })
};


// Database Pricing API
export const getDatabaseBasePrices = () => api.get('/database-pricing/base-prices');
export const getDatabaseUrgencyMultipliers = () => api.get('/database-pricing/urgency-multipliers');
export const getDatabaseVolumeDiscounts = () => api.get('/database-pricing/volume-discounts');
export const getDatabaseLoyaltyDiscounts = () => api.get('/database-pricing/loyalty-discounts');
export const updateDatabaseBasePrice = (productType: string, productVariant: string, prices: any) => 
  api.put(`/database-pricing/base-prices/${productType}/${productVariant}`, prices);
export const updateDatabaseUrgencyMultiplier = (priceType: string, multiplier: number) => 
  api.put(`/database-pricing/urgency-multipliers/${priceType}`, { multiplier });
export const updateDatabaseVolumeDiscount = (id: number, minQuantity: number, discountPercent: number) => 
  api.put(`/database-pricing/volume-discounts/${id}`, { min_quantity: minQuantity, discount_percent: discountPercent });
export const updateDatabaseLoyaltyDiscount = (customerType: string, discountPercent: number) => 
  api.put(`/database-pricing/loyalty-discounts/${customerType}`, { discount_percent: discountPercent });
export const calculateDatabasePrice = (params: any) => 
  api.post('/database-pricing/calculate', params);

// Order Management API
export const getPageChanges = (pageId: number, lastUpdate: string) => 
  api.get(`/order-management/pages/${pageId}/changes?lastUpdate=${lastUpdate}`);