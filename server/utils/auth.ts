import bcrypt from 'bcryptjs';

export async function hashPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
}

export async function comparePassword(candidatePassword: string, hashedPassword: string): Promise<boolean> {
  if (!hashedPassword) {
    return false;
  }
  const result = await bcrypt.compare(candidatePassword, hashedPassword);
  return result;
}
