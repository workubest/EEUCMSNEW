const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS'
};

interface AuthRequestBody {
  email: string;
  password: string;
}

interface GasProxyResponse {
  success?: boolean;
  user?: Record<string, unknown>;
  token?: string;
  error?: string;
  [key: string]: unknown;
}

type JsonValue = string | number | boolean | null | JsonValue[] | { [key: string]: JsonValue };

denoServer();

function denoServer() {
  Deno.serve(async (req) => {
    if (req.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    if (req.method !== 'POST') {
      return new Response(
        JSON.stringify({ error: 'Method not allowed' }),
        {
          status: 405,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json'
          }
        }
      );
    }

    try {
      const gasUrl = Deno.env.get('GAS_AUTH_URL');
      if (!gasUrl) {
        throw new Error('GAS_AUTH_URL environment variable is not set');
      }

      const body = (await req.json()) as Partial<AuthRequestBody>;
      const email = body.email?.trim();
      const password = body.password?.trim();

      if (!email || !password) {
        return new Response(
          JSON.stringify({ error: 'Email and password are required' }),
          {
            status: 400,
            headers: {
              ...corsHeaders,
              'Content-Type': 'application/json'
            }
          }
        );
      }

      const payload = {
        path: '/auth/login',
        data: { email, password }
      } satisfies Record<string, JsonValue>;

      const gasResponse = await fetch(gasUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      const text = await gasResponse.text();
      let parsed: GasProxyResponse | { raw: string };
      try {
        parsed = JSON.parse(text) as GasProxyResponse;
      } catch (_error) {
        parsed = { raw: text };
      }

      return new Response(
        JSON.stringify(parsed),
        {
          status: gasResponse.status,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json'
          }
        }
      );
    } catch (error) {
      console.error('Error in gas-auth-proxy:', error);
      return new Response(
        JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
        {
          status: 500,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json'
          }
        }
      );
    }
  });
}
