import React, { useEffect, useState } from "react";
import "./index.css";
import "./app.css";
import { Order } from "./types";
import {
  getOrders,
  createOrder,
  deleteOrder,
  deleteOrderItem,
  updateOrderStatus,
  updateOrderItem,
  addOrderItem,
} from "./api";
import { Link } from 'react-router-dom';
import AddItemModal from "./components/AddItemModal";
import ManageMaterialsModal from "./components/ManageMaterialsModal";
import ManagePresetsModal from "./components/ManagePresetsModal";
import { PrepaymentModal } from "./components/PrepaymentModal";
import { AdminReportsPage } from "./pages/AdminReportsPage";
import { PrintingCalculatorModal } from "./components/PrintingCalculatorModal";
import { ImprovedPrintingCalculatorModal } from "./components/calculator/ImprovedPrintingCalculatorModal";
import { CalculatorConfigModal } from "./components/CalculatorConfigModal";
import { CalculatorSettingsPage } from "./pages/CalculatorSettingsPage";
import { PaperTypesManager } from "./components/PaperTypesManager";
import { ToastProvider, useToastNotifications } from "./components/Toast";
import { useLogger } from "./utils/logger";

import { ProgressBar, OrderStatus } from "./components/order/ProgressBar";
import { OrderTotal } from "./components/order/OrderTotal";
import { OrderItem } from "./components/OrderItem";
import { FilesModal } from "./components/FilesModal";
import { PrepaymentDetailsModal } from "./components/PrepaymentDetailsModal";
import { setAuthToken, getOrderStatuses, listOrderFiles, uploadOrderFile, deleteOrderFile, approveOrderFile, createPrepaymentLink, getLowStock, getCurrentUser, getUsers, getDailyReportByDate, createDailyReport } from './api';
import { APP_CONFIG } from './types';
import type { OrderFile } from './types';
import { StateManagementTestPanel } from './components/StateManagementTestPanel';
import { OptimizedOrderList } from './components/optimized/OptimizedOrderList';
import { AdminTopPanel } from './components/admin/AdminTopPanel';
import { WarehouseDashboard } from './components/warehouse/WarehouseDashboard';
import { OptimizedApp } from './components/optimized/OptimizedApp';
import { ErrorBoundary } from './components/optimized/ErrorBoundary';
import { OrdersManagement, OrderEditModal, OrderHistory } from './components/orders';
import { NotificationsManager } from './components/notifications/NotificationsManager';
import { OrderManagementPage } from './pages/OrderManagementPage';
import './styles/skeleton.css';
import './styles/optimized.css';
import './styles/admin-panel.css';
import './styles/warehouse-dashboard.css';
import './components/orders/OrdersManagement.css';
import './components/orders/OrderEditModal.css';
import './components/orders/OrderHistory.css';
import './components/notifications/NotificationsManager.css';

// Главный компонент с провайдерами
export default function App() {
  return (
    <ErrorBoundary>
      <OptimizedApp />
    </ErrorBoundary>
  );
}