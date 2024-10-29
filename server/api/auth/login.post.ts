import { defineEventHandler, readBody } from 'h3';
import { loginUser } from '~/server/services/auth.service';

export default defineEventHandler(async (event) => {
  const { email, password } = await readBody(event);
  return loginUser(event, email, password);
});
