const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

let listenersAttached = false;
let memoryServer = null;

function attachConnectionLogging() {
  if (listenersAttached) return;
  listenersAttached = true;
  mongoose.connection.on('connected', () => console.log('MongoDB connection established'));
  mongoose.connection.on('disconnected', () => console.error('MongoDB connection lost; the driver will attempt to reconnect'));
  mongoose.connection.on('error', (error) => console.error(`MongoDB connection error: ${error.name}`));
}

async function connectDB() {
  const mongoUri = process.env.MONGO_URI;

  if (!mongoUri && process.env.NODE_ENV === 'production') {
    throw new Error('MONGO_URI is not set. Configure backend/.env before starting the API.');
  }

  try {
    attachConnectionLogging();
    if (mongoUri) {
      await mongoose.connect(mongoUri, {
        serverSelectionTimeoutMS: 4000,
        heartbeatFrequencyMS: 10000,
      });
      return true;
    }
  } catch (error) {
    if (process.env.NODE_ENV === 'production') {
      throw error;
    }
    console.warn(`[DB Warning] Failed to connect to MongoDB Atlas (${error.message}). Falling back to in-memory MongoDB server for local development...`);
  }

  // Fallback to MongoMemoryServer for local development if Atlas fails or is unconfigured
  try {
    memoryServer = await MongoMemoryServer.create();
    const memUri = memoryServer.getUri();
    await mongoose.connect(memUri);
    console.log(`[DB Success] Connected to local in-memory MongoDB at ${memUri}`);
    return true;
  } catch (fallbackError) {
    console.error('Failed to start in-memory MongoDB:', fallbackError);
    throw fallbackError;
  }
}

module.exports = { connectDB };

