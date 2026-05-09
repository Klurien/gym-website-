import React from 'react';

const YOUTUBE_REGEX = /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/;
const IMAGE_REGEX = /\.(jpeg|jpg|gif|png|webp)$/i;
const VIDEO_REGEX = /\.(mp4|webm|ogg|mov)$/i;
const URL_REGEX = /(https?:\/\/[^\s]+)/g;

export default function RichMedia({ url, type, title, description, immersive = false }) {
  const textContent = (description || title || '');
  const detectedUrls = textContent.match(URL_REGEX) || [];
  const primaryUrl = url || detectedUrls[0];

  const getYoutubeId = (link) => {
    const match = link?.match(YOUTUBE_REGEX);
    return match ? match[1] : null;
  };

  const renderContent = () => {
    const youtubeId = getYoutubeId(primaryUrl);

    if (youtubeId) {
      return (
        <div className={immersive ? 'absolute inset-0 z-0' : 'iframe-container'}>
          <iframe
            src={`https://www.youtube.com/embed/${youtubeId}?autoplay=1&mute=1&loop=1&playlist=${youtubeId}&controls=1`}
            title="YouTube video player"
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          ></iframe>
        </div>
      );
    }

    if (primaryUrl?.match(IMAGE_REGEX) || type === 'static') {
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

    // Link Card Fallback for other URLs
    if (primaryUrl && !immersive) {
      const hostname = new URL(primaryUrl).hostname;
      return (
        <a href={primaryUrl} target="_blank" rel="noopener noreferrer" className="link-card group">
          <div className="link-card-content">
            <h4 className="link-card-title group-hover:text-lime-400">{title || hostname}</h4>
            <div className="link-card-url">
              <span className="material-symbols-outlined text-[10px]">link</span>
              {hostname}
            </div>
          </div>
          <div className="link-card-open-icon">
            <span className="material-symbols-outlined text-3xl text-zinc-600 group-hover:text-lime-400 transition-colors">open_in_new</span>
          </div>
        </a>
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
