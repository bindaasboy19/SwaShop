import SellerProfile from '../models/SellerProfile.js';
import Product from '../models/Product.js';
import { getStorefrontQR, getProductQR, getWhatsAppLinks } from '../services/qrService.js';

// @desc    Get QR Code and Canonical Links for Seller Storefront
// @route   GET /api/qr/store/:identifier
// @access  Public
export const getSellerStoreQR = async (req, res, next) => {
  try {
    const { identifier } = req.params;
    let seller = null;

    if (identifier.match(/^[0-9a-fA-F]{24}$/)) {
      seller = await SellerProfile.findById(identifier);
    }
    if (!seller) {
      seller = await SellerProfile.findOne({ storeSlug: identifier.toLowerCase() });
    }

    if (!seller) {
      return res.status(404).json({ success: false, message: 'Seller not found' });
    }

    const host = req.get('host');
    const protocol = req.protocol;
    const baseUrl = `${protocol}://${host}`;

    const qrData = getStorefrontQR(seller, baseUrl);
    const whatsapp = getWhatsAppLinks({ seller, baseUrl });

    res.json({
      success: true,
      ...qrData,
      whatsapp
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get QR Code and WhatsApp Sharing links for a Product
// @route   GET /api/qr/product/:id
// @access  Public
export const getProductPageQR = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id).populate('sellerId');
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    const host = req.get('host');
    const protocol = req.protocol;
    const baseUrl = `${protocol}://${host}`;

    const qrData = getProductQR(product, product.sellerId, baseUrl);
    const whatsapp = getWhatsAppLinks({ product, seller: product.sellerId, baseUrl });

    res.json({
      success: true,
      ...qrData,
      whatsapp
    });
  } catch (err) {
    next(err);
  }
};
