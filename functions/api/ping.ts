export const onRequest: PagesFunction = async () => {
  return new Response(JSON.stringify({ ping: 'pong', timestamp: Date.now() }), {
    headers: {
      'Content-Type': 'application/json',
      'X-Ping-Test': 'true'
    }
  });
};
