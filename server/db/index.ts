// server/db/index.ts

import mongoose from 'mongoose';
import { startUserStatusSync } from '../services/user.status.service';
export default async () => {
  const config = useRuntimeConfig();
  try {
    await mongoose.connect(config.private.mongodbUri);
    startUserStatusSync();
    console.log('Connected to MongoDB');
  } catch (error) {
    console.error('Failed to connect to MongoDB:', error);
  }
};
