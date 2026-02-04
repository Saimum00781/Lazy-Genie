
import React, { useState, useEffect, useRef } from 'react';

interface AudioPlayerProps {
  base64Audio: string | null;
  onFinished?: () => void;
}

const AudioPlayer: React.FC<AudioPlayerProps> = ({ base64Audio, onFinished }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const audioContextRef = useRef<AudioContext | null>(null);
  const sourceRef = useRef<AudioBufferSourceNode | null>(null);

  const decode = (base64: string) => {
    const binaryString = atob(base64);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes;
  };

  const decodeAudioData = async (
    data: Uint8Array,
    ctx: AudioContext,
    sampleRate: number,
    numChannels: number,
  ): Promise<AudioBuffer> => {
    const frameCount = Math.floor(data.length / (2 * numChannels));
    const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);
    const dataView = new DataView(data.buffer, data.byteOffset, data.byteLength);

    for (let channel = 0; channel < numChannels; channel++) {
      const channelData = buffer.getChannelData(channel);
      for (let i = 0; i < frameCount; i++) {
        const sampleIndex = i * numChannels + channel;
        const byteOffset = sampleIndex * 2;
        if (byteOffset + 1 < data.byteLength) {
            const sample = dataView.getInt16(byteOffset, true); 
            channelData[i] = sample / 32768.0;
        } else {
            channelData[i] = 0;
        }
      }
    }
    return buffer;
  };

  const playAudio = async () => {
    if (!base64Audio) return;

    try {
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      }

      const ctx = audioContextRef.current;
      if (ctx.state === 'suspended') {
        await ctx.resume();
      }

      const audioBytes = decode(base64Audio);
      const audioBuffer = await decodeAudioData(audioBytes, ctx, 24000, 1);

      const source = ctx.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(ctx.destination);
      source.onended = () => {
        setIsPlaying(false);
        if (onFinished) onFinished();
      };
      
      sourceRef.current = source;
      source.start(0);
      setIsPlaying(true);
    } catch (err) {
      console.error("Audio Playback Error:", err);
      setIsPlaying(false);
      alert("Error playing audio: " + (err as Error).message);
    }
  };

  const stopAudio = () => {
    if (sourceRef.current) {
      sourceRef.current.stop();
      setIsPlaying(false);
    }
  };

  return (
    <div className="flex items-center gap-4 bg-slate-900 p-4 rounded-xl shadow-md border border-slate-700">
      <button
        onClick={isPlaying ? stopAudio : playAudio}
        className="w-12 h-12 flex items-center justify-center bg-indigo-500 hover:bg-indigo-400 rounded-full text-white shadow-lg active:scale-95 transition-all"
      >
        {isPlaying ? (
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>
        ) : (
          <svg className="w-5 h-5 ml-1" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
        )}
      </button>
      <div>
        <div className="font-semibold text-white tracking-wide text-sm">LazyGenie Audio</div>
        <div className="text-xs text-slate-400 font-medium uppercase tracking-wider">
           {isPlaying ? 'Broadcasting...' : 'Ready to Play'}
        </div>
      </div>
    </div>
  );
};

export default AudioPlayer;
