export interface Material {
  id: number;
  name: string;
  unit: string;
  quantity: number;
  min_quantity?: number;
  max_stock_level?: number; // Максимальный уровень запаса
  sheet_price_single?: number | null;
  description?: string; // Описание материала
  category_id?: number; // Ссылка на категорию
  category_name?: string; // Название категории для отображения
  category_color?: string; // Цвет категории
  supplier_id?: number; // Ссылка на поставщика
  supplier_name?: string; // Название поставщика для отображения
  supplier_contact?: string; // Контакт поставщика
  paper_type_id?: number; // Ссылка на тип бумаги
  paper_type_name?: string; // Название типа бумаги для отображения
  density?: number; // Плотность бумаги
}
