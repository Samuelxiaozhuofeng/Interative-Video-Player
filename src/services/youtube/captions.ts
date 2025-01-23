import YouTubeClient from './client';
import { Subtitle } from '../../types/subtitle';

class YouTubeCaptions {
  private client: YouTubeClient;

  constructor(apiKey: string) {
    this.client = new YouTubeClient(apiKey);
  }

  async getCaptions(videoId: string, language = 'zh'): Promise<Subtitle[]> {
    try {
      const captions = await this.client.getCaptions(videoId);
      
      // 过滤指定语言的字幕
      const targetCaption = captions.find(
        (caption: any) => 
          caption.snippet.language === language && 
          caption.snippet.trackKind === 'standard'
      );

      if (!targetCaption) {
        throw new Error(`未找到${language}字幕`);
      }

      // TODO: 实现字幕下载和解析
      // 返回统一格式的字幕数据
      return [];
    } catch (error) {
      console.error('获取YouTube字幕失败:', error);
      throw error;
    }
  }
}

export default YouTubeCaptions;