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

const seedDatabase = async () => {
  try {
    console.log('[Seed] Connecting to database...');
    await connectDB();

    console.log('[Seed] Clearing existing collections...');
    await Promise.all([
      User.deleteMany({}),
      SellerProfile.deleteMany({}),
      Product.deleteMany({}),
      Category.deleteMany({}),
      ResellerListing.deleteMany({}),
      Enquiry.deleteMany({}),
      Favourite.deleteMany({})
    ]);

    console.log('[Seed] Seeding categories...');
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
        name: 'Local Groceries & Sweets',
        slug: 'local-groceries-sweets',
        description: 'Artisanal jaggery, homemade pickles, papads, and regional sweets.',
        icon: 'ShoppingBag',
        image: 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=600&auto=format&fit=crop&q=80',
        isActive: true
      }
    ]);

    const catBamboo = categories.find((c) => c.slug === 'handicrafts-bamboo');
    const catTextiles = categories.find((c) => c.slug === 'handloom-textiles');
    const catOrganics = categories.find((c) => c.slug === 'organic-spices');
    const catPottery = categories.find((c) => c.slug === 'pottery-clayware');

    console.log('[Seed] Seeding Users and Seller Profiles...');
    const defaultPasswordHash = await User.hashPassword('Password@123');

    // 1. Admin User
    const adminUser = await User.create({
      name: 'SwaShop Administrator',
      email: 'admin@swashop.in',
      phone: '+91 9876500001',
      passwordHash: await User.hashPassword('AdminPass@12345'),
      role: 'ADMIN',
      isActive: true
    });

    // 2. Customer User (Priya Sharma)
    const customerUser = await User.create({
      name: 'Priya Sharma',
      email: 'customer@example.com',
      phone: '+91 9876500002',
      passwordHash: await User.hashPassword('CustomerPass@123'),
      role: 'CUSTOMER',
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&auto=format&fit=crop&q=80',
      isActive: true
    });

    // 3. Seller B: Sharma Handicrafts (Artisan Maker)
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
      coordinates: { lat: 28.5733, lng: 77.2085 }, // Near Dilli Haat, INA
      businessHours: 'Mon - Sat: 10:00 AM - 8:00 PM',
      verificationStatus: 'APPROVED',
      isOpen: true,
      logo: 'https://images.unsplash.com/photo-1544717305-2782549b5136?w=200&auto=format&fit=crop&q=80',
      coverImage: 'https://images.unsplash.com/photo-1513519245088-0e12902e5a38?w=800&auto=format&fit=crop&q=80'
    });

    // 4. Seller A: Aarav Gift Shop (Local Shop / Reseller)
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
      coordinates: { lat: 28.6328, lng: 77.2197 }, // Connaught Place (~6.5 km from INA)
      businessHours: 'Mon - Sun: 11:00 AM - 9:30 PM',
      verificationStatus: 'APPROVED',
      isOpen: true,
      logo: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=200&auto=format&fit=crop&q=80',
      coverImage: 'https://images.unsplash.com/photo-1513151233558-d860c5398176?w=800&auto=format&fit=crop&q=80'
    });

    // 5. Seller C: Kaveri Pottery Works (Micro Entrepreneur)
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
      coordinates: { lat: 28.5708, lng: 77.3261 }, // Noida Sector 18 (~12 km)
      businessHours: 'Mon - Sat: 9:30 AM - 7:30 PM',
      verificationStatus: 'APPROVED',
      isOpen: true,
      logo: 'https://images.unsplash.com/photo-1578749556568-bc2c40e68b61?w=200&auto=format&fit=crop&q=80',
      coverImage: 'https://images.unsplash.com/photo-1565193566173-7a0ee3dbe261?w=800&auto=format&fit=crop&q=80'
    });

    // 6. Seller D: Vedic Roots Organics (MSME)
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
      coordinates: { lat: 28.4952, lng: 77.0891 }, // Gurgaon Cyber City (~18 km)
      businessHours: 'Mon - Sat: 9:00 AM - 8:00 PM',
      verificationStatus: 'APPROVED',
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
      businessHours: 'Mon - Sat: 10:00 AM - 7:00 PM',
      verificationStatus: 'PENDING', // PENDING ADMIN APPROVAL!
      isOpen: true
    });

    console.log('[Seed] Seeding Products...');

    // Products by Sharma Handicrafts (Seller B)
    // Core Demo Scenario Product: Handmade Bamboo Basket (₹500)
    const bambooBasket = await Product.create({
      sellerId: sellerB._id,
      name: 'Handmade Bamboo Basket',
      description: 'Durable, hand-woven natural bamboo fruit and storage basket made with sustainably harvested wild bamboo. Naturally finished without toxic varnishes.',
      categoryId: catBamboo._id,
      images: [
        'https://images.unsplash.com/photo-1590736969955-71cc94801759?w=800&auto=format&fit=crop&q=80',
        'https://images.unsplash.com/photo-1544816155-12df9643f363?w=800&auto=format&fit=crop&q=80'
      ],
      price: 500,
      discountPrice: 450,
      availability: true,
      stockStatus: 'AVAILABLE',
      tags: ['bamboo', 'basket', 'handcrafted', 'eco-friendly', 'kitchen'],
      isPublished: true,
      isActive: true,
      views: 142
    });

    const caneTray = await Product.create({
      sellerId: sellerB._id,
      name: 'Handcrafted Cane Fruit Tray',
      description: 'Artisanal shallow cane serving tray with reinforced rim. Ideal for fruits, dry snacks, and dining table centerpiece.',
      categoryId: catBamboo._id,
      images: [
        'https://images.unsplash.com/photo-1513519245088-0e12902e5a38?w=800&auto=format&fit=crop&q=80'
      ],
      price: 350,
      availability: true,
      stockStatus: 'AVAILABLE',
      tags: ['cane', 'tray', 'serving', 'handicraft'],
      isPublished: true,
      isActive: true,
      views: 89
    });

    const windChime = await Product.create({
      sellerId: sellerB._id,
      name: 'Melodious Bamboo Wind Chime',
      description: 'Traditional 6-tube tuned bamboo chime creating soothing, earthy tones for balconies, gardens, and patios.',
      categoryId: catBamboo._id,
      images: [
        'https://images.unsplash.com/photo-1518895949257-7621c3c786d7?w=800&auto=format&fit=crop&q=80'
      ],
      price: 450,
      availability: true,
      stockStatus: 'AVAILABLE',
      tags: ['windchime', 'bamboo', 'garden', 'decor'],
      isPublished: true,
      isActive: true,
      views: 65
    });

    // Own Products by Aarav Gift Shop (Seller A)
    const diyaSet = await Product.create({
      sellerId: sellerA._id,
      name: 'Artisanal Brass Diya Set (Set of 4)',
      description: 'Solid carved brass oil lamps with engraved peacock patterns. Perfect for festivals, rituals, and ambient home lighting.',
      categoryId: catBamboo._id,
      images: [
        'https://images.unsplash.com/photo-1605648916361-9bc12ad6a569?w=800&auto=format&fit=crop&q=80'
      ],
      price: 799,
      discountPrice: 699,
      availability: true,
      stockStatus: 'AVAILABLE',
      tags: ['brass', 'diya', 'festive', 'pooja', 'decor'],
      isPublished: true,
      isActive: true,
      views: 110
    });

    const candle = await Product.create({
      sellerId: sellerA._id,
      name: 'Hand-poured Scented Soy Candle',
      description: 'Natural soy wax candle infused with lavender and Himalayan cedarwood essential oils in a reusable frosted glass tumbler.',
      categoryId: catBamboo._id,
      images: [
        'https://images.unsplash.com/photo-1603006905003-be475563bc59?w=800&auto=format&fit=crop&q=80'
      ],
      price: 399,
      availability: true,
      stockStatus: 'AVAILABLE',
      tags: ['candle', 'aromatherapy', 'handmade', 'gift'],
      isPublished: true,
      isActive: true,
      views: 74
    });

    // Products by Kaveri Pottery Works (Seller C)
    const matka = await Product.create({
      sellerId: sellerC._id,
      name: 'Traditional Terracotta Water Pot (Matka)',
      description: 'Unglazed porous clay pot that naturally cools water through evaporation. Comes with a handcrafted clay lid and stand.',
      categoryId: catPottery._id,
      images: [
        'https://images.unsplash.com/photo-1565193566173-7a0ee3dbe261?w=800&auto=format&fit=crop&q=80'
      ],
      price: 299,
      availability: true,
      stockStatus: 'AVAILABLE',
      tags: ['pottery', 'matka', 'terracotta', 'eco-friendly'],
      isPublished: true,
      isActive: true,
      views: 156
    });

    const ceramicMugs = await Product.create({
      sellerId: sellerC._id,
      name: 'Studio Pottery Coffee Mugs (Set of 2)',
      description: 'Wheel-thrown ceramic stoneware mugs with reactive dual-tone glaze. Microwave and dishwasher safe.',
      categoryId: catPottery._id,
      images: [
        'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=800&auto=format&fit=crop&q=80'
      ],
      price: 550,
      availability: true,
      stockStatus: 'AVAILABLE',
      tags: ['ceramics', 'mugs', 'coffee', 'handmade'],
      isPublished: true,
      isActive: true,
      views: 92
    });

    // Products by Vedic Roots Organics (Seller D)
    const forestHoney = await Product.create({
      sellerId: sellerD._id,
      name: 'Wild Forest Raw Honey (500g)',
      description: 'Unprocessed, unpasteurized multi-flora honey harvested by tribal beekeepers in the Jim Corbett foothills.',
      categoryId: catOrganics._id,
      images: [
        'https://images.unsplash.com/photo-1587049352846-4a222e784d38?w=800&auto=format&fit=crop&q=80'
      ],
      price: 499,
      discountPrice: 449,
      availability: true,
      stockStatus: 'AVAILABLE',
      tags: ['honey', 'organic', 'raw', 'wellness'],
      isPublished: true,
      isActive: true,
      views: 204
    });

    const turmeric = await Product.create({
      sellerId: sellerD._id,
      name: 'Organic Lakadong Turmeric (High Curcumin 7%)',
      description: 'Single-origin Meghalaya turmeric known for its deep color, intense aroma, and therapeutic grade curcumin content.',
      categoryId: catOrganics._id,
      images: [
        'https://images.unsplash.com/photo-1615485290382-441e4d049cb5?w=800&auto=format&fit=crop&q=80'
      ],
      price: 240,
      availability: true,
      stockStatus: 'AVAILABLE',
      tags: ['turmeric', 'spices', 'organic', 'ayurveda'],
      isPublished: true,
      isActive: true,
      views: 118
    });

    console.log('[Seed] Seeding Reseller Listing (Core Demo Scenario)...');
    // Demo Scenario: Seller A (Aarav Gift Shop) reselling Sharma Handicrafts' Bamboo Basket for ₹699, qty 10!
    const resellerListing = await ResellerListing.create({
      sellerId: sellerA._id,
      sourceProductId: bambooBasket._id,
      sourceSellerId: sellerB._id,
      price: 699,
      quantity: 10,
      availability: true,
      isPublished: true,
      isActive: true
    });

    console.log('[Seed] Seeding Enquiries & Favourites...');
    // Customer enquiry to Sharma Handicrafts
    await Enquiry.create({
      customerId: customerUser._id,
      sellerId: sellerB._id,
      productId: bambooBasket._id,
      message: 'Hello! Can I order 5 of these handmade bamboo baskets with customized cloth lining for Diwali gifts?',
      contactPhone: '+91 9876500002',
      contactEmail: 'customer@example.com',
      status: 'RESPONDED',
      responseMessage: 'Namaste Priya ji! Yes absolutely, we can customize the lining with organic cotton fabric in red or cream.'
    });

    // Seller A enquires with Seller B regarding bulk cane trays
    await Enquiry.create({
      customerId: userSellerA._id, // Seller acting as customer!
      sellerId: sellerB._id,
      productId: caneTray._id,
      message: 'Hi Ramesh ji, we are interested in stocking 25 units of the Cane Fruit Tray in our CP store. What would be the lead time?',
      contactPhone: '+91 9876500004',
      contactEmail: 'aarav.gifts@example.com',
      status: 'PENDING'
    });

    // Favourites
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

    console.log('================================================================');
    console.log('  SwaShop Phase 1 Database Seed Completed Successfully!         ');
    console.log('================================================================');
    console.log('  Accounts for Testing:                                         ');
    console.log('  1. ADMIN:                                                     ');
    console.log('     Email:    admin@swashop.in                                 ');
    console.log('     Password: AdminPass@12345                                  ');
    console.log('  2. SELLER A (Reseller & Shop Owner):                          ');
    console.log('     Shop:     Aarav Gift Shop                                  ');
    console.log('     Email:    aarav.gifts@example.com                          ');
    console.log('     Password: Password@123                                     ');
    console.log('  3. SELLER B (Artisan Maker):                                  ');
    console.log('     Shop:     Sharma Handicrafts                               ');
    console.log('     Email:    sharma.handicrafts@example.com                   ');
    console.log('     Password: Password@123                                     ');
    console.log('  4. CUSTOMER:                                                  ');
    console.log('     Name:     Priya Sharma                                     ');
    console.log('     Email:    customer@example.com                             ');
    console.log('     Password: CustomerPass@123                                 ');
    console.log('================================================================');

    await closeDB();
    process.exit(0);
  } catch (err) {
    console.error('[Seed] Database seeding failed:', err);
    process.exit(1);
  }
};

seedDatabase();
