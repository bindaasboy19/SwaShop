import Conversation from '../models/Conversation.js';
import Message from '../models/Message.js';
import SellerProfile from '../models/SellerProfile.js';
import Product from '../models/Product.js';
import Notification from '../models/Notification.js';

/**
 * Get or Initiate a Conversation between a Customer and a Shop
 * POST /api/chat/conversations
 */
export const getOrCreateConversation = async (req, res) => {
  try {
    const { sellerId, productId, initialMessage } = req.body;

    if (!sellerId) {
      return res.status(400).json({
        success: false,
        message: 'Seller shop ID is required to start a conversation.'
      });
    }

    // Find the target Shop
    const seller = await SellerProfile.findById(sellerId);
    if (!seller) {
      return res.status(404).json({
        success: false,
        message: 'Physical shop not found.'
      });
    }

    // Prevent shop owner chatting with own shop
    if (seller.userId.toString() === req.user._id.toString()) {
      return res.status(400).json({
        success: false,
        message: 'You cannot initiate a customer chat with your own shop.'
      });
    }

    // Check for existing conversation between this customer and this shop
    let conversation = await Conversation.findOne({
      customerId: req.user._id,
      sellerId: seller._id
    });

    if (!conversation) {
      conversation = await Conversation.create({
        participants: [req.user._id, seller.userId],
        customerId: req.user._id,
        sellerId: seller._id,
        productId: productId || null,
        unreadCountSeller: initialMessage ? 1 : 0
      });
    } else if (productId && !conversation.productId) {
      // Update attached product if previously not set
      conversation.productId = productId;
      await conversation.save();
    }

    // If an initial message was passed (e.g. from Product page)
    if (initialMessage && initialMessage.trim()) {
      const msg = await Message.create({
        conversationId: conversation._id,
        senderId: req.user._id,
        senderRole: 'CUSTOMER',
        text: initialMessage.trim()
      });

      conversation.lastMessage = initialMessage.trim();
      conversation.lastMessageSenderId = req.user._id;
      conversation.lastMessageAt = new Date();
      conversation.unreadCountSeller += 1;
      await conversation.save();

      // Trigger notification for shop owner
      try {
        await Notification.create({
          userId: seller.userId,
          type: 'ENQUIRY_RECEIVED',
          title: 'New Customer Chat Message',
          message: `${req.user.name || 'A customer'} sent a message: "${initialMessage.trim().substring(0, 80)}"`,
          metadata: {
            conversationId: conversation._id,
            customerId: req.user._id,
            productId: productId || null
          }
        });
      } catch (_) {}
    }

    // Populate details for frontend
    const populated = await Conversation.findById(conversation._id)
      .populate('sellerId', 'businessName logo address city state pincode phone businessHours verificationStatus sellerType')
      .populate('customerId', 'name email phone')
      .populate('productId', 'name images price stockStatus categoryId');

    res.status(200).json({
      success: true,
      conversation: populated
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to start conversation.'
    });
  }
};

/**
 * Get all conversations for current logged-in user
 * GET /api/chat/conversations
 */
export const getUserConversations = async (req, res) => {
  try {
    const userId = req.user._id;

    // Check if user is also a seller
    const sellerProfile = await SellerProfile.findOne({ userId });

    const query = {
      $or: [
        { customerId: userId },
        { participants: userId }
      ]
    };

    if (sellerProfile) {
      query.$or.push({ sellerId: sellerProfile._id });
    }

    const conversations = await Conversation.find(query)
      .populate('sellerId', 'businessName logo address city state pincode phone businessHours verificationStatus sellerType')
      .populate('customerId', 'name email phone')
      .populate('productId', 'name images price stockStatus categoryId')
      .sort({ lastMessageAt: -1 });

    res.status(200).json({
      success: true,
      count: conversations.length,
      conversations
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to load conversations.'
    });
  }
};

/**
 * Get all messages for a specific conversation
 * GET /api/chat/conversations/:id/messages
 */
export const getConversationMessages = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id.toString();

    const conversation = await Conversation.findById(id)
      .populate('sellerId', 'businessName logo address city state pincode phone businessHours verificationStatus sellerType userId')
      .populate('customerId', 'name email phone')
      .populate('productId', 'name images price stockStatus categoryId');

    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: 'Conversation not found.'
      });
    }

    // Access check: User must be customer or shop owner
    const isCustomer = conversation.customerId._id.toString() === userId;
    const isSeller = conversation.sellerId.userId.toString() === userId;

    if (!isCustomer && !isSeller && req.user.role !== 'ADMIN') {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to view this chat conversation.'
      });
    }

    // Mark messages as read
    await Message.updateMany(
      {
        conversationId: id,
        senderId: { $ne: req.user._id },
        isRead: false
      },
      { isRead: true }
    );

    // Reset unread counter for current reader
    if (isCustomer) {
      conversation.unreadCountCustomer = 0;
    } else if (isSeller) {
      conversation.unreadCountSeller = 0;
    }
    await conversation.save();

    const messages = await Message.find({ conversationId: id }).sort({ createdAt: 1 });

    res.status(200).json({
      success: true,
      conversation,
      messages
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to load chat messages.'
    });
  }
};

/**
 * Send a message in a conversation
 * POST /api/chat/conversations/:id/messages
 */
export const sendMessage = async (req, res) => {
  try {
    const { id } = req.params;
    const { text } = req.body;
    const userId = req.user._id.toString();

    if (!text || !text.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Message text cannot be empty.'
      });
    }

    const conversation = await Conversation.findById(id).populate('sellerId', 'businessName userId');
    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: 'Conversation not found.'
      });
    }

    // Access check
    const isCustomer = conversation.customerId.toString() === userId;
    const isSeller = conversation.sellerId.userId.toString() === userId;

    if (!isCustomer && !isSeller && req.user.role !== 'ADMIN') {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to send messages in this chat.'
      });
    }

    const senderRole = isCustomer ? 'CUSTOMER' : 'SELLER';
    const recipientUserId = isCustomer ? conversation.sellerId.userId : conversation.customerId;

    const message = await Message.create({
      conversationId: id,
      senderId: req.user._id,
      senderRole,
      text: text.trim()
    });

    // Update conversation metadata
    conversation.lastMessage = text.trim();
    conversation.lastMessageSenderId = req.user._id;
    conversation.lastMessageAt = new Date();

    if (isCustomer) {
      conversation.unreadCountSeller += 1;
    } else {
      conversation.unreadCountCustomer += 1;
    }
    await conversation.save();

    // Trigger Notification for recipient
    try {
      await Notification.create({
        userId: recipientUserId,
        type: 'ENQUIRY_RECEIVED',
        title: isCustomer ? `Message from Customer` : `Message from ${conversation.sellerId.businessName}`,
        message: text.trim().substring(0, 100),
        metadata: {
          conversationId: conversation._id,
          messageId: message._id
        }
      });
    } catch (_) {}

    res.status(201).json({
      success: true,
      message
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to send message.'
    });
  }
};
