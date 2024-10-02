import type { AuthData } from '~/server/types/auth';
import type { ApiResponse } from '~/server/types/api';
import User from '~/server/db/models/user.model.js';
import jwt from 'jsonwebtoken';

export const registerUser = async (
  username: string,
  email: string,
  password: string
): Promise<ApiResponse<AuthData>> => {
  try {
    const config = useRuntimeConfig();
    const user = new User({ username, email, password });
    await sseManager.broadcastUserStatusUpdate(user._id.toString(), { isOnline: false, isGame: false });
    await user.save();

    const jwtSecret = config.jwtSecret! || process.env.JWT_SECRET!;
    const token = jwt.sign({ userId: user._id }, jwtSecret, { expiresIn: '1d' });
    return { data: { user: user.toObject(), token }, error: null };
  } catch (error) {
    return { data: null, error: error instanceof Error ? error.message : 'An unknown error occurred' };
  }
};

export const loginUser = async (email: string, password: string): Promise<ApiResponse<AuthData>> => {
  const config = useRuntimeConfig();

  try {
    const user = await User.findOne({ email }).select('+password');

    if (!user) {
      return { data: null, error: 'Invalid email or password' };
    }

    const isPasswordValid = await user.comparePassword(password);

    if (!isPasswordValid) {
      return { data: null, error: 'Invalid email or password' };
    }

    user.isOnline = true;

    await sseManager.broadcastUserStatusUpdate(user._id.toString(), { isOnline: true, isGame: false });
    await user.save();
    const jwtSecret = config.jwtSecret! || process.env.JWT_SECRET!;
    const token = jwt.sign({ userId: user._id.toString() }, jwtSecret, { expiresIn: '30d' });

    return { data: { user: user.toObject(), token }, error: null };
  } catch (error) {
    return {
      data: null,
      error: error instanceof Error ? `Error in loginUser: ${error.message}` : 'An unknown error occurred in loginUser',
    };
  }
};

export const logoutUser = async (userId: string): Promise<ApiResponse<{ message: string }>> => {
  try {
    await User.findByIdAndUpdate(userId, { isOnline: false });
    await sseManager.broadcastUserStatusUpdate(userId, { isOnline: false, isGame: false });
    return { data: { message: 'Logout successful' }, error: null };
  } catch (error) {
    return { data: null, error: error instanceof Error ? error.message : 'An unknown error occurred' };
  }
};
