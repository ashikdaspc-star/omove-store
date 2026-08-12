// Cloudflare Pages Middleware for Omove Store
// Forces strict anti-caching headers on index.html & HTML page responses
// so that live website updates reflect instantly across all browsers and CDN POPs.

export interface Env {}

export type PagesFunction<Env = any> = (context: {
  request: Request;
  env: Env;
  params: Record<string, string | string[]>;
  waitUntil: (promise: Promise<any>) => void;
  next: (input?: RequestInfo, init?: RequestInit) => Promise<Response>;
  data: Record<string, any>;
}) => Promise<Response> | Response;

export const onRequest: PagesFunction<Env> = async (context) => {
  const { request } = context;
  const url = new URL(request.url);
  const response = await context.next();

  // If request is for HTML page (index.html or client-side routes), enforce strict anti-caching
  const contentType = response.headers.get('Content-Type') || '';
  const isHtmlPage = contentType.includes('text/html') || url.pathname === '/' || url.pathname === '/index.html' || !url.pathname.includes('.');

  if (isHtmlPage) {
    const newHeaders = new Headers(response.headers);
    newHeaders.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0');
    newHeaders.set('Pragma', 'no-cache');
    newHeaders.set('Expires', '0');
    newHeaders.set('X-Edge-Version', 'v2026.8.12-d1-migration');
    newHeaders.set('X-Deploy-Timestamp', Date.now().toString());

    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: newHeaders
    });
  }

  return response;
};
