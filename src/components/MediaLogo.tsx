import React, { useState, useEffect } from 'react';
import { tmdb, getImageUrl } from '../lib/tmdb';

interface MediaLogoProps {
  mediaId: number | string;
  mediaType: 'movie' | 'tv';
  titleFallback: string;
  as?: 'h1' | 'h2' | 'h3' | 'span';
  size?: 'w185' | 'w300' | 'w500';
  className?: string;
  imgClassName?: string;
  titleClassName?: string;
}

export function getBestLogoPath(imagesObj?: { logos?: any[] }): string | null {
  if (!imagesObj || !imagesObj.logos || imagesObj.logos.length === 0) return null;
  const logos = imagesObj.logos;
  // Prioritize English ('en'), then null/any, sorted by vote_average and width
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
  as = 'span',
  size = 'w300',
  className = '',
  imgClassName = 'max-h-14 sm:max-h-16 md:max-h-24 w-auto object-contain drop-shadow-lg',
  titleClassName,
}) => {
  const [logoPath, setLogoPath] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    setLogoPath(null);
    setLoaded(false);
    let isMounted = true;
    async function fetchLogo() {
      if (!mediaId) return;
      try {
        const images = await tmdb.getImages(mediaType, mediaId);
        if (isMounted && images) {
          const best = getBestLogoPath(images);
          setLogoPath(best);
        }
      } catch {
        // Fallback silently to text title
      }
    }
    fetchLogo();
    return () => {
      isMounted = false;
    };
  }, [mediaId, mediaType]);

  const logoUrl = logoPath ? getImageUrl(logoPath, size) : null;
  const headingClasses =
    titleClassName ||
    'text-2xl sm:text-4xl md:text-5xl font-black text-white tracking-tight drop-shadow-2xl line-clamp-2';
  const Tag = as;
  const dimWidth = size === 'w185' ? 185 : size === 'w500' ? 500 : 300;
  const dimHeight = size === 'w185' ? 60 : size === 'w500' ? 160 : 96;

  if (logoUrl) {
    return (
      <Tag className={`inline-flex items-center relative max-w-full ${className}`}>
        <img
          src={logoUrl}
          alt={titleFallback}
          width={dimWidth}
          height={dimHeight}
          decoding="async"
          className={`${imgClassName} transition-opacity duration-200 ${
            loaded ? 'opacity-100 relative' : 'opacity-0 absolute inset-y-0 left-0 pointer-events-none'
          }`}
          onLoad={() => setLoaded(true)}
          onError={() => setLogoPath(null)}
          loading={as === 'h1' ? 'eager' : 'lazy'}
        />
        {!loaded && <span className={headingClasses}>{titleFallback}</span>}
      </Tag>
    );
  }

  return <Tag className={`${headingClasses} ${className}`}>{titleFallback}</Tag>;
};

