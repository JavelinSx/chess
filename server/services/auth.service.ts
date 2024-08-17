import type { AuthData, ApiResponse } from '~/server/types/auth';
import User from '~/server/db/models/user.model.js';
import jwt from 'jsonwebtoken';
export const registerUser = async (
  username: string,
  email: string,
  password: string
): Promise<ApiResponse<AuthData>> => {
  try {
    const user = new User({ username, email, password, isOnline: true });
    await sseManager.sendUserStatusUpdate(user._id.toString(), { isOnline: false, isGame: false });
    await user.save();
    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET!, { expiresIn: '1d' });
    return { data: { user: user.toObject(), token }, error: null };
  } catch (error) {
    return { data: null, error: error instanceof Error ? error.message : 'An unknown error occurred' };
  }
};

export const loginUser = async (email: string, password: string): Promise<ApiResponse<AuthData>> => {
  try {
    const user = await User.findOne({ email });
    if (!user || !(await user.comparePassword(password))) {
      return { data: null, error: 'Invalid email or password' };
    }
    user.isOnline = true;
    await sseManager.sendUserStatusUpdate(user._id.toString(), { isOnline: true, isGame: false });
    await user.save();
    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET!, { expiresIn: '30d' });
    return { data: { user: user.toObject(), token }, error: null };
  } catch (error) {
    return { data: null, error: error instanceof Error ? error.message : 'An unknown error occurred' };
  }
};

export const logoutUser = async (userId: string): Promise<ApiResponse<{ message: string }>> => {
  try {
    await User.findByIdAndUpdate(userId, { isOnline: false });
    await sseManager.sendUserStatusUpdate(userId, { isOnline: false, isGame: false });
    return { data: { message: 'Logout successful' }, error: null };
  } catch (error) {
    return { data: null, error: error instanceof Error ? error.message : 'An unknown error occurred' };
  }
};
