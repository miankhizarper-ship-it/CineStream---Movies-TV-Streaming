import React, { useEffect } from 'react';
import { applySEO, SEOConfig } from '../lib/seo';

export const SEOHead: React.FC<SEOConfig> = (props) => {
  const {
    title,
    description,
    canonicalPath,
    ogType,
    ogImage,
    robots,
    structuredData,
  } = props;

  const serializedSchema = structuredData ? JSON.stringify(structuredData) : '';

  useEffect(() => {
    applySEO({
      title,
      description,
      canonicalPath,
      ogType,
      ogImage,
      robots,
      structuredData,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [title, description, canonicalPath, ogType, ogImage, robots, serializedSchema]);

  return null;
};
