import bcrypt from 'bcryptjs';

export async function hashPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
}

export async function comparePassword(candidatePassword: string, hashedPassword: string): Promise<boolean> {
  console.log('Comparing passwords');
  console.log('Candidate password:', candidatePassword);
  console.log('Hashed password:', hashedPassword);
  if (!hashedPassword) {
    console.log('Hashed password is undefined or empty');
    return false;
  }
  const result = await bcrypt.compare(candidatePassword, hashedPassword);
  console.log('Password comparison result:', result);
  return result;
}
