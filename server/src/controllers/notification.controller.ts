import { Response } from 'express';
import { AuthenticatedRequest } from '../types/auth.types.js';
import prisma from '../config/db.js';

/**
 * Controller: Get all notifications for logged-in user
 * Route: GET /api/user/notifications
 */
export const getUserNotifications = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Authentication required.' });
      return;
    }

    const notifications = await prisma.notification.findMany({
      where: { user_id: req.user.id },
      orderBy: { created_at: 'desc' },
    });

    const unreadCount = notifications.filter((n) => !n.read_at).length;

    res.status(200).json({
      success: true,
      unreadCount,
      count: notifications.length,
      notifications,
    });
  } catch (error) {
    console.error('Error in getUserNotifications:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve notifications.',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

/**
 * Controller: Mark single notification as read
 * Route: PATCH /api/user/notifications/:id/read
 */
export const markNotificationAsRead = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Authentication required.' });
      return;
    }

    const { id } = req.params;

    const notification = await prisma.notification.updateMany({
      where: { id, user_id: req.user.id },
      data: { read_at: new Date() },
    });

    res.status(200).json({
      success: true,
      message: 'Notification marked as read.',
      updated: notification.count > 0,
    });
  } catch (error) {
    console.error('Error in markNotificationAsRead:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update notification.',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

/**
 * Controller: Mark all notifications as read
 * Route: PATCH /api/user/notifications/read-all
 */
export const markAllNotificationsAsRead = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Authentication required.' });
      return;
    }

    await prisma.notification.updateMany({
      where: { user_id: req.user.id, read_at: null },
      data: { read_at: new Date() },
    });

    res.status(200).json({
      success: true,
      message: 'All notifications marked as read.',
    });
  } catch (error) {
    console.error('Error in markAllNotificationsAsRead:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update notifications.',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

/**
 * Controller: Delete single notification
 * Route: DELETE /api/user/notifications/:id
 */
export const deleteNotification = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Authentication required.' });
      return;
    }

    const { id } = req.params;

    await prisma.notification.deleteMany({
      where: { id, user_id: req.user.id },
    });

    res.status(200).json({
      success: true,
      message: 'Notification deleted.',
    });
  } catch (error) {
    console.error('Error in deleteNotification:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete notification.',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

/**
 * Controller: Clear all notifications for user
 * Route: DELETE /api/user/notifications
 */
export const clearAllNotifications = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Authentication required.' });
      return;
    }

    await prisma.notification.deleteMany({
      where: { user_id: req.user.id },
    });

    res.status(200).json({
      success: true,
      message: 'All notifications cleared.',
    });
  } catch (error) {
    console.error('Error in clearAllNotifications:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to clear notifications.',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

/**
 * Controller: Manually trigger a fresh health tip notification
 * Route: POST /api/user/notifications/tip
 */
export const generateHealthTip = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Authentication required.' });
      return;
    }

    const tips = [
      {
        title: 'Daily Iron & Erythrocyte Health',
        message: 'Consuming vitamin C-rich fruits alongside iron-rich legumes increases non-heme iron absorption by up to 67%, bolstering your RBC production.',
      },
      {
        title: 'Hydration & Blood Viscosity Tip',
        message: 'Drinking at least 2.5–3 liters of water daily supports optimal plasma volume and cardiovascular circulation.',
      },
      {
        title: 'Pre-Donation Rest & Recovery',
        message: 'Adequate 7–8 hours of sleep before donating blood stabilizes blood pressure and ensures rapid post-donation recovery.',
      },
      {
        title: 'Platelet Function & Diet',
        message: 'Antioxidant-rich berries, spinach, and omega-3 fatty acids help maintain healthy platelet aggregation without vascular inflammation.',
      },
      {
        title: 'Electrolyte Balance for Active Donors',
        message: 'Replenishing sodium and potassium through natural coconut water helps prevent vasovagal symptoms post blood donation.',
      },
    ];

    const randomTip = tips[Math.floor(Math.random() * tips.length)];

    const notification = await prisma.notification.create({
      data: {
        user_id: req.user.id,
        type: 'health_tip',
        title: randomTip.title,
        message: randomTip.message,
      },
    });

    res.status(201).json({
      success: true,
      message: 'Fresh health tip generated.',
      notification,
    });
  } catch (error) {
    console.error('Error in generateHealthTip:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate health tip.',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};
