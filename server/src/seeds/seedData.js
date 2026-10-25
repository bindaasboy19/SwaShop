import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../../../.env') });
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

import { connectDB, closeDB } from '../config/db.js';
import User from '../models/User.js';
import SellerProfile from '../models/SellerProfile.js';
import Product from '../models/Product.js';
import Category from '../models/Category.js';
import ResellerListing from '../models/ResellerListing.js';
import Enquiry from '../models/Enquiry.js';
import Favourite from '../models/Favourite.js';
import BuyerRequirement from '../models/BuyerRequirement.js';
import AnalyticsEvent from '../models/AnalyticsEvent.js';
import SearchEvent from '../models/SearchEvent.js';

export const seedDatabaseCore = async ({ silent = false } = {}) => {
  const log = (...args) => {
    if (!silent) console.log(...args);
  };

  log('[Seed] Clearing existing collections...');
  await Promise.all([
    User.deleteMany({}),
    SellerProfile.deleteMany({}),
    Product.deleteMany({}),
    Category.deleteMany({}),
    ResellerListing.deleteMany({}),
    Enquiry.deleteMany({}),
    Favourite.deleteMany({}),
    BuyerRequirement.deleteMany({}),
    AnalyticsEvent.deleteMany({}),
    SearchEvent.deleteMany({})
  ]);

  log('[Seed] Seeding categories...');
  const categories = await Category.create([
    {
      name: 'Handicrafts & Bamboo',
      slug: 'handicrafts-bamboo',
      description: 'Authentic handcrafted cane, bamboo baskets, woodcraft, and rural decor.',
      icon: 'Palette',
      image: 'https://images.unsplash.com/photo-1590736969955-71cc94801759?w=600&auto=format&fit=crop&q=80',
      isActive: true
    },
    {
      name: 'Handloom & Textiles',
      slug: 'handloom-textiles',
      description: 'Traditional khadi, cotton weaves, sarees, stoles, and embroidered apparel.',
      icon: 'Shirt',
      image: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=600&auto=format&fit=crop&q=80',
      isActive: true
    },
    {
      name: 'Organic & Spices',
      slug: 'organic-spices',
      description: 'Pure forest honey, stone-ground indigenous spices, and natural wellness items.',
      icon: 'Apple',
      image: 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=600&auto=format&fit=crop&q=80',
      isActive: true
    },
    {
      name: 'Pottery & Clayware',
      slug: 'pottery-clayware',
      description: 'Eco-friendly terracotta cookware, earthen pots, and hand-glazed ceramic art.',
      icon: 'Coffee',
      image: 'https://images.unsplash.com/photo-1565193566173-7a0ee3dbe261?w=600&auto=format&fit=crop&q=80',
      isActive: true
    },
    {
      name: 'Jewellery & Adornments',
      slug: 'jewellery-adornments',
      description: 'Handmade tribal beads, terracotta earrings, brass anklets, and artisanal sets.',
      icon: 'Sparkles',
      image: 'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=600&auto=format&fit=crop&q=80',
      isActive: true
    },
    {
      name: 'Gifts & Home Decor',
      slug: 'gifts-home-decor',
      description: 'Brass diyas, natural soy candles, wall hangings, and artisanal festival packs.',
      icon: 'Gift',
      image: 'https://images.unsplash.com/photo-1513519245088-0e12902e5a38?w=600&auto=format&fit=crop&q=80',
      isActive: true
    }
  ]);

  const catBamboo = categories.find((c) => c.slug === 'handicrafts-bamboo');
  const catTextiles = categories.find((c) => c.slug === 'handloom-textiles');
  const catOrganic = categories.find((c) => c.slug === 'organic-spices');
  const catPottery = categories.find((c) => c.slug === 'pottery-clayware');

  log('[Seed] Seeding platform users & sellers...');
  const defaultPasswordHash = await User.hashPassword('Password@123');

  // 1. Admin
  const adminUser = await User.create({
    name: 'SwaShop Admin',
    email: 'admin@swashop.in',
    phone: '+91 9876500001',
    passwordHash: await User.hashPassword('AdminPass@12345'),
    role: 'ADMIN',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&auto=format&fit=crop&q=80',
    isActive: true
  });

  // 2. Customer with B2B Buyer capability enabled
  const customerUser = await User.create({
    name: 'Priya Sharma',
    email: 'customer@example.com',
    phone: '+91 9876500002',
    passwordHash: await User.hashPassword('CustomerPass@123'),
    role: 'CUSTOMER',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&auto=format&fit=crop&q=80',
    isActive: true,
    buyerProfile: {
      enabled: true,
      businessName: 'Apex Corporate Gifting & Events',
      businessType: 'CORPORATE',
      industry: 'Hospitality & Corporate Gifting',
      location: {
        city: 'Lucknow',
        state: 'Uttar Pradesh',
        country: 'India',
        coordinates: { lat: 26.8467, lng: 80.9462 }
      },
      gstNumber: '09AAACA1234A1Z5',
      verificationStatus: 'VERIFIED'
    }
  });

  // 3. Seller B: Sharma Handicrafts (Artisan Maker, VERIFIED, B2B Enabled)
  const userSellerB = await User.create({
    name: 'Ramesh Sharma',
    email: 'sharma.handicrafts@example.com',
    phone: '+91 9876500003',
    passwordHash: defaultPasswordHash,
    role: 'SELLER',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&auto=format&fit=crop&q=80',
    isActive: true
  });

  const sellerB = await SellerProfile.create({
    userId: userSellerB._id,
    businessName: 'Sharma Handicrafts',
    sellerType: 'ARTISAN',
    description: 'Master bamboo artisans crafting traditional baskets, cane furniture, and rural eco-crafts for over 25 years.',
    category: 'Handicrafts & Cane',
    phone: '+91 9876500003',
    address: '14 Craft Colony, Dilli Haat Road',
    city: 'New Delhi',
    state: 'Delhi',
    pincode: '110023',
    coordinates: { lat: 28.5733, lng: 77.2085 },
    businessHours: 'Mon - Sat: 10:00 AM - 8:00 PM',
    verificationStatus: 'VERIFIED',
    verificationDetails: {
      requestedAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000),
      verifiedAt: new Date(Date.now() - 55 * 24 * 60 * 60 * 1000),
      documentType: 'ARTISAN_CARD',
      documentNumber: 'AC-DL-884920',
      reviewNotes: 'Verified state artisan federation registration card.'
    },
    b2bProfile: {
      enabled: true,
      productionCapacity: 1500,
      minimumOrderQuantity: 50,
      bulkAvailable: true,
      leadTimeDays: 14,
      businessCategories: ['Handicrafts & Bamboo', 'Gifts & Home Decor'],
      serviceLocations: ['Delhi NCR', 'Lucknow', 'Pan India'],
      catalogSummary: 'Wholesale bamboo organizers, conference baskets, and eco-friendly gift containers.'
    },
    isOpen: true,
    logo: 'https://images.unsplash.com/photo-1544717305-2782549b5136?w=200&auto=format&fit=crop&q=80',
    coverImage: 'https://images.unsplash.com/photo-1513519245088-0e12902e5a38?w=800&auto=format&fit=crop&q=80'
  });

  // 4. Seller A: Aarav Gift Shop (Local Shop / Reseller, APPROVED, B2B Enabled)
  const userSellerA = await User.create({
    name: 'Aarav Gupta',
    email: 'aarav.gifts@example.com',
    phone: '+91 9876500004',
    passwordHash: defaultPasswordHash,
    role: 'SELLER',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&auto=format&fit=crop&q=80',
    isActive: true
  });

  const sellerA = await SellerProfile.create({
    userId: userSellerA._id,
    businessName: 'Aarav Gift Shop',
    sellerType: 'LOCAL_SHOP',
    description: 'Curated home decor, artisanal gift collections, and premium local crafts located in central Connaught Place.',
    category: 'Gifts & Home Decor',
    phone: '+91 9876500004',
    address: 'Shop 42, Block B, Connaught Place',
    city: 'New Delhi',
    state: 'Delhi',
    pincode: '110001',
    coordinates: { lat: 28.6328, lng: 77.2197 },
    businessHours: 'Mon - Sun: 11:00 AM - 9:30 PM',
    verificationStatus: 'APPROVED',
    verificationDetails: {
      requestedAt: new Date(Date.now() - 40 * 24 * 60 * 60 * 1000),
      verifiedAt: new Date(Date.now() - 35 * 24 * 60 * 60 * 1000),
      documentType: 'GSTIN',
      documentNumber: '07AAAAA0000A1Z5',
      reviewNotes: 'Active trade license and GSTIN verified.'
    },
    b2bProfile: {
      enabled: true,
      productionCapacity: 500,
      minimumOrderQuantity: 20,
      bulkAvailable: true,
      leadTimeDays: 7,
      businessCategories: ['Gifts & Home Decor', 'Handicrafts & Bamboo'],
      serviceLocations: ['Delhi NCR'],
      catalogSummary: 'Corporate festive gift hampers and branded artisanal desk items.'
    },
    isOpen: true,
    logo: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=200&auto=format&fit=crop&q=80',
    coverImage: 'https://images.unsplash.com/photo-1513151233558-d860c5398176?w=800&auto=format&fit=crop&q=80'
  });

  // 5. Seller C: Kaveri Pottery Works (Micro Entrepreneur, VERIFIED)
  const userSellerC = await User.create({
    name: 'Lakshmi Devi',
    email: 'kaveri.pottery@example.com',
    phone: '+91 9876500005',
    passwordHash: defaultPasswordHash,
    role: 'SELLER',
    avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=200&auto=format&fit=crop&q=80',
    isActive: true
  });

  const sellerC = await SellerProfile.create({
    userId: userSellerC._id,
    businessName: 'Kaveri Pottery Works',
    sellerType: 'MICRO_ENTREPRENEUR',
    description: 'Hand-thrown earthenware, glazed stoneware mugs, and cooling clay matkas crafted with natural riverbed clay.',
    category: 'Pottery & Ceramics',
    phone: '+91 9876500005',
    address: '22 Kumhar Gali, Sector 18',
    city: 'Noida',
    state: 'Uttar Pradesh',
    pincode: '201301',
    coordinates: { lat: 28.5708, lng: 77.3261 },
    businessHours: 'Mon - Sat: 9:30 AM - 7:30 PM',
    verificationStatus: 'VERIFIED',
    b2bProfile: {
      enabled: true,
      productionCapacity: 800,
      minimumOrderQuantity: 25,
      bulkAvailable: true,
      leadTimeDays: 10,
      businessCategories: ['Pottery & Clayware'],
      serviceLocations: ['Noida', 'Delhi NCR', 'Lucknow'],
      catalogSummary: 'Terracotta dinnerware sets and eco-friendly office planter pots.'
    },
    isOpen: true,
    logo: 'https://images.unsplash.com/photo-1578749556568-bc2c40e68b61?w=200&auto=format&fit=crop&q=80',
    coverImage: 'https://images.unsplash.com/photo-1565193566173-7a0ee3dbe261?w=800&auto=format&fit=crop&q=80'
  });

  // 6. Seller D: Vedic Roots Organics (MSME, VERIFIED)
  const userSellerD = await User.create({
    name: 'Dr. Vikram Singh',
    email: 'vedic.roots@example.com',
    phone: '+91 9876500006',
    passwordHash: defaultPasswordHash,
    role: 'SELLER',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&auto=format&fit=crop&q=80',
    isActive: true
  });

  const sellerD = await SellerProfile.create({
    userId: userSellerD._id,
    businessName: 'Vedic Roots Organics',
    sellerType: 'MSME',
    description: 'Certified pesticide-free farm produce, raw honey, cold-pressed oils, and Himalayan forest herbs.',
    category: 'Organic Foods & Wellness',
    phone: '+91 9876500006',
    address: 'Tower 4, Cyber City Phase 2',
    city: 'Gurugram',
    state: 'Haryana',
    pincode: '122002',
    coordinates: { lat: 28.4952, lng: 77.0891 },
    businessHours: 'Mon - Sat: 9:00 AM - 8:00 PM',
    verificationStatus: 'VERIFIED',
    b2bProfile: {
      enabled: true,
      productionCapacity: 2000,
      minimumOrderQuantity: 40,
      bulkAvailable: true,
      leadTimeDays: 5,
      businessCategories: ['Organic & Spices']
    },
    isOpen: true,
    logo: 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=200&auto=format&fit=crop&q=80',
    coverImage: 'https://images.unsplash.com/photo-1615485290382-441e4d049cb5?w=800&auto=format&fit=crop&q=80'
  });

  // 7. Seller E: Surabhi Handlooms (PENDING Verification)
  const userSellerE = await User.create({
    name: 'Surabhi Verma',
    email: 'surabhi.weaves@example.com',
    phone: '+91 9876500007',
    passwordHash: defaultPasswordHash,
    role: 'SELLER',
    isActive: true
  });

  const sellerE = await SellerProfile.create({
    userId: userSellerE._id,
    businessName: 'Surabhi Handloom Weavers',
    sellerType: 'ARTISAN',
    description: 'Hand-woven Varanasi zari stoles and pure organic cotton unstitched fabric.',
    category: 'Textiles & Weaves',
    phone: '+91 9876500007',
    address: 'Weavers Lane, Bhelupur',
    city: 'Varanasi',
    state: 'Uttar Pradesh',
    pincode: '221005',
    coordinates: { lat: 25.3176, lng: 82.9739 },
    verificationStatus: 'PENDING',
    verificationDetails: {
      requestedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      documentType: 'ARTISAN_CARD',
      documentNumber: 'UP-VAR-991240',
      reviewNotes: 'Submitted artisan identity card and sample workshop photos.'
    },
    isOpen: true
  });

  log('[Seed] Seeding products with availability & B2B capabilities...');
  const bambooBasket = await Product.create({
    sellerId: sellerB._id,
    name: 'Handmade Bamboo Basket',
    description: 'Natural woven bamboo storage basket made by seasoned artisans. Lightweight, durable, and 100% biodegradable. Perfect for fruit display, organizing clothes, or gifting.',
    categoryId: catBamboo._id,
    images: [
      'https://images.unsplash.com/photo-1590736969955-71cc94801759?w=800&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1615485290382-441e4d049cb5?w=800&auto=format&fit=crop&q=80'
    ],
    price: 499,
    discountPrice: 450,
    availability: true,
    stockStatus: 'AVAILABLE',
    availabilityStatus: 'AVAILABLE',
    availabilityUpdatedAt: new Date(),
    quantityAvailable: 150,
    b2b: {
      enabled: true,
      minOrderQuantity: 50,
      bulkPrice: 380,
      productionCapacity: 1500,
      leadTimeDays: 14
    },
    tags: ['bamboo', 'basket', 'handcrafted', 'eco-friendly', 'kitchen', 'corporate gift'],
    keywords: ['bamboo storage', 'eco gift', 'sustainable basket', 'handicraft organizer'],
    features: ['100% natural cane and bamboo', 'Splinter-free polished finish', 'Eco-friendly and chemical-free'],
    isPublished: true,
    isActive: true,
    views: 240,
    favouriteCount: 18
  });

  const caneTray = await Product.create({
    sellerId: sellerB._id,
    name: 'Handcrafted Cane Fruit Tray',
    description: 'Artisanal shallow cane serving tray with reinforced rim. Ideal for fruits, dry snacks, and dining table centerpiece.',
    categoryId: catBamboo._id,
    images: ['https://images.unsplash.com/photo-1513519245088-0e12902e5a38?w=800&auto=format&fit=crop&q=80'],
    price: 350,
    availability: true,
    stockStatus: 'AVAILABLE',
    availabilityStatus: 'AVAILABLE',
    availabilityUpdatedAt: new Date(),
    b2b: {
      enabled: true,
      minOrderQuantity: 25,
      bulkPrice: 280,
      productionCapacity: 800,
      leadTimeDays: 7
    },
    tags: ['cane', 'tray', 'serving', 'handicraft', 'eco-friendly'],
    isPublished: true,
    isActive: true,
    views: 120,
    favouriteCount: 8
  });

  const windChime = await Product.create({
    sellerId: sellerB._id,
    name: 'Melodious Bamboo Wind Chime',
    description: 'Traditional 6-tube tuned bamboo chime creating soothing, earthy tones for balconies, gardens, and patios.',
    categoryId: catBamboo._id,
    images: ['https://images.unsplash.com/photo-1518895949257-7621c3c786d7?w=800&auto=format&fit=crop&q=80'],
    price: 450,
    availability: true,
    stockStatus: 'AVAILABLE',
    availabilityStatus: 'AVAILABLE',
    tags: ['windchime', 'bamboo', 'garden', 'decor'],
    isPublished: true,
    isActive: true,
    views: 85,
    favouriteCount: 5
  });

  const brassDiya = await Product.create({
    sellerId: sellerA._id,
    name: 'Artisanal Brass Diya Set (Set of 4)',
    description: 'Solid carved brass oil lamps with engraved peacock patterns. Perfect for festivals, rituals, and ambient home lighting.',
    categoryId: catBamboo._id,
    images: ['https://images.unsplash.com/photo-1605648916361-9bc12ad6a569?w=800&auto=format&fit=crop&q=80'],
    price: 799,
    discountPrice: 699,
    availability: true,
    stockStatus: 'AVAILABLE',
    availabilityStatus: 'AVAILABLE',
    b2b: {
      enabled: true,
      minOrderQuantity: 20,
      bulkPrice: 550,
      productionCapacity: 500,
      leadTimeDays: 7
    },
    tags: ['brass', 'diya', 'festive', 'pooja', 'decor', 'gift set'],
    isPublished: true,
    isActive: true,
    views: 195,
    favouriteCount: 14
  });

  const matka = await Product.create({
    sellerId: sellerC._id,
    name: 'Traditional Terracotta Water Pot (Matka)',
    description: 'Unglazed porous clay pot that naturally cools water through evaporation. Comes with a handcrafted clay lid and stand.',
    categoryId: catPottery._id,
    images: ['https://images.unsplash.com/photo-1565193566173-7a0ee3dbe261?w=800&auto=format&fit=crop&q=80'],
    price: 299,
    availability: true,
    stockStatus: 'AVAILABLE',
    availabilityStatus: 'AVAILABLE',
    b2b: {
      enabled: true,
      minOrderQuantity: 25,
      bulkPrice: 220,
      productionCapacity: 800,
      leadTimeDays: 10
    },
    tags: ['pottery', 'terracotta', 'matka', 'earthenware', 'kitchen'],
    isPublished: true,
    isActive: true,
    views: 160,
    favouriteCount: 9
  });

  const silkStole = await Product.create({
    sellerId: sellerE._id,
    name: 'Varanasi Pure Silk Brocade Stole',
    description: 'Exquisite hand-woven gold zari floral motifs on crimson katan silk. Lightweight and royal bridal party wear.',
    categoryId: catTextiles._id,
    images: ['https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=800&auto=format&fit=crop&q=80'],
    price: 2499,
    availability: true,
    stockStatus: 'LOW_STOCK',
    availabilityStatus: 'LOW_STOCK',
    availabilityUpdatedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
    tags: ['handloom', 'silk', 'stole', 'zari', 'varanasi', 'festive'],
    isPublished: true,
    isActive: true,
    views: 110,
    favouriteCount: 12
  });

  log('[Seed] Seeding reseller listings...');
  await ResellerListing.create({
    resellerSellerId: sellerA._id,
    originalProductId: bambooBasket._id,
    originalSellerId: sellerB._id,
    customMarkup: 150,
    resellerPrice: 649,
    customTitle: 'Eco Artisanal Bamboo Hamper Basket (CP Store Edition)',
    customDescription: 'Directly sourced from Ramesh Sharma handicraft cooperative, curated for our Connaught Place showroom.',
    isActive: true
  });

  log('[Seed] Seeding customer favourites & enquiries...');
  await Favourite.create({
    userId: customerUser._id,
    targetType: 'PRODUCT',
    targetId: bambooBasket._id,
    targetModel: 'Product'
  });

  await Favourite.create({
    userId: customerUser._id,
    targetType: 'SELLER',
    targetId: sellerB._id,
    targetModel: 'SellerProfile'
  });

  await Enquiry.create({
    customerId: customerUser._id,
    sellerId: sellerB._id,
    productId: bambooBasket._id,
    message: 'Hello, I want to confirm if you can supply 50 bamboo baskets for Diwali gift hampers by next week.',
    contactPhone: '+91 9876500002',
    contactEmail: 'customer@example.com',
    status: 'RESPONDED',
    responseMessage: 'Namaste Priya ji! Yes, we have seasoned stock ready and can ship within 4 business days.'
  });

  log('[Seed] Seeding B2B Buyer Requirements...');
  const req1 = await BuyerRequirement.create({
    buyerId: customerUser._id,
    title: 'Need 500 eco-friendly handmade gift bags for corporate event',
    description: 'Looking for 500 units of sustainable, handmade bamboo or jute gift bags with customized handles for an annual corporate summit in Lucknow.',
    category: 'Handicrafts & Bamboo',
    quantity: 500,
    budgetMin: 150,
    budgetMax: 250,
    targetPricePerUnit: 200,
    location: {
      city: 'Lucknow',
      state: 'Uttar Pradesh',
      country: 'India',
      coordinates: { lat: 26.8467, lng: 80.9462 }
    },
    deadline: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000),
    requiredAttributes: ['eco-friendly', 'handmade', 'bulk-available'],
    preferredSellerTypes: ['ARTISAN', 'LOCAL_SHOP', 'MSME'],
    bulkRequired: true,
    status: 'OPEN',
    matchedSellerCount: 3,
    enquiriesCount: 1
  });

  const req2 = await BuyerRequirement.create({
    buyerId: customerUser._id,
    title: 'Bulk Terracotta Planter Pots for Office Campus',
    description: 'Require 200 medium-sized unglazed clay planters for corporate indoor landscaping in Delhi NCR.',
    category: 'Pottery & Clayware',
    quantity: 200,
    budgetMin: 120,
    budgetMax: 180,
    targetPricePerUnit: 150,
    location: {
      city: 'Noida',
      state: 'Uttar Pradesh',
      country: 'India',
      coordinates: { lat: 28.5708, lng: 77.3261 }
    },
    deadline: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
    requiredAttributes: ['terracotta', 'breathable-clay', 'office-decor'],
    status: 'MATCHED',
    matchedSellerCount: 2,
    enquiriesCount: 0
  });

  // B2B Bulk Enquiry linked to Requirement 1
  await Enquiry.create({
    customerId: customerUser._id,
    sellerId: sellerB._id,
    requirementId: req1._id,
    enquiryType: 'B2B_REQUIREMENT',
    quantity: 500,
    message: 'Hello Ramesh ji, we reviewed your bamboo workshop capacity and would like a formal quotation for 500 units of conference gift baskets for our Lucknow summit.',
    contactPhone: '+91 9876500002',
    contactEmail: 'customer@example.com',
    quotedPrice: 190,
    status: 'PENDING'
  });

  log('[Seed] Seeding realistic discovery analytics & search demand events...');
  const eventTypes = [
    { type: 'PRODUCT_VIEW', seller: sellerB._id, product: bambooBasket._id, count: 28, source: 'SEARCH' },
    { type: 'PRODUCT_SEARCH_IMPRESSION', seller: sellerB._id, product: bambooBasket._id, count: 65, source: 'SEARCH' },
    { type: 'SELLER_PROFILE_VIEW', seller: sellerB._id, count: 18, source: 'NEARBY' },
    { type: 'PRODUCT_VIEW', seller: sellerA._id, product: brassDiya._id, count: 22, source: 'SEARCH' },
    { type: 'PRODUCT_SEARCH_IMPRESSION', seller: sellerA._id, product: brassDiya._id, count: 48, source: 'SEARCH' },
    { type: 'SELLER_PROFILE_VIEW', seller: sellerA._id, count: 14, source: 'DIRECT' }
  ];

  for (const e of eventTypes) {
    const promises = [];
    for (let i = 0; i < e.count; i++) {
      const daysAgo = Math.floor(Math.random() * 20);
      promises.push(
        AnalyticsEvent.create({
          eventType: e.type,
          sellerId: e.seller,
          productId: e.product || null,
          source: e.source,
          createdAt: new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000)
        })
      );
    }
    await Promise.all(promises);
  }

  // Seed search queries for market demand intelligence
  const sampleSearches = [
    { query: 'handmade bamboo basket', category: 'Handicrafts & Bamboo', city: 'Delhi', count: 15 },
    { query: 'eco friendly corporate gift', category: 'Handicrafts & Bamboo', city: 'Lucknow', count: 22 },
    { query: 'terracotta planters bulk', category: 'Pottery & Clayware', city: 'Noida', count: 12 },
    { query: 'varanasi silk stole', category: 'Handloom & Textiles', city: 'Varanasi', count: 10 }
  ];

  for (const s of sampleSearches) {
    const searchPromises = [];
    for (let i = 0; i < s.count; i++) {
      searchPromises.push(
        SearchEvent.create({
          query: s.query,
          category: s.category,
          city: s.city,
          resultsCount: 3,
          searchType: 'KEYWORD',
          createdAt: new Date(Date.now() - Math.floor(Math.random() * 15) * 24 * 60 * 60 * 1000)
        })
      );
    }
    await Promise.all(searchPromises);
  }

  log('================================================================');
  log('  SwaShop Phase 3 Database Seed Completed Successfully!         ');
  log('================================================================');
  log('  Credentials:                                                  ');
  log('  1. ADMIN:      admin@swashop.in          / AdminPass@12345    ');
  log('  2. SELLER A:   aarav.gifts@example.com   / Password@123       ');
  log('  3. SELLER B:   sharma.handicrafts@example.com / Password@123  ');
  log('  4. CUSTOMER:   customer@example.com      / CustomerPass@123   ');
  log('================================================================');

  return {
    adminUser,
    customerUser,
    sellerA,
    sellerB,
    bambooBasket,
    req1
  };
};

const runStandalone = async () => {
  try {
    console.log('[Seed] Connecting to MongoDB...');
    await connectDB();
    await seedDatabaseCore();
    await closeDB();
    process.exit(0);
  } catch (err) {
    console.error('[Seed] Database seeding failed:', err);
    process.exit(1);
  }
};

// Check if run directly from terminal
if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  runStandalone();
}
