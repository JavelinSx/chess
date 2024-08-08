import jwt from 'jsonwebtoken';
import User from '../db/models/user.model';
import type { AuthResponse } from '~/server/types/auth';
import { sseManager } from '~/server/utils/SSEManager';

export const registerUser = async (username: string, email: string, password: string): Promise<AuthResponse> => {
  const user = new User({ username, email, password, isOnline: true });
  await sseManager.sendUserStatusUpdate(user._id.toString(), { isOnline: true, isGame: false });
  await user.save();
  const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET!, { expiresIn: '1d' });

  return { user: user.toObject(), token };
};

export const loginUser = async (email: string, password: string): Promise<AuthResponse> => {
  console.log('Starting loginUser function');
  const user = await User.findOne({ email });
  console.log('User found:', !!user);

  if (!user || !(await user.comparePassword(password))) {
    console.log('Invalid email or password');
    throw new Error('Invalid email or password');
  }

  console.log('Password verified, updating user status');
  user.isOnline = true;

  console.log('Sending status update');
  await sseManager.sendUserStatusUpdate(user._id.toString(), { isOnline: true, isGame: false });

  console.log('Saving user');
  await user.save();

  console.log('Generating token');
  const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET!, { expiresIn: '1d' });

  console.log('Returning user data and token');
  return { user: user.toObject(), token };
};

export const logoutUser = async (userId: string): Promise<void> => {
  await User.findByIdAndUpdate(userId, { isOnline: false });
  await sseManager.sendUserStatusUpdate(userId, { isOnline: true, isGame: false });
};
