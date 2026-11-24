import { useEffect, useRef, useState } from 'react';
import WaveSurfer from 'wavesurfer.js';
import { Play, Pause, Volume2 } from 'lucide-react';

interface WaveformPlayerProps {
  file: File;
  accentColor?: string;
}

export function WaveformPlayer({ file, accentColor = '#38bdf8' }: WaveformPlayerProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const wavesurferRef = useRef<WaveSurfer | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);

  useEffect(() => {
    if (!containerRef.current) return;

    const objectUrl = URL.createObjectURL(file);

    const ws = WaveSurfer.create({
      container: containerRef.current,
      waveColor: '#475569',
      progressColor: accentColor,
      cursorColor: '#f8fafc',
      barWidth: 2,
      barGap: 2,
      barRadius: 2,
      height: 84,
      normalize: true,
    });

    ws.load(objectUrl);

    ws.on('ready', () => {
      setDuration(ws.getDuration());
      setCurrentTime(0);
      setIsPlaying(false);
    });

    ws.on('audioprocess', () => setCurrentTime(ws.getCurrentTime()));
    ws.on('seeking', () => setCurrentTime(ws.getCurrentTime()));
    ws.on('finish', () => setIsPlaying(false));

    wavesurferRef.current = ws;

    return () => {
      ws.destroy();
      URL.revokeObjectURL(objectUrl);
    };
  }, [file, accentColor]);

  const togglePlayback = () => {
    if (!wavesurferRef.current) return;
    wavesurferRef.current.playPause();
    setIsPlaying(wavesurferRef.current.isPlaying());
  };

  const formatTime = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const secs = Math.floor(sec % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-4">
      <div className="mb-3 flex items-center justify-between text-xs text-slate-400">
        <div className="flex items-center gap-2 font-medium text-slate-200">
          <Volume2 className="h-4 w-4 text-sky-400" />
          <span className="truncate max-w-xs sm:max-w-md">{file.name}</span>
        </div>
        <span className="font-mono">
          {formatTime(currentTime)} / {formatTime(duration)}
        </span>
      </div>

      <div ref={containerRef} className="w-full" />

      <div className="mt-3 flex items-center justify-end">
        <button
          type="button"
          onClick={togglePlayback}
          className="inline-flex items-center gap-2 rounded-lg bg-slate-800 px-3.5 py-1.5 text-xs font-semibold text-slate-100 transition hover:bg-slate-700"
        >
          {isPlaying ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
          {isPlaying ? 'Pause Audio' : 'Play Waveform'}
        </button>
      </div>
    </div>
  );
}