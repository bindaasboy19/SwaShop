import ResellerListing from '../models/ResellerListing.js';
import Product from '../models/Product.js';
import SellerProfile from '../models/SellerProfile.js';

// @desc    Create a new Reseller Listing ("Buy & Resell" workflow)
// @route   POST /api/reseller-listings
// @access  Private (Seller only)
export const createResellerListing = async (req, res, next) => {
  try {
    if (!req.sellerProfile) {
      return res.status(403).json({
        success: false,
        message: 'Seller profile required to create reseller listings.'
      });
    }

    const { sourceProductId, price, quantity } = req.body;

    if (!sourceProductId || price === undefined || quantity === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Please provide sourceProductId, resell price, and quantity.'
      });
    }

    // Find the original source product
    const sourceProduct = await Product.findById(sourceProductId).populate('sellerId');
    if (!sourceProduct || !sourceProduct.isActive || !sourceProduct.isPublished) {
      return res.status(404).json({
        success: false,
        message: 'The selected product is not available for reselling.'
      });
    }

    // Ensure seller does not resell their own product
    if (sourceProduct.sellerId._id.toString() === req.sellerProfile._id.toString()) {
      return res.status(400).json({
        success: false,
        message: 'You cannot create a reseller listing for a product you already own.'
      });
    }

    // Check if seller already has an active reseller listing for this product
    let listing = await ResellerListing.findOne({
      sellerId: req.sellerProfile._id,
      sourceProductId: sourceProduct._id
    });

    if (listing) {
      // Update existing listing with new price and quantity
      listing.price = parseFloat(price);
      listing.quantity = parseInt(quantity, 10);
      listing.isActive = true;
      listing.isPublished = true;
      await listing.save();
    } else {
      listing = await ResellerListing.create({
        sellerId: req.sellerProfile._id,
        sourceProductId: sourceProduct._id,
        sourceSellerId: sourceProduct.sellerId._id,
        price: parseFloat(price),
        quantity: parseInt(quantity, 10),
        isPublished: true,
        isActive: true
      });
    }

    const populatedListing = await ResellerListing.findById(listing._id)
      .populate('sourceProductId')
      .populate('sourceSellerId', 'businessName sellerType city logo');

    res.status(201).json({
      success: true,
      message: 'Product successfully added to your catalogue as a Reseller Listing!',
      listing: populatedListing
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get current seller's combined catalogue (Own Products + Reseller Listings)
// @route   GET /api/reseller-listings/catalogue
// @access  Private (Seller only)
export const getSellerCombinedCatalogue = async (req, res, next) => {
  try {
    if (!req.sellerProfile) {
      return res.status(403).json({
        success: false,
        message: 'Seller profile required.'
      });
    }

    // Fetch own products
    const ownProducts = await Product.find({ sellerId: req.sellerProfile._id })
      .populate('categoryId', 'name slug icon')
      .lean();

    const formattedOwnProducts = ownProducts.map((p) => ({
      ...p,
      isResellProduct: false,
      catalogueType: 'OWN_PRODUCT',
      sourceAttribution: null
    }));

    // Fetch reseller listings
    const resellerListings = await ResellerListing.find({
      sellerId: req.sellerProfile._id,
      isActive: true
    })
      .populate({
        path: 'sourceProductId',
        populate: { path: 'categoryId', select: 'name slug icon' }
      })
      .populate('sourceSellerId', 'businessName sellerType city logo')
      .lean();

    const formattedResellProducts = resellerListings
      .filter((r) => r.sourceProductId) // Guard against deleted source products
      .map((r) => ({
        _id: r._id,
        resellerListingId: r._id,
        sourceProductId: r.sourceProductId._id,
        name: r.sourceProductId.name,
        description: r.sourceProductId.description,
        categoryId: r.sourceProductId.categoryId,
        images: r.sourceProductId.images,
        price: r.price, // Reseller's own pricing
        originalPrice: r.sourceProductId.price, // Maker's price
        quantity: r.quantity,
        availability: r.availability,
        isPublished: r.isPublished,
        isActive: r.isActive,
        createdAt: r.createdAt,
        updatedAt: r.updatedAt,
        isResellProduct: true,
        catalogueType: 'RESELL_PRODUCT',
        sourceSeller: {
          _id: r.sourceSellerId?._id,
          businessName: r.sourceSellerId?.businessName || 'Original Artisan',
          sellerType: r.sourceSellerId?.sellerType,
          city: r.sourceSellerId?.city
        }
      }));

    // Combine both
    const combinedCatalogue = [...formattedOwnProducts, ...formattedResellProducts].sort(
      (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
    );

    res.json({
      success: true,
      totalItems: combinedCatalogue.length,
      ownProductsCount: formattedOwnProducts.length,
      resellProductsCount: formattedResellProducts.length,
      items: combinedCatalogue
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get all reseller listings for current seller
// @route   GET /api/reseller-listings
// @access  Private (Seller only)
export const getMyResellerListings = async (req, res, next) => {
  try {
    if (!req.sellerProfile) {
      return res.status(403).json({
        success: false,
        message: 'Seller profile required.'
      });
    }

    const listings = await ResellerListing.find({
      sellerId: req.sellerProfile._id,
      isActive: true
    })
      .populate({
        path: 'sourceProductId',
        populate: { path: 'categoryId', select: 'name slug icon' }
      })
      .populate('sourceSellerId', 'businessName sellerType city logo');

    res.json({
      success: true,
      count: listings.length,
      listings
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Update reseller listing (price, quantity, availability)
// @route   PUT /api/reseller-listings/:id
// @access  Private (Seller only)
export const updateResellerListing = async (req, res, next) => {
  try {
    if (!req.sellerProfile) {
      return res.status(403).json({
        success: false,
        message: 'Seller profile required.'
      });
    }

    const listing = await ResellerListing.findById(req.params.id);
    if (!listing) {
      return res.status(404).json({
        success: false,
        message: 'Reseller listing not found.'
      });
    }

    // Ownership check: only the reseller who created this listing can update it
    if (listing.sellerId.toString() !== req.sellerProfile._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied: You do not own this reseller listing.'
      });
    }

    const { price, quantity, availability, isPublished } = req.body;

    if (price !== undefined) listing.price = parseFloat(price);
    if (quantity !== undefined) listing.quantity = parseInt(quantity, 10);
    if (availability !== undefined) listing.availability = Boolean(availability);
    if (isPublished !== undefined) listing.isPublished = Boolean(isPublished);

    await listing.save();

    res.json({
      success: true,
      message: 'Reseller listing updated successfully.',
      listing
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Toggle publish state for reseller listing
// @route   PATCH /api/reseller-listings/:id/publish
// @access  Private (Seller only)
export const togglePublishResellerListing = async (req, res, next) => {
  try {
    if (!req.sellerProfile) {
      return res.status(403).json({
        success: false,
        message: 'Seller profile required.'
      });
    }

    const listing = await ResellerListing.findById(req.params.id);
    if (!listing) {
      return res.status(404).json({
        success: false,
        message: 'Reseller listing not found.'
      });
    }

    if (listing.sellerId.toString() !== req.sellerProfile._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied: You do not own this reseller listing.'
      });
    }

    listing.isPublished = !listing.isPublished;
    await listing.save();

    res.json({
      success: true,
      message: `Reseller listing is now ${listing.isPublished ? 'published' : 'hidden'}.`,
      isPublished: listing.isPublished
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Delete / deactivate reseller listing
// @route   DELETE /api/reseller-listings/:id
// @access  Private (Seller only)
export const deleteResellerListing = async (req, res, next) => {
  try {
    if (!req.sellerProfile) {
      return res.status(403).json({
        success: false,
        message: 'Seller profile required.'
      });
    }

    const listing = await ResellerListing.findById(req.params.id);
    if (!listing) {
      return res.status(404).json({
        success: false,
        message: 'Reseller listing not found.'
      });
    }

    if (listing.sellerId.toString() !== req.sellerProfile._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied: You do not own this reseller listing.'
      });
    }

    await ResellerListing.findByIdAndDelete(listing._id);

    res.json({
      success: true,
      message: 'Reseller listing removed from your catalogue.'
    });
  } catch (err) {
    next(err);
  }
};
