import React, { useRef } from 'react';
import { Upload } from 'lucide-react';
import useVideoStore from '../store/videoStore';
import SrtParser2 from 'srt-parser-2';

const FileUpload: React.FC = () => {
  const videoRef = useRef<HTMLInputElement>(null);
  const subtitleRef = useRef<HTMLInputElement>(null);
  const { setVideoState } = useVideoStore();

  const handleVideoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const videoUrl = URL.createObjectURL(file);
      const videoElement = document.querySelector('video');
      if (videoElement) {
        videoElement.src = videoUrl;
      }
    }
  };

  const handleSubtitleUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const text = await file.text();
      const parser = new SrtParser2();
      const subtitles = parser.fromSrt(text).map((sub, index) => ({
        id: index,
        startTime: sub.startSeconds,
        endTime: sub.endSeconds,
        text: sub.text
      }));
      setVideoState({ subtitles });
    }
  };

  return (
    <div className="flex gap-4 mb-6">
      <button
        onClick={() => videoRef.current?.click()}
        className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
      >
        <Upload size={20} />
        Upload Video
      </button>
      <input
        ref={videoRef}
        type="file"
        accept="video/*"
        onChange={handleVideoUpload}
        className="hidden"
      />

      <button
        onClick={() => subtitleRef.current?.click()}
        className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
      >
        <Upload size={20} />
        Upload Subtitles
      </button>
      <input
        ref={subtitleRef}
        type="file"
        accept=".srt,.vtt"
        onChange={handleSubtitleUpload}
        className="hidden"
      />
    </div>
  );
}

export default FileUpload;