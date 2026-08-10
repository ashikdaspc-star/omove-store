// Re-export PagesFunction handler from functions/api/[[path]].ts for universal edge routing

export { onRequest } from './api/[[path]]';
export type { Env, PagesFunction } from './api/[[path]]';
