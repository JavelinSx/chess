// server/db/index.ts

import mongoose from 'mongoose';

export default async () => {
  const config = useRuntimeConfig();
  try {
    await mongoose.connect(config.private.mongodbUri);
    console.log('Connected to MongoDB');
  } catch (error) {
    console.error('Failed to connect to MongoDB:', error);
  }
};
