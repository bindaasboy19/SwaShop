import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import mongoose from 'mongoose';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../../../.env') });
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

import { connectDB, closeDB } from '../config/db.js';
import User from '../models/User.js';

const seedAdmin = async () => {
  try {
    await connectDB();

    const name = process.env.ADMIN_NAME || 'SwaShop Administrator';
    const email = (process.env.ADMIN_EMAIL || 'admin@swashop.in').toLowerCase().trim();
    const password = process.env.ADMIN_PASSWORD || 'AdminPass@12345';

    console.log(`[Seed Admin] Checking for administrator: ${email}...`);

    let admin = await User.findOne({ email });

    if (admin) {
      console.log(`[Seed Admin] Administrator account already exists for ${email}. Ensuring active status & role...`);
      admin.role = 'ADMIN';
      admin.isActive = true;
      admin.passwordHash = await User.hashPassword(password);
      await admin.save();
      console.log(`[Seed Admin] Admin credentials updated successfully.`);
    } else {
      const passwordHash = await User.hashPassword(password);
      admin = await User.create({
        name,
        email,
        passwordHash,
        role: 'ADMIN',
        isActive: true,
        phone: '+91 9876543210'
      });
      console.log(`[Seed Admin] Administrator created successfully: ${email}`);
    }

    console.log('----------------------------------------------------');
    console.log(`  Admin Email:    ${email}`);
    console.log(`  Admin Password: ${password}`);
    console.log('----------------------------------------------------');

    await closeDB();
    process.exit(0);
  } catch (err) {
    console.error('[Seed Admin] Error:', err);
    process.exit(1);
  }
};

seedAdmin();
