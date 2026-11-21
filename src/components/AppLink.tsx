import React from 'react';
import { useRouter } from '../context/RouterContext';

interface AppLinkProps extends React.AnchorHTMLAttributes<HTMLAnchorElement> {
  to: string;
  children: React.ReactNode;
}

/**
 * Crawlable anchor link (<a href="...">) that performs smooth SPA navigation
 * on unmodified primary clicks while preserving browser new-tab behavior and SEO crawlability.
 */
export const AppLink: React.FC<AppLinkProps> = ({
  to,
  onClick,
  children,
  ...rest
}) => {
  const { navigate } = useRouter();

  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (onClick) {
      onClick(e);
    }
    if (
      e.defaultPrevented ||
      e.button !== 0 ||
      e.metaKey ||
      e.ctrlKey ||
      e.shiftKey ||
      e.altKey ||
      rest.target === '_blank'
    ) {
      return;
    }
    e.preventDefault();
    navigate(to);
  };

  return (
    <a href={to} onClick={handleClick} {...rest}>
      {children}
    </a>
  );
};
