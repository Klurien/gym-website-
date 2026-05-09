import React from 'react';

const YOUTUBE_REGEX = /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/;
const IMAGE_REGEX = /\.(jpeg|jpg|gif|png|webp)$/i;
const VIDEO_REGEX = /\.(mp4|webm|ogg|mov)$/i;
const URL_REGEX = /(https?:\/\/[^\s]+)/g;

export default function RichMedia({ url, type, title, description, immersive = false }) {
  // If no main URL, check description for links
  const textContent = (description || title || '');
  const URL_REGEX = /(https?:\/\/[^\s]+)/g;
  const detectedUrls = textContent.match(URL_REGEX) || [];
  const primaryUrl = url || detectedUrls[0];

  const getYoutubeId = (link) => {
    const YOUTUBE_REGEX = /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/;
    const match = link?.match(YOUTUBE_REGEX);
    return match ? match[1] : null;
  };

  const renderContent = () => {
    const IMAGE_REGEX = /\.(jpeg|jpg|gif|png|webp)$/i;
    const VIDEO_REGEX = /\.(mp4|webm|ogg|mov)$/i;
    const youtubeId = getYoutubeId(primaryUrl);

    if (youtubeId) {
      return (
        <div className={`${immersive ? 'absolute inset-0' : 'aspect-video rounded-2xl'} w-full overflow-hidden border border-white/10 bg-black shadow-2xl`}>
          <iframe
            src={`https://www.youtube.com/embed/${youtubeId}?autoplay=1&mute=1&loop=1&playlist=${youtubeId}&controls=1`}
            className="w-full h-full"
            title="YouTube video player"
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          ></iframe>
        </div>
      );
    }

    if (primaryUrl?.match(IMAGE_REGEX) || type === 'static' || (!youtubeId && !primaryUrl?.match(VIDEO_REGEX) && type !== 'video')) {
      if (!primaryUrl) return immersive ? <div className="absolute inset-0 bg-gradient-to-br from-zinc-900 to-black"></div> : null;
      return (
        <div className={`${immersive ? 'absolute inset-0' : 'rounded-2xl'} overflow-hidden border border-white/5 bg-zinc-900 shadow-xl`}>
          <img src={primaryUrl} className={`w-full h-full ${immersive ? 'object-cover' : 'object-contain max-h-[500px]'}`} alt={title} />
        </div>
      );
    }

    if (primaryUrl?.match(VIDEO_REGEX) || type === 'video') {
      if (!primaryUrl) return null;
      return (
        <div className={`${immersive ? 'absolute inset-0' : 'rounded-2xl'} overflow-hidden border border-white/5 bg-black shadow-xl`}>
          <video src={primaryUrl} className="w-full h-full object-cover" autoPlay={immersive} loop={immersive} muted={immersive} controls={!immersive} playsInline />
        </div>
      );
    }

    return null;
  };

  return (
    <div className={immersive ? "contents" : "mt-3"}>
      {renderContent()}
    </div>
  );
}
