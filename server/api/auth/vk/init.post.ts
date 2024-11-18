// server/api/auth/vk/init.post.ts
import { defineEventHandler } from 'h3';
import crypto from 'crypto';

export default defineEventHandler(async (event) => {
  try {
    // Генерируем state для безопасности
    const state = crypto.randomBytes(16).toString('hex');

    // Генерируем code_verifier согласно спецификации RFC 7636
    const verifier = crypto
      .randomBytes(32)
      .toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '')
      .substring(0, 43);

    // Создаем code_challenge из code_verifier
    const challenge = crypto
      .createHash('sha256')
      .update(verifier)
      .digest('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '');

    return {
      data: {
        state,
        codeChallenge: challenge,
        codeVerifier: verifier,
      },
      error: null,
    };
  } catch (error) {
    console.error('VK init error:', error);
    return {
      data: null,
      error: error instanceof Error ? error.message : 'Failed to initialize VK auth',
    };
  }
});
