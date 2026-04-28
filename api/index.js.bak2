export default async function handler(req) {
  const url = new URL(req.url);
  const path = url.pathname;
  const method = req.method;
  
  console.log('API:', method, path);
  
  return new Response(JSON.stringify({ method, path }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' }
  });
}