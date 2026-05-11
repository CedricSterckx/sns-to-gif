import { Router, Request, Response, NextFunction } from 'express';
import { detectPlatform } from '../utils/url-parser.js';
import { fetchTwitterMedia } from '../services/twitter.service.js';
import { fetchInstagramMedia } from '../services/instagram.service.js';
import { InvalidUrlError } from '../utils/errors.js';

const router = Router();

router.post('/fetch', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { url } = req.body as { url?: string };
    if (!url || typeof url !== 'string') {
      return res.status(400).json({ error: 'INVALID_URL', message: 'url is required' });
    }

    const platform = detectPlatform(url.trim());
    if (!platform) {
      throw new InvalidUrlError('URL must be from Twitter/X or Instagram');
    }

    const media =
      platform === 'twitter'
        ? await fetchTwitterMedia(url.trim())
        : await fetchInstagramMedia(url.trim());

    return res.json(media);
  } catch (err) {
    next(err);
  }
});

export default router;
