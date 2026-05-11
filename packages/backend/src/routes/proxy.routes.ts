import { Router, Request, Response } from 'express';
import axios from 'axios';

const router = Router();

// Stream any video URL through the backend with appropriate headers.
// Needed for Twitter CDN URLs which block direct browser requests (403).
router.get('/', async (req: Request, res: Response) => {
  const url = req.query.url as string;
  if (!url) return res.status(400).json({ error: 'url query param required' });

  const upstream: Record<string, string> = {
    'User-Agent':
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    Referer: 'https://twitter.com/',
    Origin: 'https://twitter.com',
  };
  if (req.headers.range) upstream['Range'] = req.headers.range;

  try {
    const upstream_res = await axios.get<NodeJS.ReadableStream>(url, {
      responseType: 'stream',
      headers: upstream,
      timeout: 30000,
      validateStatus: () => true, // let us forward non-200 statuses too
    });

    res.status(upstream_res.status);

    for (const h of ['content-type', 'content-length', 'content-range', 'accept-ranges']) {
      const val = upstream_res.headers[h];
      if (val) res.setHeader(h, val);
    }

    (upstream_res.data as NodeJS.ReadableStream).pipe(res);
  } catch (err) {
    if (!res.headersSent) {
      res.status(502).json({ error: 'PROXY_ERROR', message: String(err) });
    }
  }
});

export default router;
