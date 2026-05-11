import { json, CORS_HEADERS } from '../utils/response';

export async function serveProxy(req: Request): Promise<Response> {
  const url = new URL(req.url).searchParams.get('url');
  if (!url) return json({ error: 'url query param required' }, 400);

  const upstreamHeaders: Record<string, string> = {
    'User-Agent':
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    Referer: 'https://twitter.com/',
    Origin: 'https://twitter.com',
  };

  const rangeHeader = req.headers.get('range');
  if (rangeHeader) upstreamHeaders['Range'] = rangeHeader;

  try {
    const upstream = await fetch(url, {
      headers: upstreamHeaders,
      signal: AbortSignal.timeout(30000),
    });

    const responseHeaders = new Headers(CORS_HEADERS);
    for (const h of ['content-type', 'content-length', 'content-range', 'accept-ranges']) {
      const val = upstream.headers.get(h);
      if (val) responseHeaders.set(h, val);
    }

    return new Response(upstream.body, {
      status: upstream.status,
      headers: responseHeaders,
    });
  } catch (err) {
    return json({ error: 'PROXY_ERROR', message: String(err) }, 502);
  }
}
