import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let mongodInstance = null;

export const connectDB = async () => {
  let uri = process.env.MONGODB_URI;

  if (uri && uri.trim() !== '') {
    try {
      await mongoose.connect(uri, { serverSelectionTimeoutMS: 4000 });
      console.log(`[Database] Connected to external MongoDB at ${uri.split('@').pop()}`);
      return;
    } catch (err) {
      console.warn(`[Database] Failed to connect to external MONGODB_URI: ${err.message}. Falling back to local embedded MongoDB.`);
    }
  }

  // Attempt default localhost if available
  try {
    const localUri = 'mongodb://127.0.0.1:27017/swashop';
    await mongoose.connect(localUri, { serverSelectionTimeoutMS: 2000 });
    console.log(`[Database] Connected to local MongoDB at ${localUri}`);
    return;
  } catch (err) {
    // Local standalone mongod not running, start embedded MongoMemoryServer with persistent dbPath
    console.log('[Database] Local mongod daemon not detected. Starting embedded MongoDB engine...');
    
    const dbDir = path.resolve(__dirname, '../../.mongo-data');
    if (!fs.existsSync(dbDir)) {
      fs.mkdirSync(dbDir, { recursive: true });
    }

    try {
      mongodInstance = await MongoMemoryServer.create({
        instance: {
          dbName: 'swashop',
          storageEngine: 'wiredTiger',
          dbPath: dbDir
        }
      });
      const memoryUri = mongodInstance.getUri();
      await mongoose.connect(memoryUri);
      console.log(`[Database] Connected to embedded MongoDB instance at ${memoryUri}`);
    } catch (memErr) {
      console.warn(`[Database] Persistent storage engine initialization failed (${memErr.message}), falling back to in-memory mode.`);
      mongodInstance = await MongoMemoryServer.create({
        instance: {
          dbName: 'swashop'
        }
      });
      const inMemoryUri = mongodInstance.getUri();
      await mongoose.connect(inMemoryUri);
      console.log(`[Database] Connected to in-memory MongoDB at ${inMemoryUri}`);
    }
  }
};

export const closeDB = async () => {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }
  if (mongodInstance) {
    await mongodInstance.stop();
  }
};
