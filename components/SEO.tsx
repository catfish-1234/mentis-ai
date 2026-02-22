import React from 'react';
import { Helmet } from 'react-helmet-async';

interface SEOProps {
  title: string;
  description: string;
  image?: string;
}

export const SEO: React.FC<SEOProps> = ({ title, description, image }) => {
  return (
    <Helmet>
      <title>{title} | MentisAI</title>
      <meta name="description" content={description} />
      
      {/* Open Graph (Facebook/LinkedIn) */}
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      {image && <meta property="og:image" content={image} />}
      
      {/* Twitter Cards */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      {image && <meta name="twitter:image" content={image} />}
    </Helmet>
  );
};
