import {
  getUserNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead
} from '../services/notificationService.js';
import User from '../models/User.js';

// @desc    Get current user's notifications
// @route   GET /api/notifications
// @access  Private
export const getMyNotifications = async (req, res, next) => {
  try {
    const { limit = 20, unreadOnly = false } = req.query;
    const result = await getUserNotifications(req.user._id, {
      limit: parseInt(limit, 10),
      unreadOnly: unreadOnly === 'true'
    });

    res.json({
      success: true,
      ...result
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Mark a single notification as read
// @route   PATCH /api/notifications/:id/read
// @access  Private
export const markAsRead = async (req, res, next) => {
  try {
    const notification = await markNotificationAsRead(req.params.id, req.user._id);
    if (!notification) {
      return res.status(404).json({ success: false, message: 'Notification not found' });
    }

    res.json({
      success: true,
      message: 'Notification marked as read',
      notification
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Mark all user's notifications as read
// @route   PATCH /api/notifications/read-all
// @access  Private
export const markAllRead = async (req, res, next) => {
  try {
    await markAllNotificationsAsRead(req.user._id);
    res.json({
      success: true,
      message: 'All notifications marked as read'
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get notification preferences
// @route   GET /api/notifications/preferences
// @access  Private
export const getPreferences = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).select('notificationPreferences preferredLanguage');
    res.json({
      success: true,
      preferences: user?.notificationPreferences || {},
      preferredLanguage: user?.preferredLanguage || 'en'
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Update notification preferences
// @route   PUT /api/notifications/preferences
// @access  Private
export const updatePreferences = async (req, res, next) => {
  try {
    const { preferences, preferredLanguage } = req.body;
    const updates = {};
    if (preferences) updates.notificationPreferences = preferences;
    if (preferredLanguage) updates.preferredLanguage = preferredLanguage;

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { $set: updates },
      { new: true }
    ).select('notificationPreferences preferredLanguage');

    res.json({
      success: true,
      message: 'Preferences updated successfully',
      preferences: user.notificationPreferences,
      preferredLanguage: user.preferredLanguage
    });
  } catch (err) {
    next(err);
  }
};
