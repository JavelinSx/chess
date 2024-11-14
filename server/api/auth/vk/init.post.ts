import { defineEventHandler } from 'h3';
import crypto from 'crypto';

export default defineEventHandler(async (event) => {
  try {
    // Генерируем state для безопасности
    const state = crypto.randomBytes(16).toString('hex');
    const codeVerifier = crypto
      .randomBytes(64)
      .toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '')
      .slice(0, 128);

    const codeChallenge = crypto
      .createHash('sha256')
      .update(codeVerifier)
      .digest('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '');

    return {
      data: {
        state,
        codeChallenge,
        codeVerifier,
      },
      error: null,
    };
  } catch (error) {
    return {
      data: null,
      error: error instanceof Error ? error.message : 'Failed to initialize VK auth',
    };
  }
});
