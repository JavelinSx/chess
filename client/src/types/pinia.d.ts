import 'pinia';

declare module 'pinia' {
  export interface DefineStoreOptionsBase<S, Store> {
    persist?: PersistOptions;
  }
}

interface PersistOptions {
  storage?: 'localStorage' | 'sessionStorage';
  paths?: string[];
  // другие опции, если нужны
}
