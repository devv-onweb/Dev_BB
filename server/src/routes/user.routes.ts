import { Router } from 'express';
import { verifyToken, authorizeRoles } from '../middlewares/auth.middleware.js';
import {
  createBloodOrder,
  getUserBloodOrders,
  getAllBloodOrders,
  updateBloodOrderStatus,
} from '../controllers/bloodOrder.controller.js';
import {
  uploadMiddleware,
  uploadAndAnalyzeReport,
  getUserReports,
  deleteReport,
} from '../controllers/report.controller.js';
import {
  getDoctors,
  setPreferredDoctor,
  sendMessageToDoctor,
  getDoctorMessages,
} from '../controllers/doctor.controller.js';
import {
  getUserNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification,
  clearAllNotifications,
  generateHealthTip,
} from '../controllers/notification.controller.js';

const router = Router();

// -------------------------------------------------------------
// FEATURE 1: Blood Orders
// -------------------------------------------------------------
router.post('/orders', verifyToken, createBloodOrder);
router.get('/orders', verifyToken, getUserBloodOrders);
router.get('/orders/all', verifyToken, getAllBloodOrders);
router.patch('/orders/:id/status', verifyToken, updateBloodOrderStatus);

// -------------------------------------------------------------
// FEATURE 2: Report Upload + AI Analysis
// -------------------------------------------------------------
router.post('/reports/upload', verifyToken, uploadMiddleware.single('file'), uploadAndAnalyzeReport);
router.get('/reports', verifyToken, getUserReports);
router.delete('/reports/:id', verifyToken, deleteReport);

// -------------------------------------------------------------
// FEATURE 3 & 4: Doctors & Preferred Doctor
// -------------------------------------------------------------
router.get('/doctors', verifyToken, getDoctors);
router.post('/doctors/:id/prefer', verifyToken, setPreferredDoctor);
router.post('/doctors/:id/messages', verifyToken, sendMessageToDoctor);
router.get('/doctors/:id/messages', verifyToken, getDoctorMessages);

// -------------------------------------------------------------
// FEATURE 5: Health Notifications (Phase 9)
// -------------------------------------------------------------
router.get('/notifications', verifyToken, getUserNotifications);
router.patch('/notifications/read-all', verifyToken, markAllNotificationsAsRead);
router.patch('/notifications/:id/read', verifyToken, markNotificationAsRead);
router.delete('/notifications/:id', verifyToken, deleteNotification);
router.delete('/notifications', verifyToken, clearAllNotifications);
router.post('/notifications/tip', verifyToken, generateHealthTip);

export default router;
