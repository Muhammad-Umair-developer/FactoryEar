import { useEffect, useRef, useState } from 'react';
import WaveSurfer from 'wavesurfer.js';
import { Play, Pause, RotateCcw, Volume2 } from 'lucide-react';

interface WaveformPlayerProps {
  file: File;
}

export function WaveformPlayer({ file }: WaveformPlayerProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const wsRef = useRef<WaveSurfer | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [volume, setVolume] = useState(85);

  useEffect(() => {
    if (!containerRef.current) return;

    const objectUrl = URL.createObjectURL(file);
    const ws = WaveSurfer.create({
      container: containerRef.current,
      waveColor: '#94a3b8',
      progressColor: '#0f766e',
      cursorColor: '#18181b',
      barWidth: 2,
      barGap: 2,
      barRadius: 1,
      height: 88,
      normalize: true,
    });

    ws.load(objectUrl);

    ws.on('ready', () => {
      setDuration(ws.getDuration());
      setCurrentTime(0);
      setIsPlaying(false);
      ws.setVolume(volume / 100);
    });
    ws.on('audioprocess', () => setCurrentTime(ws.getCurrentTime()));
    ws.on('seeking', () => setCurrentTime(ws.getCurrentTime()));
    ws.on('finish', () => setIsPlaying(false));

    wsRef.current = ws;

    return () => {
      ws.destroy();
      URL.revokeObjectURL(objectUrl);
    };
  }, [file]);

  const handleTogglePlay = () => {
    if (!wsRef.current) return;
    wsRef.current.playPause();
    setIsPlaying(wsRef.current.isPlaying());
  };

  const handleReset = () => {
    if (!wsRef.current) return;
    wsRef.current.stop();
    setCurrentTime(0);
    setIsPlaying(false);
  };

  const handleVolumeChange = (nextVol: number) => {
    setVolume(nextVol);
    wsRef.current?.setVolume(nextVol / 100);
  };

  const formatTime = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    const ms = Math.floor((sec % 1) * 10);
    return `${m}:${s.toString().padStart(2, '0')}.${ms}`;
  };

  return (
    <div className="rounded-lg border border-zinc-200 bg-white p-4">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2 text-xs">
        <span className="font-mono font-medium text-zinc-800 truncate max-w-md">
          {file.name}
        </span>
        <span className="font-mono tabular-nums text-zinc-500">
          {formatTime(currentTime)} / {formatTime(duration)}
        </span>
      </div>

      <div className="rounded-md border border-zinc-200 bg-zinc-50 px-3 py-2">
        <div ref={containerRef} className="w-full" />
      </div>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleTogglePlay}
            className="inline-flex items-center gap-1.5 rounded-md bg-teal-700 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-teal-800"
          >
            {isPlaying ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
            {isPlaying ? 'Pause' : 'Play'}
          </button>
          <button
            type="button"
            onClick={handleReset}
            className="inline-flex items-center gap-1 rounded-md border border-zinc-200 bg-white px-2.5 py-1.5 text-xs font-medium text-zinc-700 transition hover:bg-zinc-50"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Reset
          </button>
        </div>

        <div className="flex items-center gap-2">
          <Volume2 className="h-3.5 w-3.5 text-zinc-400" />
          <input
            type="range"
            min={0}
            max={100}
            value={volume}
            onChange={(e) => handleVolumeChange(Number(e.target.value))}
            className="h-1.5 w-24 cursor-pointer accent-teal-700"
            aria-label="Audio volume"
          />
          <span className="w-8 font-mono text-[11px] tabular-nums text-zinc-500">
            {volume}%
          </span>
        </div>
      </div>
    </div>
  );
}