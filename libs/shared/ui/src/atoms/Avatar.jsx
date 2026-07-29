import React, { createContext, useContext, useState, useEffect, forwardRef } from 'react';
import { Box } from '../layout/Box.jsx';

/** @typedef {'idle' | 'loading' | 'loaded' | 'error'} AvatarStatus */

/**
 * @typedef {Object} AvatarContextValue
 * @property {AvatarStatus} status
 * @property {React.Dispatch<React.SetStateAction<AvatarStatus>>} setStatus
 */

/** @type {React.Context<AvatarContextValue | null>} */
const AvatarContext = createContext(/** @type {AvatarContextValue | null} */ (null));

export function useAvatarContext() {
  const context = useContext(AvatarContext);
  if (!context) {
    throw new Error('Avatar compound components must be rendered within the Avatar.Root component.');
  }
  return context;
}

/**
 * Avatar.Root
 * Manages the state of the Avatar image (loading, loaded, error) and acts as the container.
 * Built on top of <Box> to leverage tokens.
 *
 * @type {React.ForwardRefExoticComponent<import('react').ComponentProps<typeof Box> & React.RefAttributes<any>>}
 */
const AvatarRoot = forwardRef(function AvatarRoot({ children, className = '', style = {}, borderRadius = '50%', ...rest }, ref) {
  const [status, setStatus] = useState(/** @type {AvatarStatus} */ ('idle'));

  return (
    <AvatarContext.Provider value={{ status, setStatus }}>
      <Box
        ref={ref}
        className={`vami-avatar-root ${className}`}
        borderRadius={borderRadius}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden',
          position: 'relative',
          verticalAlign: 'middle',
          ...style,
        }}
        {...rest}
      >
        {children}
      </Box>
    </AvatarContext.Provider>
  );
});

/**
 * Avatar.Image
 * Renders the image and updates the root context on load or error.
 *
 * @type {React.ForwardRefExoticComponent<import('react').ImgHTMLAttributes<HTMLImageElement> & React.RefAttributes<HTMLImageElement>>}
 */
const AvatarImage = forwardRef(function AvatarImage({ src, alt, onLoad, onError, style = {}, ...rest }, ref) {
  const { status, setStatus } = useAvatarContext();

  useEffect(() => {
    if (!src) {
      setStatus('error');
    } else {
      setStatus('loading');
    }
  }, [src, setStatus]);

  if (!src) {
    return null;
  }

  return (
    <img
      ref={ref}
      src={src}
      alt={alt || ''}
      onLoad={(e) => {
        setStatus('loaded');
        if (onLoad) onLoad(e);
      }}
      onError={(e) => {
        setStatus('error');
        if (onError) onError(e);
      }}
      style={{
        width: '100%',
        height: '100%',
        objectFit: 'cover',
        borderRadius: 'inherit',
        display: status === 'loaded' ? 'block' : 'none',
        ...style,
      }}
      {...rest}
    />
  );
});

/**
 * Avatar.Fallback
 * Renders when the image hasn't loaded yet or fails to load.
 *
 * @type {React.ForwardRefExoticComponent<import('react').ComponentProps<typeof Box> & { delayMs?: number } & React.RefAttributes<any>>}
 */
const AvatarFallback = forwardRef(function AvatarFallback({ children, className = '', delayMs, ...rest }, ref) {
  const { status } = useAvatarContext();
  const [canRender, setCanRender] = useState(delayMs === undefined);

  useEffect(() => {
    if (delayMs !== undefined) {
      const timer = setTimeout(() => setCanRender(true), delayMs);
      return () => clearTimeout(timer);
    }
  }, [delayMs]);

  if (status === 'loaded' || !canRender) {
    return null;
  }

  return (
    <Box
      ref={ref}
      className={`vami-avatar-fallback ${className}`}
      background="var(--vami-color-surface-card)"
      color="var(--vami-color-text-primary)"
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontWeight: 600,
      }}
      {...rest}
    >
      {children}
    </Box>
  );
});

export const Avatar = {
  Root: AvatarRoot,
  Image: AvatarImage,
  Fallback: AvatarFallback,
};
