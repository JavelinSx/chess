import NodeCache from 'node-cache';
//strange upperCase GameCache
class GameCache {
  private cache: NodeCache;

  constructor() {
    this.cache = new NodeCache();
  }

  set(key: string, value: any, ttl: number): void {
    this.cache.set(key, value, ttl);
  }

  get<T>(key: string): T | undefined {
    return this.cache.get<T>(key);
  }

  del(key: string): number {
    return this.cache.del(key);
  }
}

export default new GameCache();
