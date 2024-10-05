import mongoose from 'mongoose';
// import { startUserStatusSync } from '../services/user.status.service';
export default async () => {
  const config = useRuntimeConfig();
  try {
    const mongoURI = config.mongodbUri! || process.env.MONGODB_URI!;
    await mongoose.connect(mongoURI);
  } catch (error) {
    console.error('Failed to connect to MongoDB:', error);
  }
};
