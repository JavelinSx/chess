import jwt from 'jsonwebtoken';
import User from '../db/models/user.model';

export const registerUser = async (username: string, email: string, password: string) => {
  const user = new User({ username, email, password });
  await user.save();
  return user;
};

export const loginUser = async (email: string, password: string) => {
  const user = await User.findOne({ email });
  if (!user || !(await user.comparePassword(password))) {
    throw new Error('Invalid email or password');
  }
  const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET!, { expiresIn: '1d' });
  return { user, token };
};
