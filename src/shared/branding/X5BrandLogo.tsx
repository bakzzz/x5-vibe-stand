import React from 'react';
import {
  X5_LOGO_LONG_URL,
  X5_LOGO_SHORT_URL,
  type StandBrandingMeta,
  resolveX5Logos,
} from './standBranding';

type Props = {
  collapsed?: boolean;
  branding?: StandBrandingMeta;
  className?: string;
};

const markStyle: React.CSSProperties = {
  width: 35.739,
  height: 24,
  display: 'block',
  flexShrink: 0,
};

const longStyle: React.CSSProperties = {
  height: 24,
  width: 'auto',
  maxWidth: 150,
  display: 'block',
  objectFit: 'contain',
};

/**
 * Каноничный логотип X5: short = знак; long = lockup (знак + Real Estate).
 */
export const X5BrandLogo: React.FC<Props> = ({ collapsed, branding, className }) => {
  const { logoLong, logoShort } = resolveX5Logos(branding ?? {});

  if (collapsed) {
    return (
      <img
        src={logoShort}
        alt="X5"
        className={className}
        style={markStyle}
      />
    );
  }

  return (
    <img
      src={logoLong}
      alt="X5 Real Estate"
      className={className}
      style={longStyle}
    />
  );
};
