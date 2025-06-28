import type { Types, Model } from 'mongoose';

export type ObjectId = Types.ObjectId;

// Interface for Mongoose models with MeiliSearch functionality
export interface MeiliSearchHit {
  conversationId?: string;
  [key: string]: unknown;
}

export interface MeiliSearchResult {
  hits: MeiliSearchHit[];
  [key: string]: unknown;
}

export interface SchemaWithMeiliMethods<T = Record<string, unknown>> extends Model<T> {
  meiliSearch(query: string): Promise<MeiliSearchResult>;
}
export * from './user';
export * from './token';
export * from './convo';
export * from './session';
export * from './balance';
export * from './banner';
export * from './message';
export * from './agent';
export * from './role';
export * from './action';
export * from './assistant';
export * from './file';
export * from './share';
export * from './pluginAuth';
/* Memories */
export * from './memory';
