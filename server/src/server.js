import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load root or server .env
dotenv.config({ path: path.resolve(__dirname, '../../.env') });
dotenv.config({ path: path.resolve(__dirname, '../.env') });

import app from './app.js';
import { connectDB } from './config/db.js';

const PORT = process.env.PORT || 5001;

const startServer = async () => {
  try {
    await connectDB();
    const server = app.listen(PORT, () => {
      console.log(`========================================`);
      console.log(`  SwaShop Backend Server is Running!     `);
      console.log(`  Port: ${PORT}                          `);
      console.log(`  Mode: ${process.env.NODE_ENV || 'development'} `);
      console.log(`  Health: http://localhost:${PORT}/api/health `);
      console.log(`========================================`);
    });

    const shutdown = async () => {
      console.log('Shutting down server gracefully...');
      server.close(() => {
        process.exit(0);
      });
    };

    process.on('SIGTERM', shutdown);
    process.on('SIGINT', shutdown);
  } catch (err) {
    console.error('Failed to start SwaShop server:', err);
    process.exit(1);
  }
};

startServer();
