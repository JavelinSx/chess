import NodeCache from 'node-cache';

class GameCache {
  private cache: NodeCache;

  constructor() {
    this.cache = new NodeCache();
  }

  set(key: string, value: any, ttl: number): void {
    console.log(this.cache.data, 'set-----------------');
    this.cache.set(key, value, ttl);
  }

  get<T>(key: string): T | undefined {
    console.log(this.cache.data, 'get-------------');
    return this.cache.get<T>(key);
  }

  del(key: string): number {
    return this.cache.del(key);
  }
}

export default new GameCache();
