import mongoose from 'mongoose';
import { startUserStatusSync } from '../services/user.status.service';

export default async () => {
  const config = useRuntimeConfig();
  try {
    const mongoURI = config.mongodbUri! || process.env.MONGODB_URI!;
    await mongoose.connect(mongoURI);
    startUserStatusSync();
    console.log('Connected to MongoDB');
  } catch (error) {
    console.error('Failed to connect to MongoDB:', error);
  }
};
