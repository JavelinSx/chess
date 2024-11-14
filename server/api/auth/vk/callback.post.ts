// server/api/auth/vk/callback.post.ts
import { vkAuthService } from '~/server/services/vk.service';

export default defineEventHandler(async (event) => {
  const { code, codeVerifier, device_id } = await readBody(event);
  return await vkAuthService.exchangeCode(event, code, codeVerifier, device_id);
});
