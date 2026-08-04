import { NextResponse } from 'next/server';

export function proxy(request) {
  const isDev = process.env.NODE_ENV === 'development';
  
  // Define strict Content Security Policy (PPR-compatible)
  const cspHeader = `
    default-src 'self';
    script-src 'self' 'unsafe-inline' https://vercel.live https://c.vercel-scripts.com ${isDev ? "'unsafe-eval'" : ''};
    style-src 'self' 'unsafe-inline' https://vercel.live;
    img-src 'self' blob: data: https://res.cloudinary.com https://images.unsplash.com https://vercel.live https://vercel.com;
    font-src 'self' https://assets.vercel.com https://vercel.live;
    connect-src 'self' https://vercel.live wss://ws-us3.pusher.com;
    frame-src 'self' https://www.google.com https://vercel.live;
    object-src 'none';
    base-uri 'self';
    form-action 'self';
    frame-ancestors 'none';
    upgrade-insecure-requests;
  `.replace(/\s{2,}/g, ' ').trim();

  const response = NextResponse.next();

  // Apply Security Headers to Response
  response.headers.set('Content-Security-Policy', cspHeader);
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  
  // HSTS - enforce HTTPS in production
  if (process.env.NODE_ENV === 'production') {
    response.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
  }

  return response;
}

export const config = {
  // Apply middleware to all routes except api, _next/static, _next/image, and favicon
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};
