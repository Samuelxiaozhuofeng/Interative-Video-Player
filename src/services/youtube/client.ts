import axios from 'axios';

const YOUTUBE_API_URL = 'https://www.googleapis.com/youtube/v3';

class YouTubeClient {
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async getVideoDetails(videoId: string) {
    try {
      const response = await axios.get(`${YOUTUBE_API_URL}/videos`, {
        params: {
          part: 'snippet,contentDetails',
          id: videoId,
          key: this.apiKey
        }
      });
      return response.data.items[0];
    } catch (error) {
      console.error('获取视频详情失败:', error);
      throw error;
    }
  }

  async getCaptions(videoId: string) {
    try {
      const response = await axios.get(`${YOUTUBE_API_URL}/captions`, {
        params: {
          part: 'snippet',
          videoId,
          key: this.apiKey
        }
      });
      return response.data.items;
    } catch (error) {
      console.error('获取字幕列表失败:', error);
      throw error;
    }
  }
}

export default YouTubeClient;