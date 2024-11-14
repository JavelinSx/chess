// server/api/auth/vk/complete.post.ts
import { vkAuthService } from '~/server/services/vk.service';

export default defineEventHandler(async (event) => {
  return await vkAuthService.completeAuthentication(event);
});
