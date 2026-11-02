import React, { useState, useEffect } from 'react';
import { tmdb, getImageUrl } from '../lib/tmdb';

interface MediaLogoProps {
  mediaId: number | string;
  mediaType: 'movie' | 'tv';
  titleFallback: string;
  className?: string;
  imgClassName?: string;
}

export function getBestLogoPath(imagesObj?: { logos?: any[] }): string | null {
  if (!imagesObj || !imagesObj.logos || imagesObj.logos.length === 0) return null;
  const logos = imagesObj.logos;
  // Prioritize English ('en'), then null/any, sorted by vote_average, vote_count, and width
  const sorted = [...logos].sort((a, b) => {
    const aIsEn = a.iso_639_1 === 'en' ? 2 : a.iso_639_1 === null ? 1 : 0;
    const bIsEn = b.iso_639_1 === 'en' ? 2 : b.iso_639_1 === null ? 1 : 0;
    if (aIsEn !== bIsEn) return bIsEn - aIsEn;
    if ((b.vote_average || 0) !== (a.vote_average || 0)) {
      return (b.vote_average || 0) - (a.vote_average || 0);
    }
    return (b.width || 0) - (a.width || 0);
  });
  return sorted[0]?.file_path || null;
}

export const MediaLogo: React.FC<MediaLogoProps> = ({
  mediaId,
  mediaType,
  titleFallback,
  className = '',
  imgClassName = 'max-h-16 md:max-h-24 w-auto object-contain drop-shadow-lg',
}) => {
  const [logoPath, setLogoPath] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let isMounted = true;
    async function fetchLogo() {
      if (!mediaId) return;
      try {
        const images = await tmdb.getImages(mediaType, mediaId);
        if (isMounted && images) {
          const best = getBestLogoPath(images);
          setLogoPath(best);
        }
      } catch (err) {
        // Fallback silently to text title
      }
    }
    fetchLogo();
    return () => {
      isMounted = false;
    };
  }, [mediaId, mediaType]);

  const logoUrl = logoPath ? getImageUrl(logoPath, 'w500') : null;

  if (logoUrl) {
    return (
      <div className={`inline-flex items-center relative ${className}`}>
        <img
          src={logoUrl}
          alt={titleFallback}
          className={`${imgClassName} transition-opacity duration-300 ${
            loaded ? 'opacity-100' : 'opacity-0'
          }`}
          onLoad={() => setLoaded(true)}
          onError={() => setLogoPath(null)}
          loading="eager"
        />
        {!loaded && (
          <h1 className="text-2xl sm:text-4xl md:text-6xl font-black text-white tracking-tight drop-shadow-2xl">
            {titleFallback}
          </h1>
        )}
      </div>
    );
  }

  return (
    <h1
      className={`text-2xl sm:text-4xl md:text-6xl font-black text-white tracking-tight drop-shadow-2xl ${className}`}
    >
      {titleFallback}
    </h1>
  );
};
