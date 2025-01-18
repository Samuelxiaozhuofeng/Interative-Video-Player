import { AnkiConnectResponse, AnkiDeck, AnkiNoteType } from '../types/anki';
import { CardContent, CardFieldMapping } from '../types/card';

const ANKI_CONNECT_URL = 'http://localhost:8765';

async function invokeAnkiConnect<T>(action: string, params: Record<string, any> = {}): Promise<T> {
    try {
        const response = await fetch(ANKI_CONNECT_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Origin': window.location.origin
            },
            body: JSON.stringify({
                action,
                version: 6,
                params
            }),
            mode: 'cors',
            credentials: 'omit'
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data: AnkiConnectResponse<T> = await response.json();
        if (data.error) {
            throw new Error(data.error);
        }
        return data.result;
    } catch (error) {
        console.error('AnkiConnect error:', error);
        throw error;
    }
}

export async function testConnection(): Promise<boolean> {
    try {
        const version = await invokeAnkiConnect<number>('version');
        return version >= 6;
    } catch (error) {
        console.error('Failed to connect to Anki:', error);
        return false;
    }
}

export async function getDeckNames(): Promise<string[]> {
    return invokeAnkiConnect<string[]>('deckNames');
}

export async function getModelNames(): Promise<string[]> {
    return invokeAnkiConnect<string[]>('modelNames');
}

export async function getModelFieldNames(modelName: string): Promise<string[]> {
    return invokeAnkiConnect<string[]>('modelFieldNames', {
        modelName
    });
}

export async function addNote(deckName: string, modelName: string, fields: Record<string, string>, tags: string[] = []): Promise<number> {
    try {
        // 先获取模型的所有字段
        const modelFields = await getModelFieldNames(modelName);
        
        // 确保所有字段都有值（即使是空字符串）
        const completeFields: Record<string, string> = {};
        modelFields.forEach(field => {
            completeFields[field] = fields[field] || '';
        });

        return await invokeAnkiConnect<number>('addNote', {
            note: {
                deckName,
                modelName,
                fields: completeFields,
                options: {
                    allowDuplicate: false,
                    duplicateScope: "deck"
                },
                tags
            }
        });
    } catch (error) {
        console.error('Failed to add note:', error);
        throw new Error(`添加笔记失败: ${error instanceof Error ? error.message : String(error)}`);
    }
}

export async function storeMediaFile(filename: string, data: string): Promise<void> {
    await invokeAnkiConnect<null>('storeMediaFile', {
        filename,
        data
    });
}

export async function addNoteWithMedia(
    deckName: string,
    modelName: string,
    content: CardContent,
    fieldMapping: CardFieldMapping
): Promise<number> {
    try {
        // 获取模型的所有字段
        const modelFields = await getModelFieldNames(modelName);
        
        // 创建反向映射
        const reverseMapping: Record<string, keyof CardFieldMapping> = {};
        Object.entries(fieldMapping).forEach(([key, value]) => {
            if (value) {
                reverseMapping[value] = key as keyof CardFieldMapping;
            }
        });

        // 准备字段数据
        const fields: Record<string, string> = {};
        modelFields.forEach(field => {
            const mappedKey = reverseMapping[field];
            if (mappedKey) {
                switch (mappedKey) {
                    case 'word':
                        fields[field] = content.word || '';
                        break;
                    case 'sentence':
                        fields[field] = content.sentence || '';
                        break;
                    case 'explanation':
                        fields[field] = content.explanation || '';
                        break;
                    default:
                        fields[field] = '';
                }
            } else {
                // 对于未映射的字段，设置为空字符串
                fields[field] = '';
            }
        });

        // 处理音频
        if (content.audioBlob && fieldMapping.audio) {
            const audioData = await blobToBase64(content.audioBlob);
            const audioFilename = `audio_${Date.now()}.mp3`;
            await storeMediaFile(audioFilename, audioData);
            fields[fieldMapping.audio] = `[sound:${audioFilename}]`;
        }

        // 处理图片
        if (content.imageBlob && fieldMapping.image) {
            const imageData = await blobToBase64(content.imageBlob);
            const imageFilename = `image_${Date.now()}.png`;
            await storeMediaFile(imageFilename, imageData);
            fields[fieldMapping.image] = `<img src="${imageFilename}">`;
        }

        // 添加笔记
        return await addNote(deckName, modelName, fields, ['interactive_video_player']);
    } catch (error) {
        console.error('Failed to add note with media:', error);
        throw new Error(`添加带媒体的笔记失败: ${error instanceof Error ? error.message : String(error)}`);
    }
}

// 辅助函数：将 Blob 转换为 base64 字符串
async function blobToBase64(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
            if (typeof reader.result === 'string') {
                // 移除 data URL 前缀
                const base64 = reader.result.split(',')[1];
                resolve(base64);
            } else {
                reject(new Error('Failed to convert blob to base64'));
            }
        };
        reader.onerror = reject;
        reader.readAsDataURL(blob);
    });
} 