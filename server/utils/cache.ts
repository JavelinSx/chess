import type { EventHandler, EventHandlerObject, H3Event } from 'h3';
import { defineEventHandler, createError } from 'h3';

interface CacheOptions {
  ttl?: number;
  group?: string;
}

type StorageValue = string | number | boolean | object | null;

export function cachedEventHandler<T extends StorageValue = any>(
  handler: EventHandler<any, Promise<T>>,
  options: CacheOptions = {}
): EventHandlerObject {
  return {
    handler: defineEventHandler(async (event: H3Event): Promise<T> => {
      const cache = useStorage('cache');
      const key = `${event.node.req.url}:${JSON.stringify(event.context)}`;

      try {
        const cachedResponse = await cache.getItem<T>(key);
        if (cachedResponse !== null) {
          return cachedResponse;
        }
      } catch (error) {
        console.error('Cache read error:', error);
      }

      const response = await handler(event);

      try {
        await cache.setItem(key, response, {
          ttl: options.ttl,
          tags: options.group ? [options.group] : undefined,
        });
      } catch (error) {
        console.error('Cache write error:', error);
      }

      return response;
    }),
  };
}
