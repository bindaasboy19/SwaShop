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

  log('[Seed] Seeding 6 primary craft & local categories...');
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
  const catJewellery = categories.find((c) => c.slug === 'jewellery-adornments');
  const catDecor = categories.find((c) => c.slug === 'gifts-home-decor');

  log('[Seed] Seeding platform users & 12 artisan/shop profiles across India...');
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

  // 3. Seller B: Sharma Handicrafts (New Delhi - Artisan)
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
      minimumOrderQuantity: 30,
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

  // 4. Seller A: Aarav Gift Shop (New Delhi CP - Local Shop / Reseller)
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

  // 5. Seller C: Kaveri Pottery Works (Noida - Micro Entrepreneur)
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
      productionCapacity: 1200,
      minimumOrderQuantity: 25,
      bulkAvailable: true,
      leadTimeDays: 10,
      businessCategories: ['Pottery & Clayware', 'Gifts & Home Decor'],
      serviceLocations: ['Noida', 'Delhi NCR', 'Lucknow'],
      catalogSummary: 'Terracotta dinnerware sets, handis, and eco-friendly planter pots.'
    },
    isOpen: true,
    logo: 'https://images.unsplash.com/photo-1578749556568-bc2c40e68b61?w=200&auto=format&fit=crop&q=80',
    coverImage: 'https://images.unsplash.com/photo-1565193566173-7a0ee3dbe261?w=800&auto=format&fit=crop&q=80'
  });

  // 6. Seller D: Vedic Roots Organics (Gurugram - MSME)
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
      productionCapacity: 2500,
      minimumOrderQuantity: 30,
      bulkAvailable: true,
      leadTimeDays: 5,
      businessCategories: ['Organic & Spices'],
      serviceLocations: ['Pan India', 'Delhi NCR'],
      catalogSummary: 'Bulk unprocessed forest honey, cold-pressed oils, and Lakadong turmeric.'
    },
    isOpen: true,
    logo: 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=200&auto=format&fit=crop&q=80',
    coverImage: 'https://images.unsplash.com/photo-1615485290382-441e4d049cb5?w=800&auto=format&fit=crop&q=80'
  });

  // 7. Seller E: Surabhi Handlooms (Varanasi - Artisan)
  const userSellerE = await User.create({
    name: 'Surabhi Verma',
    email: 'surabhi.weaves@example.com',
    phone: '+91 9876500007',
    passwordHash: defaultPasswordHash,
    role: 'SELLER',
    avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=200&auto=format&fit=crop&q=80',
    isActive: true
  });

  const sellerE = await SellerProfile.create({
    userId: userSellerE._id,
    businessName: 'Surabhi Handloom Weavers',
    sellerType: 'ARTISAN',
    description: 'Hand-woven Varanasi zari stoles, pure katan silk sarees, and organic handspun cotton fabric.',
    category: 'Textiles & Weaves',
    phone: '+91 9876500007',
    address: 'Weavers Lane, Bhelupur',
    city: 'Varanasi',
    state: 'Uttar Pradesh',
    pincode: '221005',
    coordinates: { lat: 25.3176, lng: 82.9739 },
    verificationStatus: 'VERIFIED',
    b2bProfile: {
      enabled: true,
      productionCapacity: 400,
      minimumOrderQuantity: 10,
      bulkAvailable: true,
      leadTimeDays: 20,
      businessCategories: ['Handloom & Textiles'],
      serviceLocations: ['Pan India', 'Varanasi', 'Delhi NCR']
    },
    isOpen: true,
    logo: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=200&auto=format&fit=crop&q=80',
    coverImage: 'https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?w=800&auto=format&fit=crop&q=80'
  });

  // 8. Seller F: Awadh Chikankari Kendra (Lucknow - Artisan)
  const userSellerF = await User.create({
    name: 'Zeenat Fatima',
    email: 'awadh.chikan@example.com',
    phone: '+91 9876500008',
    passwordHash: defaultPasswordHash,
    role: 'SELLER',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80',
    isActive: true
  });

  const sellerF = await SellerProfile.create({
    userId: userSellerF._id,
    businessName: 'Awadh Chikankari Kendra',
    sellerType: 'ARTISAN',
    description: 'Generations of women artisans preserving 32 traditional Lakhnavi needlework stitches and delicate Mukaish work.',
    category: 'Handloom & Textiles',
    phone: '+91 9876500008',
    address: 'Chowk Heritage Bazar, Old City',
    city: 'Lucknow',
    state: 'Uttar Pradesh',
    pincode: '226003',
    coordinates: { lat: 26.8688, lng: 80.9129 },
    businessHours: 'Mon - Sat: 10:30 AM - 8:30 PM',
    verificationStatus: 'VERIFIED',
    b2bProfile: {
      enabled: true,
      productionCapacity: 600,
      minimumOrderQuantity: 15,
      bulkAvailable: true,
      leadTimeDays: 14,
      businessCategories: ['Handloom & Textiles', 'Jewellery & Adornments'],
      serviceLocations: ['Lucknow', 'Pan India']
    },
    isOpen: true,
    logo: 'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?w=200&auto=format&fit=crop&q=80',
    coverImage: 'https://images.unsplash.com/photo-1598300042247-d088f8ab3a91?w=800&auto=format&fit=crop&q=80'
  });

  // 9. Seller G: Jaipur Royal Blue Pottery (Jaipur - Artisan)
  const userSellerG = await User.create({
    name: 'Kripal Singh Rathore',
    email: 'jaipur.bluepottery@example.com',
    phone: '+91 9876500009',
    passwordHash: defaultPasswordHash,
    role: 'SELLER',
    avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=200&auto=format&fit=crop&q=80',
    isActive: true
  });

  const sellerG = await SellerProfile.create({
    userId: userSellerG._id,
    businessName: 'Jaipur Royal Blue Pottery',
    sellerType: 'ARTISAN',
    description: 'GI-tagged authentic Jaipur quartz blue pottery. Ceramic mugs, floral wall plates, and handcrafted tile decor.',
    category: 'Pottery & Ceramics',
    phone: '+91 9876500009',
    address: 'Kripal Kumbh Lane, Bani Park',
    city: 'Jaipur',
    state: 'Rajasthan',
    pincode: '302016',
    coordinates: { lat: 26.9260, lng: 75.7924 },
    businessHours: 'Mon - Sat: 10:00 AM - 7:30 PM',
    verificationStatus: 'VERIFIED',
    b2bProfile: {
      enabled: true,
      productionCapacity: 800,
      minimumOrderQuantity: 20,
      bulkAvailable: true,
      leadTimeDays: 12,
      businessCategories: ['Pottery & Clayware', 'Gifts & Home Decor']
    },
    isOpen: true,
    logo: 'https://images.unsplash.com/photo-1578749556568-bc2c40e68b61?w=200&auto=format&fit=crop&q=80',
    coverImage: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=800&auto=format&fit=crop&q=80'
  });

  // 10. Seller H: Saharanpur Carved Wood Heritage (Saharanpur - MSME)
  const userSellerH = await User.create({
    name: 'Mohammad Haroon',
    email: 'saharanpur.woodcraft@example.com',
    phone: '+91 9876500010',
    passwordHash: defaultPasswordHash,
    role: 'SELLER',
    avatar: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=200&auto=format&fit=crop&q=80',
    isActive: true
  });

  const sellerH = await SellerProfile.create({
    userId: userSellerH._id,
    businessName: 'Saharanpur Woodcraft Studio',
    sellerType: 'MSME',
    description: 'Acclaimed carved Sheesham wood screens, brass inlay platters, and vintage spice boxes hand-chiseled by hereditary master carvers.',
    category: 'Handicrafts & Woodcraft',
    phone: '+91 9876500010',
    address: 'Wood Artisans Hub, Court Road',
    city: 'Saharanpur',
    state: 'Uttar Pradesh',
    pincode: '247001',
    coordinates: { lat: 29.9679, lng: 77.5510 },
    businessHours: 'Mon - Sat: 9:00 AM - 8:00 PM',
    verificationStatus: 'VERIFIED',
    b2bProfile: {
      enabled: true,
      productionCapacity: 1000,
      minimumOrderQuantity: 20,
      bulkAvailable: true,
      leadTimeDays: 15,
      businessCategories: ['Handicrafts & Bamboo', 'Gifts & Home Decor']
    },
    isOpen: true,
    logo: 'https://images.unsplash.com/photo-1589829085413-56de8ae18c73?w=200&auto=format&fit=crop&q=80',
    coverImage: 'https://images.unsplash.com/photo-1590736969955-71cc94801759?w=800&auto=format&fit=crop&q=80'
  });

  // 11. Seller I: Bastar Dhokra Tribal Arts (Raipur - Artisan)
  const userSellerI = await User.create({
    name: 'Budhram Mandavi',
    email: 'bastar.dhokra@example.com',
    phone: '+91 9876500011',
    passwordHash: defaultPasswordHash,
    role: 'SELLER',
    avatar: 'https://images.unsplash.com/photo-1501196354995-cbb51c65aaea?w=200&auto=format&fit=crop&q=80',
    isActive: true
  });

  const sellerI = await SellerProfile.create({
    userId: userSellerI._id,
    businessName: 'Bastar Dhokra Tribal Arts',
    sellerType: 'ARTISAN',
    description: '4,000-year-old ancient lost-wax bell metal craft. Tribal figurines, sacred animal totems, and cast brass adornments.',
    category: 'Jewellery & Adornments',
    phone: '+91 9876500011',
    address: 'Shilpgram Craft Complex, Telibandha',
    city: 'Raipur',
    state: 'Chhattisgarh',
    pincode: '492001',
    coordinates: { lat: 21.2514, lng: 81.6296 },
    businessHours: 'Mon - Sun: 10:00 AM - 7:00 PM',
    verificationStatus: 'VERIFIED',
    b2bProfile: {
      enabled: true,
      productionCapacity: 450,
      minimumOrderQuantity: 15,
      bulkAvailable: true,
      leadTimeDays: 18,
      businessCategories: ['Jewellery & Adornments', 'Gifts & Home Decor']
    },
    isOpen: true,
    logo: 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=200&auto=format&fit=crop&q=80',
    coverImage: 'https://images.unsplash.com/photo-1578749556568-bc2c40e68b61?w=800&auto=format&fit=crop&q=80'
  });

  // 12. Seller J: Bhadohi Heritage Carpets & Dhurries (Bhadohi - Artisan)
  const userSellerJ = await User.create({
    name: 'Radheshyam Ansari',
    email: 'bhadohi.rugs@example.com',
    phone: '+91 9876500012',
    passwordHash: defaultPasswordHash,
    role: 'SELLER',
    avatar: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=200&auto=format&fit=crop&q=80',
    isActive: true
  });

  const sellerJ = await SellerProfile.create({
    userId: userSellerJ._id,
    businessName: 'Bhadohi Heritage Carpets',
    sellerType: 'ARTISAN',
    description: 'Capital of Indian hand-knotted carpets. Pure wool area rugs, reversible cotton flatweaves, and natural jute floor runners.',
    category: 'Handloom & Textiles',
    phone: '+91 9876500012',
    address: 'Carpet City Road, Maryadpatti',
    city: 'Bhadohi',
    state: 'Uttar Pradesh',
    pincode: '221401',
    coordinates: { lat: 25.4057, lng: 82.5694 },
    businessHours: 'Mon - Sat: 9:30 AM - 7:00 PM',
    verificationStatus: 'VERIFIED',
    b2bProfile: {
      enabled: true,
      productionCapacity: 300,
      minimumOrderQuantity: 8,
      bulkAvailable: true,
      leadTimeDays: 25,
      businessCategories: ['Handloom & Textiles']
    },
    isOpen: true,
    logo: 'https://images.unsplash.com/photo-1600121848594-d8644e57abab?w=200&auto=format&fit=crop&q=80',
    coverImage: 'https://images.unsplash.com/photo-1582533561751-ef6f6ab93a2e?w=800&auto=format&fit=crop&q=80'
  });

  // 13. Seller K: Kashmir Valley Pashmina & Crafts (Srinagar - Artisan)
  const userSellerK = await User.create({
    name: 'Ghulam Mohammad Mir',
    email: 'kashmir.valley@example.com',
    phone: '+91 9876500013',
    passwordHash: defaultPasswordHash,
    role: 'SELLER',
    avatar: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=200&auto=format&fit=crop&q=80',
    isActive: true
  });

  const sellerK = await SellerProfile.create({
    userId: userSellerK._id,
    businessName: 'Kashmir Valley Crafts & Pashmina',
    sellerType: 'ARTISAN',
    description: 'Charkha-spun Cashmere Pashmina, fine papier-mâché jewelry boxes, and seasoned walnut wood carvings from Srinagar.',
    category: 'Handloom & Textiles',
    phone: '+91 9876500013',
    address: 'Old City Zaina Kadal',
    city: 'Srinagar',
    state: 'Jammu and Kashmir',
    pincode: '190002',
    coordinates: { lat: 34.0837, lng: 74.7973 },
    businessHours: 'Mon - Sun: 10:00 AM - 7:00 PM',
    verificationStatus: 'VERIFIED',
    b2bProfile: {
      enabled: true,
      productionCapacity: 250,
      minimumOrderQuantity: 5,
      bulkAvailable: true,
      leadTimeDays: 21,
      businessCategories: ['Handloom & Textiles', 'Gifts & Home Decor']
    },
    isOpen: true,
    logo: 'https://images.unsplash.com/photo-1520903920243-00d872a2d1c9?w=200&auto=format&fit=crop&q=80',
    coverImage: 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=800&auto=format&fit=crop&q=80'
  });

  // 14. Seller L: Malabar Coast Spices & Plantation (Kochi - Local Shop)
  const userSellerL = await User.create({
    name: 'Devadas Nambiar',
    email: 'malabar.spices@example.com',
    phone: '+91 9876500014',
    passwordHash: defaultPasswordHash,
    role: 'SELLER',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&auto=format&fit=crop&q=80',
    isActive: true
  });

  const sellerL = await SellerProfile.create({
    userId: userSellerL._id,
    businessName: 'Malabar Coast Spices & Plantation',
    sellerType: 'LOCAL_SHOP',
    description: 'Direct plantation harvest: Tellicherry extra bold black pepper, Idukki green cardamom, Ceylon cinnamon, and extra virgin coconut oil.',
    category: 'Organic Foods & Wellness',
    phone: '+91 9876500014',
    address: 'Spice Market, Jew Town, Mattancherry',
    city: 'Kochi',
    state: 'Kerala',
    pincode: '682002',
    coordinates: { lat: 9.9578, lng: 76.2599 },
    businessHours: 'Mon - Sat: 9:00 AM - 8:00 PM',
    verificationStatus: 'APPROVED',
    b2bProfile: {
      enabled: true,
      productionCapacity: 3000,
      minimumOrderQuantity: 30,
      bulkAvailable: true,
      leadTimeDays: 7,
      businessCategories: ['Organic & Spices'],
      serviceLocations: ['Pan India', 'Kerala']
    },
    isOpen: true,
    logo: 'https://images.unsplash.com/photo-1509358271058-acd22cc93898?w=200&auto=format&fit=crop&q=80',
    coverImage: 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=800&auto=format&fit=crop&q=80'
  });

  log('[Seed] Seeding 48 rich handcrafted products across all artisan shops...');

  // --- Category 1: Handicrafts & Bamboo ---
  const bambooBasket = await Product.create({
    sellerId: sellerB._id,
    name: 'Handmade Bamboo Storage Basket',
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
    discountPrice: 320,
    availability: true,
    stockStatus: 'AVAILABLE',
    availabilityStatus: 'AVAILABLE',
    quantityAvailable: 90,
    b2b: {
      enabled: true,
      minOrderQuantity: 25,
      bulkPrice: 280,
      productionCapacity: 800,
      leadTimeDays: 7
    },
    tags: ['cane', 'tray', 'serving', 'handicraft', 'eco-friendly'],
    keywords: ['cane tray', 'serving basket', 'handmade tableware'],
    features: ['Lightweight woven cane', 'Food-safe water-resistant polish', 'Reinforced borders'],
    isPublished: true,
    isActive: true,
    views: 120,
    favouriteCount: 8
  });

  const windChime = await Product.create({
    sellerId: sellerB._id,
    name: 'Melodious Bamboo Wind Chime',
    description: 'Traditional 6-tube tuned bamboo chime creating soothing, earthy acoustic tones for balconies, gardens, and patios.',
    categoryId: catBamboo._id,
    images: ['https://images.unsplash.com/photo-1518895949257-7621c3c786d7?w=800&auto=format&fit=crop&q=80'],
    price: 450,
    discountPrice: 399,
    availability: true,
    stockStatus: 'AVAILABLE',
    availabilityStatus: 'AVAILABLE',
    quantityAvailable: 60,
    b2b: {
      enabled: true,
      minOrderQuantity: 30,
      bulkPrice: 340,
      productionCapacity: 500,
      leadTimeDays: 10
    },
    tags: ['windchime', 'bamboo', 'garden', 'decor', 'handcrafted'],
    keywords: ['wind chime', 'bamboo decor', 'zen garden', 'balcony acoustic'],
    features: ['Tuned hollow bamboo tubes', 'Weather-treated coconut shell canopy', 'Calming meditative tone'],
    isPublished: true,
    isActive: true,
    views: 85,
    favouriteCount: 5
  });

  const bambooDeskOrganizer = await Product.create({
    sellerId: sellerB._id,
    name: 'Woven Bamboo Desktop Stationery Caddy',
    description: 'Multi-compartment eco-desk organizer handwoven from seasoned golden bamboo. Holds pens, scissors, phone, and notepads sustainably.',
    categoryId: catBamboo._id,
    images: ['https://images.unsplash.com/photo-1544717305-2782549b5136?w=800&auto=format&fit=crop&q=80'],
    price: 299,
    discountPrice: 260,
    availability: true,
    stockStatus: 'AVAILABLE',
    availabilityStatus: 'AVAILABLE',
    quantityAvailable: 110,
    b2b: {
      enabled: true,
      minOrderQuantity: 40,
      bulkPrice: 210,
      productionCapacity: 900,
      leadTimeDays: 8
    },
    tags: ['bamboo', 'organizer', 'office', 'sustainable', 'desk'],
    keywords: ['desk organizer', 'bamboo pen stand', 'corporate eco stationery'],
    features: ['3 functional dividers', 'Sturdy woven bottom', 'Zero plastic construction'],
    isPublished: true,
    isActive: true,
    views: 140,
    favouriteCount: 11
  });

  const carvedBookRest = await Product.create({
    sellerId: sellerH._id,
    name: 'Carved Sheesham Wood Foldable Book Rest (Rehal)',
    description: 'Intricately lattice-carved single-piece Sheesham hardwood foldable stand for Holy books, recipe manuals, and tablets.',
    categoryId: catBamboo._id,
    images: ['https://images.unsplash.com/photo-1589829085413-56de8ae18c73?w=800&auto=format&fit=crop&q=80'],
    price: 650,
    discountPrice: 599,
    availability: true,
    stockStatus: 'AVAILABLE',
    availabilityStatus: 'AVAILABLE',
    quantityAvailable: 45,
    b2b: {
      enabled: true,
      minOrderQuantity: 20,
      bulkPrice: 480,
      productionCapacity: 600,
      leadTimeDays: 14
    },
    tags: ['woodcraft', 'sheesham', 'carving', 'rehal', 'reading', 'saharanpur'],
    keywords: ['wooden rehal', 'book stand', 'sheesham handicraft', 'prayer stand'],
    features: ['Carved from a single wood block', 'Intricate floral jali openwork', 'Folds flat for compact storage'],
    isPublished: true,
    isActive: true,
    views: 165,
    favouriteCount: 14
  });

  const woodenSpiceBox = await Product.create({
    sellerId: sellerH._id,
    name: 'Hand-Carved Wooden Spice Box with Brass Latch',
    description: '9-compartment artisan masala daani crafted from seasoned Indian rosewood with a glass viewing lid and solid antique brass clasp.',
    categoryId: catBamboo._id,
    images: ['https://images.unsplash.com/photo-1590736969955-71cc94801759?w=800&auto=format&fit=crop&q=80'],
    price: 1199,
    discountPrice: 999,
    availability: true,
    stockStatus: 'AVAILABLE',
    availabilityStatus: 'AVAILABLE',
    quantityAvailable: 35,
    b2b: {
      enabled: true,
      minOrderQuantity: 15,
      bulkPrice: 820,
      productionCapacity: 400,
      leadTimeDays: 12
    },
    tags: ['woodcraft', 'spicebox', 'masala-box', 'kitchen', 'brass-inlay'],
    keywords: ['wooden masala daani', 'spice storage box', 'traditional kitchenware'],
    features: ['9 removable spice cups', 'Hand-fitted clear glass lid', 'Treated with food-grade walnut oil'],
    isPublished: true,
    isActive: true,
    views: 280,
    favouriteCount: 22
  });

  const brassInlayPlatter = await Product.create({
    sellerId: sellerH._id,
    name: 'Brass Inlay Floral Sheesham Serving Platter',
    description: 'Hand-embedded floral brass wire (Tarkashi work) on rich walnut-finished Sheesham wood. Treated with food-safe natural oil.',
    categoryId: catBamboo._id,
    images: ['https://images.unsplash.com/photo-1615485290382-441e4d049cb5?w=800&auto=format&fit=crop&q=80'],
    price: 850,
    discountPrice: 750,
    availability: true,
    stockStatus: 'AVAILABLE',
    availabilityStatus: 'AVAILABLE',
    quantityAvailable: 50,
    b2b: {
      enabled: true,
      minOrderQuantity: 20,
      bulkPrice: 620,
      productionCapacity: 500,
      leadTimeDays: 14
    },
    tags: ['platter', 'brass-inlay', 'serving-tray', 'handcrafted-wood', 'dining'],
    keywords: ['tarkashi platter', 'wooden serving tray', 'brass wood decor'],
    features: ['Hand-hammered brass wire inlay', 'Water-resistant natural finish', 'Dual carved side handles'],
    isPublished: true,
    isActive: true,
    views: 190,
    favouriteCount: 16
  });

  const walnutFruitBowl = await Product.create({
    sellerId: sellerK._id,
    name: 'Hand-Carved Kashmiri Walnut Wood Dry Fruit Bowl',
    description: 'Distinctive chinar-leaf relief carving sculpted by master woodturners of Srinagar from cured high-altitude walnut wood.',
    categoryId: catBamboo._id,
    images: ['https://images.unsplash.com/photo-1605648916361-9bc12ad6a569?w=800&auto=format&fit=crop&q=80'],
    price: 1450,
    discountPrice: 1299,
    availability: true,
    stockStatus: 'AVAILABLE',
    availabilityStatus: 'AVAILABLE',
    quantityAvailable: 25,
    b2b: {
      enabled: true,
      minOrderQuantity: 10,
      bulkPrice: 1050,
      productionCapacity: 250,
      leadTimeDays: 18
    },
    tags: ['walnut-wood', 'kashmir', 'carved-bowl', 'dry-fruit', 'luxury-craft'],
    keywords: ['walnut wood bowl', 'kashmiri carving', 'centerpiece bowl'],
    features: ['100% natural seasoned Kashmiri walnut', 'Hand-carved Chinar leaf motif', 'Silky hand-waxed lustre'],
    isPublished: true,
    isActive: true,
    views: 215,
    favouriteCount: 19
  });

  // --- Category 2: Handloom & Textiles ---
  const silkStole = await Product.create({
    sellerId: sellerE._id,
    name: 'Varanasi Pure Silk Brocade Stole',
    description: 'Exquisite hand-woven gold zari floral motifs on crimson katan silk. Lightweight and royal bridal party wear.',
    categoryId: catTextiles._id,
    images: ['https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=800&auto=format&fit=crop&q=80'],
    price: 2499,
    discountPrice: 2199,
    availability: true,
    stockStatus: 'AVAILABLE',
    availabilityStatus: 'AVAILABLE',
    quantityAvailable: 40,
    b2b: {
      enabled: true,
      minOrderQuantity: 10,
      bulkPrice: 1750,
      productionCapacity: 400,
      leadTimeDays: 20
    },
    tags: ['handloom', 'silk', 'stole', 'zari', 'varanasi', 'festive'],
    keywords: ['banarasi stole', 'silk dupatta', 'zari wrap', 'wedding stole'],
    features: ['Pure mulberry katan silk base', 'Hand-woven tested gold zari bootis', 'Silk Mark certified quality'],
    isPublished: true,
    isActive: true,
    views: 210,
    favouriteCount: 19
  });

  const banarasiSaree = await Product.create({
    sellerId: sellerE._id,
    name: 'Handwoven Banarasi Katan Silk Saree in Emerald Green',
    description: 'Traditional Kadwa weave Banarasi saree featuring intricate floral jaal woven with tested pure gold and silver zari.',
    categoryId: catTextiles._id,
    images: ['https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?w=800&auto=format&fit=crop&q=80'],
    price: 6499,
    discountPrice: 5800,
    availability: true,
    stockStatus: 'AVAILABLE',
    availabilityStatus: 'AVAILABLE',
    quantityAvailable: 15,
    b2b: {
      enabled: true,
      minOrderQuantity: 5,
      bulkPrice: 4600,
      productionCapacity: 120,
      leadTimeDays: 25
    },
    tags: ['saree', 'banarasi', 'katan-silk', 'handloom', 'wedding-wear'],
    keywords: ['bridal banarasi saree', 'pure silk saree', 'varanasi katan saree'],
    features: ['Genuine Kadwa handloom weave', 'Unstitched matching blouse piece included', 'Grand zari pallu with meenakari accents'],
    isPublished: true,
    isActive: true,
    views: 340,
    favouriteCount: 28
  });

  const indigoKhadiDupatta = await Product.create({
    sellerId: sellerE._id,
    name: 'Natural Indigo Dyed Khadi Cotton Dupatta',
    description: 'Hand-spun and hand-woven 100% organic khadi cotton scarf patterned with authentic vegetable indigo mud-resist block prints.',
    categoryId: catTextiles._id,
    images: ['https://images.unsplash.com/photo-1606760227091-3dd870d97f1d?w=800&auto=format&fit=crop&q=80'],
    price: 799,
    discountPrice: 699,
    availability: true,
    stockStatus: 'AVAILABLE',
    availabilityStatus: 'AVAILABLE',
    quantityAvailable: 70,
    b2b: {
      enabled: true,
      minOrderQuantity: 25,
      bulkPrice: 520,
      productionCapacity: 600,
      leadTimeDays: 10
    },
    tags: ['khadi', 'cotton', 'indigo', 'organic-textile', 'dupatta', 'summer'],
    keywords: ['indigo khadi scarf', 'natural dye dupatta', 'handspun cotton wrap'],
    features: ['100% breathable organic khadi', 'Natural plant-based indigo dye', 'Hand-knotted tassel fringe borders'],
    isPublished: true,
    isActive: true,
    views: 175,
    favouriteCount: 15
  });

  const chikanKurta = await Product.create({
    sellerId: sellerF._id,
    name: 'Authentic Lakhnavi Chikankari Pure Georgette Kurta',
    description: 'Hand-embroidered with 32 traditional stitches (Bakhiya, Phanda, Keel Kangan) on soft pastel georgette with matching slip.',
    categoryId: catTextiles._id,
    images: ['https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?w=800&auto=format&fit=crop&q=80'],
    price: 1899,
    discountPrice: 1650,
    availability: true,
    stockStatus: 'AVAILABLE',
    availabilityStatus: 'AVAILABLE',
    quantityAvailable: 45,
    b2b: {
      enabled: true,
      minOrderQuantity: 15,
      bulkPrice: 1300,
      productionCapacity: 500,
      leadTimeDays: 14
    },
    tags: ['chikankari', 'lucknow', 'kurta', 'hand-embroidered', 'ethnic-wear'],
    keywords: ['lucknowi chikan kurta', 'georgette chikankari', 'handmade kurta'],
    features: ['GI-certified authentic Lucknow craft', 'Intricate shadow work embroidery', 'Lightweight and skin-friendly'],
    isPublished: true,
    isActive: true,
    views: 310,
    favouriteCount: 26
  });

  const mukaishStole = await Product.create({
    sellerId: sellerF._id,
    name: 'Mukaish Work Chanderi Silk Stole in Pearl White',
    description: 'Royal silver wire Mukaish badla dots hand-hammered onto lightweight Chanderi silk fabric with tasselled edges.',
    categoryId: catTextiles._id,
    images: ['https://images.unsplash.com/photo-1598300042247-d088f8ab3a91?w=800&auto=format&fit=crop&q=80'],
    price: 1499,
    discountPrice: 1350,
    availability: true,
    stockStatus: 'AVAILABLE',
    availabilityStatus: 'AVAILABLE',
    quantityAvailable: 35,
    b2b: {
      enabled: true,
      minOrderQuantity: 20,
      bulkPrice: 1050,
      productionCapacity: 450,
      leadTimeDays: 15
    },
    tags: ['mukaish', 'chanderi', 'stole', 'lucknow-craft', 'festive-wrap'],
    keywords: ['mukaish badla stole', 'chanderi wrap', 'silver dot scarf'],
    features: ['Real flattened metallic wire work', 'Semi-sheer lustrous Chanderi texture', 'Drapes elegantly for evening soirees'],
    isPublished: true,
    isActive: true,
    views: 160,
    favouriteCount: 13
  });

  const pashminaShawl = await Product.create({
    sellerId: sellerK._id,
    name: 'Hand-Spun Pure Kashmiri Pashmina Cashmere Shawl',
    description: 'Ultra-soft, lightweight Changthangi mountain cashmere handspun on spinning wheels (charkha) and woven by valley masters. Passes the ring test effortlessly.',
    categoryId: catTextiles._id,
    images: ['https://images.unsplash.com/photo-1520903920243-00d872a2d1c9?w=800&auto=format&fit=crop&q=80'],
    price: 7999,
    discountPrice: 7200,
    availability: true,
    stockStatus: 'AVAILABLE',
    availabilityStatus: 'AVAILABLE',
    quantityAvailable: 12,
    b2b: {
      enabled: true,
      minOrderQuantity: 5,
      bulkPrice: 5800,
      productionCapacity: 80,
      leadTimeDays: 24
    },
    tags: ['pashmina', 'cashmere', 'kashmir-shawl', 'luxury', 'handwoven'],
    keywords: ['pure pashmina shawl', 'cashmere wrap', 'kashmir handloom'],
    features: ['Genuine 100% Changthangi goat fiber (under 14 microns)', 'Feather-light warmth', 'Classic natural fawn hue with open fringe'],
    isPublished: true,
    isActive: true,
    views: 420,
    favouriteCount: 35
  });

  const woolRug = await Product.create({
    sellerId: sellerJ._id,
    name: 'Hand-Knotted New Zealand Wool Area Rug (4x6 ft)',
    description: 'Artisan hand-knotted wool rug with geometric Mughal trellis patterns. Dense plush pile, naturally dyed, and stain-resistant.',
    categoryId: catTextiles._id,
    images: ['https://images.unsplash.com/photo-1600121848594-d8644e57abab?w=800&auto=format&fit=crop&q=80'],
    price: 4899,
    discountPrice: 4400,
    availability: true,
    stockStatus: 'AVAILABLE',
    availabilityStatus: 'AVAILABLE',
    quantityAvailable: 18,
    b2b: {
      enabled: true,
      minOrderQuantity: 8,
      bulkPrice: 3400,
      productionCapacity: 150,
      leadTimeDays: 25
    },
    tags: ['carpet', 'rug', 'bhadohi', 'wool-rug', 'home-furnishing', 'living-room'],
    keywords: ['bhadohi carpet', 'hand-knotted rug', 'wool area rug', 'geometric carpet'],
    features: ['High-density knotting (over 120 knots/sq inch)', 'Resilient blend of Indian and NZ wool', 'Reinforced hand-bound selvedge'],
    isPublished: true,
    isActive: true,
    views: 290,
    favouriteCount: 23
  });

  const juteDhurrie = await Product.create({
    sellerId: sellerJ._id,
    name: 'Handwoven Natural Jute & Recycled Cotton Floor Dhurrie',
    description: 'Eco-friendly reversible flatweave runner combining golden Bengal jute and soft unbleached cotton yarn for high-traffic hallways.',
    categoryId: catTextiles._id,
    images: ['https://images.unsplash.com/photo-1582533561751-ef6f6ab93a2e?w=800&auto=format&fit=crop&q=80'],
    price: 1250,
    discountPrice: 1099,
    availability: true,
    stockStatus: 'AVAILABLE',
    availabilityStatus: 'AVAILABLE',
    quantityAvailable: 65,
    b2b: {
      enabled: true,
      minOrderQuantity: 20,
      bulkPrice: 850,
      productionCapacity: 500,
      leadTimeDays: 12
    },
    tags: ['dhurrie', 'jute-rug', 'floor-runner', 'boho-decor', 'sustainable'],
    keywords: ['jute runner', 'flatweave dhurrie', 'reversible rug', 'entryway carpet'],
    features: ['Reversible double-sided weave', 'Naturally anti-static and durable', 'Non-toxic, bio-degradable fibers'],
    isPublished: true,
    isActive: true,
    views: 180,
    favouriteCount: 14
  });

  // --- Category 3: Organic & Spices ---
  const wildHoney = await Product.create({
    sellerId: sellerD._id,
    name: 'Raw Himalayan Multiflora Wild Forest Honey (500g)',
    description: 'Unpasteurized, unprocessed raw honey harvested by tribal foragers from high-altitude Himalayan pine and rhododendron forests. Rich in natural pollens and enzymes.',
    categoryId: catOrganic._id,
    images: ['https://images.unsplash.com/photo-1587049352846-4a222e784d38?w=800&auto=format&fit=crop&q=80'],
    price: 450,
    discountPrice: 399,
    availability: true,
    stockStatus: 'AVAILABLE',
    availabilityStatus: 'AVAILABLE',
    quantityAvailable: 200,
    b2b: {
      enabled: true,
      minOrderQuantity: 40,
      bulkPrice: 310,
      productionCapacity: 2500,
      leadTimeDays: 5
    },
    tags: ['honey', 'organic', 'raw-honey', 'immunity', 'himalayan', 'wellness'],
    keywords: ['wild forest honey', 'raw unpasteurized honey', 'himalayan honey'],
    features: ['Single-source wild beehives', 'Zero added sugar or heat treatment', 'Naturally crystallizing raw purity'],
    isPublished: true,
    isActive: true,
    views: 310,
    favouriteCount: 25
  });

  const lakadongTurmeric = await Product.create({
    sellerId: sellerD._id,
    name: 'Organic Lakadong Turmeric Powder (7% Curcumin, 250g)',
    description: 'Sourced from the Jaintia Hills of Meghalaya. World highest curcumin content (7-8%) with deep golden colour and potent anti-inflammatory properties.',
    categoryId: catOrganic._id,
    images: ['https://images.unsplash.com/photo-1615485290382-441e4d049cb5?w=800&auto=format&fit=crop&q=80'],
    price: 320,
    discountPrice: 280,
    availability: true,
    stockStatus: 'AVAILABLE',
    availabilityStatus: 'AVAILABLE',
    quantityAvailable: 180,
    b2b: {
      enabled: true,
      minOrderQuantity: 50,
      bulkPrice: 210,
      productionCapacity: 2000,
      leadTimeDays: 5
    },
    tags: ['turmeric', 'curcumin', 'lakadong', 'spices', 'organic-spices'],
    keywords: ['lakadong haldi', 'high curcumin turmeric', 'meghalaya turmeric powder'],
    features: ['High 7.5% natural curcumin value', 'Cold-ground without burning oils', 'Chemical and heavy metal tested'],
    isPublished: true,
    isActive: true,
    views: 220,
    favouriteCount: 17
  });

  const mustardOil = await Product.create({
    sellerId: sellerD._id,
    name: 'Wood Cold-Pressed Yellow Mustard Oil (Kachi Ghani, 1 Litre)',
    description: 'Traditional slow wooden churner (kolhu) extraction at below 40°C. Retains natural pungency, healthy fats, and antioxidants without chemicals.',
    categoryId: catOrganic._id,
    images: ['https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=800&auto=format&fit=crop&q=80'],
    price: 360,
    discountPrice: 325,
    availability: true,
    stockStatus: 'AVAILABLE',
    availabilityStatus: 'AVAILABLE',
    quantityAvailable: 140,
    b2b: {
      enabled: true,
      minOrderQuantity: 30,
      bulkPrice: 250,
      productionCapacity: 1500,
      leadTimeDays: 6
    },
    tags: ['mustard-oil', 'cold-pressed', 'kachi-ghani', 'cooking-oil', 'organic'],
    keywords: ['cold pressed mustard oil', 'wood pressed sarson tel', 'kachi ghani oil'],
    features: ['Pure wooden press extraction', 'Authentic aroma and natural pungency', 'Rich in Omega-3 and Vitamin E'],
    isPublished: true,
    isActive: true,
    views: 195,
    favouriteCount: 14
  });

  const chilliFlakes = await Product.create({
    sellerId: sellerD._id,
    name: 'Stone-Pounded Kashmiri Red Chilli Flakes (200g)',
    description: 'Sun-dried mild Kashmiri peppers hand-pounded in stone mortars. Imparts radiant red curry color without pungent burning heat.',
    categoryId: catOrganic._id,
    images: ['https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=800&auto=format&fit=crop&q=80'],
    price: 260,
    discountPrice: 230,
    availability: true,
    stockStatus: 'AVAILABLE',
    availabilityStatus: 'AVAILABLE',
    quantityAvailable: 160,
    b2b: {
      enabled: true,
      minOrderQuantity: 40,
      bulkPrice: 175,
      productionCapacity: 1800,
      leadTimeDays: 5
    },
    tags: ['chilli', 'kashmiri-mirch', 'spices', 'cooking', 'natural'],
    keywords: ['kashmiri mirch', 'mild red chilli', 'stone ground spices'],
    features: ['Mild heat rating (1500 SHU)', 'Vibrant natural ruby red color', 'Zero artificial dyes or preservatives'],
    isPublished: true,
    isActive: true,
    views: 150,
    favouriteCount: 11
  });

  const tellicherryPepper = await Product.create({
    sellerId: sellerL._id,
    name: 'Tellicherry Extra Bold Whole Black Peppercorns (TGSEB, 250g)',
    description: 'Single-estate handpicked whole black pepper berries sized over 4.75mm from the Malabar coast. Intense floral aroma and clean sharp bite.',
    categoryId: catOrganic._id,
    images: ['https://images.unsplash.com/photo-1509358271058-acd22cc93898?w=800&auto=format&fit=crop&q=80'],
    price: 390,
    discountPrice: 350,
    availability: true,
    stockStatus: 'AVAILABLE',
    availabilityStatus: 'AVAILABLE',
    quantityAvailable: 130,
    b2b: {
      enabled: true,
      minOrderQuantity: 30,
      bulkPrice: 270,
      productionCapacity: 2000,
      leadTimeDays: 7
    },
    tags: ['black-pepper', 'tellicherry', 'malabar', 'whole-spices', 'export-quality'],
    keywords: ['tellicherry peppercorns', 'malabar black pepper', 'grade tgseb pepper'],
    features: ['Grade TGSEB (Tellicherry Garbled Special Extra Bold)', 'Sun-cured on woven bamboo mats', 'High piperine concentration'],
    isPublished: true,
    isActive: true,
    views: 240,
    favouriteCount: 20
  });

  const greenCardamom = await Product.create({
    sellerId: sellerL._id,
    name: 'Organic Green Cardamom Pods from Idukki (8mm Grade, 100g)',
    description: 'Jumbo green cardamom pods harvested from high-elevation shade plantations in Idukki, Kerala. Loaded with essential oils and sweet perfume.',
    categoryId: catOrganic._id,
    images: ['https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=800&auto=format&fit=crop&q=80'],
    price: 420,
    discountPrice: 380,
    availability: true,
    stockStatus: 'AVAILABLE',
    availabilityStatus: 'AVAILABLE',
    quantityAvailable: 110,
    b2b: {
      enabled: true,
      minOrderQuantity: 30,
      bulkPrice: 295,
      productionCapacity: 1200,
      leadTimeDays: 6
    },
    tags: ['cardamom', 'elaichi', 'kerala-spices', 'aromatic', 'organic'],
    keywords: ['green cardamom idukki', 'jumbo elaichi 8mm', 'whole green cardamom'],
    features: ['Bold 8mm+ pod diameter', 'Packed in food-grade resealable aroma lock pouch', 'High cineole essential oil count'],
    isPublished: true,
    isActive: true,
    views: 185,
    favouriteCount: 16
  });

  const ceylonCinnamon = await Product.create({
    sellerId: sellerL._id,
    name: 'Authentic Ceylon Cinnamon Quills (Grade C5, 100g)',
    description: 'True Ceylon cinnamon soft rolled bark quills with delicate sweet flavor, safe low coumarin levels, and fragrant aroma for desserts and tea.',
    categoryId: catOrganic._id,
    images: ['https://images.unsplash.com/photo-1514733670139-4d87a1941d55?w=800&auto=format&fit=crop&q=80'],
    price: 280,
    discountPrice: 250,
    availability: true,
    stockStatus: 'AVAILABLE',
    availabilityStatus: 'AVAILABLE',
    quantityAvailable: 150,
    b2b: {
      enabled: true,
      minOrderQuantity: 40,
      bulkPrice: 190,
      productionCapacity: 1500,
      leadTimeDays: 7
    },
    tags: ['cinnamon', 'dalchini', 'ceylon-cinnamon', 'spices', 'bakery'],
    keywords: ['true ceylon cinnamon', 'dalchini sticks', 'low coumarin cinnamon'],
    features: ['Multi-layered cigar quills', 'Safe ultra-low coumarin level (<0.004%)', 'Sweet aroma without astringency'],
    isPublished: true,
    isActive: true,
    views: 160,
    favouriteCount: 13
  });

  const virginCoconutOil = await Product.create({
    sellerId: sellerL._id,
    name: 'Pure Cold-Pressed Extra Virgin Coconut Oil (500ml Glass Jar)',
    description: 'Fresh raw coconut milk centrifuge extraction within 48 hours of harvest. Pristine aroma, food-grade purity, and deep hair/skin conditioning.',
    categoryId: catOrganic._id,
    images: ['https://images.unsplash.com/photo-1526947425960-945c6e72858f?w=800&auto=format&fit=crop&q=80'],
    price: 340,
    discountPrice: 299,
    availability: true,
    stockStatus: 'AVAILABLE',
    availabilityStatus: 'AVAILABLE',
    quantityAvailable: 175,
    b2b: {
      enabled: true,
      minOrderQuantity: 30,
      bulkPrice: 230,
      productionCapacity: 1800,
      leadTimeDays: 6
    },
    tags: ['coconut-oil', 'extra-virgin', 'kerala', 'wellness', 'skincare', 'edible'],
    keywords: ['virgin coconut oil', 'cold pressed coconut oil', 'kerala edible coconut oil'],
    features: ['Zero heat centrifuge extraction', 'Rich in Lauric acid', 'Raw edible and cosmetic grade'],
    isPublished: true,
    isActive: true,
    views: 230,
    favouriteCount: 19
  });

  // --- Category 4: Pottery & Clayware ---
  const matka = await Product.create({
    sellerId: sellerC._id,
    name: 'Traditional Terracotta Water Pot (Matka with Clay Tap)',
    description: 'Unglazed porous clay pot that naturally cools water through micro-evaporation. Infuses alkaline minerals and comes with food-grade clay spigot.',
    categoryId: catPottery._id,
    images: ['https://images.unsplash.com/photo-1565193566173-7a0ee3dbe261?w=800&auto=format&fit=crop&q=80'],
    price: 450,
    discountPrice: 399,
    availability: true,
    stockStatus: 'AVAILABLE',
    availabilityStatus: 'AVAILABLE',
    quantityAvailable: 80,
    b2b: {
      enabled: true,
      minOrderQuantity: 25,
      bulkPrice: 310,
      productionCapacity: 800,
      leadTimeDays: 10
    },
    tags: ['pottery', 'terracotta', 'matka', 'earthenware', 'kitchen', 'cooling'],
    keywords: ['terracotta water pot', 'cooling clay matka', 'earthen water dispenser'],
    features: ['Natural alkaline balancing', 'Fitted with leak-proof food-grade tap', 'Hand-turned river silt clay'],
    isPublished: true,
    isActive: true,
    views: 260,
    favouriteCount: 21
  });

  const clayHandi = await Product.create({
    sellerId: sellerC._id,
    name: 'Handcrafted Clay Biryani Handi with Lid (2 Litre)',
    description: 'Slow-cooking clay pot pre-seasoned with rice water and mustard oil. Traps steam for fragrant dum cooking on gas stoves or wood fire.',
    categoryId: catPottery._id,
    images: ['https://images.unsplash.com/photo-1610701596007-11502861dcfa?w=800&auto=format&fit=crop&q=80'],
    price: 380,
    discountPrice: 330,
    availability: true,
    stockStatus: 'AVAILABLE',
    availabilityStatus: 'AVAILABLE',
    quantityAvailable: 60,
    b2b: {
      enabled: true,
      minOrderQuantity: 30,
      bulkPrice: 250,
      productionCapacity: 600,
      leadTimeDays: 10
    },
    tags: ['handi', 'terracotta', 'slow-cooking', 'biryani', 'clay-cookware'],
    keywords: ['clay handi', 'dum biryani pot', 'earthen cooking pot'],
    features: ['Even heat distribution', 'Natural moisture circulation', 'Compatible with gas stoves on low flame'],
    isPublished: true,
    isActive: true,
    views: 210,
    favouriteCount: 18
  });

  const chaiKulhadSet = await Product.create({
    sellerId: sellerC._id,
    name: 'Handmade Terracotta Chai Kulhads (Set of 6)',
    description: 'Traditional unglazed earthen tea cups that give street-style masala chai its signature earthy petrichor flavor (saunda swaad).',
    categoryId: catPottery._id,
    images: ['https://images.unsplash.com/photo-1576092768241-dec231879fc3?w=800&auto=format&fit=crop&q=80'],
    price: 240,
    discountPrice: 199,
    availability: true,
    stockStatus: 'AVAILABLE',
    availabilityStatus: 'AVAILABLE',
    quantityAvailable: 150,
    b2b: {
      enabled: true,
      minOrderQuantity: 50,
      bulkPrice: 140,
      productionCapacity: 1500,
      leadTimeDays: 7
    },
    tags: ['kulhad', 'chai', 'terracotta', 'tea-cups', 'clayware'],
    keywords: ['clay chai cups', 'terracotta kulhad set', 'earthen tea mugs'],
    features: ['Set of 6 handcrafted cups (150ml each)', 'Authentic earthy aroma', 'Biodegradable and eco-safe'],
    isPublished: true,
    isActive: true,
    views: 290,
    favouriteCount: 24
  });

  const bonsaiPlanter = await Product.create({
    sellerId: sellerC._id,
    name: 'Rustic Terracotta Bonsai & Succulent Planter',
    description: 'Breathable natural clay shallow planter with bottom drainage hole. Prevents root rot and provides superior aeration for miniature gardens.',
    categoryId: catPottery._id,
    images: ['https://images.unsplash.com/photo-1485955900006-10f4d324d411?w=800&auto=format&fit=crop&q=80'],
    price: 299,
    discountPrice: 250,
    availability: true,
    stockStatus: 'AVAILABLE',
    availabilityStatus: 'AVAILABLE',
    quantityAvailable: 95,
    b2b: {
      enabled: true,
      minOrderQuantity: 40,
      bulkPrice: 190,
      productionCapacity: 900,
      leadTimeDays: 8
    },
    tags: ['planter', 'bonsai', 'terracotta', 'gardening', 'home-decor'],
    keywords: ['terracotta planter', 'bonsai pot', 'succulent clay bowl'],
    features: ['Porous walls prevent waterlogging', 'Pre-drilled center drainage hole', 'Rustic ribbed rim design'],
    isPublished: true,
    isActive: true,
    views: 170,
    favouriteCount: 15
  });

  const bluePotteryMug = await Product.create({
    sellerId: sellerG._id,
    name: 'Jaipur Blue Pottery Glazed Tea Mug (Set of 2)',
    description: 'Hand-molded from Egyptian paste (quartz powder, Fuller earth, and natural gum) without river clay. Glazed with radiant cobalt and turquoise floral motifs.',
    categoryId: catPottery._id,
    images: ['https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=800&auto=format&fit=crop&q=80'],
    price: 680,
    discountPrice: 599,
    availability: true,
    stockStatus: 'AVAILABLE',
    availabilityStatus: 'AVAILABLE',
    quantityAvailable: 45,
    b2b: {
      enabled: true,
      minOrderQuantity: 20,
      bulkPrice: 450,
      productionCapacity: 600,
      leadTimeDays: 12
    },
    tags: ['blue-pottery', 'jaipur', 'ceramic-mug', 'tea-set', 'handpainted'],
    keywords: ['jaipur blue pottery mug', 'quartz ceramic cup', 'floral handpainted mug'],
    features: ['GI-tagged Jaipur blue craft', 'Lead-free food-safe gloss glaze', 'Comfortable ergonomic handle grip'],
    isPublished: true,
    isActive: true,
    views: 320,
    favouriteCount: 27
  });

  const bluePotteryWallPlate = await Product.create({
    sellerId: sellerG._id,
    name: 'Jaipur Blue Pottery Decorative Wall Hanging Plate (10 inch)',
    description: 'Vibrant artisanal quartz plate adorned with Rajasthani peacock and blooming lotus frescoes. Pre-fitted with rear wall mounting hook.',
    categoryId: catPottery._id,
    images: ['https://images.unsplash.com/photo-1578749556568-bc2c40e68b61?w=800&auto=format&fit=crop&q=80'],
    price: 890,
    discountPrice: 799,
    availability: true,
    stockStatus: 'AVAILABLE',
    availabilityStatus: 'AVAILABLE',
    quantityAvailable: 30,
    b2b: {
      enabled: true,
      minOrderQuantity: 15,
      bulkPrice: 600,
      productionCapacity: 400,
      leadTimeDays: 14
    },
    tags: ['wall-plate', 'blue-pottery', 'jaipur-art', 'home-decor', 'peacock'],
    keywords: ['decorative wall plate', 'jaipur blue craft', 'peacock ceramic plate'],
    features: ['Hand-painted with squirrel-hair brushes', 'High gloss glass glaze', 'Includes sturdy pre-attached wall bracket'],
    isPublished: true,
    isActive: true,
    views: 240,
    favouriteCount: 22
  });

  const bluePotteryCoasterSet = await Product.create({
    sellerId: sellerG._id,
    name: 'Hand-Painted Blue Pottery Coaster Set (Set of 4)',
    description: 'Heat-resistant ceramic quartz tile drink coasters with velvet bottom pads to protect delicate wooden and glass tabletops.',
    categoryId: catPottery._id,
    images: ['https://images.unsplash.com/photo-1530595467537-0b5996c41f2d?w=800&auto=format&fit=crop&q=80'],
    price: 420,
    discountPrice: 380,
    availability: true,
    stockStatus: 'AVAILABLE',
    availabilityStatus: 'AVAILABLE',
    quantityAvailable: 75,
    b2b: {
      enabled: true,
      minOrderQuantity: 30,
      bulkPrice: 280,
      productionCapacity: 800,
      leadTimeDays: 10
    },
    tags: ['coasters', 'blue-pottery', 'tableware', 'gift-set', 'jaipur'],
    keywords: ['blue pottery coasters', 'tile drink coasters', 'rajasthani coasters set'],
    features: ['Set of 4 square coasters (3.5 inch)', 'Non-scratch protective felt backing', 'Wipe-clean glazed finish'],
    isPublished: true,
    isActive: true,
    views: 190,
    favouriteCount: 16
  });

  const ceramicRamenBowls = await Product.create({
    sellerId: sellerC._id,
    name: 'Handcrafted Ceramic Ramen & Curry Serving Bowls (Set of 2)',
    description: 'High-fired stoneware bowls with speckled oat matte glaze and deep ribbed exterior. Microwave, dishwasher, and oven safe.',
    categoryId: catPottery._id,
    images: ['https://images.unsplash.com/photo-1610701596007-11502861dcfa?w=800&auto=format&fit=crop&q=80'],
    price: 750,
    discountPrice: 650,
    availability: true,
    stockStatus: 'AVAILABLE',
    availabilityStatus: 'AVAILABLE',
    quantityAvailable: 50,
    b2b: {
      enabled: true,
      minOrderQuantity: 20,
      bulkPrice: 490,
      productionCapacity: 600,
      leadTimeDays: 12
    },
    tags: ['ceramic-bowl', 'stoneware', 'tableware', 'dining', 'kitchen'],
    keywords: ['ceramic ramen bowl', 'stoneware pasta bowl', 'matte glazed ceramic'],
    features: ['800ml deep capacity', 'Chip-resistant durable stoneware', 'Microwave and dishwasher safe'],
    isPublished: true,
    isActive: true,
    views: 180,
    favouriteCount: 15
  });

  // --- Category 5: Jewellery & Adornments ---
  const dhokraNecklace = await Product.create({
    sellerId: sellerI._id,
    name: 'Bastar Dhokra Bell Metal Tribal Choker Necklace',
    description: 'Handcrafted using 4,000-year-old lost-wax casting technique. Features hollow brass beads, geometric tribal spirals, and adjustable hand-spun cotton cord.',
    categoryId: catJewellery._id,
    images: ['https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=800&auto=format&fit=crop&q=80'],
    price: 1250,
    discountPrice: 1099,
    availability: true,
    stockStatus: 'AVAILABLE',
    availabilityStatus: 'AVAILABLE',
    quantityAvailable: 35,
    b2b: {
      enabled: true,
      minOrderQuantity: 15,
      bulkPrice: 820,
      productionCapacity: 350,
      leadTimeDays: 18
    },
    tags: ['dhokra', 'tribal-jewellery', 'brass-necklace', 'bastar-art', 'ethnic'],
    keywords: ['dhokra choker', 'tribal brass necklace', 'bastar bell metal jewellery'],
    features: ['Lost-wax cast bell metal alloy', 'Adjustable braided black cotton cord', 'Authentic GI-registered tribal art'],
    isPublished: true,
    isActive: true,
    views: 295,
    favouriteCount: 26
  });

  const dhokraFishEarrings = await Product.create({
    sellerId: sellerI._id,
    name: 'Dhokra Cast Brass Fish Motif Tribal Earrings',
    description: 'Authentic tribal bell metal earrings depicting the sacred Bastar river fish motif symbolising abundance and fertility.',
    categoryId: catJewellery._id,
    images: ['https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=800&auto=format&fit=crop&q=80'],
    price: 499,
    discountPrice: 440,
    availability: true,
    stockStatus: 'AVAILABLE',
    availabilityStatus: 'AVAILABLE',
    quantityAvailable: 50,
    b2b: {
      enabled: true,
      minOrderQuantity: 25,
      bulkPrice: 320,
      productionCapacity: 500,
      leadTimeDays: 14
    },
    tags: ['earrings', 'dhokra', 'brass', 'tribal-craft', 'handmade-jewellery'],
    keywords: ['dhokra earrings', 'brass fish dangle earrings', 'tribal drop earrings'],
    features: ['Solid cast brass dangling pendant', 'Hypoallergenic surgical steel ear hooks', 'Warm antique bronze patina'],
    isPublished: true,
    isActive: true,
    views: 180,
    favouriteCount: 16
  });

  const terracottaJhumkas = await Product.create({
    sellerId: sellerC._id,
    name: 'Hand-Painted Terracotta Floral Jhumkas',
    description: 'Lightweight fired natural river clay molded into bell jhumkas, hand-painted with acrylic folk motifs and sealed with protective waterproof gloss.',
    categoryId: catJewellery._id,
    images: ['https://images.unsplash.com/photo-1630019852942-f89202989a59?w=800&auto=format&fit=crop&q=80'],
    price: 350,
    discountPrice: 299,
    availability: true,
    stockStatus: 'AVAILABLE',
    availabilityStatus: 'AVAILABLE',
    quantityAvailable: 70,
    b2b: {
      enabled: true,
      minOrderQuantity: 30,
      bulkPrice: 210,
      productionCapacity: 800,
      leadTimeDays: 8
    },
    tags: ['terracotta-jewellery', 'jhumka', 'handpainted', 'ethnic', 'clay-earrings'],
    keywords: ['terracotta jhumka', 'clay earrings', 'handmade floral jhumka'],
    features: ['Ultra-light on earlobes', 'Waterproof sealed lacquer coating', 'Hand-strung tiny golden beads'],
    isPublished: true,
    isActive: true,
    views: 220,
    favouriteCount: 19
  });

  const papierMacheJewelBox = await Product.create({
    sellerId: sellerK._id,
    name: 'Kashmiri Papier-Mache Royal Jewellery Box',
    description: 'Multi-layered recycled paper pulp box painted with miniature bird and floral motifs in pure gold dust ink, finished with rich lacquer.',
    categoryId: catJewellery._id,
    images: ['https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=800&auto=format&fit=crop&q=80'],
    price: 850,
    discountPrice: 750,
    availability: true,
    stockStatus: 'AVAILABLE',
    availabilityStatus: 'AVAILABLE',
    quantityAvailable: 30,
    b2b: {
      enabled: true,
      minOrderQuantity: 20,
      bulkPrice: 580,
      productionCapacity: 350,
      leadTimeDays: 16
    },
    tags: ['papier-mache', 'jewellery-box', 'kashmir-art', 'handpainted', 'gift'],
    keywords: ['kashmiri trinket box', 'papier mache jewellery box', 'handpainted box'],
    features: ['Velvet-lined interior storage', 'Protected with 8 layers of hand-buffed lacquer', 'Gold leaf outlining'],
    isPublished: true,
    isActive: true,
    views: 205,
    favouriteCount: 18
  });

  const glassBeadAnklet = await Product.create({
    sellerId: sellerA._id,
    name: 'Handmade Glass Bead Bohemian Tribal Anklet (Payal)',
    description: 'Vibrant multicolour glass seed beads woven with miniature brass musical bells (ghungroos) on waxed thread.',
    categoryId: catJewellery._id,
    images: ['https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=800&auto=format&fit=crop&q=80'],
    price: 320,
    discountPrice: 280,
    availability: true,
    stockStatus: 'AVAILABLE',
    availabilityStatus: 'AVAILABLE',
    quantityAvailable: 90,
    b2b: {
      enabled: true,
      minOrderQuantity: 40,
      bulkPrice: 190,
      productionCapacity: 1000,
      leadTimeDays: 7
    },
    tags: ['anklet', 'payal', 'tribal-beads', 'ghungroo', 'boho-jewellery'],
    keywords: ['beaded payal', 'boho anklet', 'ghungroo ankle bracelet'],
    features: ['Rust-resistant brass mini bells', 'Adjustable lobster clasp', 'Fade-proof vibrant glass beads'],
    isPublished: true,
    isActive: true,
    views: 170,
    favouriteCount: 14
  });

  const woodenBangles = await Product.create({
    sellerId: sellerH._id,
    name: 'Hand-Carved Wooden Bangle Set (Set of 4)',
    description: 'Natural Sheesham and Haldu wood bangles buffed to a silky sheen with organic beeswax. Hypoallergenic and lightweight.',
    categoryId: catJewellery._id,
    images: ['https://images.unsplash.com/photo-1611591475155-4264754f9349?w=800&auto=format&fit=crop&q=80'],
    price: 450,
    discountPrice: 390,
    availability: true,
    stockStatus: 'AVAILABLE',
    availabilityStatus: 'AVAILABLE',
    quantityAvailable: 60,
    b2b: {
      enabled: true,
      minOrderQuantity: 25,
      bulkPrice: 280,
      productionCapacity: 600,
      leadTimeDays: 10
    },
    tags: ['wooden-bangle', 'sheesham', 'handcrafted-jewellery', 'natural', 'accessories'],
    keywords: ['wooden bangles set', 'sheesham wood bracelets', 'eco friendly jewellery'],
    features: ['Set of 4 smooth wood bangles (2.6 inch size)', 'Beeswax coated chemical-free polish', 'Skin-friendly organic wood'],
    isPublished: true,
    isActive: true,
    views: 140,
    favouriteCount: 11
  });

  const dhokraBrassCuff = await Product.create({
    sellerId: sellerI._id,
    name: 'Tribal Bell Metal Twisted Bangle Bracelet',
    description: 'Heavy solid brass wire hand-coiled by Bastar adivasi metalsmiths into an adjustable statement cuff bracelet.',
    categoryId: catJewellery._id,
    images: ['https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=800&auto=format&fit=crop&q=80'],
    price: 590,
    discountPrice: 520,
    availability: true,
    stockStatus: 'AVAILABLE',
    availabilityStatus: 'AVAILABLE',
    quantityAvailable: 45,
    b2b: {
      enabled: true,
      minOrderQuantity: 20,
      bulkPrice: 380,
      productionCapacity: 400,
      leadTimeDays: 14
    },
    tags: ['cuff-bracelet', 'dhokra', 'brass-bangle', 'tribal', 'statement-jewellery'],
    keywords: ['brass cuff bracelet', 'dhokra bangle', 'tribal metal cuff'],
    features: ['Solid cast brass core', 'Gentle flexibility to fit most wrist sizes', 'Carved geometric rope twist pattern'],
    isPublished: true,
    isActive: true,
    views: 195,
    favouriteCount: 17
  });

  const silkPotliBag = await Product.create({
    sellerId: sellerF._id,
    name: 'Embroidered Silk Potli Bag with Pearl Tassels',
    description: 'Hand-crafted bridal drawstring pouch featuring delicate Zardozi and Chikankari floral bootis with pearl drawstring beads.',
    categoryId: catJewellery._id,
    images: ['https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=800&auto=format&fit=crop&q=80'],
    price: 550,
    discountPrice: 480,
    availability: true,
    stockStatus: 'AVAILABLE',
    availabilityStatus: 'AVAILABLE',
    quantityAvailable: 70,
    b2b: {
      enabled: true,
      minOrderQuantity: 30,
      bulkPrice: 350,
      productionCapacity: 700,
      leadTimeDays: 12
    },
    tags: ['potli', 'silk-bag', 'bridal-accessories', 'chikankari', 'wedding-gift'],
    keywords: ['silk potli bag', 'bridal drawstring purse', 'embroidered potli'],
    features: ['Pure raw silk outer shell', 'Heavy braided golden drawstring cord', 'Cluster pearl latkan hangings'],
    isPublished: true,
    isActive: true,
    views: 240,
    favouriteCount: 21
  });

  // --- Category 6: Gifts & Home Decor ---
  const brassDiya = await Product.create({
    sellerId: sellerA._id,
    name: 'Artisanal Brass Diya Set (Set of 4)',
    description: 'Solid carved brass oil lamps with engraved peacock patterns. Perfect for festivals, rituals, and ambient home lighting.',
    categoryId: catDecor._id,
    images: ['https://images.unsplash.com/photo-1605648916361-9bc12ad6a569?w=800&auto=format&fit=crop&q=80'],
    price: 799,
    discountPrice: 699,
    availability: true,
    stockStatus: 'AVAILABLE',
    availabilityStatus: 'AVAILABLE',
    quantityAvailable: 85,
    b2b: {
      enabled: true,
      minOrderQuantity: 20,
      bulkPrice: 550,
      productionCapacity: 500,
      leadTimeDays: 7
    },
    tags: ['brass', 'diya', 'festive', 'pooja', 'decor', 'gift set'],
    keywords: ['brass diya set', 'peacock oil lamp', 'diwali brass pooja diya'],
    features: ['Solid cast pure brass', 'Heavy non-topple base', 'Deep oil well for long-burning wick'],
    isPublished: true,
    isActive: true,
    views: 195,
    favouriteCount: 14
  });

  const dhokraMusician = await Product.create({
    sellerId: sellerI._id,
    name: 'Bastar Dhokra Lost-Wax Brass Tribal Musician Figurine',
    description: 'Traditional 7-inch bell metal figurine of an Adivasi dholak drummer sculpted using indigenous beeswax thread casting.',
    categoryId: catDecor._id,
    images: ['https://images.unsplash.com/photo-1578749556568-bc2c40e68b61?w=800&auto=format&fit=crop&q=80'],
    price: 1599,
    discountPrice: 1399,
    availability: true,
    stockStatus: 'AVAILABLE',
    availabilityStatus: 'AVAILABLE',
    quantityAvailable: 20,
    b2b: {
      enabled: true,
      minOrderQuantity: 10,
      bulkPrice: 1050,
      productionCapacity: 200,
      leadTimeDays: 20
    },
    tags: ['dhokra-art', 'figurine', 'brass-decor', 'tribal-statue', 'living-room'],
    keywords: ['dhokra sculpture', 'tribal musician idol', 'bastar metal art decor'],
    features: ['One-of-a-kind lost-wax casting', 'Authentic tribal cultural icon', 'Substantial solid metal weight'],
    isPublished: true,
    isActive: true,
    views: 260,
    favouriteCount: 23
  });

  const woodenTeaLight = await Product.create({
    sellerId: sellerH._id,
    name: 'Hand-Carved Wooden Jali Tea Light Candle Holders (Set of 2)',
    description: 'Seasoned mango wood candle cubes with fretwork jali lattice that projects enchanting shadow patterns across walls.',
    categoryId: catDecor._id,
    images: ['https://images.unsplash.com/photo-1513519245088-0e12902e5a38?w=800&auto=format&fit=crop&q=80'],
    price: 499,
    discountPrice: 420,
    availability: true,
    stockStatus: 'AVAILABLE',
    availabilityStatus: 'AVAILABLE',
    quantityAvailable: 80,
    b2b: {
      enabled: true,
      minOrderQuantity: 30,
      bulkPrice: 310,
      productionCapacity: 800,
      leadTimeDays: 10
    },
    tags: ['candle-holder', 'tea-light', 'woodcraft', 'jali', 'ambient-lighting'],
    keywords: ['wooden candle holder', 'jali tea light', 'ambient wooden decor'],
    features: ['Set of 2 interlocking cubes', 'Includes 2 starter tea light candles', 'Carved Mughal lattice design'],
    isPublished: true,
    isActive: true,
    views: 175,
    favouriteCount: 15
  });

  const soyWaxCandle = await Product.create({
    sellerId: sellerA._id,
    name: 'Handcrafted Natural Soy Wax Aromatic Jar Candle (Sandalwood & Jasmine)',
    description: 'Hand-poured 100% natural soy wax candle infused with Mysore sandalwood and night-blooming jasmine essential oils in a reusable amber glass jar.',
    categoryId: catDecor._id,
    images: ['https://images.unsplash.com/photo-1602874801007-bd458bb1b8b6?w=800&auto=format&fit=crop&q=80'],
    price: 399,
    discountPrice: 350,
    availability: true,
    stockStatus: 'AVAILABLE',
    availabilityStatus: 'AVAILABLE',
    quantityAvailable: 110,
    b2b: {
      enabled: true,
      minOrderQuantity: 40,
      bulkPrice: 240,
      productionCapacity: 1200,
      leadTimeDays: 7
    },
    tags: ['candle', 'aromatherapy', 'soy-wax', 'scented-candle', 'home-decor'],
    keywords: ['scented soy candle', 'sandalwood candle', 'aromatherapy candle jar'],
    features: ['Clean soot-free cotton wick', '35+ hours burning time', 'Therapeutic pure botanical extracts'],
    isPublished: true,
    isActive: true,
    views: 230,
    favouriteCount: 19
  });

  const macrameWallHanging = await Product.create({
    sellerId: sellerA._id,
    name: 'Handmade Macrame Cotton Boho Wall Hanging',
    description: 'Intricately knotted natural unbleached cotton rope wall tapestry suspended on a polished rustic driftwood branch.',
    categoryId: catDecor._id,
    images: ['https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=800&auto=format&fit=crop&q=80'],
    price: 699,
    discountPrice: 599,
    availability: true,
    stockStatus: 'AVAILABLE',
    availabilityStatus: 'AVAILABLE',
    quantityAvailable: 45,
    b2b: {
      enabled: true,
      minOrderQuantity: 20,
      bulkPrice: 440,
      productionCapacity: 500,
      leadTimeDays: 12
    },
    tags: ['macrame', 'wall-hanging', 'boho-decor', 'cotton-craft', 'bedroom-decor'],
    keywords: ['macrame tapestry', 'boho wall decor', 'cotton rope wall art'],
    features: ['100% pure twisted cotton yarn', 'Geometric chevron knotting', 'Dimensions: 14 inch wide x 26 inch drop'],
    isPublished: true,
    isActive: true,
    views: 210,
    favouriteCount: 18
  });

  const akhandBrassDiya = await Product.create({
    sellerId: sellerA._id,
    name: 'Traditional Pure Brass Akhand Deep with Glass Chimney',
    description: 'Heavy cast brass perpetual diya equipped with heat-resistant borosilicate glass cover that keeps the sacred flame lit in wind.',
    categoryId: catDecor._id,
    images: ['https://images.unsplash.com/photo-1605648916361-9bc12ad6a569?w=800&auto=format&fit=crop&q=80'],
    price: 950,
    discountPrice: 850,
    availability: true,
    stockStatus: 'AVAILABLE',
    availabilityStatus: 'AVAILABLE',
    quantityAvailable: 40,
    b2b: {
      enabled: true,
      minOrderQuantity: 15,
      bulkPrice: 650,
      productionCapacity: 400,
      leadTimeDays: 8
    },
    tags: ['akhand-diya', 'brass', 'pooja-room', 'temple', 'festive-decor'],
    keywords: ['akhand deepak', 'brass diya glass cover', 'borosilicate akhand diya'],
    features: ['Solid cast brass base and lid', 'Thermal shock proof borosilicate glass', 'Safe continuous indoor burning'],
    isPublished: true,
    isActive: true,
    views: 180,
    favouriteCount: 15
  });

  const papierMacheVase = await Product.create({
    sellerId: sellerK._id,
    name: 'Kashmiri Papier-Mache Hand-Painted Flower Vase (8 inch)',
    description: 'Classic bulbous table vase decorated with elaborate gold-outlined Gul-o-Bulbul Persian floral motifs on imperial blue lacquer.',
    categoryId: catDecor._id,
    images: ['https://images.unsplash.com/photo-1578749556568-bc2c40e68b61?w=800&auto=format&fit=crop&q=80'],
    price: 999,
    discountPrice: 890,
    availability: true,
    stockStatus: 'AVAILABLE',
    availabilityStatus: 'AVAILABLE',
    quantityAvailable: 25,
    b2b: {
      enabled: true,
      minOrderQuantity: 15,
      bulkPrice: 680,
      productionCapacity: 300,
      leadTimeDays: 18
    },
    tags: ['flower-vase', 'papier-mache', 'kashmir', 'tabletop-decor', 'art-piece'],
    keywords: ['kashmiri flower vase', 'papier mache vase', 'persian floral vase'],
    features: ['Handcrafted from cured paper pulp', 'Water-resistant inner cavity', 'Stunning decorative mantelpiece accent'],
    isPublished: true,
    isActive: true,
    views: 195,
    favouriteCount: 16
  });

  const bambooCeilingLamp = await Product.create({
    sellerId: sellerB._id,
    name: 'Handcrafted Bamboo Pendant Ceiling Lampshade',
    description: 'Cylindrical woven cane hanging lamp shade designed to cast warm geometric light rays over dining tables and cafes.',
    categoryId: catBamboo._id,
    images: ['https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=800&auto=format&fit=crop&q=80'],
    price: 850,
    discountPrice: 750,
    availability: true,
    stockStatus: 'AVAILABLE',
    availabilityStatus: 'AVAILABLE',
    quantityAvailable: 45,
    b2b: {
      enabled: true,
      minOrderQuantity: 20,
      bulkPrice: 560,
      productionCapacity: 500,
      leadTimeDays: 12
    },
    tags: ['bamboo-lamp', 'lampshade', 'lighting', 'eco-friendly', 'interior-decor'],
    keywords: ['bamboo pendant lamp', 'cane ceiling light', 'rustic hanging lampshade'],
    features: ['Fits standard E27 bulb holders', 'Warm diffused light pattern', 'Hand-treated pest-resistant bamboo splits'],
    isPublished: true,
    isActive: true,
    views: 250,
    favouriteCount: 22
  });

  log('[Seed] Seeding reseller listings (Maker-to-Shop linkage)...');
  await ResellerListing.create({
    sellerId: sellerA._id,
    sourceProductId: bambooBasket._id,
    sourceSellerId: sellerB._id,
    price: 649,
    quantity: 20,
    availability: true,
    isPublished: true,
    isActive: true
  });

  await ResellerListing.create({
    sellerId: sellerA._id,
    sourceProductId: bluePotteryMug._id,
    sourceSellerId: sellerG._id,
    price: 799,
    quantity: 15,
    availability: true,
    isPublished: true,
    isActive: true
  });

  await ResellerListing.create({
    sellerId: sellerA._id,
    sourceProductId: matka._id,
    sourceSellerId: sellerC._id,
    price: 540,
    quantity: 12,
    availability: true,
    isPublished: true,
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
    { query: 'varanasi silk stole', category: 'Handloom & Textiles', city: 'Varanasi', count: 10 },
    { query: 'jaipur blue pottery mug', category: 'Pottery & Clayware', city: 'Jaipur', count: 18 },
    { query: 'raw forest honey', category: 'Organic & Spices', city: 'Gurugram', count: 14 },
    { query: 'dhokra tribal necklace', category: 'Jewellery & Adornments', city: 'Raipur', count: 9 },
    { query: 'sheesham wood spice box', category: 'Handicrafts & Bamboo', city: 'Saharanpur', count: 16 }
  ];

  for (const s of sampleSearches) {
    const searchPromises = [];
    for (let i = 0; i < s.count; i++) {
      searchPromises.push(
        SearchEvent.create({
          query: s.query,
          category: s.category,
          city: s.city,
          resultsCount: 5,
          searchType: 'KEYWORD',
          createdAt: new Date(Date.now() - Math.floor(Math.random() * 15) * 24 * 60 * 60 * 1000)
        })
      );
    }
    await Promise.all(searchPromises);
  }

  const totalProducts = await Product.countDocuments();
  const totalSellers = await SellerProfile.countDocuments();

  log('================================================================');
  log(`  SwaShop Database Seed Completed Successfully!                  `);
  log(`  Total Products Seeded: ${totalProducts}                        `);
  log(`  Total Artisan & Shop Profiles: ${totalSellers}                 `);
  log('================================================================');
  log('  Demo Credentials:                                             ');
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
