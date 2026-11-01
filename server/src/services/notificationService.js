import Notification from '../models/Notification.js';
import User from '../models/User.js';

/**
 * Dispatch a notification respecting user channel & event preferences
 */
export const createNotification = async ({
  userId,
  type,
  title,
  body,
  data = {},
  channel = 'IN_APP'
}) => {
  try {
    const user = await User.findById(userId).select('notificationPreferences');
    if (user && user.notificationPreferences) {
      const prefs = user.notificationPreferences;
      if (type.startsWith('ENQUIRY') && prefs.enquiries === false) return null;
      if (type.startsWith('ORDER') && prefs.orders === false) return null;
      if (type.startsWith('B2B') && prefs.b2b === false) return null;
      if (type === 'MARKET_INSIGHT' && prefs.marketInsights === false) return null;
    }

    const notification = await Notification.create({
      userId,
      type,
      title,
      body,
      data,
      channel
    });

    return notification;
  } catch (err) {
    console.error('[NotificationService] Error creating notification:', err.message);
    return null;
  }
};

/**
 * Get user's notifications
 */
export const getUserNotifications = async (userId, { limit = 20, unreadOnly = false } = {}) => {
  const query = { userId };
  if (unreadOnly) {
    query.readAt = null;
  }

  const notifications = await Notification.find(query)
    .sort({ createdAt: -1 })
    .limit(limit)
    .lean();

  const unreadCount = await Notification.countDocuments({ userId, readAt: null });

  return { notifications, unreadCount };
};

/**
 * Mark a single notification as read
 */
export const markNotificationAsRead = async (notificationId, userId) => {
  const notification = await Notification.findOneAndUpdate(
    { _id: notificationId, userId },
    { $set: { readAt: new Date() } },
    { new: true }
  );
  return notification;
};

/**
 * Mark all notifications as read for a user
 */
export const markAllNotificationsAsRead = async (userId) => {
  const result = await Notification.updateMany(
    { userId, readAt: null },
    { $set: { readAt: new Date() } }
  );
  return result;
};
