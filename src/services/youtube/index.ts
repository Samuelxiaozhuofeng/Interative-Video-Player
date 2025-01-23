import YouTubeClient from './client';
import YouTubeCaptions from './captions';

const apiKey = import.meta.env.VITE_YOUTUBE_API_KEY;

if (!apiKey) {
  throw new Error('YouTube API密钥未配置');
}

const client = new YouTubeClient(apiKey);
const captions = new YouTubeCaptions(apiKey);

export { client, captions };