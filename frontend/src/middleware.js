import { NextResponse } from 'next/server';

export function middleware(request) {
  // Your middleware logic here (if any)
  return NextResponse.next();
}

// This config ensures the middleware runs for all routes
export const config = {
  matcher: ['/:path*'],
};