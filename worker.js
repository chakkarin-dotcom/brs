export default {
  async fetch(request, env) {
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    };

    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    if (request.method !== 'GET' && request.method !== 'POST') {
      return new Response(JSON.stringify({ error: 'Method not allowed' }), {
        status: 405,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const sheetsUrl = env.GOOGLE_SHEETS_WEBAPP_URL;
    if (!sheetsUrl) {
      return new Response(JSON.stringify({ error: 'Missing GOOGLE_SHEETS_WEBAPP_URL secret' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    try {
      const requestUrl = new URL(request.url);
      const targetUrl = new URL(sheetsUrl);
      targetUrl.search = requestUrl.search;

      const options = {
        method: request.method,
        headers: { 'Content-Type': 'text/plain' },
      };

      if (request.method === 'POST') {
        options.body = await request.text();
      }

      const response = await fetch(targetUrl, options);
      const responseBody = await response.text();

      return new Response(responseBody, {
        status: response.status,
        headers: { ...corsHeaders, 'Content-Type': response.headers.get('Content-Type') || 'application/json' },
      });
    } catch (err) {
      return new Response(JSON.stringify({ error: err.message }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
  },
};
