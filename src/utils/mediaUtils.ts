import lamejs from 'lamejs';

export async function captureVideoFrame(video: HTMLVideoElement): Promise<Blob> {
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) {
        throw new Error('Failed to get canvas context');
    }
    
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    
    return new Promise((resolve, reject) => {
        canvas.toBlob((blob) => {
            if (blob) {
                resolve(blob);
            } else {
                reject(new Error('Failed to capture video frame'));
            }
        }, 'image/png');
    });
}

export async function extractAudioSegment(
    video: HTMLVideoElement,
    startTime: number,
    endTime: number
): Promise<Blob> {
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const mediaStream = (video as any).captureStream();
    const mediaStreamSource = audioContext.createMediaStreamSource(mediaStream);
    
    const duration = endTime - startTime;
    const sampleRate = audioContext.sampleRate;
    const numberOfChannels = 2;
    const numberOfFrames = Math.ceil(sampleRate * duration);
    
    const offlineContext = new OfflineAudioContext(
        numberOfChannels,
        numberOfFrames,
        sampleRate
    );
    
    const source = offlineContext.createBufferSource();
    source.connect(offlineContext.destination);
    
    // 设置视频时间并等待加载
    video.currentTime = startTime;
    await new Promise(resolve => {
        video.onseeked = resolve;
    });
    
    // 开始录制
    source.start(0);
    
    const audioBuffer = await offlineContext.startRendering();
    
    // 将 AudioBuffer 转换为 WAV 格式的 Blob
    const wavBlob = audioBufferToWav(audioBuffer);
    
    return wavBlob;
}

// 辅助函数：将 AudioBuffer 转换为 WAV 格式
function audioBufferToWav(buffer: AudioBuffer): Blob {
    const numberOfChannels = buffer.numberOfChannels;
    const sampleRate = buffer.sampleRate;
    const format = 1; // PCM
    const bitDepth = 16;
    
    const bytesPerSample = bitDepth / 8;
    const blockAlign = numberOfChannels * bytesPerSample;
    
    const wav = new ArrayBuffer(44 + buffer.length * blockAlign);
    const view = new DataView(wav);
    
    // WAV 文件头
    writeString(view, 0, 'RIFF');
    view.setUint32(4, 36 + buffer.length * blockAlign, true);
    writeString(view, 8, 'WAVE');
    writeString(view, 12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, format, true);
    view.setUint16(22, numberOfChannels, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * blockAlign, true);
    view.setUint16(32, blockAlign, true);
    view.setUint16(34, bitDepth, true);
    writeString(view, 36, 'data');
    view.setUint32(40, buffer.length * blockAlign, true);
    
    const channels = [];
    for (let i = 0; i < numberOfChannels; i++) {
        channels.push(buffer.getChannelData(i));
    }
    
    let offset = 44;
    for (let i = 0; i < buffer.length; i++) {
        for (let channel = 0; channel < numberOfChannels; channel++) {
            const sample = Math.max(-1, Math.min(1, channels[channel][i]));
            view.setInt16(offset, sample < 0 ? sample * 0x8000 : sample * 0x7FFF, true);
            offset += 2;
        }
    }
    
    return new Blob([wav], { type: 'audio/wav' });
}

function writeString(view: DataView, offset: number, string: string) {
    for (let i = 0; i < string.length; i++) {
        view.setUint8(offset + i, string.charCodeAt(i));
    }
}

export async function extractAudioFromVideo(
    videoElement: HTMLVideoElement,
    startTime: number,
    endTime: number
): Promise<Blob> {
    try {
        const audioContext = new AudioContext();
        
        // 获取视频源数据
        const response = await fetch(videoElement.src);
        const arrayBuffer = await response.arrayBuffer();
        
        // 解码音频数据
        const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
        
        // 计算开始和结束的采样位置
        const sampleRate = audioBuffer.sampleRate;
        const startSample = Math.floor(startTime * sampleRate);
        const endSample = Math.floor(endTime * sampleRate);
        const frameCount = endSample - startSample;
        
        // 创建新的 AudioBuffer 来存储截取的部分
        const newAudioBuffer = new AudioContext().createBuffer(
            audioBuffer.numberOfChannels,
            frameCount,
            sampleRate
        );
        
        // 复制指定时间范围的音频数据
        for (let channel = 0; channel < audioBuffer.numberOfChannels; channel++) {
            const channelData = audioBuffer.getChannelData(channel);
            const newChannelData = newAudioBuffer.getChannelData(channel);
            for (let i = 0; i < frameCount; i++) {
                newChannelData[i] = channelData[startSample + i];
            }
        }
        
        // 将 AudioBuffer 转换为 MP3
        const mp3Blob = await audioBufferToMP3(newAudioBuffer);
        
        return mp3Blob;
    } catch (error) {
        console.error('提取音频失败:', error);
        throw error;
    }
}

// 辅助函数：将 AudioBuffer 转换为 MP3
async function audioBufferToMP3(audioBuffer: AudioBuffer): Promise<Blob> {
    // 创建离线音频上下文
    const offlineContext = new OfflineAudioContext(
        audioBuffer.numberOfChannels,
        audioBuffer.length,
        audioBuffer.sampleRate
    );

    // 创建音频源
    const source = offlineContext.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(offlineContext.destination);
    
    // 开始渲染
    source.start(0);
    const renderedBuffer = await offlineContext.startRendering();
    
    // 创建 AudioContext 和 MediaStreamDestination
    const audioContext = new AudioContext();
    const mediaStreamDestination = audioContext.createMediaStreamDestination();
    
    // 创建新的音频源并连接到 MediaStreamDestination
    const finalSource = audioContext.createBufferSource();
    finalSource.buffer = renderedBuffer;
    finalSource.connect(mediaStreamDestination);
    
    // 使用 MediaRecorder 录制音频流
    return new Promise((resolve, reject) => {
        const mediaRecorder = new MediaRecorder(mediaStreamDestination.stream, {
            mimeType: 'audio/webm'
        });
        
        const chunks: Blob[] = [];
        mediaRecorder.ondataavailable = (event) => {
            if (event.data.size > 0) {
                chunks.push(event.data);
            }
        };
        
        mediaRecorder.onstop = () => {
            const blob = new Blob(chunks, { type: 'audio/webm' });
            audioContext.close();
            resolve(blob);
        };
        
        mediaRecorder.onerror = () => {
            reject(new Error('MediaRecorder error occurred'));
        };
        
        // 开始录制
        finalSource.start(0);
        mediaRecorder.start();
        
        // 在音频播放完成后停止录制
        setTimeout(() => {
            mediaRecorder.stop();
        }, (renderedBuffer.duration * 1000) + 100); // 添加100ms的缓冲时间
    });
} 