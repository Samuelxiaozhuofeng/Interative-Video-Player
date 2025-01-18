import { AISettings } from '../types/subtitle';

export async function getWordExplanation(
  word: string,
  context: string,
  aiSettings: AISettings
) {
  if (!aiSettings.isConfigured) {
    throw new Error('AI settings not configured');
  }

  try {
    const response = await fetch(aiSettings.apiEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${aiSettings.apiKey}`,
      },
      body: JSON.stringify({
        model: aiSettings.model,
        messages: [
          {
            role: 'system',
            content: 'You are a helpful language learning assistant. Explain English words in Chinese with clear examples. Always respond in Chinese.'
          },
          {
            role: 'user',
            content: `请用中文解释英文单词"${word}"。上下文："${context}"
                     请提供：
                     1. 清晰的中文解释
                     2. 两个相关的英文例句（带中文翻译）
                     请以JSON格式返回，包含字段：explanation（中文解释）, examples（例句数组，每个例句包含英文和中文翻译）`
          }
        ]
      })
    });

    if (!response.ok) {
      throw new Error('Failed to get AI response');
    }

    const data = await response.json();
    const result = JSON.parse(data.choices[0].message.content);
    
    return {
      word,
      explanation: result.explanation,
      examples: result.examples
    };
  } catch (error) {
    console.error('AI API Error:', error);
    return {
      word,
      explanation: '暂时无法获取解释，请检查AI设置或稍后重试。',
      examples: ['示例暂时无法获取']
    };
  }
}