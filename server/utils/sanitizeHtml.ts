// server/utils/sanitizer.ts

import sanitizeHtml from 'sanitize-html';

export function sanitizeUserHtml(dirty: string): string {
  return sanitizeHtml(dirty, {
    allowedTags: ['b', 'i', 'em', 'strong', 'a'],
    allowedAttributes: {
      a: ['href'],
    },
    allowedIframeHostnames: ['www.youtube.com'],
  });
}
