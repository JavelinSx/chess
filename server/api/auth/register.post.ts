import { defineEventHandler, readBody } from 'h3';
import { registerUser } from '~/server/services/auth.service';

export default defineEventHandler(async (event) => {
  const { username, email, password } = await readBody(event);
  return registerUser(event, username, email, password);
});
