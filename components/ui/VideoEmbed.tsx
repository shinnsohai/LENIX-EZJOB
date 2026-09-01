import React, { useState, useEffect } from 'react';
import ReactPlayer from 'react-player';
import { VideoOff } from 'lucide-react';

export default function VideoEmbed({ url, label }: { url?: string, label: string }) {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) return <div className="aspect-video bg-slate-700 animate-pulse rounded-lg" />;

  if (!url || !ReactPlayer.canPlay(url)) {
    return (
      <div className="aspect-video bg-slate-800 rounded-lg flex flex-col items-center justify-center text-slate-400 border-2 border-dashed border-slate-700">
        <VideoOff size={32} className="mb-2" />
        <span className="text-sm font-medium">No {label} Video Provided</span>
      </div>
    );
  }

  return (
    <div className="w-full overflow-hidden rounded-lg shadow-sm bg-black">
      <div className="relative aspect-video">
        <ReactPlayer
          url={url}
          width="100%"
          height="100%"
          controls={true}
          light={true} // Shows thumbnail first
        />
      </div>
    </div>
  );
}