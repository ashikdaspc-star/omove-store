type PagesFunction<Env = any> = (context: {
  request: Request;
  env: Env;
  params: Record<string, string | string[]>;
  waitUntil: (promise: Promise<any>) => void;
  next: (input?: RequestInfo, init?: RequestInit) => Promise<Response>;
  data: Record<string, any>;
}) => Promise<Response> | Response;

export const onRequest: PagesFunction = async () => {
  return new Response(JSON.stringify({ ping: 'pong', timestamp: Date.now() }), {
    headers: {
      'Content-Type': 'application/json',
      'X-Ping-Test': 'true',
      'Cache-Control': 'public, max-age=10, s-maxage=30'
    }
  });
};
