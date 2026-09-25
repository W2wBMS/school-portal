const mongoose = require('mongoose');
let listenersAttached = false;

function attachConnectionLogging() {
  if (listenersAttached) return;
  listenersAttached = true;
  mongoose.connection.on('connected', () => console.log('MongoDB connection established'));
  mongoose.connection.on('disconnected', () => console.error('MongoDB connection lost; the driver will attempt to reconnect'));
  mongoose.connection.on('error', (error) => console.error(`MongoDB connection error: ${error.name}`));
}

async function connectDB() {
  const mongoUri = process.env.MONGO_URI;

  if (!mongoUri) {
    throw new Error('MONGO_URI is not set. Configure backend/.env before starting the API.');
  }

  try {
    attachConnectionLogging();
    await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 5000,
      heartbeatFrequencyMS: 10000,
    });

    return true;
  } catch (error) {
    throw error;
  }
}

module.exports = { connectDB };
